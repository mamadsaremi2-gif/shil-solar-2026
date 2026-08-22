import { jsPDF }
from "jspdf";

import autoTable
from "jspdf-autotable";

export function createReportPDF() {

  const pdf =
    new jsPDF();

  pdf.text(
    "SHIL REPORT",
    14,
    20
  );

  autoTable(pdf, {

    startY: 30,

    head: [["Item", "Value"]],

    body: [
      ["Panels", "12"],
      ["Battery", "200Ah"],
      ["Inverter", "5kW"],
    ],

  });

  pdf.save("report.pdf");
}
