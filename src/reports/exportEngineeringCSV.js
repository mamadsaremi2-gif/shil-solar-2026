import Papa from "papaparse";
import { saveAs } from "file-saver";

export function exportEngineeringCSV() {
  const rows = [
    { parameter: "PV Array", value: "14.04", unit: "kWp" },
    { parameter: "Panel Count", value: "24", unit: "pcs" },
    { parameter: "Inverter", value: "5", unit: "kW" },
    { parameter: "Battery Bank", value: "9.6", unit: "kWh" },
    { parameter: "Voltage Drop", value: "1.8", unit: "%" },
    { parameter: "MPPT Status", value: "OK", unit: "-" },
  ];

  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });

  saveAs(blob, "SHIL-Engineering-Report.csv");
}
