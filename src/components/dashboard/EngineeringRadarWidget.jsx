import React from "react";

import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

const data = [

  {
    subject: "PV",
    value: 92,
  },

  {
    subject: "Battery",
    value: 81,
  },

  {
    subject: "Inverter",
    value: 87,
  },

  {
    subject: "Generator",
    value: 68,
  },

  {
    subject: "Efficiency",
    value: 90,
  },

];

export default function EngineeringRadarWidget() {

  return (

    <div className="engineering-radar-v15">

      <div className="widget-head-v15">

        <div>

          <span>ENGINEERING ANALYSIS</span>

          <h3>تحلیل عملکرد سیستم</h3>

        </div>

      </div>

      <ResponsiveContainer
        width="100%"
        height={320}
      >

        <RadarChart data={data}>

          <PolarGrid />

          <PolarAngleAxis
            dataKey="subject"
          />

          <PolarRadiusAxis />

          <Radar
            name="Performance"
            dataKey="value"
            stroke="#38bdf8"
            fill="#38bdf8"
            fillOpacity={0.45}
          />

        </RadarChart>

      </ResponsiveContainer>

    </div>

  );
}
