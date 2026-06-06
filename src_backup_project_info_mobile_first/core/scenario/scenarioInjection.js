import { scenarioLibrary, getScenarioById } from "../../data/scenarios/scenarioLibrary.js";
import { scenarioToEngineeringForm } from "./scenarioToEngineeringForm.js";

export { scenarioLibrary, getScenarioById };

export function injectScenarioIntoProject(scenario, projectType = scenario?.domain || "solar") {
  const form = scenarioToEngineeringForm(scenario || {});
  return {
    id: scenario?.id,
    title: scenario?.title,
    type: projectType,
    level: scenario?.level,
    domain: scenario?.domain,
    calculationEngine: scenario?.calculationEngine || projectType,
    environment: form.environment,
    equipment: {
      inverter: scenario?.inverter,
      batteryType: scenario?.batteryType,
      suggestedBattery: scenario?.suggestedBattery,
      suggestedPanels: scenario?.suggestedPanels,
      requiredEquipment: scenario?.requiredEquipment,
    },
    calculations: {
      estimatedLoad: scenario?.loadEstimate,
      dailyEnergyWh: scenario?.dailyEnergyWh,
      form,
    },
  };
}
