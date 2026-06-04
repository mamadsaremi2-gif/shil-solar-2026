import React from "react";

export default function FormStatusCard({ title, value, status }) {
  return (
    <div className={`form-status-card-v15 shil-data-row ${status}`}>
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}
