import { runEngineeringPipeline } from "../../engineering/index.js";

export function runSystemSizing(form = {}, selection = {}) {
  const result = runEngineeringPipeline(form, { selection, mode: "system-sizing-adapter", stopOnValidationError: false });
  return {
    status: result.status,
    valid: result.valid,
    canContinue: result.canContinue,
    form,
    selection,
    pv: result.outputs?.solarDesign?.pvArray || result.solarDesign?.pvArray || {},
    inverter: result.outputs?.solarDesign?.inverter || result.solarDesign?.inverter || {},
    battery: result.outputs?.batteryDesign || result.solarDesign?.battery || {},
    cable: result.values?.cable || {},
    warnings: result.warnings || [],
    explanations: result.explanations || [],
    unifiedResult: result,
  };
}
