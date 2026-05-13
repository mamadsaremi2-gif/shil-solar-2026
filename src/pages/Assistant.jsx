import React from "react";
import DashboardBottomNav from "../components/dashboard/DashboardBottomNav.jsx";

export default function PlaceholderPage() {
  return (
    <div className="dashboard-shell-v15" dir="rtl">
      <main className="dashboard-main-v15">
        <section className="status-card-v15">
          <div className="status-chip">SHIL V15</div>
          <h2>صفحه در حال توسعه</h2>
          <p>این صفحه در مرحله بعدی با طراحی کامل SHIL V15 تکمیل می‌شود.</p>
        </section>
      </main>
      <DashboardBottomNav />
    </div>
  );
}
