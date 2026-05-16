import React from "react";

const items = [
  { title: "PV Yield", value: "58 kWh", level: 88 },
  { title: "Battery SOC", value: "92%", level: 92 },
  { title: "Cable Loss", value: "1.8%", level: 18 },
  { title: "MPPT Match", value: "OK", level: 96 },
];

export default function AnalysisBars() {
  return (
    <div className="analytics-card-v15">
      <div className="widget-head-v15">
        <div>
          <span>ANALYSIS BARS</span>
          <h3>???????? ?????? ?????</h3>
        </div>
      </div>

      <div className="analysis-bars-v15">
        {items.map((item) => (
          <div className="analysis-bar-row-v15" key={item.title}>
            <div>
              <h4>{item.title}</h4>
              <span>{item.value}</span>
            </div>

            <div className="analysis-bar-track-v15">
              <div
                className="analysis-bar-fill-v15"
                style={{ width: `${item.level}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
