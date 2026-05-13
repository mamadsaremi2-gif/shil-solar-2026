import React from "react";

import DashboardHeader from "../components/dashboard/DashboardHeader.jsx";
import DashboardHero from "../components/dashboard/DashboardHero.jsx";
import DashboardGrid from "../components/dashboard/DashboardGrid.jsx";
import DashboardBottomNav from "../components/dashboard/DashboardBottomNav.jsx";

export default function Dashboard() {
  return (
    <div className="dashboard-shell-v15">

      <div className="dashboard-bg-glow glow-1" />
      <div className="dashboard-bg-glow glow-2" />
      <div className="dashboard-bg-glow glow-3" />

      <DashboardHeader />

      <main className="dashboard-main-v15">

        <DashboardHero />

        <DashboardGrid />

        <section className="status-card-v15">

          <div className="status-chip">
            V15 ACTIVE
          </div>

          <h2>
            وضعیت زیرساخت
          </h2>

          <p>
            هسته مهندسی SHIL فعال است.
            سیستم آماده توسعه مسیرهای
            محاسباتی، موتور طراحی و
            فرم‌های مهندسی می‌باشد.
          </p>

        </section>

      </main>

      <DashboardBottomNav />

    </div>
  );
}