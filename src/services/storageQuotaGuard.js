const NON_CRITICAL_LOCAL_KEYS = [
  "shil:admin:auditLog",
  "shil:admin:snapshots",
  "shil:lastRuntimeError",
  "shil-recovery-snapshot",
];

function isQuotaError(error) {
  return Boolean(
    error && (
      error.name === "QuotaExceededError" ||
      error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      error.code === 22 ||
      error.code === 1014 ||
      /quota/i.test(String(error.message || ""))
    )
  );
}

export function pruneNonCriticalLocalStorage() {
  if (typeof localStorage === "undefined") return [];
  const removed = [];

  for (const key of NON_CRITICAL_LOCAL_KEYS) {
    try {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key);
        removed.push(key);
      }
    } catch {
      // Ignore a broken storage backend; callers will fall back to session storage.
    }
  }

  // Remove stale Supabase auth tokens from localStorage. V25.19 stores the
  // active auth token in sessionStorage, so these copies are redundant.
  try {
    for (const key of Object.keys(localStorage)) {
      if (/^sb-.*-auth-token$/i.test(key)) {
        localStorage.removeItem(key);
        removed.push(key);
      }
    }
  } catch {
    // no-op
  }

  return removed;
}

export function safeLocalSetItem(key, value, { fallbackToSession = true } = {}) {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage?.setItem(key, value);
    return true;
  } catch (error) {
    if (!isQuotaError(error)) throw error;
  }

  pruneNonCriticalLocalStorage();

  try {
    window.localStorage?.setItem(key, value);
    return true;
  } catch (error) {
    if (!isQuotaError(error)) throw error;
  }

  if (fallbackToSession) {
    try {
      window.sessionStorage?.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }

  return false;
}

export function safeLocalRemoveItem(key) {
  if (typeof window === "undefined") return;
  try { window.localStorage?.removeItem(key); } catch {}
  try { window.sessionStorage?.removeItem(key); } catch {}
}

export function readLocalOrSessionItem(key) {
  if (typeof window === "undefined") return null;
  try {
    const local = window.localStorage?.getItem(key);
    if (local !== null && local !== undefined) return local;
  } catch {}
  try { return window.sessionStorage?.getItem(key) ?? null; } catch { return null; }
}
