import React from "react";
import { Link } from "react-router-dom";
import { approveProjectStep } from "../../workflow/projectWorkflow.js";
import EngineeringPageShell from "../../components/EngineeringPageShell.jsx";

export default function SolarSystemType() {
  return (
    <EngineeringPageShell title="نوع اتصال پروژه خورشیدی">
      <section className="shil-card-stack">
        <div className="shil-three-card-grid shil-method-grid">
          <Link className="shil-large-choice" onClick={() => approveProjectStep("method")} to="/new-project/solar/offgrid"><h2>آفگرید</h2><p>مستقل از شبکه برق</p></Link>
          <Link className="shil-large-choice" onClick={() => approveProjectStep("method")} to="/new-project/solar/hybrid"><h2>هیبرید</h2><p>ترکیب شبکه، پنل و باتری</p></Link>
          <Link className="shil-large-choice" onClick={() => approveProjectStep("method")} to="/new-project/solar/ongrid"><h2>آنگرید</h2><p>متصل به شبکه برق</p></Link>
        </div>
      </section>
    </EngineeringPageShell>
  );
}
