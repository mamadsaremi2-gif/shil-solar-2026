import { createScenarioSummary } from "./baseScenario.js";

export function evaluateOffgridScenario(form, outputs) {
  const pvEnergy = outputs.pv?.estimatedDailyEnergyWh || 0;
  const demand = form.project.dailyEnergyWh;
  const batteryCoverage = outputs.battery?.autonomyCoverageDays || 0;

  return {
    ...createScenarioSummary("offgrid", form, outputs),
    energyBalanceWh: pvEnergy - demand,
    autonomyCoverageDays: batteryCoverage,
    readyForOffgrid: pvEnergy >= demand && batteryCoverage >= form.project.autonomyDays,
    priorities: [
      "PV array must cover daily energy demand.",
      "Battery must cover autonomy requirement.",
      "Inverter must cover peak and surge load."
    ]
  };
}
