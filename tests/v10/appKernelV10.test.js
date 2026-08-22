import { ShilAppKernel } from "../../src/app/ShilAppKernel.js";
import { createValidOffgridFixture, assert } from "../fixtures.js";

const app = new ShilAppKernel();
const init = await app.initialize();

assert(init.integrityManifest.entries.length >= 1, "Kernel should initialize integrity manifest.");
assert(app.climate.summarize("ir_tehran").averagePeakSunHours > 0, "Kernel should expose climate engine.");
assert(app.compatibility.checkPVInverter({
  pvModule: app.equipment.get("pv_generic_550"),
  inverter: app.equipment.get("inv_generic_5k_hybrid"),
  seriesCount: 4,
  parallelCount: 2,
  minTempC: -5
}).compatible === true, "Kernel should expose compatibility engine.");

const project = await app.projects.createProject({ form: createValidOffgridFixture() });
const result = await app.runProjectCalculation(project.id, { climateCityId: "ir_tehran" });

assert(result.outputs.climate.monthlyPV.length === 12, "Kernel calculation should support climate options.");
assert(result.outputs.pluginMetrics.performanceRatio > 0, "Kernel calculation should still run plugins.");

console.log("appKernelV10.test passed");
