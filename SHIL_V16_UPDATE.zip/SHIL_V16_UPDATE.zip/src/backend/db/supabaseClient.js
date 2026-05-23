import { createClient } from "@supabase/supabase-js";
import { backendConfig } from "../config/backendConfig.js";

const fallbackUrl = "https://demo.supabase.co";
const fallbackKey = "SUPABASE_PUBLIC_KEY";

export const supabase = createClient(
  backendConfig.supabaseUrl || fallbackUrl,
  backendConfig.supabaseAnonKey || fallbackKey
);
