import { createDisabledRule } from '../contracts/ruleContract.js';

// Registry of old calculation areas that are deliberately disabled.
// Rebuild each one later as a clean rule file, then enable it from rules/index.js.
export const disabledCalculationRules = Object.freeze({
  voltage: createDisabledRule('voltage', 'DC voltage level selection', 'electrical'),
  protection: createDisabledRule('protection', 'Breaker / fuse / SPD selection', 'protection'),
  mppt: createDisabledRule('mppt', 'MPPT validation and string management', 'pv'),
  battery: createDisabledRule('battery', 'Battery sizing and fuse selection', 'battery'),
  inverter: createDisabledRule('inverter', 'Inverter sizing and compatibility', 'inverter'),
  cable: createDisabledRule('cable', 'Cable sizing and voltage drop', 'cable'),
  environment: createDisabledRule('environment', 'Environment and IP selection', 'environment'),
  layout: createDisabledRule('layout', 'Panel layout and space constraints', 'layout'),
});
