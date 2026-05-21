import React from "react";

import {
  AgGridReact
} from "ag-grid-react";

import "ag-grid-community/styles/ag-grid.css";

import "ag-grid-community/styles/ag-theme-alpine.css";

export default function AGEngineeringGrid() {

  const rowData = [
    {
      equipment: "Panel",
      qty: 12,
    },

    {
      equipment: "Battery",
      qty: 4,
    },
  ];

  const columnDefs = [

    {
      field: "equipment"
    },

    {
      field: "qty"
    },

  ];

  return (

    <div
      className="
        ag-theme-alpine
        ag-grid-v15
      "
    >

      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
      />

    </div>

  );
}
