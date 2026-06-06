import React from "react";

import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function AdvancedChart() {

  const data = [

    { month: "Jan", value: 12 },

    { month: "Feb", value: 18 },

    { month: "Mar", value: 24 },

  ];

  return (

    <div className="advanced-chart-v15">

      <ResponsiveContainer
        width="100%"
        height={320}
      >

        <LineChart data={data}>

          <Line
            type="monotone"
            dataKey="value"
            stroke="#38bdf8"
          />

          <CartesianGrid stroke="#1e293b" />

          <XAxis dataKey="month" />

          <YAxis />

          <Tooltip />

        </LineChart>

      </ResponsiveContainer>

    </div>

  );
}
