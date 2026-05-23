import { units } from "../utils/units.js";

export function createScenarioSummary(name, form, outputs) {
  return {
    scenario: name,
    projectTitle: form.project.title,
    dailyEnergyKWh: units.round(units.whToKwh(form.project.dailyEnergyWh), 2),
    peakLoadKW: units.round(form.project.peakLoadW / 1000, 2),
    pvKWp: units.round((outputs.pv?.arrayPowerW || 0) / 1000, 2),
    batteryKWhUsable: units.round((outputs.battery?.usableEnergyWh || 0) / 1000, 2),
    inverterKW: units.round((form.inverter.ratedPowerW || 0) / 1000, 2)
  };
}
