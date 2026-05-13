import { runPVEngine } from "../../src/engines/pv/pvEngine.js";
import { createValidOffgridFixture, assert } from "../fixtures.js";

const output = runPVEngine(createValidOffgridFixture());

assert(output.panelCount === 8, "PV engine should calculate panel count.");
assert(output.arrayPowerW === 4400, "PV engine should calculate array power.");
assert(output.estimatedDailyEnergyWh > 0, "PV engine should estimate daily energy.");

console.log("pvEngine.test passed");
