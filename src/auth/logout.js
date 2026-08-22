import { clearSession, getCurrentSession } from "./session.js";
import { signOutSupabase } from "../services/shilSupabaseAuth.js";
import { closeCurrentSecuritySession } from "../services/securityCenterService.js";

export async function logoutCurrentSession(reason = "logout") {
  const session = getCurrentSession();
  try {
    if (session?.authType === "supabase") {
      await closeCurrentSecuritySession(reason).catch(() => {});
      await signOutSupabase();
    }
  } catch (error) {
    console.warn("SHIL Supabase sign-out failed; local session will still be cleared.", error);
  } finally {
    clearSession();
  }
  return true;
}
