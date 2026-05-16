import React from "react";
import { Link } from "react-router-dom";

export default function WelcomePage() {
  return (
    <div className="shil-welcome-page" dir="rtl">
      <header className="shil-welcome-glass-header">
        طراحی هوشمند انرژی های خورشیدی / برق اضطراری
      </header>

      <main className="shil-welcome-center">
        <img className="shil-welcome-logo" src="/assets/shil/logo/welcome/shil-welcome-logo.webp" alt="SHIL" />
        <Link className="shil-primary-entry" to="/dashboard">ورود به داشبورد</Link>
      </main>
    </div>
  );
}
