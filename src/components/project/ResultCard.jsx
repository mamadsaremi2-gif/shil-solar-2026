import React from "react";

export default function ResultCard({ title, value, unit }) {
  return (
    <div className="result-card-v15">
      <div className="result-title-v15">{title}</div>
      <div className="result-value-v15" dir="ltr" data-engineering-value="true">
        <span>{value}</span>{unit ? <><span aria-hidden="true"> </span><span className="result-unit-v15">{unit}</span></> : null}
      </div>
    </div>
  );
}
