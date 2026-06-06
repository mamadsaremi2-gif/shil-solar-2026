import { supabase } from "../backend/db/supabaseClient.js";
import { backendConfig } from "../backend/config/backendConfig.js";
import { getCurrentSession } from "../auth/session.js";

export const SHIL_CLOUD_TABLE = "shil_records";
export const SHIL_ADMIN_SETTINGS_TABLE = "shil_admin_settings";

export function isSupabaseReady() {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}

export function getCloudModeLabel() {
  if (!isSupabaseReady()) return "لوکال / بدون اتصال Supabase";
  return backendConfig.cloudSecurityMode === "development"
    ? "آنلاین / Supabase توسعه"
    : "آنلاین / Supabase امن";
}

function nowIso() {
  return new Date().toISOString();
}

function safeParse(value, fallback = []) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

async function getAuthUserId() {
  if (!isSupabaseReady()) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data?.user?.id || null;
}

function normalizeCloudRow(row) {
  const record = row.record && typeof row.record === "object" ? row.record : {};
  return {
    ...record,
    id: row.record_id || record.id || row.id,
    sourceKey: `${row.base_key}:${row.user_id}`,
    baseKey: row.base_key,
    userId: row.user_id,
    userRole: row.user_role || record.userRole || "user",
    userLogin: row.user_login || record.userLogin || "",
    status: row.status || record.status || "open",
    createdAt: row.created_at || record.createdAt,
    updatedAt: row.updated_at || record.updatedAt,
    cloudId: row.id,
  };
}

export async function upsertCloudRecord(baseKey, record) {
  if (!isSupabaseReady() || !record?.id) return { skipped: true };
  const session = getCurrentSession();
  const ownerAuthId = await getAuthUserId();
  if (backendConfig.cloudSecurityMode === "production" && !ownerAuthId) {
    return { skipped: true, reason: "supabase_auth_required" };
  }
  const payload = {
    base_key: baseKey,
    record_id: record.id,
    user_id: record.userId || session?.userId || "anonymous",
    user_role: record.userRole || session?.role || "user",
    user_login: record.userLogin || session?.login || "",
    status: record.status || "open",
    record: { ...record, updatedAt: record.updatedAt || nowIso() },
    owner_auth_id: ownerAuthId,
    updated_at: nowIso(),
  };
  const { data, error } = await supabase
    .from(SHIL_CLOUD_TABLE)
    .upsert(payload, { onConflict: "base_key,record_id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCloudRecord(baseKey, recordId) {
  if (!isSupabaseReady() || !recordId) return { skipped: true };
  const ownerAuthId = await getAuthUserId();
  if (backendConfig.cloudSecurityMode === "production" && !ownerAuthId) {
    return { skipped: true, reason: "supabase_auth_required" };
  }
  const { error } = await supabase
    .from(SHIL_CLOUD_TABLE)
    .delete()
    .eq("base_key", baseKey)
    .eq("record_id", recordId);
  if (error) throw error;
  return true;
}

export async function readCloudRecords(baseKeys = ["shil-feedback", "shil-assistant-questions", "shil-projects"]) {
  if (!isSupabaseReady()) return { online: false, records: [], users: [], feedback: [], assistant: [], projects: [] };
  const { data, error } = await supabase
    .from(SHIL_CLOUD_TABLE)
    .select("*")
    .in("base_key", baseKeys)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return makeAdminDataSnapshot((data || []).map(normalizeCloudRow), true);
}

export function makeAdminDataSnapshot(records, online = false) {
  const feedback = records.filter((item) => item.baseKey === "shil-feedback" || item.sourceKey?.startsWith("shil-feedback:"));
  const assistant = records.filter((item) => item.baseKey === "shil-assistant-questions" || item.sourceKey?.startsWith("shil-assistant-questions:"));
  const projects = records.filter((item) => item.baseKey === "shil-projects" || item.sourceKey?.startsWith("shil-projects:"));
  const byUser = new Map();
  [...feedback, ...assistant, ...projects].forEach((item) => {
    const userId = item.userId || item.sourceKey?.split(":").slice(1).join(":") || "anonymous";
    const current = byUser.get(userId) || {
      userId,
      login: item.userLogin || "",
      role: item.userRole || "user",
      feedback: 0,
      assistant: 0,
      projects: 0,
      lastAt: "",
      online,
    };
    current.login = current.login || item.userLogin || "";
    current.role = current.role || item.userRole || "user";
    current.lastAt = [current.lastAt, item.updatedAt, item.createdAt].filter(Boolean).sort().at(-1) || current.lastAt;
    byUser.set(userId, current);
  });
  feedback.forEach((item) => byUser.get(item.userId || "anonymous") && (byUser.get(item.userId || "anonymous").feedback += 1));
  assistant.forEach((item) => byUser.get(item.userId || "anonymous") && (byUser.get(item.userId || "anonymous").assistant += 1));
  projects.forEach((item) => byUser.get(item.userId || "anonymous") && (byUser.get(item.userId || "anonymous").projects += 1));
  return { online, feedback, assistant, projects, users: Array.from(byUser.values()).sort((a,b)=>String(b.lastAt).localeCompare(String(a.lastAt))) };
}

export async function pushAllLocalRecordsToCloud() {
  if (!isSupabaseReady()) throw new Error("Supabase هنوز در فایل .env تنظیم نشده است.");
  const baseKeys = ["shil-feedback", "shil-assistant-questions", "shil-projects"];
  let count = 0;
  for (const baseKey of baseKeys) {
    const prefix = `${baseKey}:`;
    for (const key of Object.keys(localStorage).filter((item) => item.startsWith(prefix))) {
      const list = safeParse(localStorage.getItem(key), []);
      for (const record of list) {
        await upsertCloudRecord(baseKey, { ...record, sourceKey: key });
        count += 1;
      }
    }
  }
  return count;
}

export async function saveAdminSettingToCloud(key, value) {
  if (!isSupabaseReady()) return { skipped: true };
  const ownerAuthId = await getAuthUserId();
  if (backendConfig.cloudSecurityMode === "production" && !ownerAuthId) {
    return { skipped: true, reason: "supabase_auth_required" };
  }
  const { data, error } = await supabase
    .from(SHIL_ADMIN_SETTINGS_TABLE)
    .upsert({ key, value, updated_at: nowIso() }, { onConflict: "key" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function readAdminSettingsFromCloud() {
  if (!isSupabaseReady()) return [];
  const { data, error } = await supabase.from(SHIL_ADMIN_SETTINGS_TABLE).select("*");
  if (error) throw error;
  return data || [];
}

export function mirrorCloudWrite(promiseFactory) {
  if (!isSupabaseReady()) return;
  window.setTimeout(() => {
    Promise.resolve().then(promiseFactory).catch((error) => {
      console.warn("SHIL cloud sync failed:", error?.message || error);
    });
  }, 0);
}


export async function writeAdminAuditLog(action, entity = "admin", payload = {}) {
  if (!isSupabaseReady()) return { skipped: true };
  const session = getCurrentSession();
  const actorAuthId = await getAuthUserId();
  if (backendConfig.cloudSecurityMode === "production" && !actorAuthId) {
    return { skipped: true, reason: "supabase_auth_required" };
  }
  const { data, error } = await supabase
    .from("shil_admin_audit_log")
    .insert({
      actor_user_id: session?.userId || "anonymous",
      actor_auth_id: actorAuthId,
      action,
      entity,
      payload,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
