import React from "react";
import { Link } from "react-router-dom";
import { FolderOpen, MapPin, Route, Calculator, ClipboardList, Settings, FileCheck, Gauge, Cuboid } from "lucide-react";
import { motion } from "framer-motion";
import DashboardBottomNav from "../components/dashboard/DashboardBottomNav.jsx";

const steps = [
  { number: "1", title: "اطلاعات پروژه", subtitle: "مشخصات پایه پروژه", to: "/new-project/info", icon: <FolderOpen size={38} />, tone: "blue" },
  { number: "2", title: "شرایط محیطی", subtitle: "GPS، اقلیم، تابش و سایه", to: "/new-project/environment", icon: <MapPin size={38} />, tone: "cyan" },
  { number: "3", title: "انتخاب مسیر پروژه", subtitle: "خورشیدی یا برق اضطراری", to: "/new-project/path", icon: <Route size={38} />, tone: "purple" },
  { number: "4", title: "روش محاسبات", subtitle: "انتخاب مدل محاسبه", to: "/new-project/method", icon: <Calculator size={38} />, tone: "amber" },
  { number: "5", title: "ورودی محاسبات", subtitle: "مصرف، تجهیزات و پارامترها", to: "/new-project/inputs", icon: <ClipboardList size={38} />, tone: "yellow" },
  { number: "6", title: "تنظیمات سیستم", subtitle: "پنل، باتری، کابل و تلفات", to: "/new-project/system", icon: <Settings size={38} />, tone: "green" },
  { number: "7", title: "چکیده اطلاعات", subtitle: "Validation و مرور نهایی", to: "/new-project/summary", icon: <FileCheck size={38} />, tone: "cyan" },
  { number: "8", title: "اجرای محاسبات", subtitle: "موتور طراحی و خروجی", to: "/new-project/run", icon: <Gauge size={38} />, tone: "pink" },
  { number: "9", title: "توسعه", subtitle: "قابلیت‌های آینده", to: "/new-project/future", icon: <Cuboid size={38} />, tone: "silver" },
];

export default function NewProject() {
  return (
    <div className="project-shell-v15" dir="rtl">
      <div className="dashboard-bg-glow glow-1" /><div className="dashboard-bg-glow glow-2" /><div className="dashboard-bg-glow glow-3" />
      <header className="project-header-v15">
        <Link to="/" className="project-header-btn">داشبورد</Link>
        <div className="project-brand-v15"><h1>SHIL</h1><span>SMART ENGINEERING SUITE</span></div>
        <Link to="/new-project/info" className="project-header-btn primary">پروژه جدید</Link>
      </header>
      <main className="project-main-v15">
        <section className="project-title-v15"><h2>پروژه جدید</h2><p>مسیر طراحی و محاسبات مهندسی</p></section>
        <section className="project-step-grid-v15">
          {steps.map((step, index) => (
            <motion.div key={step.number} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.035 }}>
              <Link to={step.to} className={`project-step-card-v15 ${step.tone}`}>
                <div className="step-number-v15">{step.number}</div><div className="step-icon-v15">{step.icon}</div><h3>{step.title}</h3><p>{step.subtitle}</p>
              </Link>
            </motion.div>
          ))}
        </section>
      </main>
      <DashboardBottomNav />
    </div>
  );
}
