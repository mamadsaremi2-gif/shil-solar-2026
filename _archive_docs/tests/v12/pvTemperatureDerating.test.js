import { calculatePVModuleOutput, calculateArrayMonthlyOutput } from "../../src/engineering/pv/PVTemperatureDeratingEngine.js";
import { calculateStringWindow } from "../../src/engineering/pv/PVStringEngineeringEngine.js";
import { monthlyClimateData } from "../../src/climate/monthlyClimateData.js";
import { createValidOffgridFixture, assert } from "../fixtures.js";

const moduleOutput = calculatePVModuleOutput({
  stcPowerW: 550,
  ambientTempC: 35,
  irradianceWm2: 1000
});

assert(moduleOutput.cellTempC > 35, "Cell temperature should exceed ambient temperature.");
assert(moduleOutput.outputW < 550, "High temperature should derate PV output.");

const monthly = calculateArrayMonthlyOutput({
  form: createValidOffgridFixture(),
  monthlyClimate: monthlyClimateData.ir_tehran
});

assert(monthly.length === 12, "Monthly temperature PV should include 12 months.");
assert(monthly.every((m) => m.estimatedEnergyWh > 0), "Monthly temperature PV should estimate energy.");

const window = calculateStringWindow({
  module: { voc: 49.8, vmp: 41.8, tempCoeffVocPercentPerC: -0.28, tempCoeffVmpPercentPerC: -0.35 },
  inverter: { maxDcVoltage: 500, mpptMinVoltage: 120, mpptMaxVoltage: 450 },
  minTempC: -5,
  maxTempC: 45
});

assert(window.validSeries.length > 0, "String engineering should find valid series window.");

console.log("pvTemperatureDerating.test passed");
