import { normalizeAccessRole } from "./roles.js";
import { deleteCloudRecord, mirrorCloudWrite, upsertCloudRecord } from "../services/shilCloudSync.js";

const SESSION_KEY = "shil-session";
const DEVICE_GUEST_KEY = "shil-device-guest-id";
const ADMIN_CREDENTIALS_KEY = "shil:admin:login-credentials";
const PROFILE_KEY = "shil_profile";
const ADMIN_BOOTSTRAP_KEY = "shil:admin:bootstrap-complete";
const ADMIN_SECURITY_KEY = "shil:admin:security";
const PBKDF2_ITERATIONS = 210000;

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

function bytesToBase64(bytes) {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function deriveSecret(secret, salt, iterations = PBKDF2_ITERATIONS) {
  if (!globalThis.crypto?.subtle) throw new Error("Secure Web Crypto در این مرورگر در دسترس نیست.");
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256);
  return new Uint8Array(bits);
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function makeCredentialRecord(login, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const digest = await deriveSecret(password, salt);
  return {
    login: String(login || "").trim(),
    salt: bytesToBase64(salt),
    passwordHash: bytesToBase64(digest),
    iterations: PBKDF2_ITERATIONS,
    version: 2,
  };
}

function readRawAdminCredentials() {
  const saved = safeParse(localStorage.getItem(ADMIN_CREDENTIALS_KEY), []);
  return Array.isArray(saved) ? saved : [];
}

export function hasLocalAdminCredentials() {
  return readRawAdminCredentials().some((item) =>
    Boolean(String(item?.login || "").trim() && (item?.passwordHash || item?.password))
  );
}

export function isAdminBootstrapComplete() {
  return localStorage.getItem(ADMIN_BOOTSTRAP_KEY) === "1";
}

export function isAdminBootstrapRequired() {
  if (isAdminBootstrapComplete() || hasLocalAdminCredentials()) return false;
  const security = safeParse(localStorage.getItem(ADMIN_SECURITY_KEY), null);
  const pinAlreadyConfigured = Boolean(
    security?.pinConfigured && security?.pinHash && security?.pinSalt
  );
  return !pinAlreadyConfigured;
}

export function markAdminBootstrapComplete() {
  localStorage.setItem(ADMIN_BOOTSTRAP_KEY, "1");
}

export function readAdminLoginCredentials() {
  return readRawAdminCredentials()
    .map((item) => ({ login: String(item.login || "").trim(), password: "", configured: Boolean(item.passwordHash || item.password) }))
    .filter((item) => item.login);
}

export async function saveAdminLoginCredentials(credentials = []) {
  const existing = readRawAdminCredentials();
  const existingByLogin = new Map(existing.map((item) => [normalizeLogin(item.login), item]));
  const cleanInput = credentials
    .map((item) => ({ login: String(item.login || "").trim(), password: String(item.password || "") }))
    .filter((item) => item.login);

  if (!cleanInput.length) throw new Error("حداقل یک یوزر ادمین محلی باید ثبت شود یا دسترسی محلی را کاملاً حذف کنید.");

  const next = [];
  for (const item of cleanInput) {
    const previous = existingByLogin.get(normalizeLogin(item.login));
    if (item.password) {
      if (item.password.length < 10) throw new Error("پسورد ادمین محلی باید حداقل ۱۰ کاراکتر باشد.");
      next.push(await makeCredentialRecord(item.login, item.password));
    } else if (previous?.passwordHash && previous?.salt) {
      next.push({ ...previous, login: item.login, password: undefined });
    } else {
      throw new Error(`برای یوزر ${item.login} یک پسورد جدید وارد کنید.`);
    }
  }

  localStorage.setItem(ADMIN_CREDENTIALS_KEY, JSON.stringify(next));
  return readAdminLoginCredentials();
}

export function resetAdminLoginCredentials() {
  localStorage.removeItem(ADMIN_CREDENTIALS_KEY);
  return [];
}

export async function isAdminCredential(login, password) {
  const normalized = normalizeLogin(login);
  const record = readRawAdminCredentials().find((item) => normalizeLogin(item.login) === normalized);
  if (!record || !password) return false;

  // One-time migration for legacy local credentials. No default credentials are shipped anymore.
  if (record.password && !record.passwordHash) {
    if (record.password !== password) return false;
    const migrated = await makeCredentialRecord(record.login, password);
    const next = readRawAdminCredentials().map((item) => normalizeLogin(item.login) === normalized ? migrated : item);
    localStorage.setItem(ADMIN_CREDENTIALS_KEY, JSON.stringify(next));
    return true;
  }

  if (!record.passwordHash || !record.salt) return false;
  const actual = await deriveSecret(password, base64ToBytes(record.salt), Number(record.iterations || PBKDF2_ITERATIONS));
  return constantTimeEqual(actual, base64ToBytes(record.passwordHash));
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

export function createSession({ role = "user", accessRole = "viewer", login = "", authType = "email", displayName = "", userId: providedUserId = "", sessionInstanceId: providedSessionInstanceId = "" } = {}) {
  const normalizedAccessRole = normalizeAccessRole(accessRole);
  let userId = providedUserId || (role === "admin" ? "admin-root" : stableIdFromLogin(login));

  if (role === "guest") {
    const existingGuestId = localStorage.getItem(DEVICE_GUEST_KEY);
    userId = existingGuestId || makeId("guest");
    localStorage.setItem(DEVICE_GUEST_KEY, userId);
  }

  const previous = getCurrentSession();
  const reusableSessionId = previous?.userId === userId && previous?.authType === authType ? previous?.sessionInstanceId : "";
  const session = {
    role,
    accessRole: role === "admin" ? (["super_admin", "admin"].includes(normalizedAccessRole) ? normalizedAccessRole : "admin") : role === "guest" ? "guest" : normalizedAccessRole,
    userId,
    sessionInstanceId: providedSessionInstanceId || reusableSessionId || makeId("session"),
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
  const current = getCurrentSession();
  if (current?.userId && typeof sessionStorage !== "undefined") sessionStorage.removeItem(`shil:auth:validated:${current.userId}`);
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem("shil-role");
  localStorage.removeItem(PROFILE_KEY);

  // End only the temporary PIN verification window, while preserving the configured PIN hash.
  const securityKey = "shil:admin:security";
  const security = safeParse(localStorage.getItem(securityKey), null);
  if (security && typeof security === "object") {
    localStorage.setItem(securityKey, JSON.stringify({ ...security, lastVerifiedAt: "", lastSensitiveVerifiedAt: "" }));
  }
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
