import { supabase } from "../backend/db/supabaseClient.js";
import { isSupabaseReady } from "./shilCloudSync.js";

export async function getSupabaseAuthSession() {
  if (!isSupabaseReady()) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data?.session || null;
}

export async function getSupabaseUser() {
  const session = await getSupabaseAuthSession();
  return session?.user || null;
}

export async function signInWithSupabaseEmail(email, password) {
  if (!isSupabaseReady()) throw new Error("Supabase هنوز تنظیم نشده است.");
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUpWithSupabaseEmail(email, password, metadata = {}) {
  if (!isSupabaseReady()) throw new Error("Supabase هنوز تنظیم نشده است.");
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata },
  });
  if (error) throw error;
  return data;
}

export async function signOutSupabase() {
  if (!isSupabaseReady()) return true;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  return true;
}

export async function ensureSupabaseProfile(appSession) {
  if (!isSupabaseReady() || !appSession) return { skipped: true };
  const authSession = await getSupabaseAuthSession();
  const authUser = authSession?.user;
  if (!authUser) return { skipped: true, reason: "not_authenticated" };
  const { data, error } = await supabase
    .from("shil_profiles")
    .upsert({
      auth_id: authUser.id,
      app_user_id: appSession.userId,
      display_name: appSession.displayName || appSession.login || "",
      role: appSession.role || "user",
    }, { onConflict: "auth_id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}
