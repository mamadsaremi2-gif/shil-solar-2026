export function createEngineResult(overrides = {}) {
  return {
    ok: true,
    mode: 'ACTIVE_ENGINE_READY',
    calculationsEnabled: true,
    equipment: {},
    values: {},
    summary: null,
    warnings: [],
    errors: [],
    explanations: [],
    appliedRules: [],
    skippedRules: [],
    trace: [],
    ...overrides,
  };
}

export function addEngineWarning(result, warning) {
  result.warnings.push(typeof warning === 'string' ? { message: warning } : warning);
  return result;
}

export function addEngineError(result, error) {
  result.ok = false;
  result.errors.push(typeof error === 'string' ? { message: error } : error);
  return result;
}
