import { sha256 } from "../../security/hash.js";

export class DataIntegrityService {
  constructor(storage) {
    this.storage = storage;
  }

  async createManifest(prefix = "") {
    const keys = await this.storage.keys(prefix);
    const entries = [];

    for (const key of keys.sort()) {
      const value = await this.storage.getItem(key);
      entries.push({
        key,
        checksum: sha256(JSON.stringify(value)),
        type: Array.isArray(value) ? "array" : typeof value
      });
    }

    return {
      version: 1,
      entries,
      checksum: sha256(JSON.stringify(entries)),
      createdAt: new Date().toISOString()
    };
  }

  async verifyManifest(manifest) {
    const current = await this.createManifest("");
    const currentMap = new Map(current.entries.map((entry) => [entry.key, entry.checksum]));
    const issues = [];

    for (const entry of manifest.entries) {
      if (!currentMap.has(entry.key)) {
        issues.push({ key: entry.key, code: "MISSING_KEY" });
      } else if (currentMap.get(entry.key) !== entry.checksum) {
        issues.push({ key: entry.key, code: "CHECKSUM_MISMATCH" });
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  async findOrphans() {
    const projectKeys = await this.storage.keys("project:");
    const snapshotKeys = await this.storage.keys("snapshot:");
    const projectIds = new Set(projectKeys.map((key) => key.replace("project:", "")));
    const orphans = [];

    for (const key of snapshotKeys) {
      const snapshot = await this.storage.getItem(key);
      if (snapshot?.projectId && !projectIds.has(snapshot.projectId)) {
        orphans.push({ key, projectId: snapshot.projectId });
      }
    }

    return orphans;
  }
}
