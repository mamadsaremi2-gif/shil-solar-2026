import React from "react";
import { Link } from "react-router-dom";
import { Bell, Menu } from "lucide-react";

export default function DashboardHeader() {
  return (
    <header className="dashboard-header-v15">

      <button className="header-icon-btn">
        <Menu size={24} />
      </button>

      <div className="header-brand-v15">
        <div className="header-brand-glow" />

        <h1>SHIL</h1>

        <span>
          ENGINEERING PLATFORM
        </span>
      </div>

      <Link to="/notifications" className="header-icon-btn">
        <Bell size={22} />
      </Link>

    </header>
  );
}
