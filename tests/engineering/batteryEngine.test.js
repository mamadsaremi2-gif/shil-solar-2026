import { runBatteryEngine } from "../../src/engines/battery/batteryEngine.js";
import { createValidOffgridFixture, assert } from "../fixtures.js";

const output = runBatteryEngine(createValidOffgridFixture());

assert(output.requiredCapacityAh > 0, "Battery engine should calculate required Ah.");
assert(output.autonomyCoverageDays > 0, "Battery engine should calculate autonomy coverage.");

console.log("batteryEngine.test passed");
