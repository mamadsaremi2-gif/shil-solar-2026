import React from "react";
import MobileShell from "../components/MobileShell.jsx";

export default function Scenarios() {
  return (
    <MobileShell title="سناریوها">
      <section className="page-card">
        <h1>سناریوهای PV</h1>
        <p>انتخاب نوع اتصال سیستم خورشیدی.</p>

        <div className="list-card active"><h3>آنگرید</h3><p>سیستم متصل به شبکه</p></div>
        <div className="list-card"><h3>آفگرید</h3><p>سیستم مستقل با باتری</p></div>
        <div className="list-card"><h3>هیبرید</h3><p>ترکیبی هوشمند</p></div>

        <button className="primary-btn">تأیید مرحله</button>
      </section>
    </MobileShell>
  );
}
