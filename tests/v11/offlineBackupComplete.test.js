import { MemoryStorageAdapter } from "../../src/data/storage/MemoryStorageAdapter.js";
import { OfflineBackupManager } from "../../src/data/offline/OfflineBackupManager.js";
import { assert } from "../fixtures.js";

const storage = new MemoryStorageAdapter();
await storage.setItem("project:demo", { id: "demo", value: 1 });

const manager = new OfflineBackupManager(storage);
const backup = await manager.createVersionedBackup("qa");
assert(backup.format === "SHIL_BACKUP", "Backup format should be SHIL_BACKUP.");
assert(manager.verifyBackup(backup), "Backup checksum should verify.");
assert((await manager.listBackups()).length === 1, "Backup index should contain the created backup.");

await storage.setItem("project:demo", { id: "demo", value: 2 });
await manager.restoreBackup(backup);
assert((await storage.getItem("project:demo")).value === 1, "Restore should recover backed-up data.");

await manager.deleteBackup(backup.id);
assert((await manager.listBackups()).length === 0, "Deleted backup should leave the index.");

console.log("offlineBackupComplete.test passed");
