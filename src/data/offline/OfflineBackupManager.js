import { sha256 } from "../../security/hash.js";

const DEFAULT_INDEX_KEY = "offline:backups:index";
const DEFAULT_PREFIX = "offline:backup:";

function makeBackupId() {
  return `backup_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export class OfflineBackupManager {
  constructor(storage, { indexKey = DEFAULT_INDEX_KEY, backupPrefix = DEFAULT_PREFIX } = {}) {
    this.storage = storage;
    this.indexKey = indexKey;
    this.backupPrefix = backupPrefix;
  }

  async _readIndex() {
    const index = await this.storage.getItem(this.indexKey);
    return Array.isArray(index) ? index : [];
  }

  async _writeIndex(index) {
    await this.storage.setItem(this.indexKey, index);
    return index;
  }

  async createVersionedBackup(label = "manual") {
    const keys = (await this.storage.keys(""))
      .filter((key) => key !== this.indexKey && !key.startsWith(this.backupPrefix))
      .sort();

    const data = {};
    for (const key of keys) data[key] = await this.storage.getItem(key);

    const createdAt = new Date().toISOString();
    const payload = {
      format: "SHIL_BACKUP",
      formatVersion: 1,
      id: makeBackupId(),
      label: String(label || "manual"),
      createdAt,
      data,
    };

    const backup = {
      ...payload,
      checksum: sha256(JSON.stringify(payload)),
    };

    await this.storage.setItem(`${this.backupPrefix}${backup.id}`, backup);
    const index = await this._readIndex();
    index.unshift({ id: backup.id, label: backup.label, createdAt: backup.createdAt, checksum: backup.checksum });
    await this._writeIndex(index);
    return backup;
  }

  async listBackups() {
    return this._readIndex();
  }

  async getBackup(id) {
    if (!id) return null;
    return this.storage.getItem(`${this.backupPrefix}${id}`);
  }

  verifyBackup(backup) {
    if (!backup || backup.format !== "SHIL_BACKUP" || !backup.checksum || !backup.data || typeof backup.data !== "object") {
      return false;
    }
    const { checksum, ...payload } = backup;
    return checksum === sha256(JSON.stringify(payload));
  }

  async restoreBackup(idOrBackup, { clearExisting = false } = {}) {
    const backup = typeof idOrBackup === "string" ? await this.getBackup(idOrBackup) : idOrBackup;
    if (!this.verifyBackup(backup)) throw new Error("Backup checksum verification failed.");

    if (clearExisting) {
      const keys = await this.storage.keys("");
      for (const key of keys) {
        if (key !== this.indexKey && !key.startsWith(this.backupPrefix)) await this.storage.removeItem(key);
      }
    }

    for (const [key, value] of Object.entries(backup.data)) {
      await this.storage.setItem(key, value);
    }

    return { restored: true, id: backup.id, restoredKeys: Object.keys(backup.data).length };
  }

  async deleteBackup(id) {
    if (!id) return false;
    await this.storage.removeItem(`${this.backupPrefix}${id}`);
    const index = (await this._readIndex()).filter((item) => item.id !== id);
    await this._writeIndex(index);
    return true;
  }
}
