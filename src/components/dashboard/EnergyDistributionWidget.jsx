import React from "react";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

const data = [
  { name: "مصرف", value: 62 },
  { name: "ذخیره", value: 24 },
  { name: "تلفات", value: 14 },
];

const COLORS = [
  "#38bdf8",
  "#8b5cf6",
  "#ef4444",
];

export default function EnergyDistributionWidget() {

  return (

    <div className="energy-distribution-v15">

      <div className="widget-head-v15">

        <div>

          <span>ENERGY FLOW</span>

          <h3>توزیع انرژی سیستم</h3>

        </div>

      </div>

      <ResponsiveContainer
        width="100%"
        height={260}
      >

        <PieChart>

          <Pie
            data={data}
            dataKey="value"
            innerRadius={54}
            outerRadius={84}
            paddingAngle={4}
          >

            {data.map((entry, index) => (

              <Cell
                key={index}
                fill={COLORS[index]}
              />

            ))}

          </Pie>

        </PieChart>

      </ResponsiveContainer>

      <div className="energy-legend-v15">

        {data.map((item, index) => (

          <div
            key={item.name}
            className="energy-legend-item-v15"
          >

            <span
              style={{
                background:
                  COLORS[index],
              }}
            />

            <p>{item.name}</p>

            <strong>
              {item.value}%
            </strong>

          </div>

        ))}

      </div>

    </div>

  );
}
