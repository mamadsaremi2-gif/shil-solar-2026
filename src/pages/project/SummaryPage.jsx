import React from "react";
import { Link } from "react-router-dom";
import {
  FileCheck2,
  CheckCircle2,
  MapPinned,
  Battery,
  Sun,
  Zap,
  Shield,
  Cpu,
} from "lucide-react";
import DashboardBottomNav from "../../components/dashboard/DashboardBottomNav.jsx";

const summary = [
  {
    icon: <CheckCircle2 size={32} />,
    title: "اطلاعات پروژه",
    desc: "تکمیل و تایید شده",
  },
  {
    icon: <MapPinned size={32} />,
    title: "شرایط محیطی",
    desc: "GPS و اقلیم ثبت شد",
  },
  {
    icon: <Sun size={32} />,
    title: "پنل خورشیدی",
    desc: "مدل انتخاب شد",
  },
  {
    icon: <Battery size={32} />,
    title: "باتری سیستم",
    desc: "ظرفیت نهایی شد",
  },
  {
    icon: <Zap size={32} />,
    title: "اینورتر",
    desc: "توان خروجی تایید شد",
  },
  {
    icon: <Shield size={32} />,
    title: "حفاظت",
    desc: "فیوز و SPD بررسی شد",
  },
  {
    icon: <Cpu size={32} />,
    title: "کنترلر شارژ",
    desc: "MPPT فعال",
  },
  {
    icon: <FileCheck2 size={32} />,
    title: "آماده اجرا",
    desc: "ورود به موتور محاسبات",
  },
];

export default function SummaryPage() {
  return (
    <div className="dashboard-shell-v15" dir="rtl">
      <header className="dashboard-header-v15">
        <Link to="/new-project/system" className="header-btn-v15">
          مرحله قبل
        </Link>

        <div className="brand-center-v15">
          <h1>SHIL</h1>
          <span>SMART ENGINEERING SUITE</span>
        </div>

        <Link to="/new-project/run" className="header-btn-v15">
          اجرای محاسبات
        </Link>
      </header>

      <main className="dashboard-main-v15">
        <section className="hero-card-v15">
          <div className="hero-top-v15">
            <span>STEP 07</span>
            <span>Summary & Validation</span>
          </div>

          <div className="hero-content-v15">
            <h2>چکیده اطلاعات</h2>

            <p>
              مرور نهایی داده‌ها و آماده‌سازی
              برای اجرای موتور طراحی.
            </p>
          </div>
        </section>

        <section className="dashboard-grid-v15">
          {summary.map((item, index) => (
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
