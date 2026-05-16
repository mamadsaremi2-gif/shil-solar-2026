import { scenarioLibrary } from "../../data/scenarios/scenarioLibrary";

export function getScenarioById(id) {
  return scenarioLibrary.find((item) => item.id === Number(id));
}

export function injectScenarioIntoProject(scenario, projectType) {
  return {
    id: scenario.id,
    title: scenario.title,
    type: projectType,
    level: scenario.level,

    environment: {
      city: "",
      province: "",
      irradiance: null,
      temperature: null
    },

    equipment: {
      inverter: scenario.inverter,
      batteryType: scenario.batteryType,
      suggestedBattery: scenario.suggestedBattery,
      suggestedPanels: scenario.suggestedPanels
    },

    calculations: {
      estimatedLoad: scenario.loadEstimate
    }
  };
}
