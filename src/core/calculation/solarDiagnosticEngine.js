import { createDisabledEngineResult } from "../../rules/index.js";
export function runSolarProfessionalDiagnostics(input = {}) {
  return createDisabledEngineResult("Solar_Diagnostics_DISABLED", { input, checks: [], recommendations: [] });
}
