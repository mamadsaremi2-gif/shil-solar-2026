import { getCalculationEngineName, getReadyScenarioEntry } from "../../src/ui/v15/calculationDispatcherRules.js";
function assert(c, m) { if (!c) throw new Error(m); }

assert(getCalculationEngineName({ projectPath: "offgrid" }) === "SolarUnifiedCalculationEngine", "Solar engine selected");
assert(getCalculationEngineName({ projectPath: "emergency" }) === "EmergencyPowerUnifiedCalculationEngine", "Emergency engine selected");
assert(getReadyScenarioEntry("solar")[0] === "environmentalConditions", "Solar scenario starts at environment");
assert(getReadyScenarioEntry("emergency")[0] === "equipmentList", "Emergency scenario starts at equipment");

console.log("V15 calculation dispatcher rules test passed");
