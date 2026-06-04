import React from "react";

export default function EngineeringMiniCard({ title, value, subtitle }) {
  return (
    <div className="engineering-mini-card-v15 shil-data-row">
      <span>{title}</span>
      <strong>{value}</strong>
      {subtitle ? <small>{subtitle}</small> : null}
    </div>
  );
}
