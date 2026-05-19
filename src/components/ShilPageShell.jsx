import React from "react";
import { Link, useNavigate } from "react-router-dom";

export function ShilHeader({ title = "SHIL" }) {
  const navigate = useNavigate();
  return (
    <header className="shil-fixed-header">
      <button type="button" onClick={() => navigate(-1)} className="shil-header-action">Ø¨Ø§Ø²Ú¯Ø´Øª</button>
      <div className="shil-header-title">{title}</div>
      <Link to="/dashboard" className="shil-header-action">Ø¯Ø§Ø´Ø¨ÙˆØ±Ø¯</Link>
    </header>
  );
}

export function ShilFooter({ compact = false }) {
  return (
    <footer className="shil-fixed-footer">
      <Link to="/dashboard">Ø®Ø§Ù†Ù‡</Link>
      {!compact ? <Link to="/new-project">Ù¾Ø±ÙˆÚ˜Ù‡ Ø¬Ø¯ÛŒØ¯</Link> : null}
      {!compact ? <Link to="/projects">Ù¾Ø±ÙˆÚ˜Ù‡â€ŒÙ‡Ø§</Link> : null}
      <Link to="/contact">Ø§Ø±ØªØ¨Ø§Ø·</Link>
    </footer>
  );
}

export default function ShilPageShell({ title, children, className = "" }) {
  return (
    <div className={`shil-page-shell ${className}`} dir="rtl">
      <div className="shil-master-bg" />
      <ShilHeader title={title} />
      <main className="shil-page-content">{children}</main>
      <ShilFooter />
    </div>
  );
}
