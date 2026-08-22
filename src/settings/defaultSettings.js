export const DEFAULT_SETTINGS = Object.freeze({
  locale: "fa-IR",
  unitSystem: "metric",
  defaultScenario: "offgrid",
  autoSave: true,
  autoSaveIntervalMs: 30000,
  reportFormat: "object",
  calculation: {
    stopOnValidationError: true,
    includeDiagnostics: true,
    includeSizing: true
  },
  sync: {
    enabled: true,
    retryLimit: 3
  }
});
