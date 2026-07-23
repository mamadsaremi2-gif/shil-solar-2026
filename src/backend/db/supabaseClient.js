import { createClient } from "@supabase/supabase-js";
import { backendConfig } from "../config/backendConfig.js";

const fallbackUrl = "https://wwrrcdcwgnyzoalynlet.supabase.co";
const fallbackKey = "sb_publishable_fZHHTO1sH1_kLjpGSeJAHA_zBHsN2Te";

/**
 * Single browser-wide Supabase client.
 *
 * Every authentication and cloud-sync module must import this instance instead
 * of calling createClient() again. This prevents concurrent GoTrue clients from
 * sharing the same auth storage key, which can cause unstable behavior in Safari.
 */
export const supabase = createClient(
  backendConfig.supabaseUrl || fallbackUrl,
  backendConfig.supabaseAnonKey || fallbackKey
);
