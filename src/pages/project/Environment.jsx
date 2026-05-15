import React from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, MapPinned } from "lucide-react";

import DashboardBottomNav from "../../components/dashboard/DashboardBottomNav.jsx";
import ProjectStepRail from "../../components/project/ProjectStepRail.jsx";
import ProjectActionBar from "../../components/project/ProjectActionBar.jsx";
import EngineeringMiniCard from "../../components/project/EngineeringMiniCard.jsx";
import EngineeringStatusPanel from "../../components/project/EngineeringStatusPanel.jsx";
import EngineeringInputGrid from "../../components/project/EngineeringInputGrid.jsx";

export default function Environment() {
  return (
    <div className="dashboard-shell-v15" dir="rtl">
      <header className="dashboard-header-v15">
        <Link to="/new-project/info" className="header-btn-v15">
          <ChevronLeft size={20} />
        </Link>

        <div className="brand-v15">
          <h1>SHIL</h1>
          <span>ENVIRONMENT ENGINE</span>
        </div>

        <Link to="/new-project/path" className="header-btn-v15">
          بعدی
        </Link>
      </header>

      <main className="dashboard-main-v15">
        <ProjectStepRail />

        <section className="hero-card-v15">
          <div className="hero-row-v15">
            <span>STEP 02</span>
            <span>SITE ANALYSIS</span>
          </div>

          <div className="hero-content-v15">
            <h1>شرایط محیطی</h1>
            <h2>
              ثبت موقعیت، تابش، زاویه نصب، جهت جغرافیایی و تحلیل سایه پروژه.
            </h2>
          </div>
        </section>

        <EngineeringInputGrid>
          <EngineeringMiniCard
            title="GPS"
            value="35.68°"
            subtitle="مختصات محل پروژه"
          />

          <EngineeringMiniCard
            title="تابش"
            value="5.8"
            subtitle="kWh/m²/day"
          />

          <EngineeringMiniCard
            title="زاویه نصب"
            value="32°"
            subtitle="Tilt پیشنهادی"
          />

          <EngineeringMiniCard
            title="جهت"
            value="جنوب"
            subtitle="Azimuth بهینه"
          />
        </EngineeringInputGrid>

        <section className="environment-map-v15">
          <div className="map-grid-v15" />
          <div className="map-center-dot" />
          <div className="map-overlay-v15">
            <MapPinned size={16} />
            موقعیت پروژه و تحلیل سایت
          </div>
        </section>

        <EngineeringStatusPanel
          title="وضعیت تحلیل محیطی"
          items={[
            { label: "GPS", value: "ثبت شد" },
            { label: "Solar Data", value: "آماده" },
            { label: "Shadow Check", value: "در انتظار" },
            { label: "Validation", value: "OK" },
          ]}
        />
      </main>

      <ProjectActionBar />
      <DashboardBottomNav />
    </div>
  );
}
