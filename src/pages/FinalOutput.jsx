import React from "react";
import ShilPageShell from "../components/ShilPageShell.jsx";

export default function FinalOutput() {
  return (
    <ShilPageShell title="خروجی نهایی محاسبات">
      <section className="shil-card-stack">
        <div className="shil-section-card">
          <div className="shil-section-head"><h2>خروجی مهندسی</h2><span>Final Output</span></div>
          <div className="shil-summary-grid">
            <div><span>انرژی روزانه</span><strong>در انتظار محاسبه</strong></div>
            <div><span>توان سیستم</span><strong>در انتظار محاسبه</strong></div>
            <div><span>بازده کل</span><strong>در انتظار محاسبه</strong></div>
            <div><span>گزارش</span><strong>PDF / Excel / CSV</strong></div>
          </div>
        </div>
      </section>
    </ShilPageShell>
  );
}
