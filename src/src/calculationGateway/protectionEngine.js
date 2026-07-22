import { createDisabledEngineResult } from "../rules/index.js";
export function runProtectionEngine(input = {}) {
  return createDisabledEngineResult("Protection_Engine_DISABLED", { input, per_MPPT_protection: [], AC_output_panel: {}, Battery_DC_block: {}, PV_combiner_panel: {} });
}
