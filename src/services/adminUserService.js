import { supabase } from "../backend/db/supabaseClient.js";
import { getCurrentSession } from "../auth/session.js";
import { assertSessionPermission, getEffectiveAccessRole } from "../auth/access.js";
import { PERMISSIONS, normalizeAccessRole } from "../auth/roles.js";

const PROFILE_TABLE = "profiles";
const RECORD_TABLE = "shil_records";
const ALLOWED_STATUS = new Set(["pending", "approved", "suspended", "rejected", "disabled"]);
const ALLOWED_ROLES = new Set(["super_admin", "admin", "engineer", "reviewer", "viewer", "user"]);
const ACTIVITY_KEYS = new Set(["shil-projects", "shil-feedback", "shil-assistant-questions"]);

function assertCloudAdmin() {
  const session = getCurrentSession();
  assertSessionPermission(PERMISSIONS.CLOUD_ADMIN, session);
  if (session?.authType !== "supabase") {
    const error = new Error("مدیریت کاربران Cloud فقط با ورود آنلاین ادمین مجاز است.");
    error.code = "ONLINE_ADMIN_REQUIRED";
    throw error;
  }
  return session;
}

function emptyActivity() {
  return { projects: 0, feedback: 0, assistant: 0, totalRecords: 0, lastActivityAt: "" };
}

function activityBucket(baseKey) {
  if (baseKey === "shil-projects") return "projects";
  if (baseKey === "shil-feedback") return "feedback";
  if (baseKey === "shil-assistant-questions") return "assistant";
  return null;
}

function enrichProfiles(profiles = [], rows = []) {
  const byAuthId = new Map();
  const byUserId = new Map();

  rows.forEach((row) => {
    const bucket = activityBucket(row.base_key);
    const stats = byAuthId.get(row.owner_auth_id) || byUserId.get(row.user_id) || emptyActivity();
    if (bucket) stats[bucket] += 1;
    stats.totalRecords += 1;
    const stamp = row.updated_at || row.created_at || "";
    if (stamp && (!stats.lastActivityAt || stamp > stats.lastActivityAt)) stats.lastActivityAt = stamp;
    if (row.owner_auth_id) byAuthId.set(row.owner_auth_id, stats);
    if (row.user_id) byUserId.set(row.user_id, stats);
  });

  return profiles.map((profile) => ({
    ...profile,
    role: normalizeAccessRole(profile.role || "viewer"),
    activity: byAuthId.get(profile.id) || byUserId.get(profile.id) || emptyActivity(),
  }));
}

export async function listManagedProfiles() {
  assertCloudAdmin();
  const [{ data: profiles, error: profileError }, { data: rows, error: recordError }] = await Promise.all([
    supabase.from(PROFILE_TABLE).select("id,email,role,status,full_name"),
    supabase.from(RECORD_TABLE)
      .select("base_key,user_id,owner_auth_id,created_at,updated_at")
      .in("base_key", Array.from(ACTIVITY_KEYS))
      .order("updated_at", { ascending: false }),
  ]);
  if (profileError) throw profileError;
  if (recordError) throw recordError;
  return enrichProfiles(profiles || [], rows || []);
}

export async function getManagedUserRecords(userId, limit = 80) {
  assertCloudAdmin();
  const safeLimit = Math.max(1, Math.min(250, Number(limit) || 80));
  const { data, error } = await supabase
    .from(RECORD_TABLE)
    .select("id,base_key,record_id,user_id,user_role,user_login,status,record,owner_auth_id,created_at,updated_at")
    .or(`owner_auth_id.eq.${userId},user_id.eq.${userId}`)
    .order("updated_at", { ascending: false })
    .limit(safeLimit);
  if (error) throw error;
  return data || [];
}

export async function exportManagedUserBundle(userId) {
  assertCloudAdmin();
  const [profiles, records] = await Promise.all([
    supabase.from(PROFILE_TABLE).select("id,email,role,status,full_name").eq("id", userId).maybeSingle(),
    getManagedUserRecords(userId, 250),
  ]);
  if (profiles.error) throw profiles.error;
  return {
    exportedAt: new Date().toISOString(),
    profile: profiles.data || null,
    records,
  };
}

export async function deleteManagedUserCloudData(userId) {
  const session = assertCloudAdmin();
  assertSessionPermission(PERMISSIONS.USER_MANAGE, session);
  if (userId === session.userId) throw new Error("حذف داده‌های Cloud حساب فعال ادمین مجاز نیست.");
  const { error } = await supabase
    .from(RECORD_TABLE)
    .delete()
    .or(`owner_auth_id.eq.${userId},user_id.eq.${userId}`);
  if (error) throw error;
  return true;
}

export async function updateManagedProfile(userId, patch = {}) {
  const session = assertCloudAdmin();
  assertSessionPermission(PERMISSIONS.USER_MANAGE, session);

  const clean = {};
  if (patch.role !== undefined) {
    assertSessionPermission(PERMISSIONS.ROLE_MANAGE, session);
    const role = normalizeAccessRole(patch.role);
    if (!ALLOWED_ROLES.has(role)) throw new Error("نقش انتخاب‌شده معتبر نیست.");
    if (["super_admin", "admin"].includes(role) && getEffectiveAccessRole(session) !== "super_admin") {
      throw new Error("فقط Super Admin می‌تواند نقش مدیریتی اعطا کند.");
    }
    if (userId === session.userId && !["super_admin", "admin"].includes(role)) {
      throw new Error("ادمین نمی‌تواند نقش مدیریتی حساب فعال خودش را حذف کند.");
    }
    clean.role = role;
  }
  if (patch.status !== undefined) {
    const status = String(patch.status || "").toLowerCase();
    if (!ALLOWED_STATUS.has(status)) throw new Error("وضعیت انتخاب‌شده معتبر نیست.");
    if (userId === session.userId && status !== "approved") {
      throw new Error("ادمین نمی‌تواند حساب فعال خودش را تعلیق یا غیرفعال کند.");
    }
    clean.status = status;
  }
  if (!Object.keys(clean).length) throw new Error("تغییری برای ذخیره ارسال نشده است.");

  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    .update(clean)
    .eq("id", userId)
    .select("id,email,role,status,full_name")
    .single();
  if (error) throw error;
  return { ...data, role: normalizeAccessRole(data.role || "viewer") };
}
