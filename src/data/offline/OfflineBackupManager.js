import { BackupService } from "../backup/BackupService.js";

export class OfflineBackupManager {
  constructor(storage, { maxVersions = 10 } = {}) {
    this.storage = storage;
    this.backup = new BackupService(storage);
    this.maxVersions = maxVersions;
    this.indexKey = "backup:index";
  }

  async listBackups() {
    return (await this.storage.getItem(this.indexKey)) || [];
  }

  async createVersionedBackup(label = "auto") {
    const backup = await this.backup.createBackup();
    const id = `backup_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const key = `backup:data:${id}`;
    await this.storage.setItem(key, backup);

    const index = await this.listBackups();
    index.unshift({
      id,
      key,
      label,
      checksum: backup.checksum,
      createdAt: backup.createdAt
    });

    const trimmed = index.slice(0, this.maxVersions);
    for (const removed of index.slice(this.maxVersions)) {
      await this.storage.removeItem(removed.key);
    }

    await this.storage.setItem(this.indexKey, trimmed);
    return trimmed[0];
  }

  async restoreBackup(id) {
    const index = await this.listBackups();
    const item = index.find((entry) => entry.id === id);
    if (!item) throw new Error(`Backup not found: ${id}`);
    const backup = await this.storage.getItem(item.key);
    return this.backup.restore(backup, { clearBeforeRestore: false });
  }

  async verifyAll() {
    const index = await this.listBackups();
    const results = [];
    for (const item of index) {
      const backup = await this.storage.getItem(item.key);
      results.push({ id: item.id, valid: this.backup.verify(backup) });
    }
    return {
      valid: results.every((item) => item.valid),
      results
    };
  }
}
