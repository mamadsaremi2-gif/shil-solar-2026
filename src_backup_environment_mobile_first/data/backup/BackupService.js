import { sha256 } from "../../security/hash.js";

function stablePayload(payload) {
  return JSON.stringify(payload);
}

export class BackupService {
  constructor(storage) {
    this.storage = storage;
  }

  async createBackup() {
    const keys = await this.storage.keys("");
    const data = {};

    for (const key of keys) {
      if (key.startsWith("backup:data:")) continue;
      if (key === "backup:index") continue;
      data[key] = await this.storage.getItem(key);
    }

    const payload = {
      format: "SHIL_BACKUP",
      version: 1,
      createdAt: new Date().toISOString(),
      data
    };

    return {
      ...payload,
      checksum: sha256(stablePayload(payload))
    };
  }

  verify(backup) {
    if (!backup || backup.format !== "SHIL_BACKUP") return false;
    const { checksum, ...payload } = backup;
    return checksum === sha256(stablePayload(payload));
  }

  async restore(backup, { clearBeforeRestore = false, verifyChecksum = true } = {}) {
    if (verifyChecksum && !this.verify(backup)) {
      throw new Error("Backup checksum verification failed.");
    }

    if (backup.format !== "SHIL_BACKUP") {
      throw new Error("Unsupported backup format.");
    }

    if (clearBeforeRestore) await this.storage.clear();

    for (const [key, value] of Object.entries(backup.data || {})) {
      await this.storage.setItem(key, value);
    }

    return {
      restoredKeys: Object.keys(backup.data || {}).length,
      restoredAt: new Date().toISOString()
    };
  }
}
