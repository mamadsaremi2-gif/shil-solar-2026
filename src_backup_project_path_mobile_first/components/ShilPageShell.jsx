import React from "react";
import { Link, useNavigate } from "react-router-dom";

export function ShilHeader({ title = "SHIL" }) {
  const navigate = useNavigate();
  return (
    <header className="shil-fixed-header">
      <button type="button" onClick={() => navigate(-1)} className="shil-header-action">بازگشت</button>
      <div className="shil-header-title">{title}</div>
      <Link to="/dashboard" className="shil-header-action">داشبورد</Link>
    </header>
  );
}

export function ShilFooter({ compact = false }) {
  return (
    <footer className="shil-fixed-footer">
      <Link to="/dashboard">خانه</Link>
      {!compact ? <Link to="/new-project">پروژه جدید</Link> : null}
      {!compact ? <Link to="/projects">پروژه‌ها</Link> : null}
      <Link to="/contact">ارتباط</Link>
    </footer>
  );
}

export default function ShilPageShell({ title, children, className = "", hideHeader = false, hideFooter = false }) {
  return (
    <div className={`shil-page-shell ${className}`} dir="rtl">
      <div className="shil-master-bg" />
      {!hideHeader && <ShilHeader title={title} />}
      <main className="shil-page-content">{children}</main>
      {!hideFooter && <ShilFooter />}
    </div>
  );
}
