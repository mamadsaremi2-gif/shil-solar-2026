import { ShilAppKernel } from "../../src/app/ShilAppKernel.js";
import { createValidOffgridFixture, assert } from "../fixtures.js";

const app = new ShilAppKernel();
const init = await app.initialize();

assert(init.plugins.length >= 2, "App kernel should register builtin plugins.");
assert(init.ruleset.id, "App kernel should initialize ruleset.");
assert(app.equipment.list({ type: "pv" }).length >= 3, "App kernel should expose equipment DB.");

const project = await app.projects.createProject({ form: createValidOffgridFixture() });
const result = await app.runProjectCalculation(project.id);

assert(result.outputs.pluginMetrics.performanceRatio > 0, "Kernel calculation should run plugin hooks.");
assert(result.risk.level, "Kernel calculation should attach risk plugin result.");

const telemetry = await app.telemetry.summarize();
assert(telemetry.total >= 3, "Kernel should record telemetry events.");

console.log("appKernelV9.test passed");
