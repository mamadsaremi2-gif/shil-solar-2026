import React from "react";
import { Link } from "react-router-dom";
import { approveProjectStep } from "../../workflow/projectWorkflow.js";
import EngineeringPageShell from "../../components/EngineeringPageShell.jsx";

export default function ProjectPath() {
  return (
    <EngineeringPageShell title="انتخاب مسیر پروژه">
      <section className="shil-card-stack">
        <div className="shil-two-card-grid shil-path-root-grid">
          <Link className="shil-large-choice" onClick={() => approveProjectStep("path")} to="/new-project/solar/select"><h2>پروژه انرژی خورشیدی با پنل</h2><p>ورود به انتخاب آفگرید، هیبرید یا آنگرید</p></Link>
          <Link className="shil-large-choice" onClick={() => approveProjectStep("path")} to="/new-project/emergency"><h2>پروژه برق اضطراری</h2><p>طراحی با اینورتر خورشیدی و باتری، بر اساس منطق محاسبات اختصاصی برق اضطراری</p></Link>
        </div>
      </section>
    </EngineeringPageShell>
  );
}
