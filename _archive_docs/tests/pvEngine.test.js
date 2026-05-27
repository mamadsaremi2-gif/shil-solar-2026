
import { validatePVSystem } from '../src/validation/engineering/pvValidation.js';

const result = validatePVSystem({
  systemVoltage: 600,
  panelPower: 550,
  batteryCapacity: 200
});

if (!result.valid) {
  throw new Error("PV validation test failed");
}

console.log("PV engine validation test passed");
