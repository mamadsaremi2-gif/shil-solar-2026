import React from "react";
import { runEngineeringEngine } from "../../engineering/engine/runEngineeringEngine.js";

function Row({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function EngineeringResultPanel() {
  const result = runEngineeringEngine();

  const rows = [
    ["تعداد پنل", result.pv.panelCount],
    ["توان آرایه", `${result.pv.arrayPowerW} Wp`],
    ["باتری", `${result.battery.batteryCount || result.battery.totalCount || "-"} عدد / ${result.battery.voltageV || result.battery.unitVoltageV || "-"}V`],
    ["ظرفیت باتری", `${result.battery.batteryAh || result.battery.capacityAh || result.battery.unitCapacityAh || "-"}Ah / ${result.battery.batteryKWh || result.battery.grossEnergyKWh || "-"}kWh`],
    ["اینورتر پیشنهادی", `${result.inverter.recommendedInverterW} W`],
    ["افت ولتاژ", `${result.cable.voltageDropPercent}%`],
    ["وضعیت کابل", result.cable.status],
    ["MPPT", result.string.status],
    ["Vmp String", `${result.string.vmpString} V`],
    ["راندمان", `${result.losses.efficiency}%`],
    ["تلفات کل", `${result.losses.totalLoss}%`],
  ];

  return (
    <section className="engineering-result-panel-v15 shil-compact-engineering-panel">
      <div className="widget-head-v15">
        <div>
          <span>REAL ENGINE</span>
          <h3>نتیجه محاسبات مهندسی</h3>
        </div>
        <div className="engine-status-chip-v15">{result.status}</div>
      </div>

      <div className="shil-summary-grid shil-engineering-grid-table">
        {rows.filter(([, value]) => value !== undefined && value !== null).map(([label, value]) => (
          <Row key={label} label={label} value={value} />
        ))}
      </div>
    </section>
  );
}
