import { createDisabledEngineResult } from "../rules/index.js";
export function runUnifiedEngineForLegacyUI(input = {}, options = {}) {
  return createDisabledEngineResult("Legacy_Engineering_Adapter_DISABLED", { input, options });
}
export function toLegacyEngineeringResult(result = {}) {
  return createDisabledEngineResult("Legacy_Engineering_Result_DISABLED", { source: result });
}
