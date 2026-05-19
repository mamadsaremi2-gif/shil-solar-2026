import React from "react";

import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const irradiance = [

  {
    hour: "06",
    value: 120,
  },

  {
    hour: "08",
    value: 340,
  },

  {
    hour: "10",
    value: 620,
  },

  {
    hour: "12",
    value: 940,
  },

  {
    hour: "14",
    value: 880,
  },

  {
    hour: "16",
    value: 510,
  },

  {
    hour: "18",
    value: 160,
  },

];

export default function IrradianceWidget() {

  return (

    <div className="irradiance-widget-v15">

      <div className="widget-head-v15">

        <div>

          <span>IRRADIANCE</span>

          <h3>شدت تابش خورشیدی</h3>

        </div>

        <div className="irradiance-badge-v15">
          PEAK
        </div>

      </div>

      <ResponsiveContainer
        width="100%"
        height={260}
      >

        <AreaChart data={irradiance}>

          <XAxis dataKey="hour" />

          <YAxis />

          <Tooltip />

          <Area
            type="monotone"
            dataKey="value"
            stroke="#facc15"
            fill="#facc15"
            fillOpacity={0.28}
            strokeWidth={3}
          />

        </AreaChart>

      </ResponsiveContainer>

    </div>

  );
}
