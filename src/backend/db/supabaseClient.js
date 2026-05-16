import { createClient } from "@supabase/supabase-js";
import { backendConfig } from "../config/backendConfig.js";

export const supabase = createClient(
  backendConfig.supabaseUrl,
  backendConfig.supabaseAnonKey
);
