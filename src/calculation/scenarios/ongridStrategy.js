import { createScenarioSummary } from "./baseScenario.js";

export function evaluateOngridScenario(form, outputs) {
  const pvEnergy = outputs.pv?.estimatedDailyEnergyWh || 0;
  const demand = form.project.dailyEnergyWh;

  return {
    ...createScenarioSummary("ongrid", form, outputs),
    exportPotentialWh: Math.max(pvEnergy - demand, 0),
    selfConsumptionPotentialWh: Math.min(pvEnergy, demand),
    batteryRequired: false,
    readyForOngrid: outputs.pv?.arrayPowerW > 0 && form.inverter.ratedPowerW > 0,
    priorities: [
      "PV generation should match daytime consumption.",
      "Inverter MPPT range must match PV string design.",
      "Export rules depend on local utility policy."
    ]
  };
}
