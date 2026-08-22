import { changeAdminPin, exportAdminJson, importAdminJson, logAdminAction, readAdminSecurity } from "../admin/adminStore.js";
import { readAdminLoginCredentials, saveAdminLoginCredentials } from "../auth/session.js";

const RECOVERY_KEY = "shil:admin:recovery-v1";
const LOCK_KEY = "shil:admin:emergency-lock";
const ADMIN_CREDENTIALS_KEY = "shil:admin:login-credentials";
const ADMIN_SECURITY_KEY = "shil:admin:security";
const ADMIN_BOOTSTRAP_KEY = "shil:admin:bootstrap-complete";
const ITERATIONS = 310000;

function safeParse(value, fallback = null) {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
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

function randomBytes(length = 16) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

function normalizeRecoveryCode(value = "") {
  return String(value).trim().toUpperCase().replace(/\s+/g, "");
}

async function deriveBits(secret, salt, iterations = ITERATIONS, usages = ["deriveBits"]) {
  if (!globalThis.crypto?.subtle) throw new Error("Secure Web Crypto در این مرورگر در دسترس نیست.");
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), "PBKDF2", false, usages);
  return crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, material, 256);
}

async function deriveAesKey(secret, salt, iterations = ITERATIONS) {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

export function generateRecoveryCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(24);
  const chars = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
  return chars.match(/.{1,4}/g).join("-");
}

export function readRecoveryState() {
  const raw = safeParse(localStorage.getItem(RECOVERY_KEY), null);
  return {
    configured: Boolean(raw?.hash && raw?.salt),
    configuredAt: raw?.configuredAt || "",
    rotatedAt: raw?.rotatedAt || "",
    version: raw?.version || 0,
  };
}

export async function configureRecoveryCode(code) {
  const clean = normalizeRecoveryCode(code);
  if (clean.length < 20) throw new Error("Recovery Code باید حداقل ۲۰ کاراکتر امن داشته باشد.");
  const salt = randomBytes(16);
  const digest = new Uint8Array(await deriveBits(clean, salt));
  const previous = safeParse(localStorage.getItem(RECOVERY_KEY), null);
  const now = new Date().toISOString();
  localStorage.setItem(RECOVERY_KEY, JSON.stringify({
    hash: bytesToBase64(digest),
    salt: bytesToBase64(salt),
    iterations: ITERATIONS,
    version: 1,
    configuredAt: previous?.configuredAt || now,
    rotatedAt: previous ? now : "",
  }));
  logAdminAction(previous ? "admin-recovery:code-rotated" : "admin-recovery:code-configured", {});
  return readRecoveryState();
}

export async function verifyRecoveryCode(code) {
  const clean = normalizeRecoveryCode(code);
  const record = safeParse(localStorage.getItem(RECOVERY_KEY), null);
  if (!record?.hash || !record?.salt || !clean) return false;
  const digest = new Uint8Array(await deriveBits(clean, base64ToBytes(record.salt), Number(record.iterations || ITERATIONS)));
  return constantTimeEqual(digest, base64ToBytes(record.hash));
}

export function readEmergencyLock() {
  const lock = safeParse(localStorage.getItem(LOCK_KEY), null);
  return lock?.locked ? lock : { locked: false, at: "", reason: "" };
}

export function activateEmergencyLock(reason = "قفل اضطراری توسط ادمین") {
  const lock = { locked: true, at: new Date().toISOString(), reason: String(reason || "قفل اضطراری توسط ادمین").slice(0, 240) };
  localStorage.setItem(LOCK_KEY, JSON.stringify(lock));
  const security = safeParse(localStorage.getItem(ADMIN_SECURITY_KEY), {});
  localStorage.setItem(ADMIN_SECURITY_KEY, JSON.stringify({ ...security, lastVerifiedAt: "", lastSensitiveVerifiedAt: "" }));
  logAdminAction("admin-recovery:emergency-lock", { reason: lock.reason });
  return lock;
}

export async function unlockEmergencyLock(code) {
  if (!(await verifyRecoveryCode(code))) throw new Error("Recovery Code صحیح نیست.");
  localStorage.removeItem(LOCK_KEY);
  logAdminAction("admin-recovery:emergency-unlock", {});
  return true;
}

function buildSecurityBundle() {
  const security = safeParse(localStorage.getItem(ADMIN_SECURITY_KEY), readAdminSecurity());
  const credentials = safeParse(localStorage.getItem(ADMIN_CREDENTIALS_KEY), []);
  return {
    format: "SHIL_ADMIN_RECOVERY_BACKUP_V1",
    createdAt: new Date().toISOString(),
    adminSystem: exportAdminJson(true),
    localAdmin: {
      credentials,
      security: { ...security, lastVerifiedAt: "", lastSensitiveVerifiedAt: "" },
      bootstrapComplete: localStorage.getItem(ADMIN_BOOTSTRAP_KEY) === "1",
    },
  };
}

export async function createEncryptedRecoveryBackup(code) {
  if (!(await verifyRecoveryCode(code))) throw new Error("Recovery Code صحیح نیست.");
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = await deriveAesKey(normalizeRecoveryCode(code), salt);
  const plaintext = new TextEncoder().encode(JSON.stringify(buildSecurityBundle()));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  logAdminAction("admin-recovery:backup-exported", {});
  return {
    format: "SHIL_ADMIN_ENCRYPTED_BACKUP_V1",
    algorithm: "AES-GCM-256",
    kdf: "PBKDF2-SHA256",
    iterations: ITERATIONS,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(encrypted)),
    createdAt: new Date().toISOString(),
  };
}

export async function restoreEncryptedRecoveryBackup(backup, code) {
  if (!backup || backup.format !== "SHIL_ADMIN_ENCRYPTED_BACKUP_V1") throw new Error("فایل Backup امنیتی معتبر نیست.");
  try {
    const key = await deriveAesKey(normalizeRecoveryCode(code), base64ToBytes(backup.salt), Number(backup.iterations || ITERATIONS));
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64ToBytes(backup.iv) }, key, base64ToBytes(backup.ciphertext));
    const bundle = JSON.parse(new TextDecoder().decode(decrypted));
    if (bundle?.format !== "SHIL_ADMIN_RECOVERY_BACKUP_V1") throw new Error("فرمت محتوای Backup معتبر نیست.");
    if (bundle.adminSystem) importAdminJson(bundle.adminSystem);
    if (Array.isArray(bundle.localAdmin?.credentials)) localStorage.setItem(ADMIN_CREDENTIALS_KEY, JSON.stringify(bundle.localAdmin.credentials));
    if (bundle.localAdmin?.security) localStorage.setItem(ADMIN_SECURITY_KEY, JSON.stringify({ ...bundle.localAdmin.security, lastVerifiedAt: "", lastSensitiveVerifiedAt: "" }));
    if (bundle.localAdmin?.bootstrapComplete) localStorage.setItem(ADMIN_BOOTSTRAP_KEY, "1");
    localStorage.removeItem(LOCK_KEY);
    logAdminAction("admin-recovery:backup-restored", {});
    return true;
  } catch (error) {
    if (error?.message?.includes("فرمت")) throw error;
    throw new Error("رمزگشایی Backup ناموفق بود؛ Recovery Code یا فایل Backup صحیح نیست.");
  }
}

export async function recoverLocalAdminAccess(code, { login, password, pin }) {
  if (!(await verifyRecoveryCode(code))) throw new Error("Recovery Code صحیح نیست.");
  const cleanLogin = String(login || "").trim();
  if (!cleanLogin) throw new Error("نام کاربری جدید ادمین را وارد کنید.");
  if (String(password || "").length < 10) throw new Error("پسورد جدید باید حداقل ۱۰ کاراکتر باشد.");
  if (String(pin || "").replace(/\D/g, "").length < 6) throw new Error("PIN جدید باید حداقل ۶ رقم باشد.");
  await saveAdminLoginCredentials([{ login: cleanLogin, password: String(password) }]);
  await changeAdminPin(pin);
  localStorage.setItem(ADMIN_BOOTSTRAP_KEY, "1");
  localStorage.removeItem(LOCK_KEY);
  logAdminAction("admin-recovery:access-reset", { login: cleanLogin });
  return { credentials: readAdminLoginCredentials(), recovery: readRecoveryState() };
}
