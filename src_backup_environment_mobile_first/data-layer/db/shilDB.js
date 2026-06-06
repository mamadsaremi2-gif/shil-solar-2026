import Dexie from "dexie";

export const shilDB = new Dexie("SHIL_V15_OFFLINE_DB");

shilDB.version(1).stores({
  projects: "++id, uid, name, type, status, updatedAt, createdAt",
  drafts: "++id, projectId, step, updatedAt",
  reports: "++id, projectId, type, createdAt",
  syncQueue: "++id, entity, action, createdAt, status",
  settings: "key",
});

export async function saveOfflineProject(project) {
  const now = new Date().toISOString();

  return shilDB.projects.put({
    ...project,
    uid: project.uid || crypto.randomUUID(),
    updatedAt: now,
    createdAt: project.createdAt || now,
  });
}

export async function getOfflineProjects() {
  return shilDB.projects.orderBy("updatedAt").reverse().toArray();
}

export async function saveDraft(projectId, step, data) {
  return shilDB.drafts.put({
    projectId,
    step,
    data,
    updatedAt: new Date().toISOString(),
  });
}

export async function addSyncJob(entity, action, payload) {
  return shilDB.syncQueue.add({
    entity,
    action,
    payload,
    status: "pending",
    createdAt: new Date().toISOString(),
  });
}

export async function getPendingSyncJobs() {
  return shilDB.syncQueue
    .where("status")
    .equals("pending")
    .toArray();
}
