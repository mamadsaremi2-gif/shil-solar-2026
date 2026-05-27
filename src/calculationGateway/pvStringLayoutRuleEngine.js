import { createDisabledEngineResult } from "../rules/index.js";
export function runPvStringLayoutRule(input = {}) {
  return createDisabledEngineResult("PV_String_Layout_Rule_DISABLED", { ok: true, input, n_series: 0, n_parallel: 0, connection_type: "disabled" });
}
