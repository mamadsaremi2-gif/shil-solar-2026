import { supabase } from "../backend/db/supabaseClient.js";

const LOCAL_DIRECTORY_KEY = "shil:user:directory:v2";
const MAX_LOCAL_USERS = 200;

function safeParse(value, fallback = []) {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
}
function clean(value = "") { return String(value ?? "").trim(); }
function cleanEmail(value = "") { return clean(value).toLowerCase(); }
function nowIso() { return new Date().toISOString(); }
function makeId(prefix = "user") {
  try { return `${prefix}-${crypto.randomUUID()}`; }
  catch { return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
}

function safeWriteLocalStorage(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    try {
      localStorage.removeItem("shil:admin:auditLog");
      localStorage.removeItem("shil:admin:snapshots");
      localStorage.setItem(key, value);
      return true;
    } catch {
      console.warn("SHIL localStorage quota guard:", error?.message || error);
      return false;
    }
  }
}

export function readLocalUserDirectory() {
  if (typeof localStorage === "undefined") return [];
  const data = safeParse(localStorage.getItem(LOCAL_DIRECTORY_KEY), []);
  return Array.isArray(data) ? data : [];
}

export function rememberLocalUser(input = {}) {
  if (typeof localStorage === "undefined") return null;

  const email = cleanEmail(input.email || input.login);
  const phone = clean(input.phone);
  const fullName = clean(input.fullName || input.displayName);
  const userId = clean(input.userId || input.id) || makeId(input.authType === "guest" ? "guest" : "user");
  const now = nowIso();

  const list = readLocalUserDirectory();
  const index = list.findIndex((item) =>
    item.userId === userId ||
    (email && item.email === email) ||
    (!email && phone && item.phone === phone)
  );

  const old = index >= 0 ? list[index] : {};
  const item = {
    userId,
    email,
    fullName,
    phone,
    company: clean(input.company || old.company),
    authType: clean(input.authType || old.authType || "email"),
    role: clean(input.role || old.role || "user"),
    status: clean(input.status || old.status || "active"),
    firstSeenAt: old.firstSeenAt || now,
    lastSeenAt: now,
    loginCount: Number(old.loginCount || 0) + 1,
  };

  const next = list.slice();
  if (index >= 0) next[index] = item;
  else next.unshift(item);

  next.sort((a, b) => String(b.lastSeenAt).localeCompare(String(a.lastSeenAt)));
  safeWriteLocalStorage(LOCAL_DIRECTORY_KEY, JSON.stringify(next.slice(0, MAX_LOCAL_USERS)));
  return item;
}

export async function recordUserLogin(input = {}) {
  const local = rememberLocalUser(input);

  try {
    const { data, error } = await supabase.functions.invoke("shil-user-login", {
      body: {
        userId: local?.userId,
        email: local?.email || "",
        fullName: local?.fullName || "",
        phone: local?.phone || "",
        company: local?.company || "",
        authType: local?.authType || "email",
        role: local?.role || "user",
        status: local?.status || "active",
        at: local?.lastSeenAt || nowIso(),
      },
    });
    if (error) throw error;
    return { ok: true, local, cloud: data || null };
  } catch (error) {
    console.warn("SHIL cloud login event unavailable:", error?.message || error);
    return { ok: false, local, error: error?.message || String(error) };
  }
}

export async function readCloudUserDirectory() {
  try {
    const { data, error } = await supabase
      .from("shil_user_directory")
      .select("user_id,email,full_name,phone,company,auth_type,role,status,first_seen_at,last_seen_at,login_count")
      .order("last_seen_at", { ascending: false })
      .limit(500);

    if (error) throw error;

    return (data || []).map((row) => ({
      userId: row.user_id,
      login: row.email || row.phone || row.user_id,
      email: row.email || "",
      fullName: row.full_name || "",
      phone: row.phone || "",
      company: row.company || "",
      authType: row.auth_type || "email",
      role: row.role || "user",
      status: row.status || "active",
      firstAt: row.first_seen_at || "",
      lastAt: row.last_seen_at || "",
      loginCount: Number(row.login_count || 0),
      feedback: 0,
      assistant: 0,
      projects: 0,
      online: true,
    }));
  } catch (error) {
    console.warn("SHIL cloud directory unavailable:", error?.message || error);
    return [];
  }
}

export async function getCombinedUserDirectory() {
  const local = readLocalUserDirectory().map((row) => ({
    userId: row.userId,
    login: row.email || row.phone || row.userId,
    email: row.email || "",
    fullName: row.fullName || "",
    phone: row.phone || "",
    company: row.company || "",
    authType: row.authType || "email",
    role: row.role || "user",
    status: row.status || "active",
    firstAt: row.firstSeenAt || "",
    lastAt: row.lastSeenAt || "",
    loginCount: Number(row.loginCount || 0),
    feedback: 0,
    assistant: 0,
    projects: 0,
    online: false,
  }));

  const cloud = await readCloudUserDirectory();
  const map = new Map();

  [...local, ...cloud].forEach((item) => {
    const key = item.userId || item.email || item.phone;
    if (!key) return;
    map.set(key, { ...(map.get(key) || {}), ...item });
  });

  return Array.from(map.values()).sort((a, b) =>
    String(b.lastAt || "").localeCompare(String(a.lastAt || ""))
  );
}
