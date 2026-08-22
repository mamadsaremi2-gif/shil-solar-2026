import { createClient } from "@supabase/supabase-js";
import { backendConfig } from "../config/backendConfig.js";

const fallbackUrl = "https://shil-not-configured.invalid";
const fallbackKey = "shil-not-configured";

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
