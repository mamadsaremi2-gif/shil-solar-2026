import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://wwrrcdcwgnyzoalynlet.supabase.co";

const supabaseAnonKey = "sb_publishable_fZHHTO1sH1_kLjpGSeJAHA_zBHsN2Te";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
