import Papa from "papaparse";

export function exportCSV(
  data
) {

  const csv =
    Papa.unparse(data);

  const blob =
    new Blob([csv]);

  const link =
    document.createElement("a");

  link.href =
    URL.createObjectURL(blob);

  link.download =
    "report.csv";

  link.click();
}
