import React from "react";

export default function EngineeringMiniCard({
  title,
  value,
  subtitle,
}) {
  return (
    <div className="engineering-mini-card-v15">
      <h4>{title}</h4>
      <strong>{value}</strong>
      <p>{subtitle}</p>
    </div>
  );
}
