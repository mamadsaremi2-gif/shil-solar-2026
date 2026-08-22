
import { validateInverterCompatibility } from '../src/validation/engineering/inverterValidation.js';

const result = validateInverterCompatibility(450, 600);

if (!result.valid) {
  throw new Error("Inverter compatibility test failed");
}

console.log("Inverter compatibility test passed");
