import React from "react";

import {
  useProjectStore,
} from "../../store/projectStore.js";

import {
  runEngineeringEngine,
} from "../../engineering/engine/runEngineeringEngine.js";

import {
  generateBOM,
} from "../../reports/bom/generateBOM.js";

export default function FinalProjectSummary() {

  const { project } =
    useProjectStore();

  const result =
    runEngineeringEngine(project);

  const bom =
    generateBOM(result);

  return (

    <section className="final-summary-v15">

      <div className="widget-head-v15">

        <div>
          <span>FINAL SUMMARY</span>
          <h3>????? ????? ?????</h3>
        </div>

      </div>

      <div className="summary-grid-v15">

        <div>
          <h4>??? ???????</h4>
          <strong>
            {result.pv.panelCount}
          </strong>
        </div>

        <div>
          <h4>???????</h4>
          <strong>
            {result.inverter.recommendedInverterW}W
          </strong>
        </div>

        <div>
          <h4>?????</h4>
          <strong>
            {result.battery.batteryCount || result.battery.totalCount || "-"} ??? / {result.battery.voltageV || result.battery.unitVoltageV || "-"}V
          </strong>
          <small>{result.battery.batteryAh || result.battery.capacityAh || result.battery.unitCapacityAh || "-"}Ah / {result.battery.batteryKWh || result.battery.grossEnergyKWh || "-"}kWh</small>
        </div>

      </div>

      <div className="summary-bom-v15">

        {bom.map((item)=>(

          <div
            key={item.title}
            className="summary-bom-item-v15"
          >

            <span>{item.title}</span>

            <strong>{item.qty}</strong>

          </div>

        ))}

      </div>

    </section>

  );
}
