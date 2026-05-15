import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const data = [
  { month: "فروردین", pv: 520, load: 410, loss: 42 },
  { month: "اردیبهشت", pv: 610, load: 450, loss: 48 },
  { month: "خرداد", pv: 720, load: 510, loss: 56 },
  { month: "تیر", pv: 780, load: 540, loss: 62 },
  { month: "مرداد", pv: 750, load: 530, loss: 59 },
  { month: "شهریور", pv: 680, load: 500, loss: 51 },
];

export default function EngineeringComposedChart() {
  return (
    <div className="analytics-card-v15">
      <div className="widget-head-v15">
        <div>
          <span>MONTHLY ANALYSIS</span>
          <h3>تحلیل تولید، مصرف و تلفات</h3>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.08)" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Area type="monotone" dataKey="pv" fill="#38bdf8" stroke="#38bdf8" fillOpacity={0.22} />
          <Bar dataKey="load" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
          <Line type="monotone" dataKey="loss" stroke="#f97316" strokeWidth={3} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
