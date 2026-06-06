import { runEngineeringDesign } from "../runEngineeringDesign.js";

export class EngineeringCalculationCoreV12 {
  constructor({ rulePackId = "SHIL_UNIFIED_FINAL_GATEWAY" } = {}) {
    this.rulePackId = rulePackId;
    this.engine = "SHIL_Unified_Final_Calculation_Gateway";
  }

  run(form = {}, options = {}) {
    const result = runEngineeringDesign(form, {
      ...options,
      source: options.source || "engineering-core-v12-facade",
      rulePackId: this.rulePackId,
    });

    return {
      result,
      report: buildUnifiedReport(form, result),
    };
  }
}

function buildUnifiedReport(form, result) {
  const important = result?.summary?.important_results || {};
  return {
    engine: result.engine,
    status: result.status,
    valid: result.valid,
    project: form?.project || {},
    importantResults: important,
    warnings: result.warnings || [],
    explanations: result.explanations || [],
    generatedAt: new Date().toISOString(),
  };
}
