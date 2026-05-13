import React from "react";
import { Link } from "react-router-dom";

import {
  ChevronLeft,
  Route,
  Sun,
  BatteryCharging,
  Zap,
  CheckCircle2,
  Save,
} from "lucide-react";

import { motion } from "framer-motion";

import DashboardBottomNav from "../../components/dashboard/DashboardBottomNav.jsx";

const paths = [
  {
    title: "آفگرید",
    desc: "سیستم مستقل از شبکه",
    icon: <BatteryCharging size={38} />,
    tone: "cyan",
  },
  {
    title: "آنگرید",
    desc: "متصل به شبکه برق",
    icon: <Zap size={38} />,
    tone: "purple",
  },
  {
    title: "هیبرید",
    desc: "ترکیب باتری و شبکه",
    icon: <Sun size={38} />,
    tone: "amber",
  },
];

export default function ProjectPath() {
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
          <span>PROJECT PATH</span>
        </div>

        <div className="header-btn-v15">
          <Route size={22} />
        </div>

      </header>

      <main className="dashboard-main-v15">

        <motion.section
          className="hero-card-v15"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
        >

          <div className="hero-row-v15">
            <span>STEP 03</span>
            <span>PROJECT PATH</span>
          </div>

          <div className="hero-content-v15">

            <h1>انتخاب مسیر پروژه</h1>

            <h2>
              انتخاب معماری اصلی سیستم
              خورشیدی یا برق اضطراری
            </h2>

          </div>

        </motion.section>

        <section className="environment-grid-v15">

          {paths.map((item, index) => (

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
