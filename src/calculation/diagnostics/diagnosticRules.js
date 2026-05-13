export function runDiagnostics(form, result) {
  const diagnostics = [];
  const outputs = result.outputs || {};

  if (outputs.pv?.estimatedDailyEnergyWh < form.project.dailyEnergyWh) {
    diagnostics.push({
      severity: "warning",
      code: "ENERGY_DEFICIT",
      message: "Estimated PV daily energy is lower than daily demand.",
      recommendation: "Increase PV array size, reduce demand, or revise peak sun hours."
    });
  }

  if (outputs.inverter && outputs.inverter.loadRatio > 0.85) {
    diagnostics.push({
      severity: "warning",
      code: "INVERTER_HIGH_LOAD_RATIO",
      message: "Inverter load ratio is high.",
      recommendation: "Select a larger inverter or review peak load assumptions."
    });
  }

  if (outputs.battery?.autonomyCoverageDays < form.project.autonomyDays && form.project.scenario !== "ongrid") {
    diagnostics.push({
      severity: "error",
      code: "AUTONOMY_NOT_MET",
      message: "Battery autonomy coverage is below requirement.",
      recommendation: "Increase battery capacity or reduce autonomy days."
    });
  }

  if (outputs.cable && outputs.cable.withinLimit === false) {
    diagnostics.push({
      severity: "error",
      code: "CABLE_DROP_EXCEEDED",
      message: "Cable voltage drop exceeds design limit.",
      recommendation: "Increase cable cross-section or reduce cable run length."
    });
  }

  return diagnostics;
}
