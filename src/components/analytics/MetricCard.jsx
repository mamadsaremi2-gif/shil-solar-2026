import React from "react";

export default function MetricCard({ title, value, unit }) {
  return (
    <div className="metric-card-v15">
      <div className="metric-title-v15">{title}</div>
      <div className="metric-value-v15" dir="ltr" data-engineering-value="true">
        <span>{value}</span>{unit ? <><span aria-hidden="true"> </span><span className="metric-unit-v15">{unit}</span></> : null}
      </div>
    </div>
  );
}
