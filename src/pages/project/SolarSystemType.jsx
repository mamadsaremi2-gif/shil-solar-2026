import React from "react";
import { Link } from "react-router-dom";
import { approveProjectStep } from "../../workflow/projectWorkflow.js";
import EngineeringPageShell from "../../components/EngineeringPageShell.jsx";

export default function SolarSystemType() {
  return (
    <EngineeringPageShell title="Ù†ÙˆØ¹ Ø§ØªØµØ§Ù„ Ù¾Ø±ÙˆÚ˜Ù‡ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ">
      <section className="shil-card-stack">
        <div className="shil-three-card-grid shil-method-grid">
          <Link className="shil-large-choice" onClick={() => approveProjectStep("method")} to="/new-project/solar/offgrid"><h2>Ø¢ÙÚ¯Ø±ÛŒØ¯</h2><p>Ù…Ø³ØªÙ‚Ù„ Ø§Ø² Ø´Ø¨Ú©Ù‡ Ø¨Ø±Ù‚</p></Link>
          <Link className="shil-large-choice" onClick={() => approveProjectStep("method")} to="/new-project/solar/hybrid"><h2>Ù‡ÛŒØ¨Ø±ÛŒØ¯</h2><p>ØªØ±Ú©ÛŒØ¨ Ø´Ø¨Ú©Ù‡ØŒ Ù¾Ù†Ù„ Ùˆ Ø¨Ø§ØªØ±ÛŒ</p></Link>
          <Link className="shil-large-choice" onClick={() => approveProjectStep("method")} to="/new-project/solar/ongrid"><h2>Ø¢Ù†Ú¯Ø±ÛŒØ¯</h2><p>Ù…ØªØµÙ„ Ø¨Ù‡ Ø´Ø¨Ú©Ù‡ Ø¨Ø±Ù‚</p></Link>
        </div>
      </section>
    </EngineeringPageShell>
  );
}
