import React from "react";

import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const thermalData = [

  {
    hour: "06",
    temp: 22,
  },

  {
    hour: "08",
    temp: 28,
  },

  {
    hour: "10",
    temp: 36,
  },

  {
    hour: "12",
    temp: 44,
  },

  {
    hour: "14",
    temp: 47,
  },

  {
    hour: "16",
    temp: 41,
  },

  {
    hour: "18",
    temp: 33,
  },

];

export default function ThermalAnalysisWidget() {

  return (

    <div className="thermal-widget-v15">

      <div className="widget-head-v15">

        <div>

          <span>THERMAL ANALYSIS</span>

          <h3>????? ?????? ?????</h3>

        </div>

      </div>

      <ResponsiveContainer
        width="100%"
        height={280}
      >

        <LineChart data={thermalData}>

          <CartesianGrid
            strokeDasharray="3 3"
          />

          <XAxis dataKey="hour" />

          <YAxis />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="temp"
            stroke="#f97316"
            strokeWidth={3}
            dot={false}
          />

        </LineChart>

      </ResponsiveContainer>

    </div>

  );
}
