import React from "react";

export default function MetricCard({
  title,
  value,
  unit,
}) {

  return (
    <div className="metric-card-v15">

      <div className="metric-title-v15">
        {title}
      </div>

      <div className="metric-value-v15">
        {value}
      </div>

      <div className="metric-unit-v15">
        {unit}
      </div>

    </div>
  );
}
