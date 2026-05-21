import {
  getPendingSyncJobs,
  shilDB,
} from "../db/shilDB.js";

export async function runSyncQueue(syncHandler) {
  const jobs = await getPendingSyncJobs();

  for (const job of jobs) {
    try {
      await syncHandler(job);

      await shilDB.syncQueue.update(job.id, {
        status: "done",
        syncedAt: new Date().toISOString(),
      });
    } catch (error) {
      await shilDB.syncQueue.update(job.id, {
        status: "failed",
        error: error?.message || "Sync failed",
      });
    }
  }

  return jobs.length;
}
