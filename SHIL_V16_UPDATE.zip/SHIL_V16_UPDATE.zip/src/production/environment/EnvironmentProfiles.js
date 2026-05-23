export const ENVIRONMENT_PROFILES = {
  development: {
    name: "development",
    debug: true,
    telemetry: false,
    strictValidation: false,
    storageEncryption: false,
    errorReporting: "console",
    syncMode: "local",
    performanceBudgetMs: 1500
  },
  staging: {
    name: "staging",
    debug: true,
    telemetry: true,
    strictValidation: true,
    storageEncryption: true,
    errorReporting: "captured",
    syncMode: "mock-remote",
    performanceBudgetMs: 1000
  },
  production: {
    name: "production",
    debug: false,
    telemetry: true,
    strictValidation: true,
    storageEncryption: true,
    errorReporting: "captured",
    syncMode: "remote",
    performanceBudgetMs: 750
  }
};

export function getEnvironmentProfile(name = "production") {
  return ENVIRONMENT_PROFILES[name] || ENVIRONMENT_PROFILES.production;
}
