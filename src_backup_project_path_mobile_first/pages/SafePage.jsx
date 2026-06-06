import React from "react";
import { Link } from "react-router-dom";

export default function SafePage({
  title = "???? ?? ??? ??????????",
  subtitle = "??? ??? ???? ??? ??? ???? ?? ???? ????? ???? ????.",
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
            ?????? ?? ???????
          </Link>
        </section>
      </main>
    </div>
  );
}
