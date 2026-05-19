import React from "react";
import { Link } from "react-router-dom";

import {
  ChevronLeft,
  FileCheck,
  CheckCircle2,
  ShieldCheck,
  Database,
  ClipboardCheck,
  Save,
} from "lucide-react";

import { motion } from "framer-motion";

import DashboardBottomNav from "../../components/dashboard/DashboardBottomNav.jsx";

const summaryItems = [
  {
    title: "اعتبارسنجی اطلاعات",
    desc: "بررسی کامل ورودی‌ها",
    icon: <ShieldCheck size={34} />,
    tone: "cyan",
  },
  {
    title: "بررسی طراحی",
    desc: "تحلیل نهایی ساختار سیستم",
    icon: <ClipboardCheck size={34} />,
    tone: "purple",
  },
  {
    title: "داده‌های پروژه",
    desc: "آماده‌سازی موتور خروجی",
    icon: <Database size={34} />,
    tone: "amber",
  },
  {
    title: "تایید نهایی",
    desc: "آماده اجرای محاسبات",
    icon: <CheckCircle2 size={34} />,
    tone: "pink",
  },
];

export default function ProjectSummary() {
  return (
    <div className="dashboard-shell-v15" dir="rtl">

      <div className="dashboard-bg-glow glow-1" />
      <div className="dashboard-bg-glow glow-2" />
      <div className="dashboard-bg-glow glow-3" />

      <header className="dashboard-header-v15">

        <Link to="/new-project" className="header-btn-v15">
          <ChevronLeft size={22} />
        </Link>

        <div className="brand-v15">
          <h1>SHIL</h1>
          <span>PROJECT SUMMARY</span>
        </div>

        <div className="header-btn-v15">
          <FileCheck size={22} />
        </div>

      </header>

      <main className="dashboard-main-v15">

        <motion.section
          className="hero-card-v15"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
        >

          <div className="hero-row-v15">
            <span>STEP 07</span>
            <span>SUMMARY ENGINE</span>
          </div>

          <div className="hero-content-v15">

            <h1>چکیده اطلاعات</h1>

            <h2>
              مرور نهایی اطلاعات
              و آماده‌سازی اجرای طراحی
            </h2>

          </div>

        </motion.section>

        <section className="environment-grid-v15">

          {summaryItems.map((item, index) => (

            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >

              <div
                className={`environment-card-v15 ${item.tone}`}
              >

                <div className="environment-icon-v15">
                  {item.icon}
                </div>

                <h3>{item.title}</h3>

                <p>{item.desc}</p>

              </div>

            </motion.div>

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
          ذخیره پیش‌نویس
        </button>

        <button className="action-btn-v15 primary">
          <CheckCircle2 size={20} />
          تایید مرحله
        </button>

      </div>

      <DashboardBottomNav />

    </div>
  );
}
