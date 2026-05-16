import React from "react";

import GridLayout
from "react-grid-layout";

export default function EngineeringGrid() {

  return (

    <GridLayout
      className="layout"

      cols={12}

      rowHeight={60}

      width={1200}
    >

      <div
        key="1"
        className="grid-box-v15"
      >
        Chart
      </div>

      <div
        key="2"
        className="grid-box-v15"
      >
        Reports
      </div>

    </GridLayout>

  );
}
