import React from "react";
import { Link } from "react-router-dom";

import {
  ChevronLeft,
  MapPinned,
  Compass,
  Sun,
  CloudSun,
  Camera,
  Map,
  CheckCircle2,
  Save,
} from "lucide-react";

import { motion } from "framer-motion";

import DashboardBottomNav from "../../components/dashboard/DashboardBottomNav.jsx";
import ProjectActionBar from "../../components/project/ProjectActionBar.jsx";
import ProjectStepRail from "../../components/project/ProjectStepRail.jsx";

const environmentCards = [
  {
    title: "مختصات جغرافیایی",
    desc: "GPS و موقعیت پروژه",
    icon: <MapPinned size={34} />,
    tone: "cyan",
  },
  {
    title: "جهت جغرافیایی",
    desc: "Azimuth و جهت نصب",
    icon: <Compass size={34} />,
    tone: "purple",
  },
  {
    title: "زاویه نصب",
    desc: "Tilt و زاویه پنل",
    icon: <Sun size={34} />,
    tone: "amber",
  },
  {
    title: "تحلیل سایه",
    desc: "Shadow Analysis",
    icon: <CloudSun size={34} />,
    tone: "blue",
  },
  {
    title: "تصویر محل نصب",
    desc: "آپلود تصاویر سایت",
    icon: <Camera size={34} />,
    tone: "pink",
  },
  {
    title: "NASA / Solcast",
    desc: "دریافت داده تابش",
    icon: <Map size={34} />,
    tone: "green",
  },
];

export default function Environment() {
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
          <span>ENVIRONMENT ENGINE</span>
        </div>

        <div className="header-btn-v15">
          <MapPinned size={22} />
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
            <span>STEP 02</span>
            <span>ENVIRONMENT</span>
          </div>

          <div className="hero-content-v15">

            <h1>شرایط محیطی</h1>

            <h2>
              تحلیل موقعیت، اقلیم، تابش،
              زاویه نصب و شرایط واقعی سایت
            </h2>

          </div>

        </motion.section>

        <motion.section
          className="status-card-v15"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
        >

          <div className="status-chip">
            LOCATION MAP
          </div>

          <div className="environment-map-v15">

            <div className="map-grid-v15" />

            <div className="map-center-dot" />

            <div className="map-overlay-v15">
              نقشه پروژه و GPS
            </div>

          </div>

        </motion.section>

        <section className="environment-grid-v15">

          {environmentCards.map((card, index) => (

            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >

              <div
                className={`environment-card-v15 ${card.tone}`}
              >

                <div className="environment-icon-v15">
                  {card.icon}
                </div>

                <h3>{card.title}</h3>

                <p>{card.desc}</p>

              </div>

            </motion.div>

          ))}

        </section>

        <motion.section
          className="status-card-v15"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >

          <div className="status-chip">
            ENGINE STATUS
          </div>

          <h2>وضعیت تحلیل محیطی</h2>

          <p>
            این بخش وظیفه تحلیل تابش،
            جهت نصب، زاویه پنل، شرایط اقلیمی،
            سایه و داده‌های مهندسی محیطی
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

      <ProjectActionBar />
      <DashboardBottomNav />

    </div>
  );
}


