import Dexie from "dexie";

export const db = new Dexie("SHIL_DATABASE");

db.version(1).stores({
  projects: "++id, name, createdAt",
  drafts: "++id, updatedAt",
  reports: "++id, createdAt",
});
