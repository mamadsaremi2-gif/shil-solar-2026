import React from "react";
import GaugeComponent from "react-gauge-component";

export default function EfficiencyGauge() {
  return (
    <div className="analytics-card-v15">
      <div className="widget-head-v15">
        <div>
          <span>EFFICIENCY</span>
          <h3>???? ??????? ?????</h3>
        </div>
      </div>

      <GaugeComponent
        value={88}
        minValue={0}
        maxValue={100}
        labels={{
          valueLabel: { formatTextValue: value => value + "%" },
        }}
      />
    </div>
  );
}
