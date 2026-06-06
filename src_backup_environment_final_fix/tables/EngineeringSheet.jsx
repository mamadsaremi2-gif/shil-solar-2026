import React from "react";

import {
  DataSheetGrid,
  textColumn,
} from "react-datasheet-grid";

import "react-datasheet-grid/dist/style.css";

export default function EngineeringSheet() {

  const data = [
    {
      item: "Panel",
      value: "550W",
    },

    {
      item: "Battery",
      value: "200Ah",
    },
  ];

  return (

    <div className="sheet-v15">

      <DataSheetGrid
        value={data}

        columns={[
          {
            ...textColumn,
            title: "Item",
            key: "item",
          },

          {
            ...textColumn,
            title: "Value",
            key: "value",
          },
        ]}

        onChange={() => {}}
      />

    </div>

  );
}
