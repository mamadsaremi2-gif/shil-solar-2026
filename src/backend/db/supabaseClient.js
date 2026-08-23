import { createClient } from "@supabase/supabase-js";
import { backendConfig } from "../config/backendConfig.js";
import { pruneNonCriticalLocalStorage } from "../../services/storageQuotaGuard.js";

const fallbackUrl = "https://shil-not-configured.invalid";
const fallbackKey = "shil-not-configured";

function getLocalStorageSafely() {
  try { return typeof window !== "undefined" ? window.localStorage : null; }
  catch { return null; }
}

function getSessionStorageSafely() {
  try { return typeof window !== "undefined" ? window.sessionStorage : null; }
  catch { return null; }
}

/**
 * Supabase auth storage is deliberately isolated from SHIL project data.
 *
 * The application stores engineering drafts and project records in localStorage.
 * If that quota becomes full, GoTrue must still be able to persist the login
 * session. Therefore the auth token lives in sessionStorage. Existing legacy
 * sb-*-auth-token values are migrated out of localStorage on first read.
 */
const shilAuthStorage = {
  getItem(key) {
    const session = getSessionStorageSafely();
    const local = getLocalStorageSafely();

    try {
      const current = session?.getItem(key);
      if (current != null) return current;
    } catch {}

    try {
      const legacy = local?.getItem(key);
      if (legacy != null) {
        try { session?.setItem(key, legacy); } catch {}
        try { local?.removeItem(key); } catch {}
        return legacy;
      }
    } catch {}

    return null;
  },

  setItem(key, value) {
    const session = getSessionStorageSafely();
    try {
      session?.setItem(key, value);
      return;
    } catch (error) {
      // sessionStorage can theoretically fill too. Free harmless local caches,
      // then make one final attempt before surfacing the real browser error.
      pruneNonCriticalLocalStorage();
      session?.setItem(key, value);
    }
  },

  removeItem(key) {
    try { getSessionStorageSafely()?.removeItem(key); } catch {}
    try { getLocalStorageSafely()?.removeItem(key); } catch {}
  },
};

/**
 * Single browser-wide Supabase client.
 */
export const supabase = createClient(
  backendConfig.supabaseUrl || fallbackUrl,
  backendConfig.supabaseAnonKey || fallbackKey,
  {
    auth: {
      storage: shilAuthStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
