import React from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, FolderOpen } from "lucide-react";

import DashboardBottomNav from "../../components/dashboard/DashboardBottomNav.jsx";
import ProjectStepRail from "../../components/project/ProjectStepRail.jsx";
import ProjectActionBar from "../../components/project/ProjectActionBar.jsx";
import EngineeringMiniCard from "../../components/project/EngineeringMiniCard.jsx";
import EngineeringStatusPanel from "../../components/project/EngineeringStatusPanel.jsx";
import EngineeringInputGrid from "../../components/project/EngineeringInputGrid.jsx";

export default function ProjectInfo() {
  return (
    <div className="dashboard-shell-v15" dir="rtl">
      <header className="dashboard-header-v15">
        <Link to="/new-project" className="header-btn-v15">
          <ChevronLeft size={20} />
        </Link>

        <div className="brand-v15">
          <h1>SHIL</h1>
          <span>PROJECT INFORMATION</span>
        </div>

        <Link to="/new-project/environment" className="header-btn-v15">
          بعدی
        </Link>
      </header>

      <main className="dashboard-main-v15">
        <ProjectStepRail />

        <section className="hero-card-v15">
          <div className="hero-row-v15">
            <span>STEP 01</span>
            <span>PROJECT CORE</span>
          </div>

          <div className="hero-content-v15">
            <h1>اطلاعات پروژه</h1>
            <h2>
              ثبت مشخصات پایه پروژه، کارفرما، موقعیت و نوع طراحی مهندسی.
            </h2>
          </div>
        </section>

        <EngineeringInputGrid>
          <EngineeringMiniCard
            title="نوع پروژه"
            value="خورشیدی"
            subtitle="PV / Hybrid / Backup"
          />

          <EngineeringMiniCard
            title="وضعیت"
            value="Draft"
            subtitle="در حال تکمیل"
          />

          <EngineeringMiniCard
            title="نسخه"
            value="V15"
            subtitle="Engineering UI"
          />

          <EngineeringMiniCard
            title="شناسه"
            value="SHIL-001"
            subtitle="Project ID"
          />
        </EngineeringInputGrid>

        <section className="project-section-v15">
          <div className="project-section-head-v15">
            <h3>فرم اطلاعات پایه</h3>
            <span>Project Data</span>
          </div>

          <div className="project-field-v15">
            <label>نام پروژه</label>
            <input placeholder="مثلاً نیروگاه خورشیدی ویلایی" />
          </div>

          <div className="project-field-v15">
            <label>نام کارفرما</label>
            <input placeholder="نام شخص یا شرکت" />
          </div>

          <div className="project-field-v15">
            <label>شهر / استان</label>
            <input placeholder="مثلاً شیراز / فارس" />
          </div>

          <div className="project-field-v15">
            <label>نوع پروژه</label>
            <select>
              <option>خورشیدی با پنل</option>
              <option>برق اضطراری</option>
              <option>هیبرید</option>
            </select>
          </div>

          <div className="project-field-v15">
            <label>توضیحات فنی</label>
            <textarea
              rows="5"
              placeholder="شرایط پروژه، نیاز مصرف، محدودیت‌ها و توضیحات اجرایی..."
            />
          </div>
        </section>

        <EngineeringStatusPanel
          title="وضعیت اطلاعات پروژه"
          items={[
            { label: "Project Name", value: "در انتظار" },
            { label: "Client", value: "در انتظار" },
            { label: "Location", value: "در انتظار" },
            { label: "Validation", value: "Ready" },
          ]}
        />
      </main>

      <ProjectActionBar />
      <DashboardBottomNav />
    </div>
  );
}
