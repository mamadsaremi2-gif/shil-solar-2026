import { createDisabledEngineResult } from "../../rules/index.js";
export function runSystemScaleEngine(input = {}) {
  return createDisabledEngineResult("System_Scale_DISABLED", { input });
}
