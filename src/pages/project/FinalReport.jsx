import React from "react";

import {
  FileSpreadsheet,
  Download,
  FileText,
  Printer,
  CheckCircle2,
} from "lucide-react";

import ResultCard from "../../components/project/ResultCard.jsx";

export default function FinalReport() {

  const results = {
    panelCount: 12,
    inverterPower: 5000,
    batteryCapacity: 420,
    requiredEnergy: 14.2,
  };

  return (
    <div className="dashboard-shell-v15" dir="rtl">

      <main className="dashboard-main-v15">

        <section className="hero-card-v15">

          <div className="hero-top-v15">
            <span>FINAL REPORT</span>
            <span>SHIL ENGINE</span>
          </div>

          <div className="hero-content-v15">

            <h2>خروجی نهایی پروژه</h2>

            <p>
              گزارش نهایی طراحی و
              محاسبات مهندسی سیستم
            </p>

          </div>

        </section>

        <section className="dashboard-grid-v15">

          <ResultCard
            title="تعداد پنل"
            value={results.panelCount}
            unit="عدد"
          />

          <ResultCard
            title="توان اینورتر"
            value={results.inverterPower}
            unit="وات"
          />

          <ResultCard
            title="ظرفیت باتری"
            value={results.batteryCapacity}
            unit="Ah"
          />

          <ResultCard
            title="انرژی موردنیاز"
            value={results.requiredEnergy}
            unit="kWh"
          />

        </section>

        <section className="project-section-v15">

          <div className="project-section-head-v15">

            <h3>وضعیت پروژه</h3>

            <span>Engineering Status</span>

          </div>

          <div className="report-status-v15">

            <div className="report-status-item-v15">
              <CheckCircle2 size={18} />
              طراحی تکمیل شد
            </div>

            <div className="report-status-item-v15">
              <CheckCircle2 size={18} />
              محاسبات معتبر هستند
            </div>

            <div className="report-status-item-v15">
              <CheckCircle2 size={18} />
              پروژه آماده خروجی است
            </div>

          </div>

        </section>

        <section className="report-actions-v15">

          <button className="report-btn-v15">
            <FileSpreadsheet size={20} />
            خروجی اکسل
          </button>

          <button className="report-btn-v15">
            <FileText size={20} />
            خروجی PDF
          </button>

          <button className="report-btn-v15">
            <Printer size={20} />
            پرینت گزارش
          </button>

          <button className="report-btn-v15 primary">
            <Download size={20} />
            دانلود نهایی
          </button>

        </section>

      </main>

    </div>
  );
}
