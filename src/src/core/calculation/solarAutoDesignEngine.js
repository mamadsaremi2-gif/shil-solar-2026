import { createDisabledEngineResult } from "../../rules/index.js";
export function runSolarAutoDesign({ load = {}, environment = {}, settings = {} } = {}) {
  return createDisabledEngineResult("Solar_Auto_Design_DISABLED", {
    load, environment, settings,
    panel: {}, inverter: {}, battery: {}, pvArray: {}, protection: {}, space: {}, design: {},
    warnings: [], explanations: ["طراحی خودکار خورشیدی فعلاً غیرفعال است."],
  });
}
