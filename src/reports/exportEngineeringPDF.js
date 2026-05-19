import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportEngineeringPDF() {
  const pdf = new jsPDF("p", "mm", "a4");

  pdf.setFontSize(18);
  pdf.text("SHIL Engineering Report", 14, 18);

  pdf.setFontSize(10);
  pdf.text("Solar / Hybrid / پشتیبان Engineering Output", 14, 26);

  autoTable(pdf, {
    startY: 36,
    head: [["Parameter", "Value", "Unit"]],
    body: [
      ["PV Array", "14.04", "kWp"],
      ["Panel Count", "24", "pcs"],
      ["Inverter", "5", "kW"],
      ["Battery Bank", "9.6", "kWh"],
      ["Voltage Drop", "1.8", "%"],
      ["MPPT Status", "OK", "-"],
    ],
  });

  autoTable(pdf, {
    startY: pdf.lastAutoTable.finalY + 12,
    head: [["Check", "Status"]],
    body: [
      ["PV String", "PASS"],
      ["Cable Sizing", "PASS"],
      ["Battery Autonomy", "READY"],
      ["Protection", "READY"],
    ],
  });

  pdf.save("SHIL-Engineering-Report.pdf");
}
