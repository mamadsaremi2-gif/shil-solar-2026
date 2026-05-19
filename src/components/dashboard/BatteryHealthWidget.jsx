import React from "react";

import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const batteryData = [

  {
    time: "08",
    value: 82,
  },

  {
    time: "10",
    value: 78,
  },

  {
    time: "12",
    value: 74,
  },

  {
    time: "14",
    value: 71,
  },

  {
    time: "16",
    value: 69,
  },

  {
    time: "18",
    value: 66,
  },

];

export default function BatteryHealthWidget() {

  return (

    <div className="battery-health-v15">

      <div className="widget-head-v15">

        <div>

          <span>BATTERY HEALTH</span>

          <h3>وضعیت سلامت باتری</h3>

        </div>

        <div className="battery-chip-v15">
          HEALTHY
        </div>

      </div>

      <ResponsiveContainer
        width="100%"
        height={240}
      >

        <LineChart data={batteryData}>

          <XAxis dataKey="time" />

          <YAxis />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="value"
            stroke="#22c55e"
            strokeWidth={3}
            dot={false}
          />

        </LineChart>

      </ResponsiveContainer>

    </div>

  );
}
