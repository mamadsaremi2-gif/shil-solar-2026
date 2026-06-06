import { runFinalCalculationEngine } from "../engine/core/engineGateway.js";

export function runFinalCalculationGateway(form = {}, options = {}) {
  const engineInput = {
    ...form,
    form,
    project: form.project || form.projectInfo || {},
    environment: form.environment || {},
    systemSettings: form.settings || form.systemSettings || {},
    calculationInputs: form.calculationInputs || form.load || {},
    equipment: form.equipment || {},
  };

  const result = runFinalCalculationEngine(engineInput, {
    ...options,
    group: "finalCalculation",
    profile: "SAFE_PRODUCTION",
  });

  return {
    ...result,
    valid: result.ok !== false,
    solarDesign: {
      valid: result.ok !== false,
      activeEngineMode: true,
      settings: form.settings || {},
      load: form.load || {},
      warnings: result.warnings || [],
      explanations: (result.explanations || []).map((item) => item.message || item.fa || String(item)),
      distributedInverterSystems: result.values?.distributedInverterSystems || [],
      diagnostics: { score: result.errors?.length ? 70 : 95 },
    },
  };
}
