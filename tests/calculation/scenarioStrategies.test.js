import { runEngineeringPipeline } from "../../src/engines/pipeline/engineeringPipeline.js";
import { createValidOffgridFixture, assert } from "../fixtures.js";

const offgrid = runEngineeringPipeline(createValidOffgridFixture());
assert(offgrid.outputs.scenario.scenario === "offgrid", "Offgrid scenario should be evaluated.");

const hybrid = runEngineeringPipeline(createValidOffgridFixture({
  project: {
    title: "Hybrid Test",
    scenario: "hybrid",
    location: "Tehran",
    dailyEnergyWh: 12000,
    peakLoadW: 2500,
    autonomyDays: 1
  }
}));
assert(hybrid.outputs.scenario.scenario === "hybrid", "Hybrid scenario should be evaluated.");
assert("selfSupplyRatio" in hybrid.outputs.scenario, "Hybrid output should include self supply ratio.");

const ongrid = runEngineeringPipeline(createValidOffgridFixture({
  project: {
    title: "Ongrid Test",
    scenario: "ongrid",
    location: "Tehran",
    dailyEnergyWh: 12000,
    peakLoadW: 2500,
    autonomyDays: 0
  },
  battery: {
    nominalVoltage: 48,
    capacityAh: 0,
    depthOfDischarge: 0.8,
    roundTripEfficiency: 0.9
  }
}), { stopOnValidationError: false });

assert(ongrid.outputs.scenario.scenario === "ongrid", "Ongrid scenario should be evaluated.");
assert(ongrid.outputs.scenario.batteryRequired === false, "Ongrid should not require battery.");

console.log("scenarioStrategies.test passed");
