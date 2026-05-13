import React from "react";
import { Link } from "react-router-dom";

import {
  ChevronLeft,
  Calculator,
  Cpu,
  Battery,
  Gauge,
  Zap,
  CheckCircle2,
  Save,
} from "lucide-react";

import { motion } from "framer-motion";

import DashboardBottomNav from "../../components/dashboard/DashboardBottomNav.jsx";

const methods = [
  {
    title: "لیست تجهیزات",
    desc: "بارهای مصرفی پروژه",
    icon: <Battery size={34} />,
    tone: "cyan",
  },
  {
    title: "پروفایل مصرف",
    desc: "تحلیل بار روزانه",
    icon: <Gauge size={34} />,
    tone: "purple",
  },
  {
    title: "انرژی موردنیاز",
    desc: "مصرف کل سیستم",
    icon: <Zap size={34} />,
    tone: "amber",
  },
  {
    title: "AI Sizing",
    desc: "پیشنهاد هوشمند طراحی",
    icon: <Cpu size={34} />,
    tone: "pink",
  },
];

export default function CalculationMethod() {
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
          <span>CALCULATION METHOD</span>
        </div>

        <div className="header-btn-v15">
          <Calculator size={22} />
        </div>

      </header>

      <main className="dashboard-main-v15">

        <motion.section
          className="hero-card-v15"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
        >

          <div className="hero-row-v15">
            <span>STEP 04</span>
            <span>METHOD ENGINE</span>
          </div>

          <div className="hero-content-v15">

            <h1>روش محاسبات</h1>

            <h2>
              انتخاب مدل تحلیل،
              بار مصرفی و منطق طراحی
            </h2>

          </div>

        </motion.section>

        <section className="environment-grid-v15">

          {methods.map((item, index) => (

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
            ENGINE STATUS
          </div>

          <h2>وضعیت موتور محاسبات</h2>

          <p>
            این بخش وظیفه تحلیل مصرف،
            مدل‌سازی بار، انتخاب روش سایزینگ
            و آماده‌سازی موتور طراحی مهندسی
            را برعهده دارد.
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

      <DashboardBottomNav />

    </div>
  );
}
