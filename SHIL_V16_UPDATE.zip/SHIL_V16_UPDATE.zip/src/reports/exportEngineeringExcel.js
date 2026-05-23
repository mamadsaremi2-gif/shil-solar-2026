import * as XLSX from "xlsx";

export function exportEngineeringExcel() {
  const rows = [
    { parameter: "PV Array", value: "14.04", unit: "kWp" },
    { parameter: "Panel Count", value: "24", unit: "pcs" },
    { parameter: "Inverter", value: "5", unit: "kW" },
    { parameter: "Battery Bank", value: "9.6", unit: "kWh" },
    { parameter: "Voltage Drop", value: "1.8", unit: "%" },
    { parameter: "MPPT Status", value: "OK", unit: "-" },
  ];

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Engineering Report");
  XLSX.writeFile(workbook, "SHIL-Engineering-Report.xlsx");
}
