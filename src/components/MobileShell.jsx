import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function MobileShell({ title = "داشبورد", children }) {
  const navigate = useNavigate();

  return (
    <div className="app-bg" dir="rtl">
      <div className="mobile-frame">
        <header className="app-header">
          <button className="header-btn" onClick={() => navigate(-1)}>بازگشت</button>
          <div className="brand">
            <strong>SHIL</strong>
            <span>ENGINEERING UI</span>
          </div>
          <Link className="header-btn" to="/">داشبورد</Link>
        </header>

        <main className="app-main">{children}</main>

        <footer className="app-footer">
          <Link to="/" className="footer-btn">داشبورد</Link>
          <Link to="/projects" className="footer-btn">پروژه‌ها</Link>
          <Link to="/contact" className="footer-btn">ارتباط</Link>
        </footer>
      </div>
    </div>
  );
}
