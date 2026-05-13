import { runEngineeringPipeline } from "../../src/engines/pipeline/engineeringPipeline.js";
import { createValidOffgridFixture, assert } from "../fixtures.js";

const healthy = runEngineeringPipeline(createValidOffgridFixture());
assert(healthy.health.score >= 80, "Healthy fixture should have high health score.");
assert(Array.isArray(healthy.diagnostics), "Pipeline should attach diagnostics.");

const weak = runEngineeringPipeline(createValidOffgridFixture({
  project: {
    title: "Weak PV",
    scenario: "offgrid",
    location: "Test",
    dailyEnergyWh: 40000,
    peakLoadW: 2500,
    autonomyDays: 1
  },
  battery: {
    nominalVoltage: 48,
    capacityAh: 1200,
    depthOfDischarge: 0.8,
    roundTripEfficiency: 0.9
  }
}), { stopOnValidationError: false });

assert(weak.diagnostics.some((d) => d.code === "ENERGY_DEFICIT"), "Diagnostics should detect energy deficit.");

console.log("diagnostics.test passed");
