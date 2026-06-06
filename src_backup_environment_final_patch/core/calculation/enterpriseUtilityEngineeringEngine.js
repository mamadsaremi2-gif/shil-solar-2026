import { createDisabledEngineResult } from "../../rules/index.js";
export function runEnterpriseUtilityEngineeringEngine({ utilityElectrical = {}, systemScale = {}, env = {}, settings = {} } = {}) {
  return createDisabledEngineResult("Enterprise_Utility_Engineering_DISABLED", { utilityElectrical, systemScale, env, settings });
}
