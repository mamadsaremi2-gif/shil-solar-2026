import { units } from "../calculation/utils/units.js";

export function buildEngineeringReport(form, result) {
  const outputs = result.outputs || {};
  const scenario = outputs.scenario || {};

  return {
    meta: {
      title: form.project.title,
      scenario: form.project.scenario,
      generatedAt: result.generatedAt,
      valid: result.valid
    },
    summary: {
      dailyEnergyKWh: units.round(form.project.dailyEnergyWh / 1000, 2),
      peakLoadKW: units.round(form.project.peakLoadW / 1000, 2),
      pvArrayKWp: units.round((outputs.pv?.arrayPowerW || 0) / 1000, 2),
      estimatedPVEnergyKWh: units.round((outputs.pv?.estimatedDailyEnergyWh || 0) / 1000, 2),
      batteryUsableKWh: units.round((outputs.battery?.usableEnergyWh || 0) / 1000, 2),
      inverterKW: units.round((form.inverter.ratedPowerW || 0) / 1000, 2),
      healthScore: result.health?.score ?? null
    },
    scenario,
    validation: {
      errors: result.errors || [],
      warnings: result.warnings || []
    },
    diagnostics: result.diagnostics || [],
    equipment: {
      pv: outputs.pv || null,
      battery: outputs.battery || null,
      inverter: outputs.inverter || null,
      cable: outputs.cable || null
    },
    trace: result.trace || []
  };
}

export function buildMarkdownEngineeringReport(form, result) {
  const report = buildEngineeringReport(form, result);
  const diagnostics = report.diagnostics.length
    ? report.diagnostics.map((item) => `- [${item.severity}] ${item.message} Recommendation: ${item.recommendation}`).join("\n")
    : "- No diagnostics.";

  return [
    `# SHIL Engineering Report`,
    ``,
    `Project: ${report.meta.title}`,
    `Scenario: ${report.meta.scenario}`,
    `Valid: ${report.meta.valid}`,
    ``,
    `## Summary`,
    `- Daily energy: ${report.summary.dailyEnergyKWh} kWh`,
    `- Peak load: ${report.summary.peakLoadKW} kW`,
    `- PV array: ${report.summary.pvArrayKWp} kWp`,
    `- Estimated PV energy: ${report.summary.estimatedPVEnergyKWh} kWh/day`,
    `- Battery usable energy: ${report.summary.batteryUsableKWh} kWh`,
    `- Inverter: ${report.summary.inverterKW} kW`,
    `- Health score: ${report.summary.healthScore}`,
    ``,
    `## Diagnostics`,
    diagnostics
  ].join("\n");
}
