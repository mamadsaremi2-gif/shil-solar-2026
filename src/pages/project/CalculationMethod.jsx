import React from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { approveProjectStep } from "../../workflow/projectWorkflow.js";
import EngineeringPageShell from "../../components/EngineeringPageShell.jsx";
import { inputMethods } from "../../data/shilFlowConfig.jsx";

const labels = { offgrid: "آفگرید", hybrid: "هیبرید", ongrid: "آنگرید", emergency: "برق اضطراری" };

export default function CalculationMethod() {
  const params = useParams();
  const location = useLocation();
  const isEmergency = location.pathname.includes("/emergency") || params.domain === "emergency";
  const domain = isEmergency ? "emergency" : "solar";
  const subtype = params.connection || (isEmergency ? "emergency" : "solar");
  const title = isEmergency ? "روش ورود دیتای برق اضطراری" : `روش ورود دیتای ${labels[subtype] || "خورشیدی"}`;

  return (
    <EngineeringPageShell title={title}>
      <section className="shil-card-stack">
        <div className="shil-section-card">
          <div className="shil-section-head"><h2>یکی از روش‌های ورود دیتا را انتخاب کنید</h2><span>{isEmergency ? "Emergency" : labels[subtype] || "Solar"}</span></div>
          <div className="shil-method-grid-five">
            {inputMethods.map((method) => (
              <Link key={method.key} className="shil-large-choice" onClick={() => approveProjectStep("method")} to={`/new-project/input/${domain}/${method.key}`} state={{ subtype }}>
                <h2>{method.title}</h2>
                <p>{method.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </EngineeringPageShell>
  );
}
