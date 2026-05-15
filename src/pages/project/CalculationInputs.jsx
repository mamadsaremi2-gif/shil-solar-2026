import React from "react";
import { Link } from "react-router-dom";

import {
  ChevronLeft,
  SlidersHorizontal,
  Wallet,
  Cpu,
  SunMedium,
  BatteryCharging,
  CheckCircle2,
  Save,
} from "lucide-react";

import { motion } from "framer-motion";

import DashboardBottomNav from "../../components/dashboard/DashboardBottomNav.jsx";
import ProjectActionBar from "../../components/project/ProjectActionBar.jsx";
import ProjectStepRail from "../../components/project/ProjectStepRail.jsx";

const inputs = [
  {
    title: "مصرف انرژی",
    desc: "توان و مصرف روزانه",
    icon: <BatteryCharging size={34} />,
    tone: "cyan",
  },
  {
    title: "بودجه پروژه",
    desc: "محدودیت طراحی",
    icon: <Wallet size={34} />,
    tone: "purple",
  },
  {
    title: "فضای نصب",
    desc: "سطح قابل اجرا",
    icon: <SunMedium size={34} />,
    tone: "amber",
  },
  {
    title: "AI Input",
    desc: "تحلیل هوشمند ورودی",
    icon: <Cpu size={34} />,
    tone: "pink",
  },
];

export default function CalculationInputs() {
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
          <span>CALCULATION INPUTS</span>
        </div>

        <div className="header-btn-v15">
          <SlidersHorizontal size={22} />
        </div>

      </header>

      <main className="dashboard-main-v15">
        <ProjectStepRail />

        <motion.section
          className="hero-card-v15"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
        >

          <div className="hero-row-v15">
            <span>STEP 05</span>
            <span>INPUT ENGINE</span>
          </div>

          <div className="hero-content-v15">

            <h1>ورودی محاسبات</h1>

            <h2>
              پارامترهای طراحی،
              محدودیت‌ها و داده‌های اولیه
            </h2>

          </div>

        </motion.section>

        <section className="environment-grid-v15">

          {inputs.map((item, index) => (

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

        <motion.section
          className="status-card-v15"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
        >

          <div className="status-chip">
            INPUT STATUS
          </div>

          <h2>وضعیت ورودی‌ها</h2>

          <p>
            این مرحله ورودی‌های اصلی طراحی،
            محدودیت‌های اجرایی و پارامترهای
            موردنیاز موتور محاسبات را
            آماده‌سازی می‌کند.
          </p>

        </motion.section>

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

      <ProjectActionBar />
      <DashboardBottomNav />

    </div>
  );
}


