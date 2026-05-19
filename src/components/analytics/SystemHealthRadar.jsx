import React from "react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from "recharts";

const data = [
  { subject: "PV", value: 92 },
  { subject: "Battery", value: 84 },
  { subject: "Inverter", value: 89 },
  { subject: "Cable", value: 94 },
  { subject: "Loss", value: 78 },
  { subject: "Safety", value: 91 },
];

export default function SystemHealthRadar() {
  return (
    <div className="analytics-card-v15">
      <div className="widget-head-v15">
        <div>
          <span>SYSTEM HEALTH</span>
          <h3>رادار سلامت مهندسی</h3>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" />
          <PolarRadiusAxis />
          <Tooltip />
          <Radar dataKey="value" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.42} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
