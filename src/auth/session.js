import { deleteCloudRecord, mirrorCloudWrite, upsertCloudRecord } from "../services/shilCloudSync.js";

const SESSION_KEY = "shil-session";
const DEVICE_GUEST_KEY = "shil-device-guest-id";

const DEFAULT_ADMIN_CREDENTIALS = [
  { login: "admin", password: "shil-admin" },
  { login: "admin@shil.app", password: "shil-admin" },
  { login: "shil.admin", password: "shil-admin" },
];
const ADMIN_CREDENTIALS_KEY = "shil:admin:login-credentials";

function normalizeLogin(value = "") {
  return String(value).trim().toLowerCase();
}

function safeParse(value, fallback = null) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function makeId(prefix = "user") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function stableIdFromLogin(login) {
  const normalized = normalizeLogin(login).replace(/[^a-z0-9_.@+-]/g, "-");
  return `user-${normalized || makeId("user")}`;
}

export function readAdminLoginCredentials() {
  const saved = safeParse(localStorage.getItem(ADMIN_CREDENTIALS_KEY), null);
  const list = Array.isArray(saved) && saved.length ? saved : DEFAULT_ADMIN_CREDENTIALS;
  return list.map((item) => ({
    login: String(item.login || "").trim(),
    password: String(item.password || ""),
  })).filter((item) => item.login && item.password);
}

export function saveAdminLoginCredentials(credentials = []) {
  const clean = credentials
    .map((item) => ({ login: String(item.login || "").trim(), password: String(item.password || "") }))
    .filter((item) => item.login && item.password);
  if (!clean.length) throw new Error("حداقل یک یوزر و پسورد ادمین باید ثبت شود.");
  localStorage.setItem(ADMIN_CREDENTIALS_KEY, JSON.stringify(clean));
  return clean;
}

export function resetAdminLoginCredentials() {
  localStorage.removeItem(ADMIN_CREDENTIALS_KEY);
  return readAdminLoginCredentials();
}

export function isAdminCredential(login, password) {
  const normalized = normalizeLogin(login);
  return readAdminLoginCredentials().some((item) => normalizeLogin(item.login) === normalized && item.password === password);
}

export function getCurrentSession() {
  return safeParse(localStorage.getItem(SESSION_KEY), null);
}

export function getCurrentUserId() {
  return getCurrentSession()?.userId || "anonymous";
}

export function getUserScopedKey(baseKey, userId = getCurrentUserId()) {
  return `${baseKey}:${userId}`;
}

export function createSession({ role = "user", login = "", authType = "email", displayName = "" } = {}) {
  let userId = role === "admin" ? "admin-root" : stableIdFromLogin(login);

  if (role === "guest") {
    const existingGuestId = localStorage.getItem(DEVICE_GUEST_KEY);
    userId = existingGuestId || makeId("guest");
    localStorage.setItem(DEVICE_GUEST_KEY, userId);
  }

  const session = {
    role,
    userId,
    login: role === "guest" ? "guest" : normalizeLogin(login),
    authType,
    displayName: displayName || (role === "guest" ? "کاربر مهمان" : login),
    online: navigator.onLine,
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.setItem("shil-role", role);
  return session;
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem("shil-role");
}

export function appendUserRecord(baseKey, record) {
  const session = getCurrentSession() || createSession({ role: "guest", authType: "guest" });
  const key = getUserScopedKey(baseKey, session.userId);
  const list = safeParse(localStorage.getItem(key), []);
  const nextRecord = {
    ...record,
    id: makeId(baseKey),
    userId: session.userId,
    userRole: session.role,
    userLogin: session.login,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(key, JSON.stringify([nextRecord, ...list]));
  mirrorCloudWrite(() => upsertCloudRecord(baseKey, nextRecord));
  return nextRecord;
}

export function readUserRecords(baseKey, fallback = []) {
  const key = getUserScopedKey(baseKey);
  return safeParse(localStorage.getItem(key), fallback);
}

export function readAllUserRecords(baseKey) {
  const prefix = `${baseKey}:`;
  return Object.keys(localStorage)
    .filter((key) => key.startsWith(prefix))
    .flatMap((key) => safeParse(localStorage.getItem(key), []).map((item) => ({ ...item, sourceKey: key })));
}


export function upsertUserRecord(baseKey, matcher, patch) {
  const session = getCurrentSession() || createSession({ role: "guest", authType: "guest" });
  const key = getUserScopedKey(baseKey, session.userId);
  const list = safeParse(localStorage.getItem(key), []);
  const index = list.findIndex((item) => matcher(item));
  const now = new Date().toISOString();
  if (index >= 0) {
    const updated = { ...list[index], ...patch, updatedAt: now };
    const next = [...list];
    next[index] = updated;
    localStorage.setItem(key, JSON.stringify(next));
    mirrorCloudWrite(() => upsertCloudRecord(baseKey, updated));
    return updated;
  }
  const nextRecord = {
    ...patch,
    id: makeId(baseKey),
    userId: session.userId,
    userRole: session.role,
    userLogin: session.login,
    createdAt: now,
    updatedAt: now,
  };
  localStorage.setItem(key, JSON.stringify([nextRecord, ...list]));
  mirrorCloudWrite(() => upsertCloudRecord(baseKey, nextRecord));
  return nextRecord;
}


export function updateUserRecord(baseKey, matcher, updater) {
  const session = getCurrentSession() || createSession({ role: "guest", authType: "guest" });
  const key = getUserScopedKey(baseKey, session.userId);
  const list = safeParse(localStorage.getItem(key), []);
  const now = new Date().toISOString();
  const next = list.map((item) => {
    if (!matcher(item)) return item;
    const patch = typeof updater === "function" ? updater(item) : updater;
    return { ...item, ...patch, updatedAt: now };
  });
  localStorage.setItem(key, JSON.stringify(next));
  next.filter((item) => matcher(item)).forEach((item) => mirrorCloudWrite(() => upsertCloudRecord(baseKey, item)));
  return next;
}

export function deleteUserRecord(baseKey, matcher) {
  const session = getCurrentSession() || createSession({ role: "guest", authType: "guest" });
  const key = getUserScopedKey(baseKey, session.userId);
  const list = safeParse(localStorage.getItem(key), []);
  const removed = list.filter((item) => matcher(item));
  const next = list.filter((item) => !matcher(item));
  localStorage.setItem(key, JSON.stringify(next));
  removed.forEach((item) => mirrorCloudWrite(() => deleteCloudRecord(baseKey, item.id)));
  return next;
}
