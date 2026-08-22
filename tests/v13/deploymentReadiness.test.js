import { ShilAppKernel } from "../../src/app/ShilAppKernel.js";
import { ProductionMaxService } from "../../src/production/ProductionMaxService.js";
import { createValidOffgridFixture, assert } from "../fixtures.js";

const app = new ShilAppKernel();
await app.initialize();

const project = await app.projects.createProject({ form: createValidOffgridFixture() });
const result = await app.runProjectCalculation(project.id);

const prod = new ProductionMaxService({
  storage: app.storage,
  appKernel: app,
  environment: "production",
  packageJson: { name: "shil", version: "13.0.0" }
});

const readiness = await prod.readiness({
  readiness: await app.readiness.runReadinessCheck(),
  lastResult: result,
  projectCount: 1,
  syncQueueItems: 1
});

assert(readiness.deployable === true, "Deployment readiness should pass valid production state.");

const observed = await prod.observeCalculation(project.id, async () => result);
assert(observed.valid === true, "Production observation should return calculation result.");
assert(prod.status().metrics.calculationMs.count === 1, "Production status should include observed metric.");

const release = await prod.release({ testOutput: "All tests passed", artifacts: ["v13.zip"] });
assert(release.version === "13.0.0", "Production release should build manifest.");

console.log("deploymentReadiness.test passed");
