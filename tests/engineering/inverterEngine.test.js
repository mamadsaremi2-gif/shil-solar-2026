import { runInverterEngine } from "../../src/engines/inverter/inverterEngine.js";
import { createValidOffgridFixture, assert } from "../fixtures.js";

const output = runInverterEngine(createValidOffgridFixture());

assert(output.recommendedRatedPowerW === 3125, "Inverter engine should calculate recommended power.");
assert(output.hasCapacityMargin === true, "Inverter should have enough margin in fixture.");

console.log("inverterEngine.test passed");
