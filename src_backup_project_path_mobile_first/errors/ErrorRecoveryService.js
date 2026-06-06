import { errorLogKey } from "../data/storage/storageKeys.js";

function createErrorId() {
  return `err_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export class ErrorRecoveryService {
  constructor(storage) {
    this.storage = storage;
  }

  async capture(error, context = {}) {
    const record = {
      id: createErrorId(),
      name: error?.name || "Error",
      message: error?.message || String(error),
      code: error?.code || "UNKNOWN",
      stack: error?.stack || null,
      context,
      createdAt: new Date().toISOString(),
      resolvedAt: null
    };

    await this.storage.setItem(errorLogKey(record.id), record);
    return record;
  }

  async list() {
    const keys = await this.storage.keys("error:");
    const records = [];
    for (const key of keys) {
      const record = await this.storage.getItem(key);
      if (record) records.push(record);
    }
    return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async resolve(id) {
    const key = errorLogKey(id);
    const record = await this.storage.getItem(key);
    if (!record) return null;
    const next = { ...record, resolvedAt: new Date().toISOString() };
    await this.storage.setItem(key, next);
    return next;
  }

  getRecoveryHint(errorOrRecord) {
    const code = errorOrRecord?.code || "UNKNOWN";

    const hints = {
      VALIDATION_ERROR: "Check the engineering input values before running calculation again.",
      CABLE_VOLTAGE_DROP: "Increase cable cross-section or reduce cable length/current.",
      BATTERY_UNDERSIZED: "Increase battery capacity or reduce autonomy/load demand.",
      PV_MAX_DC_VOLTAGE: "Reduce PV modules in series or choose inverter with higher DC voltage rating.",
      UNKNOWN: "Save current draft, restart calculation flow, and review the last edited step."
    };

    return hints[code] || hints.UNKNOWN;
  }
}
