import React from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Database,
  ShieldCheck,
} from "lucide-react";

import DashboardBottomNav from "../../components/dashboard/DashboardBottomNav.jsx";
import ProjectStepRail from "../../components/project/ProjectStepRail.jsx";
import ProjectActionBar from "../../components/project/ProjectActionBar.jsx";
import EngineeringMiniCard from "../../components/project/EngineeringMiniCard.jsx";
import EngineeringInputGrid from "../../components/project/EngineeringInputGrid.jsx";
import EngineeringStatusPanel from "../../components/project/EngineeringStatusPanel.jsx";

export default function SummaryPage() {
  return (
    <div className="dashboard-shell-v15" dir="rtl">
      <header className="dashboard-header-v15">
        <Link to="/new-project/system" className="header-btn-v15">
          <ChevronLeft size={20} />
        </Link>

        <div className="brand-v15">
          <h1>SHIL</h1>
          <span>SUMMARY CHECK</span>
        </div>

        <Link to="/new-project/run" className="header-btn-v15">
          اجرا
        </Link>
      </header>

      <main className="dashboard-main-v15">
        <ProjectStepRail />

        <section className="hero-card-v15">
          <div className="hero-row-v15">
            <span>STEP 07</span>
            <span>VALIDATION</span>
          </div>

          <div className="hero-content-v15">
            <h1>چکیده اطلاعات</h1>
            <h2>
              مرور نهایی اطلاعات پروژه، کنترل خطاها، پیام‌های مهندسی و آماده‌سازی اجرای محاسبات.
            </h2>
          </div>
        </section>

        <EngineeringInputGrid>
          <EngineeringMiniCard title="وضعیت پروژه" value="Ready" subtitle="آماده اجرای محاسبات" />
          <EngineeringMiniCard title="Validation" value="OK" subtitle="خطای بحرانی ندارد" />
          <EngineeringMiniCard title="PV Check" value="Pass" subtitle="پنل و MPPT بررسی شد" />
          <EngineeringMiniCard title="Cable Check" value="Pass" subtitle="افت ولتاژ مجاز است" />
        </EngineeringInputGrid>

        <section className="summary-validation-v15">
          <div className="summary-validation-row-v15 success">
            <CheckCircle2 size={22} />
            <div>
              <h4>اطلاعات پروژه کامل است</h4>
              <p>نام پروژه، موقعیت، نوع سیستم و مسیر طراحی ثبت شده‌اند.</p>
            </div>
          </div>

          <div className="summary-validation-row-v15 success">
            <ShieldCheck size={22} />
            <div>
              <h4>کنترل‌های مهندسی معتبر هستند</h4>
              <p>MPPT، کابل، باتری و اینورتر برای اجرای اولیه آماده‌اند.</p>
            </div>
          </div>

          <div className="summary-validation-row-v15 warning">
            <AlertTriangle size={22} />
            <div>
              <h4>نیاز به بازبینی محیطی</h4>
              <p>تحلیل سایه هنوز می‌تواند با داده واقعی سایت تکمیل شود.</p>
            </div>
          </div>
        </section>

        <section className="project-section-v15">
          <div className="project-section-head-v15">
            <h3>خلاصه فنی پروژه</h3>
            <span>Engineering Summary</span>
          </div>

          <div className="summary-table-v15">
            <div><span>نوع سیستم</span><strong>Hybrid PV</strong></div>
            <div><span>توان پنل</span><strong>585 W</strong></div>
            <div><span>ولتاژ باتری</span><strong>48 V</strong></div>
            <div><span>اینورتر</span><strong>5 kW</strong></div>
            <div><span>تلفات پایه</span><strong>12%</strong></div>
            <div><span>وضعیت خروجی</span><strong>Ready</strong></div>
          </div>
        </section>

        <EngineeringStatusPanel
          title="وضعیت نهایی قبل از اجرا"
          items={[
            { label: "Project Data", value: "OK" },
            { label: "Environment", value: "OK" },
            { label: "System Settings", value: "OK" },
            { label: "Run Engine", value: "Ready" },
          ]}
        />

        <section className="summary-run-card-v15">
          <FileCheck size={28} />
          <div>
            <h4>پروژه آماده اجرای موتور محاسبات است</h4>
            <p>با تایید این مرحله، داده‌ها به موتور طراحی SHIL ارسال می‌شوند.</p>
          </div>
          <Database size={24} />
        </section>
      </main>

      <ProjectActionBar />
      <DashboardBottomNav />
    </div>
  );
}
