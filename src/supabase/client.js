// Backward-compatible import path. Keep existing page imports working while
// reusing the application's one and only Supabase/GoTrue client instance.
export { supabase } from "../backend/db/supabaseClient.js";
