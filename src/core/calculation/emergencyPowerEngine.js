import { createDisabledEngineResult } from "../../rules/index.js";
export function runEmergencyPowerDesign({ load = {}, settings = {} } = {}) {
  return createDisabledEngineResult("Emergency_Power_Design_DISABLED", { load, settings });
}
