export const DEFAULT_RUNTIME_CONFIG = Object.freeze({
  environment: "production",
  version: "11.0.0",
  featureFlags: {
    advancedEngineering: true,
    offlineBackup: true,
    telemetry: true,
    strictQualityGates: true
  },
  limits: {
    maxProjects: 10000,
    maxSyncQueueItems: 50000,
    maxBackupSizeBytes: 50 * 1024 * 1024,
    maxCalculationMs: 1000
  }
});

export class RuntimeConfig {
  constructor(overrides = {}) {
    this.config = {
      ...DEFAULT_RUNTIME_CONFIG,
      ...overrides,
      featureFlags: {
        ...DEFAULT_RUNTIME_CONFIG.featureFlags,
        ...(overrides.featureFlags || {})
      },
      limits: {
        ...DEFAULT_RUNTIME_CONFIG.limits,
        ...(overrides.limits || {})
      }
    };
  }

  get(path, fallback = undefined) {
    return path.split(".").reduce((value, key) => value?.[key], this.config) ?? fallback;
  }

  isEnabled(flag) {
    return this.config.featureFlags[flag] === true;
  }

  snapshot() {
    return JSON.parse(JSON.stringify(this.config));
  }
}
