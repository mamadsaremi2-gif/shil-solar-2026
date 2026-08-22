import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export async function exportPDF(elementId, fileName = "shil-report.pdf") {
  const input = document.getElementById(elementId);

  if (!input) {
    throw new Error("Report element not found");
  }

  const canvas = await html2canvas(input, {
    scale: 2,
    backgroundColor: "#020617",
  });

  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF("p", "mm", "a4");
  const width = pdf.internal.pageSize.getWidth();
  const height = (canvas.height * width) / canvas.width;

  pdf.addImage(imgData, "PNG", 0, 0, width, height);
  pdf.save(fileName);
}
