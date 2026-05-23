import React from "react";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const data = [

  {
    name: "PV",
    value: 64,
  },

  {
    name: "Battery",
    value: 21,
  },

  {
    name: "Grid",
    value: 15,
  },

];

const COLORS = [
  "#38bdf8",
  "#8b5cf6",
  "#22c55e",
];

export default function EnergySourceWidget() {

  return (

    <div className="energy-source-widget-v15">

      <div className="widget-head-v15">

        <div>

          <span>ENERGY SOURCES</span>

          <h3>منابع تامین انرژی</h3>

        </div>

      </div>

      <ResponsiveContainer
        width="100%"
        height={260}
      >

        <PieChart>

          <Pie
            data={data}
            innerRadius={58}
            outerRadius={92}
            dataKey="value"
          >

            {data.map((entry, index) => (

              <Cell
                key={index}
                fill={COLORS[index % COLORS.length]}
              />

            ))}

          </Pie>

          <Tooltip />

        </PieChart>

      </ResponsiveContainer>

      <div className="energy-source-legend-v15">

        {data.map((item) => (

          <div
            key={item.name}
            className="energy-source-row-v15"
          >

            <div className="energy-source-left-v15">

              <span
                className="energy-dot-v15"
              />

              <p>
                {item.name}
              </p>

            </div>

            <strong>
              {item.value}%
            </strong>

          </div>

        ))}

      </div>

    </div>

  );
}
