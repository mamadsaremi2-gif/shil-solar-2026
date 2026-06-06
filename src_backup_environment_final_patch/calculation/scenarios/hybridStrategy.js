import { createScenarioSummary } from "./baseScenario.js";

export function evaluateHybridScenario(form, outputs) {
  const pvEnergy = outputs.pv?.estimatedDailyEnergyWh || 0;
  const demand = form.project.dailyEnergyWh;
  const selfSupplyRatio = demand > 0 ? Math.min(pvEnergy / demand, 1) : 0;

  return {
    ...createScenarioSummary("hybrid", form, outputs),
    selfSupplyRatio,
    gridBackupRequiredWh: Math.max(demand - pvEnergy, 0),
    readyForHybrid: form.inverter.ratedPowerW >= form.project.peakLoadW,
    priorities: [
      "PV should reduce grid dependency.",
      "Battery should cover backup-critical loads.",
      "Grid backup can cover seasonal deficit."
    ]
  };
}
