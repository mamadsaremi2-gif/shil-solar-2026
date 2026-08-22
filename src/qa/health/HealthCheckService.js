export class HealthCheckService {
  constructor({ storage, projectService } = {}) {
    this.storage = storage;
    this.projectService = projectService;
  }

  async checkStorage() {
    if (!this.storage) return { name: "storage", ok: false, message: "Storage adapter missing." };
    const key = "health:storage";
    await this.storage.setItem(key, { ok: true });
    const value = await this.storage.getItem(key);
    await this.storage.removeItem(key);
    return { name: "storage", ok: value?.ok === true, message: "Storage read/write check completed." };
  }

  async checkMigrations() {
    if (!this.projectService?.migrations) {
      return { name: "migrations", ok: false, message: "Migration runner missing." };
    }
    const version = await this.projectService.migrations.currentVersion();
    return { name: "migrations", ok: Number.isFinite(version), message: `Current migration version: ${version}` };
  }

  async checkSyncQueue() {
    if (!this.projectService?.syncQueue) {
      return { name: "syncQueue", ok: false, message: "Sync queue missing." };
    }
    const pending = await this.projectService.syncQueue.pending();
    return { name: "syncQueue", ok: true, message: `Pending sync operations: ${pending.length}`, pending: pending.length };
  }

  async runAll() {
    const checks = [
      await this.checkStorage(),
      await this.checkMigrations(),
      await this.checkSyncQueue()
    ];

    return {
      ok: checks.every((item) => item.ok),
      checks,
      generatedAt: new Date().toISOString()
    };
  }
}
