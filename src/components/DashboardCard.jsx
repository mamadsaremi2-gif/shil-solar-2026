import React from "react";
import { Link } from "react-router-dom";

export default function DashboardCard({ to, icon, title, subtitle }) {
  return (
    <Link className="dash-card" to={to}>
      <div className="card-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{subtitle}</p>
    </Link>
  );
}
