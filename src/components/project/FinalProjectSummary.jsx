import React from "react";

import { useProjectStore } from "../../store/projectStore.js";
import { runEngineeringEngine } from "../../engineering/engine/runEngineeringEngine.js";
import { generateBOM } from "../../reports/bom/generateBOM.js";

function Row({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function FinalProjectSummary() {
  const { project } = useProjectStore();
  const result = runEngineeringEngine(project);
  const bom = generateBOM(result);

  const summaryRows = [
    ["تعداد پنل", result.pv.panelCount],
    ["اینورتر", `${result.inverter.recommendedInverterW}W`],
    ["باتری", `${result.battery.batteryCount || result.battery.totalCount || "-"} عدد / ${result.battery.voltageV || result.battery.unitVoltageV || "-"}V`],
    ["ظرفیت باتری", `${result.battery.batteryAh || result.battery.capacityAh || result.battery.unitCapacityAh || "-"}Ah / ${result.battery.batteryKWh || result.battery.grossEnergyKWh || "-"}kWh`],
  ];

  return (
    <section className="final-summary-v15 shil-compact-engineering-panel">
      <div className="widget-head-v15">
        <div>
          <span>FINAL SUMMARY</span>
          <h3>چکیده نهایی پروژه</h3>
        </div>
      </div>

      <div className="shil-summary-grid shil-engineering-grid-table">
        {summaryRows.map(([label, value]) => <Row key={label} label={label} value={value} />)}
      </div>

      <div className="summary-bom-v15 shil-engineering-grid-table">
        {bom.map((item) => (
          <div key={item.title} className="summary-bom-item-v15">
            <span>{item.title}</span>
            <strong>{item.qty}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
