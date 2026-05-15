import React from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ListChecks,
  Cpu,
  Gauge,
  Zap,
} from "lucide-react";

import DashboardBottomNav from "../../components/dashboard/DashboardBottomNav.jsx";
import ProjectStepRail from "../../components/project/ProjectStepRail.jsx";
import ProjectActionBar from "../../components/project/ProjectActionBar.jsx";
import EngineeringStatusPanel from "../../components/project/EngineeringStatusPanel.jsx";

const methods = [
  {
    title: "لیست تجهیزات",
    desc: "محاسبه بر اساس تجهیزات مصرف‌کننده",
    icon: <ListChecks size={38} />,
    type: "equipment",
  },
  {
    title: "پروفایل مصرف",
    desc: "محاسبه بر اساس مصرف روزانه و زمانی",
    icon: <Gauge size={38} />,
    type: "profile",
  },
  {
    title: "AI Sizing",
    desc: "پیشنهاد هوشمند سایزینگ مهندسی",
    icon: <Cpu size={38} />,
    type: "ai",
  },
  {
    title: "توان کل",
    desc: "محاسبه سریع بر اساس توان و انرژی",
    icon: <Zap size={38} />,
    type: "power",
  },
];

export default function CalculationMethod() {
  return (
    <div className="dashboard-shell-v15" dir="rtl">
      <header className="dashboard-header-v15">
        <Link to="/new-project/path" className="header-btn-v15">
          <ChevronLeft size={20} />
        </Link>

        <div className="brand-v15">
          <h1>SHIL</h1>
          <span>METHOD ENGINE</span>
        </div>

        <Link to="/new-project/inputs" className="header-btn-v15">
          بعدی
        </Link>
      </header>

      <main className="dashboard-main-v15">
        <ProjectStepRail />

        <section className="hero-card-v15">
          <div className="hero-row-v15">
            <span>STEP 04</span>
            <span>CALCULATION METHOD</span>
          </div>

          <div className="hero-content-v15">
            <h1>روش محاسبات</h1>
            <h2>
              مدل محاسباتی پروژه را انتخاب کنید تا ورودی‌ها و موتور طراحی
              متناسب با سناریو فعال شوند.
            </h2>
          </div>
        </section>

        <section className="method-grid-v15">
          {methods.map((item) => (
            <button key={item.title} className={`method-card-v15 ${item.type}`}>
              <div className="method-icon-v15">{item.icon}</div>

              <div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>

              <span className="method-status-v15">READY</span>
            </button>
          ))}
        </section>

        <EngineeringStatusPanel
          title="وضعیت روش محاسبات"
          items={[
            { label: "Load Model", value: "آماده" },
            { label: "Energy Model", value: "آماده" },
            { label: "AI Sizing", value: "فعال" },
            { label: "Validation", value: "OK" },
          ]}
        />
      </main>

      <ProjectActionBar />
      <DashboardBottomNav />
    </div>
  );
}
