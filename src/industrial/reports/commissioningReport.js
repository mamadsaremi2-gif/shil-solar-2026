import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportIndustrialCommissioningReport({
  projectName = "SHIL Project",
  telemetry = {},
  alarms = [],
}) {
  const pdf = new jsPDF("p", "mm", "a4");

  pdf.setFontSize(18);
  pdf.text("SHIL Industrial Commissioning Report", 14, 18);

  pdf.setFontSize(10);
  pdf.text(projectName, 14, 26);

  autoTable(pdf, {
    startY: 36,
    head: [["Metric", "Value"]],
    body: [
      ["PV Power", `${telemetry.pvPower || 0} W`],
      ["Battery SOC", `${telemetry.batterySoc || 0}%`],
      ["Load Power", `${telemetry.loadPower || 0} W`],
      ["Grid Status", telemetry.gridStatus || "UNKNOWN"],
      ["Temperature", `${telemetry.temperature || 0} C`],
    ],
  });

  autoTable(pdf, {
    startY: pdf.lastAutoTable.finalY + 12,
    head: [["Alarm", "Level"]],
    body: alarms.length
      ? alarms.map((alarm) => [alarm.title, alarm.level])
      : [["No active alarms", "OK"]],
  });

  pdf.save("SHIL-Commissioning-Report.pdf");
}
