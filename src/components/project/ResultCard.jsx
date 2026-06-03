import React from "react";

export default function ResultCard({ title, value, unit }) {
  return (
    <div className="result-card-v15 shil-data-row">
      <span className="result-title-v15">{title}</span>
      <strong className="result-value-v15">{value}{unit ? ` ${unit}` : ""}</strong>
    </div>
  );
}
