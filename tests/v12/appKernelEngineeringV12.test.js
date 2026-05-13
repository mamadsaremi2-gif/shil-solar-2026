import { ShilAppKernel } from "../../src/app/ShilAppKernel.js";
import { createValidOffgridFixture, assert } from "../fixtures.js";

const app = new ShilAppKernel();
await app.initialize();

assert(app.engineeringV12, "App Kernel should expose EngineeringCalculationCoreV12.");

const output = app.engineeringV12.run(createValidOffgridFixture(), {
  climateCityId: "ir_tehran",
  hourlyLoads: [
    { name: "Base", quantity: 1, powerW: 300, schedule: Array.from({ length: 24 }, (_, i) => i) }
  ]
});

assert(output.result.outputs.v12.energyBalance.timeline.length === 24, "Kernel V12 engineering core should simulate energy balance.");
assert(output.report.meta.calculationCoreVersion === "12.0.0", "Kernel V12 engineering core should build report.");

console.log("appKernelEngineeringV12.test passed");
