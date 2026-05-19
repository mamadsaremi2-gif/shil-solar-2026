import React from "react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const data = [
  { name: "06", solar: 4 },
  { name: "08", solar: 8 },
  { name: "10", solar: 14 },
  { name: "12", solar: 21 },
  { name: "14", solar: 26 },
  { name: "16", solar: 18 },
  { name: "18", solar: 9 },
];

export default function LiveEnergyWidget() {

  return (

    <div className="live-energy-v15">

      <div className="live-energy-head-v15">

        <div>

          <span>LIVE SOLAR</span>

          <h3>تولید لحظه‌ای انرژی</h3>

        </div>

        <div className="live-energy-badge-v15">
          ONLINE
        </div>

      </div>

      <ResponsiveContainer
        width="100%"
        height={220}
      >

        <AreaChart data={data}>

          <XAxis dataKey="name" />

          <YAxis />

          <Tooltip />

          <Area
            type="monotone"
            dataKey="solar"
            stroke="#38bdf8"
            fill="url(#colorSolar)"
            strokeWidth={3}
          />

          <defs>

            <linearGradient
              id="colorSolar"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >

              <stop
                offset="5%"
                stopColor="#38bdf8"
                stopOpacity={0.8}
              />

              <stop
                offset="95%"
                stopColor="#38bdf8"
                stopOpacity={0}
              />

            </linearGradient>

          </defs>

        </AreaChart>

      </ResponsiveContainer>

    </div>

  );
}
