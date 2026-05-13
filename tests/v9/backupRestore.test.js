import { MemoryStorageAdapter } from "../../src/data/storage/MemoryStorageAdapter.js";
import { BackupService } from "../../src/data/backup/BackupService.js";
import { assert } from "../fixtures.js";

const source = new MemoryStorageAdapter();
await source.setItem("project:p1", { id: "p1", title: "Backup Test" });
await source.setItem("settings:app", { locale: "fa-IR" });

const backupService = new BackupService(source);
const backup = await backupService.createBackup();

assert(backup.format === "SHIL_BACKUP", "Backup should use SHIL format.");
assert(backupService.verify(backup) === true, "Backup checksum should verify.");

const target = new MemoryStorageAdapter();
const restoreService = new BackupService(target);
const report = await restoreService.restore(backup, { clearBeforeRestore: true });

assert(report.restoredKeys === 2, "Restore should restore all keys.");
assert((await target.getItem("project:p1")).title === "Backup Test", "Restore should recover project.");

console.log("backupRestore.test passed");
