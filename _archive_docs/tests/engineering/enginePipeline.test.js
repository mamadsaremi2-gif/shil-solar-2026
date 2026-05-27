import { runEngineeringPipeline } from "../../src/engines/pipeline/engineeringPipeline.js";
import { createValidOffgridFixture, assert } from "../fixtures.js";

const result = runEngineeringPipeline(createValidOffgridFixture());

assert(result.valid === true, "Pipeline should run for valid form.");
assert(result.outputs.pv.arrayPowerW === 4400, "PV engine should calculate array power.");
assert(result.outputs.battery.requiredCapacityAh > 0, "Battery engine should calculate required Ah.");
assert(result.outputs.inverter.recommendedRatedPowerW === 3125, "Inverter engine should calculate recommended rating.");
assert(result.outputs.cable.withinLimit === true, "Cable engine should confirm voltage drop.");
assert(result.trace.includes("engine:pv"), "Pipeline trace should include PV engine.");

console.log("enginePipeline.test passed");
