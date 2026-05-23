export function createEngineeringResult({ valid, errors = [], warnings = [], outputs = {}, trace = [] }) {
  return {
    valid,
    errors,
    warnings,
    outputs,
    trace,
    generatedAt: new Date().toISOString()
  };
}
