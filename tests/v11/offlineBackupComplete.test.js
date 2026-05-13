import { MemoryStorageAdapter } from "../../src/data/storage/MemoryStorageAdapter.js";
import { OfflineBackupManager } from "../../src/data/offline/OfflineBackupManager.js";
import { OfflineConflictJournal } from "../../src/data/offline/OfflineConflictJournal.js";
import { assert } from "../fixtures.js";

const storage = new MemoryStorageAdapter();
await storage.setItem("project:p1", { id: "p1", title: "Offline Backup" });

const manager = new OfflineBackupManager(storage, { maxVersions: 2 });
const b1 = await manager.createVersionedBackup("first");
await storage.setItem("project:p2", { id: "p2", title: "Second" });
const b2 = await manager.createVersionedBackup("second");

const list = await manager.listBackups();
assert(list.length === 2, "Offline backup manager should keep versioned backups.");

const verify = await manager.verifyAll();
assert(verify.valid === true, "All offline backups should verify.");

const restore = await manager.restoreBackup(b1.id);
assert(restore.restoredKeys >= 1, "Offline backup should restore keys.");

const journal = new OfflineConflictJournal(storage);
const conflict = await journal.record({ projectId: "p1", localVersion: 2, remoteVersion: 3 });
const resolved = await journal.resolve(conflict.id, { strategy: "local-wins" });

assert(resolved.status === "resolved", "Conflict journal should resolve conflict.");

console.log("offlineBackupComplete.test passed");
