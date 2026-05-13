import React from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  PlayCircle,
  Cpu,
  Zap,
  FileOutput,
  Activity,
  CheckCircle2,
  Save,
} from "lucide-react";

import DashboardBottomNav from "../../components/dashboard/DashboardBottomNav.jsx";

const runItems = [
  { title: "موتور طراحی", desc: "اجرای الگوریتم مهندسی", icon: <Cpu size={34} />, tone: "cyan" },
  { title: "محاسبات توان", desc: "تحلیل نهایی سیستم", icon: <Zap size={34} />, tone: "purple" },
  { title: "گزارش خروجی", desc: "تهیه فایل نهایی", icon: <FileOutput size={34} />, tone: "amber" },
  { title: "وضعیت اجرا", desc: "Realtime Processing", icon: <Activity size={34} />, tone: "pink" },
];

export default function RunCalculation() {
  return (
    <div className="dashboard-shell-v15" dir="rtl">
      <header className="dashboard-header-v15">
        <Link to="/new-project/summary" className="header-btn-v15">
          <ChevronLeft size={22} />
        </Link>

        <div className="brand-v15">
          <h1>SHIL</h1>
          <span>RUN CALCULATION</span>
        </div>

        <div className="header-btn-v15">
          <PlayCircle size={22} />
        </div>
      </header>

      <main className="dashboard-main-v15">
        <section className="hero-card-v15">
          <div className="hero-row-v15">
            <span>STEP 08</span>
            <span>RUN ENGINE</span>
          </div>

          <div className="hero-content-v15">
            <h1>اجرای محاسبات</h1>
            <h2>اجرای موتور طراحی و تولید خروجی مهندسی</h2>
          </div>
        </section>

        <section className="environment-grid-v15">
          {runItems.map((item) => (
            <div className={`environment-card-v15 ${item.tone}`} key={item.title}>
              <div className="environment-icon-v15">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </section>
      </main>

      <div className="project-actionbar-v15">
        <button className="action-btn-v15 secondary">
          <ChevronLeft size={20} />
          مرحله قبل
        </button>

        <button className="action-btn-v15">
          <Save size={20} />
          ذخیره
        </button>

        <button className="action-btn-v15 primary">
          <CheckCircle2 size={20} />
          اجرای نهایی
        </button>
      </div>

      <DashboardBottomNav />
    </div>
  );
}
