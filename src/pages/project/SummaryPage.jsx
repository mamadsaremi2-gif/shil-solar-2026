import React from "react";
import { Link } from "react-router-dom";

import {
  ChevronLeft,
  CheckCircle2,
  FileSpreadsheet,
  FolderKanban,
  MapPinned,
  Route,
  Calculator,
  Cpu,
  Save,
} from "lucide-react";

import DashboardBottomNav from "../../components/dashboard/DashboardBottomNav.jsx";
import ProjectStepRail from "../../components/project/ProjectStepRail.jsx";

const summaryItems = [
  {
    title: "اطلاعات پروژه",
    value: "تکمیل شده",
    icon: <FolderKanban size={26} />,
  },
  {
    title: "شرایط محیطی",
    value: "اعتبارسنجی شده",
    icon: <MapPinned size={26} />,
  },
  {
    title: "مسیر پروژه",
    value: "خورشیدی",
    icon: <Route size={26} />,
  },
  {
    title: "روش محاسبه",
    value: "Hybrid",
    icon: <Calculator size={26} />,
  },
  {
    title: "تنظیمات سیستم",
    value: "بررسی شد",
    icon: <Cpu size={26} />,
  },
];

export default function SummaryPage() {

  return (
    <div className="dashboard-shell-v15" dir="rtl">

      <header className="dashboard-header-v15">

        <Link
          to="/new-project/system"
          className="header-btn-v15"
        >
          <ChevronLeft size={22} />
        </Link>

        <div className="brand-v15">
          <h1>SHIL</h1>
          <span>SUMMARY REPORT</span>
        </div>

        <div className="header-btn-v15">
          <FileSpreadsheet size={22} />
        </div>

      </header>

      <main className="dashboard-main-v15">
        <ProjectStepRail />

        <section className="hero-card-v15">

          <div className="hero-row-v15">
            <span>STEP 07</span>
            <span>FINAL VALIDATION</span>
          </div>

          <div className="hero-content-v15">

            <h1>چکیده اطلاعات</h1>

            <h2>
              مرور نهایی اطلاعات پروژه
              قبل از اجرای موتور محاسبات
            </h2>

          </div>

        </section>

        <section className="project-section-v15">

          <div className="project-section-head-v15">

            <h3>وضعیت مراحل</h3>

            <span>Validation State</span>

          </div>

          <div className="summary-grid-v15">

            {summaryItems.map((item) => (

              <div
                key={item.title}
                className="summary-card-v15"
              >

                <div className="summary-icon-v15">
                  {item.icon}
                </div>

                <div className="summary-info-v15">

                  <h4>{item.title}</h4>

                  <p>{item.value}</p>

                </div>

                <CheckCircle2
                  size={20}
                  className="summary-check-v15"
                />

              </div>

            ))}

          </div>

        </section>

      </main>

      <div className="project-actionbar-v15">

        <button className="action-btn-v15 secondary">

          <ChevronLeft size={18} />

          مرحله قبل

        </button>

        <button className="action-btn-v15">

          <Save size={18} />

          ذخیره

        </button>

        <Link
          to="/new-project/run"
          className="action-btn-v15 primary"
          style={{ textDecoration: "none" }}
        >

          <CheckCircle2 size={18} />

          اجرای محاسبات

        </Link>

      </div>

      <DashboardBottomNav />

    </div>
  );
}

