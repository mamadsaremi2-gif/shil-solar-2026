import React from "react";
import { fakeMonthlySolarData } from "../../data/solarData.js";

import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function SolarChart() {

  return (
    <div className="solar-chart-v15">

      <ResponsiveContainer
        width="100%"
        height={240}
      >

        <LineChart data={fakeMonthlySolarData}>

          <XAxis dataKey="month" />

          <YAxis />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="value"
            stroke="#38bdf8"
            strokeWidth={3}
          />

        </LineChart>

      </ResponsiveContainer>

    </div>
  );
}
