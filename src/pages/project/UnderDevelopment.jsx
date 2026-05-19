import React from "react";
import { useNavigate } from "react-router-dom";
import EngineeringPageShell from "../../components/EngineeringPageShell.jsx";

export default function UnderDevelopment() {
  const navigate = useNavigate();
  return (
    <EngineeringPageShell title="توسعه">
      <section className="shil-card-stack shil-under-development-page">
        <div className="shil-section-card shil-under-development-card">
          <div className="shil-section-head"><h2>در حال توسعه</h2><span>Coming Soon</span></div>
          <p className="shil-section-note">در این مسیر فعلاً محتوایی قرار نگرفته است.</p>
          <button type="button" className="shil-primary-wide" onClick={() => navigate(-1)}>بازگشت</button>
        </div>
      </section>
    </EngineeringPageShell>
  );
}
