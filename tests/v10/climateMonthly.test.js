import { ClimateEngine } from "../../src/climate/ClimateEngine.js";
import { createValidOffgridFixture, assert } from "../fixtures.js";
import { runEngineeringPipeline } from "../../src/engines/pipeline/engineeringPipeline.js";

const climate = new ClimateEngine();
const summary = climate.summarize("ir_tehran");

assert(summary.averagePeakSunHours > 0, "Climate summary should calculate average PSH.");
assert(summary.minTemperatureC < summary.maxTemperatureC, "Climate summary should calculate temperature range.");

const monthly = climate.estimateMonthlyPV(createValidOffgridFixture(), "ir_tehran");
assert(monthly.length === 12, "Monthly PV estimate should include 12 months.");
assert(monthly.every((m) => m.estimatedEnergyWh > 0), "Monthly PV estimate should produce energy.");

const result = runEngineeringPipeline(createValidOffgridFixture(), { climateCityId: "ir_tehran" });
assert(result.outputs.climate.monthlyPV.length === 12, "Pipeline should include monthly climate output.");
assert(result.trace.includes("engine:climate-monthly"), "Pipeline trace should include climate engine.");

console.log("climateMonthly.test passed");
