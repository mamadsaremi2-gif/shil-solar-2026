import { createDisabledEngineResult } from "../rules/index.js";
export function runEfficiencyEngine(input = {}) {
  return createDisabledEngineResult("Efficiency_Engine_DISABLED", { input, E_day: 0, E_month: 0, eta_system_no_battery: 1, eta_system_with_battery: 1, hasBattery: false });
}
