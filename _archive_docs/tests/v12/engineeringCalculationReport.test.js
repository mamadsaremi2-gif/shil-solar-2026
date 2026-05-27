import { EngineeringCalculationCoreV12 } from "../../src/engineering/EngineeringCalculationCoreV12.js";
import { createValidOffgridFixture, assert } from "../fixtures.js";

const core = new EngineeringCalculationCoreV12();
const { result, report } = core.run(createValidOffgridFixture(), {
  climateCityId: "ir_tehran",
  hourlyLoads: [
    { name: "Lights", quantity: 10, powerW: 10, schedule: [18,19,20,21,22] },
    { name: "Pump", quantity: 1, powerW: 750, schedule: [10,11], simultaneityFactor: 0.8 }
  ]
});

assert(result.outputs.v12.hourlyLoad.dailyEnergyWh > 0, "V12 core should include hourly load profile.");
assert(result.outputs.v12.energyBalance.timeline.length === 24, "V12 core should include energy balance.");
assert(result.outputs.v12.monthlyTemperaturePV.length === 12, "V12 core should include monthly temperature PV.");
assert(result.outputs.v12.stringWindow.validSeries.length > 0, "V12 core should include string window.");
assert(report.meta.calculationCoreVersion === "12.0.0", "Engineering report should mark V12.");
assert(report.electrical.pvArrayPowerW === 4400, "Engineering report should include PV array power.");

console.log("engineeringCalculationReport.test passed");
