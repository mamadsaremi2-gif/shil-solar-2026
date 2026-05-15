import React from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  BatteryCharging,
  SunMedium,
  Zap,
  Ruler,
} from "lucide-react";

import DashboardBottomNav from "../../components/dashboard/DashboardBottomNav.jsx";
import ProjectStepRail from "../../components/project/ProjectStepRail.jsx";
import ProjectActionBar from "../../components/project/ProjectActionBar.jsx";
import EngineeringMiniCard from "../../components/project/EngineeringMiniCard.jsx";
import EngineeringInputGrid from "../../components/project/EngineeringInputGrid.jsx";
import EngineeringStatusPanel from "../../components/project/EngineeringStatusPanel.jsx";

export default function CalculationInputs() {
  return (
    <div className="dashboard-shell-v15" dir="rtl">
      <header className="dashboard-header-v15">
        <Link to="/new-project/method" className="header-btn-v15">
          <ChevronLeft size={20} />
        </Link>

        <div className="brand-v15">
          <h1>SHIL</h1>
          <span>INPUT ENGINE</span>
        </div>

        <Link to="/new-project/system" className="header-btn-v15">
          بعدی
        </Link>
      </header>

      <main className="dashboard-main-v15">
        <ProjectStepRail />

        <section className="hero-card-v15">
          <div className="hero-row-v15">
            <span>STEP 05</span>
            <span>CALCULATION INPUTS</span>
          </div>

          <div className="hero-content-v15">
            <h1>ورودی محاسبات</h1>
            <h2>
              مصرف، فضای نصب، ظرفیت باتری، توان اینورتر و پارامترهای پایه طراحی را وارد کنید.
            </h2>
          </div>
        </section>

        <EngineeringInputGrid>
          <EngineeringMiniCard title="مصرف روزانه" value="12.5" subtitle="kWh/day" />
          <EngineeringMiniCard title="توان بار" value="4.8" subtitle="kW" />
          <EngineeringMiniCard title="فضای نصب" value="42" subtitle="m²" />
          <EngineeringMiniCard title="ولتاژ سیستم" value="48V" subtitle="DC Bus" />
        </EngineeringInputGrid>

        <section className="project-section-v15">
          <div className="project-section-head-v15">
            <h3>ورودی‌های طراحی</h3>
            <span>Engineering Inputs</span>
          </div>

          <div className="project-field-v15">
            <label>مصرف روزانه انرژی</label>
            <input type="number" placeholder="مثلاً 12500 Wh" />
          </div>

          <div className="project-field-v15">
            <label>توان لحظه‌ای بار</label>
            <input type="number" placeholder="مثلاً 4800 W" />
          </div>

          <div className="project-field-v15">
            <label>ساعات پشتیبانی باتری</label>
            <input type="number" placeholder="مثلاً 8 ساعت" />
          </div>

          <div className="project-field-v15">
            <label>فضای قابل نصب پنل</label>
            <input type="number" placeholder="مثلاً 42 متر مربع" />
          </div>

          <div className="project-field-v15">
            <label>توضیحات مصرف</label>
            <textarea
              rows="5"
              placeholder="لیست تجهیزات، ساعات کارکرد، اولویت بارها و شرایط خاص..."
            />
          </div>
        </section>

        <section className="input-feature-grid-v15">
          <div className="input-feature-card-v15">
            <BatteryCharging size={28} />
            <h4>Battery Input</h4>
            <p>ولتاژ، ظرفیت و زمان پشتیبانی</p>
          </div>

          <div className="input-feature-card-v15">
            <SunMedium size={28} />
            <h4>PV Input</h4>
            <p>توان پنل و فضای نصب</p>
          </div>

          <div className="input-feature-card-v15">
            <Zap size={28} />
            <h4>Load Input</h4>
            <p>توان مصرف و انرژی روزانه</p>
          </div>

          <div className="input-feature-card-v15">
            <Ruler size={28} />
            <h4>Site Limit</h4>
            <p>محدودیت فضا و اجرا</p>
          </div>
        </section>

        <EngineeringStatusPanel
          title="وضعیت ورودی‌ها"
          items={[
            { label: "Daily Energy", value: "در انتظار" },
            { label: "Load Power", value: "در انتظار" },
            { label: "Battery Backup", value: "Ready" },
            { label: "Validation", value: "OK" },
          ]}
        />
      </main>

      <ProjectActionBar />
      <DashboardBottomNav />
    </div>
  );
}
