import React from "react";
import { Link } from "react-router-dom";

export default function SafePage({
  title = "صفحه در حال آماده‌سازی",
  subtitle = "این بخش فعال است اما هنوز به داده نهایی متصل نشده.",
}) {
  return (
    <div className="dashboard-shell-v15" dir="rtl">
      <main className="dashboard-main-v15">
        <section className="hero-card-v15">
          <div className="hero-row-v15">
            <span>SHIL V15</span>
            <span>SAFE PAGE</span>
          </div>

          <div className="hero-content-v15">
            <h1>{title}</h1>
            <h2>{subtitle}</h2>
          </div>

          <Link to="/" className="header-btn-v15" style={{ marginTop: 18 }}>
            بازگشت به داشبورد
          </Link>
        </section>
      </main>
    </div>
  );
}
