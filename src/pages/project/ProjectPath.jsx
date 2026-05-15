import React from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  SunMedium,
  BatteryCharging,
  Zap,
} from "lucide-react";

import DashboardBottomNav from "../../components/dashboard/DashboardBottomNav.jsx";
import ProjectStepRail from "../../components/project/ProjectStepRail.jsx";
import ProjectActionBar from "../../components/project/ProjectActionBar.jsx";

const paths = [

  {
    title: "پروژه خورشیدی",
    desc: "طراحی نیروگاه خورشیدی متصل یا مستقل",
    icon: <SunMedium size={42} />,
    color: "solar",
  },

  {
    title: "سیستم هیبرید",
    desc: "ترکیب برق شهر، باتری و خورشیدی",
    icon: <BatteryCharging size={42} />,
    color: "hybrid",
  },

  {
    title: "برق اضطراری",
    desc: "UPS و سیستم بکاپ اضطراری",
    icon: <Zap size={42} />,
    color: "backup",
  },

];

export default function ProjectPath() {

  return (

    <div className="dashboard-shell-v15" dir="rtl">

      <header className="dashboard-header-v15">

        <Link
          to="/new-project/environment"
          className="header-btn-v15"
        >

          <ChevronLeft size={20} />

        </Link>

        <div className="brand-v15">

          <h1>SHIL</h1>

          <span>
            PROJECT PATH
          </span>

        </div>

        <Link
          to="/new-project/method"
          className="header-btn-v15"
        >

          بعدی

        </Link>

      </header>

      <main className="dashboard-main-v15">

        <ProjectStepRail />

        <section className="hero-card-v15">

          <div className="hero-row-v15">

            <span>STEP 03</span>

            <span>DESIGN PATH</span>

          </div>

          <div className="hero-content-v15">

            <h1>
              انتخاب مسیر پروژه
            </h1>

            <h2>
              نوع سیستم مهندسی را انتخاب کنید تا
              موتور محاسبات و فرم‌ها متناسب شوند.
            </h2>

          </div>

        </section>

        <section className="project-path-grid-v15">

          {paths.map((item) => (

            <button
              key={item.title}
              className={`
                project-path-card-v15
                ${item.color}
              `}
            >

              <div className="project-path-icon-v15">

                {item.icon}

              </div>

              <h3>
                {item.title}
              </h3>

              <p>
                {item.desc}
              </p>

              <div className="project-path-dot-v15" />

            </button>

          ))}

        </section>

      </main>

      <ProjectActionBar />

      <DashboardBottomNav />

    </div>

  );
}
