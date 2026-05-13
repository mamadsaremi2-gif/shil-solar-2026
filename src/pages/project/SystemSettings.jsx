import React from "react";
import { Link } from "react-router-dom";
import {
  BatteryCharging,
  Cable,
  SunMedium,
  ShieldCheck,
  Layers3,
  Zap,
  Cpu,
  GaugeCircle,
} from "lucide-react";
import DashboardBottomNav from "../../components/dashboard/DashboardBottomNav.jsx";

const items = [
  {
    icon: <SunMedium size={34} />,
    title: "انتخاب پنل",
    desc: "توان، راندمان و تیپ پنل",
  },
  {
    icon: <BatteryCharging size={34} />,
    title: "تنظیمات باتری",
    desc: "ولتاژ، ظرفیت و DOD",
  },
  {
    icon: <Cable size={34} />,
    title: "کابل و افت ولتاژ",
    desc: "سایزینگ و تلفات",
  },
  {
    icon: <ShieldCheck size={34} />,
    title: "حفاظت سیستم",
    desc: "فیوز، SPD و ایمنی",
  },
  {
    icon: <Layers3 size={34} />,
    title: "آرایش سیستم",
    desc: "سری و موازی تجهیزات",
  },
  {
    icon: <Zap size={34} />,
    title: "اینورتر",
    desc: "راندمان و توان خروجی",
  },
  {
    icon: <Cpu size={34} />,
    title: "کنترلر شارژ",
    desc: "PWM / MPPT",
  },
  {
    icon: <GaugeCircle size={34} />,
    title: "تلفات کل",
    desc: "بهینه‌سازی راندمان",
  },
];

export default function SystemSettings() {
  return (
    <div className="dashboard-shell-v15" dir="rtl">
      <header className="dashboard-header-v15">
        <Link to="/new-project/inputs" className="header-btn-v15">
          مرحله قبل
        </Link>

        <div className="brand-center-v15">
          <h1>SHIL</h1>
          <span>SMART ENGINEERING SUITE</span>
        </div>

        <Link to="/new-project/summary" className="header-btn-v15">
          مرحله بعد
        </Link>
      </header>

      <main className="dashboard-main-v15">
        <section className="hero-card-v15">
          <div className="hero-top-v15">
            <span>STEP 06</span>
            <span>System Configuration</span>
          </div>

          <div className="hero-content-v15">
            <h2>تنظیمات سیستم</h2>

            <p>
              پیکربندی تجهیزات، کابل‌ها،
              حفاظت و راندمان سیستم.
            </p>
          </div>
        </section>

        <section className="dashboard-grid-v15">
          {items.map((item, index) => (
            <div className="dash-card-v15" key={index}>
              <div className="dash-card-top-v15">
                <div className="dash-mini-dots">
                  <span />
                  <span />
                  <span />
                </div>
              </div>

              <div className="dash-icon-v15">
                {item.icon}
              </div>

              <h3>{item.title}</h3>

              <p>{item.desc}</p>

              <div className="dash-status-dot" />
            </div>
          ))}
        </section>
      </main>

      <DashboardBottomNav />
    </div>
  );
}
