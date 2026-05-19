import { useMemo } from "react";
import { Link } from "react-router-dom";
import { runSolarAutoDesign } from "../../../../core/calculation/solarAutoDesignEngine.js";

export function SystemSettingsStep({ value = {} }) {
  const design = useMemo(() => runSolarAutoDesign({
    load: value.load || {},
    environment: value.environment || {},
    settings: value
  }), [value]);

  return (
    <div className="shil-card-stack shil-system-settings-mini shil-system-settings-redirect">
      <div className="shil-section-card">
        <div className="shil-section-head">
          <h2>ØªÙ†Ø¸ÛŒÙ…Ø§Øª Ø³ÛŒØ³ØªÙ…</h2>
          <span>Ù…Ø³ÛŒØ± Ø¬Ø¯ÛŒØ¯ ÙØ¹Ø§Ù„</span>
        </div>
        <p className="shil-muted-text">
          Ø¨Ø§Ù†Ú©â€ŒÙ‡Ø§ÛŒ Ù¾Ù†Ù„ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒØŒ Ø§ÛŒÙ†ÙˆØ±ØªØ± Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ Ùˆ Ø¨Ø§ØªØ±ÛŒ Ø§Ø² Ø§ÛŒÙ† Ù…Ø±Ø­Ù„Ù‡ Ù‚Ø¯ÛŒÙ…ÛŒ Ø­Ø°Ù Ø´Ø¯Ù†Ø¯ Ùˆ Ù†Ø³Ø®Ù‡ Ù†Ù‡Ø§ÛŒÛŒ ÙÙ‚Ø· Ø¯Ø± ØµÙØ­Ù‡ Ø§ØµÙ„ÛŒ ØªÙ†Ø¸ÛŒÙ…Ø§Øª Ø³ÛŒØ³ØªÙ… Ù…Ø¯ÛŒØ±ÛŒØª Ù…ÛŒâ€ŒØ´ÙˆØ¯.
        </p>
        <div className="shil-result-grid">
          <div><span>Ø§ÛŒÙ†ÙˆØ±ØªØ± Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯ÛŒ</span><strong>{design.inverter?.title || "â€”"}</strong></div>
          <div><span>Ø¨Ø§ØªØ±ÛŒ Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯ÛŒ</span><strong>{design.battery?.battery?.title || "â€”"}</strong></div>
          <div><span>Ù¾Ù†Ù„ Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯ÛŒ</span><strong>{design.panel?.title || "â€”"}</strong></div>
          <div><span>ÙˆØ¶Ø¹ÛŒØª</span><strong>{design.valid ? "Ø¢Ù…Ø§Ø¯Ù‡ ØªØ§ÛŒÛŒØ¯" : "Ù†ÛŒØ§Ø²Ù…Ù†Ø¯ ØªÚ©Ù…ÛŒÙ„ Ø¯Ø§Ø¯Ù‡"}</strong></div>
        </div>
        <Link className="shil-primary-action" to="/new-project/system/solar">
          ÙˆØ±ÙˆØ¯ Ø¨Ù‡ ØªÙ†Ø¸ÛŒÙ…Ø§Øª Ù†Ù‡Ø§ÛŒÛŒ Ø³ÛŒØ³ØªÙ…
        </Link>
      </div>
    </div>
  );
}
