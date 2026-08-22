import { RuntimeConfig } from "./RuntimeConfig.js";

export class ProductionRuntimeService {
  constructor({ appKernel, config = new RuntimeConfig() } = {}) {
    this.appKernel = appKernel;
    this.config = config;
  }

  async preflight() {
    const readiness = this.appKernel ? await this.appKernel.readiness.runReadinessCheck() : { ok: false };
    const integrity = this.appKernel ? await this.appKernel.integrity.createManifest("") : { entries: [] };
    const telemetry = this.appKernel ? await this.appKernel.telemetry.summarize() : { total: 0 };

    return {
      ok: readiness.ok && integrity.entries.length >= 0,
      readiness,
      integrityEntries: integrity.entries.length,
      telemetry,
      config: this.config.snapshot(),
      generatedAt: new Date().toISOString()
    };
  }

  enforceLimits({ projectCount = 0, syncQueueItems = 0, backupSizeBytes = 0, calculationMs = 0 } = {}) {
    const limits = this.config.snapshot().limits;
    const violations = [];

    if (projectCount > limits.maxProjects) violations.push({ code: "MAX_PROJECTS_EXCEEDED", limit: limits.maxProjects, value: projectCount });
    if (syncQueueItems > limits.maxSyncQueueItems) violations.push({ code: "MAX_SYNC_QUEUE_EXCEEDED", limit: limits.maxSyncQueueItems, value: syncQueueItems });
    if (backupSizeBytes > limits.maxBackupSizeBytes) violations.push({ code: "MAX_BACKUP_SIZE_EXCEEDED", limit: limits.maxBackupSizeBytes, value: backupSizeBytes });
    if (calculationMs > limits.maxCalculationMs) violations.push({ code: "MAX_CALCULATION_TIME_EXCEEDED", limit: limits.maxCalculationMs, value: calculationMs });

    return {
      ok: violations.length === 0,
      violations
    };
  }
}
