import React from "react";
import { useNavigate } from "react-router-dom";
import EngineeringPageShell from "../../components/EngineeringPageShell.jsx";

export default function UnderDevelopment() {
  const navigate = useNavigate();
  return (
    <EngineeringPageShell title="ØªÙˆØ³Ø¹Ù‡">
      <section className="shil-card-stack shil-under-development-page">
        <div className="shil-section-card shil-under-development-card">
          <div className="shil-section-head"><h2>Ø¯Ø± Ø­Ø§Ù„ ØªÙˆØ³Ø¹Ù‡</h2><span>Coming Soon</span></div>
          <p className="shil-section-note">Ø¯Ø± Ø§ÛŒÙ† Ù…Ø³ÛŒØ± ÙØ¹Ù„Ø§Ù‹ Ù…Ø­ØªÙˆØ§ÛŒÛŒ Ù‚Ø±Ø§Ø± Ù†Ú¯Ø±ÙØªÙ‡ Ø§Ø³Øª.</p>
          <button type="button" className="shil-primary-wide" onClick={() => navigate(-1)}>Ø¨Ø§Ø²Ú¯Ø´Øª</button>
        </div>
      </section>
    </EngineeringPageShell>
  );
}
