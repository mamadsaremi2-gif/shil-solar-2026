import React from "react";
import { runEngineeringEngine } from "../../engineering/engine/runEngineeringEngine.js";

export default function EngineeringResultPanel() {
  const result =
    runEngineeringEngine();

  return (
    <section className="engineering-result-panel-v15">
      <div className="widget-head-v15">
        <div>
          <span>REAL ENGINE</span>
          <h3>????? ????? ????? ??????</h3>
        </div>

        <div className="engine-status-chip-v15">
          {result.status}
        </div>
      </div>

      <div className="engineering-result-grid-v15">
        <div>
          <h4>????? ???</h4>
          <strong>{result.pv.panelCount}</strong>
          <p>{result.pv.arrayPowerW} Wp</p>
        </div>

        <div>
          <h4>?????</h4>
          <strong>{result.battery.batteryAh} Ah</strong>
          <p>{result.battery.batteryKWh} kWh</p>
        </div>

        <div>
          <h4>???????</h4>
          <strong>{result.inverter.recommendedInverterW} W</strong>
          <p>Recommended</p>
        </div>

        <div>
          <h4>??? ?????</h4>
          <strong>{result.cable.voltageDropPercent}%</strong>
          <p>{result.cable.status}</p>
        </div>

        <div>
          <h4>MPPT</h4>
          <strong>{result.string.status}</strong>
          <p>{result.string.vmpString} V</p>
        </div>

        <div>
          <h4>???????</h4>
          <strong>{result.losses.efficiency}%</strong>
          <p>Total Loss {result.losses.totalLoss}%</p>
        </div>
      </div>
    </section>
  );
}
