import { EngineeringRulePackService } from "../../src/engineering/standards/EngineeringRulePackService.js";
import { assert } from "../fixtures.js";

const service = new EngineeringRulePackService("SHIL_CONSERVATIVE_2026");
const voltage = service.evaluateVoltageDrop({ dcDropPercent: 2.5, acDropPercent: 1 });
assert(voltage.valid === false, "Conservative rule pack should fail high DC voltage drop.");

const battery = service.evaluateBattery({
  depthOfDischarge: 0.85,
  roundTripEfficiency: 0.7,
  autonomyDays: 1,
  scenario: "offgrid"
});
assert(battery.valid === false, "Conservative rule pack should fail low autonomy.");
assert(battery.issues.length >= 2, "Battery rule evaluation should return multiple issues.");

console.log("engineeringStandardPack.test passed");
