import { ShilAppKernel } from "../../src/app/ShilAppKernel.js";
import { createValidOffgridFixture, assert } from "../fixtures.js";

const app = new ShilAppKernel();
const init = await app.initialize();

assert(init.preflight.ok === true, "Kernel V11 should include production preflight.");
assert(app.offlineBackup, "Kernel V11 should expose offline backup manager.");
assert(app.projectIndex, "Kernel V11 should expose project index.");
assert(app.qualityGates, "Kernel V11 should expose quality gates.");

const project = await app.projects.createProject({ form: createValidOffgridFixture() });
await app.rebuildProjectIndex();
const found = await app.projectIndex.query({ scenario: "offgrid" });
assert(found.includes(project.id), "Kernel should rebuild and query project index.");

const result = await app.runProjectCalculation(project.id, { climateCityId: "ir_tehran" });
assert(result.quality.passed === true, "Kernel calculation should pass quality gates.");
assert(result.outputs.advanced, "Kernel calculation should include advanced engineering.");

const backup = await app.offlineBackup.createVersionedBackup("kernel");
assert(backup.id, "Kernel should create versioned backup.");

console.log("appKernelV11.test passed");
