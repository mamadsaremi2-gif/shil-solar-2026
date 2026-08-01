import React from "react";
import { useNavigate } from "react-router-dom";
import EngineeringPageShell from "../../components/EngineeringPageShell.jsx";

export default function UnderDevelopment() {
  const navigate = useNavigate();

  return (
    <EngineeringPageShell title="توسعه" className="shil-development-page-unified">
      <section id="shil-development-root" className="shil-card-stack shil-under-development-page">
        <div className="shil-section-card shil-under-development-card">
          <div className="shil-section-head shil-development-title-card">
            <h2>در حال توسعه</h2>
            <span>Coming Soon</span>
          </div>

          <div className="shil-development-message-card">
            <span className="shil-development-status-dot" aria-hidden="true" />
            <p className="shil-section-note">در این مسیر فعلاً محتوایی قرار نگرفته است.</p>
          </div>

          <button
            type="button"
            className="shil-primary-wide shil-development-back-button"
            onClick={() => navigate(-1)}
          >
            <span aria-hidden="true">＋</span>
            بازگشت
          </button>
        </div>
      </section>
    </EngineeringPageShell>
  );
}
