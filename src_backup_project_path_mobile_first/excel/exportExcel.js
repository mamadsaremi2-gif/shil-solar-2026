import * as XLSX
from "xlsx";

export function exportExcel(
  rows
) {

  const worksheet =
    XLSX.utils.json_to_sheet(
      rows
    );

  const workbook =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "SHIL"
  );

  XLSX.writeFile(
    workbook,
    "report.xlsx"
  );
}
