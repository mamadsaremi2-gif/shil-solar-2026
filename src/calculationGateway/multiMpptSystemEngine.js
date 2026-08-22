import { createDisabledEngineResult } from "../rules/index.js";
export function runMultiMpptSystem(input = {}) {
  return createDisabledEngineResult("Multi_MPPT_System_DISABLED", { ok: true, input, totals: { N_panels: 0, P_array: 0 }, per_MPPT_panels: [] });
}
