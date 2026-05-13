import { runCableEngine } from "../../src/engines/cable/cableEngine.js";
import { createValidOffgridFixture, assert } from "../fixtures.js";

const output = runCableEngine(createValidOffgridFixture());

assert(output.voltageDropPercent >= 0, "Cable engine should calculate non-negative voltage drop.");
assert(output.withinLimit === true, "Cable should be within limit in fixture.");

console.log("cableEngine.test passed");
