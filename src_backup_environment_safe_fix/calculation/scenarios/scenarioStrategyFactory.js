import { evaluateOffgridScenario } from "./offgridStrategy.js";
import { evaluateHybridScenario } from "./hybridStrategy.js";
import { evaluateOngridScenario } from "./ongridStrategy.js";

export function evaluateScenario(form, outputs) {
  switch (form.project.scenario) {
    case "offgrid":
      return evaluateOffgridScenario(form, outputs);
    case "hybrid":
      return evaluateHybridScenario(form, outputs);
    case "ongrid":
      return evaluateOngridScenario(form, outputs);
    default:
      throw new Error(`Unknown scenario: ${form.project.scenario}`);
  }
}
