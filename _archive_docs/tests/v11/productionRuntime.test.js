import { ShilAppKernel } from "../../src/app/ShilAppKernel.js";
import { ProductionRuntimeService } from "../../src/production/runtime/ProductionRuntimeService.js";
import { RuntimeConfig } from "../../src/production/runtime/RuntimeConfig.js";
import { createValidOffgridFixture, assert } from "../fixtures.js";

const app = new ShilAppKernel();
await app.initialize();

const runtime = new ProductionRuntimeService({ appKernel: app, config: new RuntimeConfig({ limits: { maxCalculationMs: 99999 } }) });
const preflight = await runtime.preflight();
assert(preflight.ok === true, "Production preflight should pass.");

const limits = runtime.enforceLimits({ projectCount: 1, syncQueueItems: 1, backupSizeBytes: 100, calculationMs: 10 });
assert(limits.ok === true, "Runtime limits should pass small values.");

const exceeded = runtime.enforceLimits({ projectCount: 999999 });
assert(exceeded.ok === false, "Runtime limits should fail excessive project count.");

const project = await app.projects.createProject({ form: createValidOffgridFixture() });
const result = await app.runProjectCalculation(project.id);
assert(result.runtime.limits.ok === true, "Kernel calculation should include runtime limit status.");

console.log("productionRuntime.test passed");
