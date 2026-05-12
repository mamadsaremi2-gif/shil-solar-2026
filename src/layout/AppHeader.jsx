import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/app-header.css";

export default function AppHeader({
  title = "اطلاعات پروژه",
  showHome = true,
  className = "",
}) {
  const navigate = useNavigate();

  const handleGoDashboard = () => {
    navigate("/");
  };

  return (
    <header className={`shil-app-header ${className}`} dir="rtl">
      <div className="shil-app-header__inner">
        <div className="shil-app-header__title-pill">
          <span className="shil-app-header__title-text">{title}</span>
        </div>

        <div className="shil-app-header__logo-wrap">
          <img
            src="/assets/brand/shil-logo-header.webp"
            alt="SHIL"
            className="shil-app-header__logo"
          />
        </div>

        {showHome ? (
          <button
            type="button"
            className="shil-app-header__home-btn"
            onClick={handleGoDashboard}
            aria-label="رفتن به داشبورد"
          >
            <span className="shil-app-header__home-icon">⌂</span>
          </button>
        ) : (
          <div className="shil-app-header__home-placeholder" />
        )}
      </div>
    </header>
  );
}