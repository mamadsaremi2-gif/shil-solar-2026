import { validateEngineeringForm } from "../../src/validation/engineering/validationEngine.js";
import { createValidOffgridFixture, assert } from "../fixtures.js";

const validForm = createValidOffgridFixture();
const validResult = validateEngineeringForm(validForm);

assert(validResult.valid === true, "Valid fixture should pass engineering validation.");
assert(validResult.metrics.pv.arrayPowerW === 4400, "PV validation metrics should calculate array power.");

const invalidForm = createValidOffgridFixture({
  project: {
    title: "",
    scenario: "offgrid",
    dailyEnergyWh: 50000,
    peakLoadW: 8000,
    autonomyDays: 2
  },
  inverter: {
    ratedPowerW: 1000,
    surgePowerW: 1000,
    maxDcVoltage: 150,
    mpptMinVoltage: 300,
    mpptMaxVoltage: 350,
    efficiency: 1.2
  }
});

const invalidResult = validateEngineeringForm(invalidForm);

assert(invalidResult.valid === false, "Invalid fixture should fail engineering validation.");
assert(invalidResult.errors.length >= 3, "Invalid fixture should return multiple errors.");

console.log("validationEngine.test passed");
