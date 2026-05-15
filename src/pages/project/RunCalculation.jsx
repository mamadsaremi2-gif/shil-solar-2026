import React from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  PlayCircle,
  Cpu,
  Zap,
  BatteryCharging,
  SunMedium,
  Cable,
  FileText,
  Download,
  CheckCircle2,
} from "lucide-react";

import DashboardBottomNav from "../../components/dashboard/DashboardBottomNav.jsx";
import ProjectStepRail from "../../components/project/ProjectStepRail.jsx";
import ProjectActionBar from "../../components/project/ProjectActionBar.jsx";
import EngineeringMiniCard from "../../components/project/EngineeringMiniCard.jsx";
import EngineeringInputGrid from "../../components/project/EngineeringInputGrid.jsx";
import EngineeringStatusPanel from "../../components/project/EngineeringStatusPanel.jsx";
import ReportExportCenter from "../../components/reports/ReportExportCenter.jsx";

export default function RunCalculation() {
  return (
    <div className="dashboard-shell-v15" dir="rtl">
      <header className="dashboard-header-v15">
        <Link to="/new-project/summary" className="header-btn-v15">
          <ChevronLeft size={20} />
        </Link>

        <div className="brand-v15">
          <h1>SHIL</h1>
          <span>RUN ENGINE</span>
        </div>

        <Link to="/" className="header-btn-v15">
          داشبورد
        </Link>
      </header>

      <main className="dashboard-main-v15">
        <ProjectStepRail />

        <section className="hero-card-v15">
          <div className="hero-row-v15">
            <span>STEP 08</span>
            <span>ENGINEERING OUTPUT</span>
          </div>

          <div className="hero-content-v15">
            <h1>اجرای محاسبات</h1>
            <h2>
              اجرای موتور طراحی، تحلیل خروجی مهندسی، بررسی تجهیزات و آماده‌سازی گزارش نهایی.
            </h2>
          </div>
        </section>

        <EngineeringInputGrid>
          <EngineeringMiniCard title="تعداد پنل" value="24" subtitle="PV Modules" />
          <EngineeringMiniCard title="توان اینورتر" value="5 kW" subtitle="Hybrid Inverter" />
          <EngineeringMiniCard title="ظرفیت باتری" value="200 Ah" subtitle="Battery Bank" />
          <EngineeringMiniCard title="افت ولتاژ" value="1.8%" subtitle="Cable Loss" />
        </EngineeringInputGrid>

        <section className="run-result-grid-v15">
          <div className="run-result-card-v15">
            <SunMedium size={30} />
            <h4>PV Array</h4>
            <p>24 × 585W</p>
            <strong>14.04 kWp</strong>
          </div>

          <div className="run-result-card-v15">
            <BatteryCharging size={30} />
            <h4>Battery Bank</h4>
            <p>48V Lithium</p>
            <strong>9.6 kWh</strong>
          </div>

          <div className="run-result-card-v15">
            <Cpu size={30} />
            <h4>Inverter</h4>
            <p>MPPT Internal</p>
            <strong>5 kW</strong>
          </div>

          <div className="run-result-card-v15">
            <Cable size={30} />
            <h4>Cable</h4>
            <p>DC / AC Check</p>
            <strong>PASS</strong>
          </div>
        </section>

        <section className="project-section-v15">
          <div className="project-section-head-v15">
            <h3>خروجی مهندسی</h3>
            <span>Engineering Results</span>
          </div>

          <div className="run-output-table-v15">
            <div><span>توان کل پنل‌ها</span><strong>14.04 kWp</strong></div>
            <div><span>انرژی روزانه تخمینی</span><strong>58 kWh/day</strong></div>
            <div><span>ظرفیت باتری پیشنهادی</span><strong>200 Ah</strong></div>
            <div><span>توان اینورتر</span><strong>5 kW</strong></div>
            <div><span>افت ولتاژ کابل</span><strong>1.8%</strong></div>
            <div><span>وضعیت MPPT</span><strong>OK</strong></div>
          </div>
        </section>

        <section className="run-actions-v15">
          <button>
            <PlayCircle size={20} />
            اجرای دوباره
          </button>

          <button>
            <FileText size={20} />
            گزارش PDF
          </button>

          <button className="primary">
            <Download size={20} />
            خروجی نهایی
          </button>
        </section>

        <ReportExportCenter />

        <EngineeringStatusPanel
          title="وضعیت موتور محاسبات"
          items={[
            { label: "Solar Engine", value: "Done" },
            { label: "Battery Engine", value: "Done" },
            { label: "Cable Check", value: "Pass" },
            { label: "Report", value: "Ready" },
          ]}
        />

        <section className="run-final-status-v15">
          <CheckCircle2 size={28} />
          <div>
            <h4>محاسبات با موفقیت آماده شد</h4>
            <p>
              خروجی فعلی به‌صورت UI آماده است؛ مرحله بعد اتصال داده‌های واقعی موتور محاسبات به همین خروجی است.
            </p>
          </div>
          <Zap size={24} />
        </section>
      </main>

      <ProjectActionBar />
      <DashboardBottomNav />
    </div>
  );
}


