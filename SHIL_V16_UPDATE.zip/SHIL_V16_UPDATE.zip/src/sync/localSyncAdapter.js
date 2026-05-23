/**
 * Temporary local adapter.
 * Backend/Supabase adapter can replace this later.
 */

export const localSyncAdapter = {
  async push(job) {
    console.info("[SHIL Sync] Local sync accepted:", job);
    return { ok: true };
  },
};
