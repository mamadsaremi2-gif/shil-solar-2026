import { ShilAppKernel } from "../../src/app/ShilAppKernel.js";
import { createValidOffgridFixture, assert } from "../fixtures.js";

const app = new ShilAppKernel();
await app.initialize();

assert(app.productionMax, "App Kernel should expose ProductionMaxService.");
assert(app.productionMax.status().environment.name === "production", "ProductionMax should default to production.");

const project = await app.projects.createProject({ form: createValidOffgridFixture() });
const result = await app.productionMax.observeCalculation(project.id, async () => app.runProjectCalculation(project.id));

assert(result.valid === true, "Kernel production max should observe successful calculation.");
assert(app.productionMax.status().errorBudget.healthy === true, "Kernel production max should keep healthy error budget after success.");

console.log("appKernelProductionV13.test passed");
