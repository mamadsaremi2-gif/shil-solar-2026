import React from "react";
import EngineeringPageShell from "../../components/EngineeringPageShell.jsx";
import StepConfirmLink from "../../components/StepConfirmLink.jsx";

export default function ProjectInfo() {
  return (
    <EngineeringPageShell title="Ø§Ø·Ù„Ø§Ø¹Ø§Øª Ù¾Ø±ÙˆÚ˜Ù‡">
      <section className="shil-card-stack">
        <div className="shil-section-card">
          <div className="shil-section-head"><h2>Ù…Ø´Ø®ØµØ§Øª Ø§ÙˆÙ„ÛŒÙ‡ Ù¾Ø±ÙˆÚ˜Ù‡</h2><span>Ù…Ø±Ø­Ù„Ù‡ Û±</span></div>
          <div className="shil-form-grid">
            <label><span>Ù†Ø§Ù… Ù¾Ø±ÙˆÚ˜Ù‡</span><input defaultValue="X" placeholder="Ù…Ø«Ù„Ø§Ù‹ Ù¾Ø±ÙˆÚ˜Ù‡ ÙˆÛŒÙ„Ø§ÛŒÛŒ Ø´Ù…Ø§Ù„" data-required="true" /></label>
            <label><span>Ù†Ø§Ù… Ú©Ø§Ø±ÙØ±Ù…Ø§</span><input defaultValue="SHIL CO" placeholder="Ù†Ø§Ù… Ø´Ø®Øµ ÛŒØ§ Ø´Ø±Ú©Øª" /></label>
            <label><span>ØªØ§Ø±ÛŒØ® Ø«Ø¨Øª</span><input value={new Date().toLocaleDateString("fa-IR")} readOnly /></label>
          </div>
        </div>
        <div className="shil-section-card">
          <div className="shil-section-head"><h2>ØªÙˆØ¶ÛŒØ­Ø§Øª Ù¾Ø±ÙˆÚ˜Ù‡</h2><span>Ø§Ø®ØªÛŒØ§Ø±ÛŒ</span></div>
          <textarea className="shil-textarea" rows="5" placeholder="Ù†ÛŒØ§Ø² Ù¾Ø±ÙˆÚ˜Ù‡ØŒ Ù…Ø­Ø¯ÙˆØ¯ÛŒØªâ€ŒÙ‡Ø§ØŒ ØªÙˆØ¶ÛŒØ­Ø§Øª Ø§Ø¬Ø±Ø§ÛŒÛŒ ÛŒØ§ Ù†Ú©Ø§Øª Ù…Ù‡Ù… Ø±Ø§ ÙˆØ§Ø±Ø¯ Ú©Ù†ÛŒØ¯..." />
        </div>
        <StepConfirmLink to="/new-project/environment">ØªØ£ÛŒÛŒØ¯ Ù…Ø±Ø­Ù„Ù‡ Ùˆ ÙˆØ±ÙˆØ¯ Ø¨Ù‡ Ø´Ø±Ø§ÛŒØ· Ù…Ø­ÛŒØ·ÛŒ</StepConfirmLink>
      </section>
    </EngineeringPageShell>
  );
}
