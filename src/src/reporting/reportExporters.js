import { buildEngineeringReport, buildMarkdownEngineeringReport } from "./engineeringReportBuilder.js";

export function exportReportAsJSON(form, result) {
  return JSON.stringify(buildEngineeringReport(form, result), null, 2);
}

export function exportReportAsMarkdown(form, result) {
  return buildMarkdownEngineeringReport(form, result);
}

export function exportReportAsCSV(form, result) {
  const report = buildEngineeringReport(form, result);
  const rows = [
    ["field", "value"],
    ["project", report.meta.title],
    ["scenario", report.meta.scenario],
    ["valid", String(report.meta.valid)],
    ["dailyEnergyKWh", report.summary.dailyEnergyKWh],
    ["peakLoadKW", report.summary.peakLoadKW],
    ["pvArrayKWp", report.summary.pvArrayKWp],
    ["estimatedPVEnergyKWh", report.summary.estimatedPVEnergyKWh],
    ["batteryUsableKWh", report.summary.batteryUsableKWh],
    ["inverterKW", report.summary.inverterKW],
    ["healthScore", report.summary.healthScore]
  ];

  return rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
}

export function exportReport(form, result, format = "json") {
  if (format === "json") return exportReportAsJSON(form, result);
  if (format === "markdown") return exportReportAsMarkdown(form, result);
  if (format === "csv") return exportReportAsCSV(form, result);
  throw new Error(`Unsupported report export format: ${format}`);
}
