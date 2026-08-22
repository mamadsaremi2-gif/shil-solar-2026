import { supabase } from "../backend/db/supabaseClient.js";
import { getCurrentSession } from "../auth/session.js";
import { assertSessionPermission } from "../auth/access.js";
import { PERMISSIONS } from "../auth/roles.js";

const EVENTS_TABLE = "shil_security_events";
const SESSIONS_TABLE = "shil_security_sessions";

function adminSession() {
  const session = getCurrentSession();
  assertSessionPermission(PERMISSIONS.AUDIT_READ, session);
  if (session?.authType !== "supabase") throw new Error("Security Center آنلاین فقط با ادمین Supabase در دسترس است.");
  return session;
}

export async function recordSecurityEvent(eventType, payload = {}) {
  const session = getCurrentSession();
  try {
    const { error } = await supabase.rpc("shil_record_security_event", {
      p_event_type: String(eventType || "unknown").slice(0, 80),
      p_payload: payload || {},
      p_session_id: session?.sessionInstanceId || null,
    });
    if (error) throw error;
  } catch (error) {
    console.warn("SHIL security event mirror failed:", error?.message || error);
  }
}

export async function registerSecuritySession(session = getCurrentSession()) {
  if (!session?.sessionInstanceId || session.authType !== "supabase") return { skipped: true };
  const { data, error } = await supabase.rpc("shil_register_security_session", {
    p_session_id: session.sessionInstanceId,
    p_login: session.login || "",
    p_role: session.accessRole || session.role || "viewer",
    p_user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : "",
  });
  if (error) throw error;
  await recordSecurityEvent("login_success", { login: session.login, role: session.accessRole || session.role });
  return data;
}

export async function heartbeatCurrentSecuritySession() {
  const session = getCurrentSession();
  if (!session?.sessionInstanceId || session.authType !== "supabase") return { active: true, skipped: true };
  const { data, error } = await supabase.rpc("shil_touch_security_session", { p_session_id: session.sessionInstanceId });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return { active: !row?.revoked_at, revoked: Boolean(row?.revoked_at) };
}

export async function closeCurrentSecuritySession(reason = "logout") {
  const session = getCurrentSession();
  if (!session?.sessionInstanceId || session.authType !== "supabase") return { skipped: true };
  await recordSecurityEvent(reason === "idle" ? "logout_idle" : reason === "revoked" ? "logout_revoked" : "logout", { reason });
  const { error } = await supabase.rpc("shil_end_security_session", { p_session_id: session.sessionInstanceId, p_reason: reason });
  if (error) throw error;
  return true;
}

export async function listSecurityEvents(limit = 150) {
  adminSession();
  const { data, error } = await supabase
    .from(EVENTS_TABLE)
    .select("id,user_id,session_id,event_type,payload,created_at")
    .order("created_at", { ascending: false })
    .limit(Math.max(1, Math.min(500, Number(limit) || 150)));
  if (error) throw error;
  return data || [];
}

export async function listSecuritySessions(limit = 150) {
  adminSession();
  const { data, error } = await supabase
    .from(SESSIONS_TABLE)
    .select("session_id,user_id,login,role,user_agent,created_at,last_seen_at,ended_at,end_reason,revoked_at,revoked_by")
    .order("last_seen_at", { ascending: false })
    .limit(Math.max(1, Math.min(500, Number(limit) || 150)));
  if (error) throw error;
  return data || [];
}

export async function revokeSecuritySession(sessionId) {
  const session = adminSession();
  assertSessionPermission(PERMISSIONS.SENSITIVE_ACTION, session);
  if (!sessionId) throw new Error("شناسه Session نامعتبر است.");
  if (sessionId === session.sessionInstanceId) throw new Error("برای بستن Session فعلی از گزینه خروج استفاده کنید.");
  const { error } = await supabase.rpc("shil_revoke_security_session", { p_session_id: sessionId });
  if (error) throw error;
  await recordSecurityEvent("session_revoked", { targetSessionId: sessionId });
  return true;
}
