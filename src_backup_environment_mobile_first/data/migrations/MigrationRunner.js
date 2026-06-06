import { STORAGE_KEYS } from "../storage/storageKeys.js";
import { migrations } from "./migrationRegistry.js";

export class MigrationRunner {
  constructor(storage, registry = migrations) {
    this.storage = storage;
    this.registry = [...registry].sort((a, b) => a.version - b.version);
  }

  async currentVersion() {
    return (await this.storage.getItem(STORAGE_KEYS.MIGRATION_VERSION)) || 0;
  }

  async run() {
    const current = await this.currentVersion();
    const pending = this.registry.filter((migration) => migration.version > current);
    const applied = [];

    for (const migration of pending) {
      await migration.up(this.storage);
      await this.storage.setItem(STORAGE_KEYS.MIGRATION_VERSION, migration.version);
      applied.push({ version: migration.version, name: migration.name });
    }

    return {
      from: current,
      to: await this.currentVersion(),
      applied
    };
  }
}
