import React from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  PanelsTopLeft,
  BatteryCharging,
  Cpu,
  Cable,
  ShieldCheck,
  Gauge,
} from "lucide-react";

import DashboardBottomNav from "../../components/dashboard/DashboardBottomNav.jsx";
import ProjectStepRail from "../../components/project/ProjectStepRail.jsx";
import ProjectActionBar from "../../components/project/ProjectActionBar.jsx";
import EngineeringMiniCard from "../../components/project/EngineeringMiniCard.jsx";
import EngineeringInputGrid from "../../components/project/EngineeringInputGrid.jsx";
import EngineeringStatusPanel from "../../components/project/EngineeringStatusPanel.jsx";

const systemCards = [
  { title: "پنل", value: "585W", subtitle: "Mono PERC", icon: <PanelsTopLeft size={28} /> },
  { title: "باتری", value: "48V", subtitle: "Lithium Bank", icon: <BatteryCharging size={28} /> },
  { title: "اینورتر", value: "5kW", subtitle: "Hybrid Inverter", icon: <Cpu size={28} /> },
  { title: "کابل", value: "6mm²", subtitle: "DC Cable", icon: <Cable size={28} /> },
];

export default function SystemSettings() {
  return (
    <div className="dashboard-shell-v15" dir="rtl">
      <header className="dashboard-header-v15">
        <Link to="/new-project/inputs" className="header-btn-v15">
          <ChevronLeft size={20} />
        </Link>

        <div className="brand-v15">
          <h1>SHIL</h1>
          <span>SYSTEM SETTINGS</span>
        </div>

        <Link to="/new-project/summary" className="header-btn-v15">
          بعدی
        </Link>
      </header>

      <main className="dashboard-main-v15">
        <ProjectStepRail />

        <section className="hero-card-v15">
          <div className="hero-row-v15">
            <span>STEP 06</span>
            <span>SYSTEM CONFIG</span>
          </div>

          <div className="hero-content-v15">
            <h1>تنظیمات سیستم</h1>
            <h2>
              پیکربندی پنل، اینورتر، باتری، کابل، حفاظت و مدل تلفات سیستم.
            </h2>
          </div>
        </section>

        <EngineeringInputGrid>
          {systemCards.map((item) => (
            <EngineeringMiniCard
              key={item.title}
              title={item.title}
              value={item.value}
              subtitle={item.subtitle}
            />
          ))}
        </EngineeringInputGrid>

        <section className="system-config-grid-v15">
          <div className="system-config-card-v15">
            <PanelsTopLeft size={30} />
            <h4>آرایش پنل‌ها</h4>
            <p>بررسی سری/موازی، Voc و محدودیت MPPT</p>
          </div>

          <div className="system-config-card-v15">
            <Cpu size={30} />
            <h4>MPPT داخل اینورتر</h4>
            <p>کنترل ولتاژ، جریان و بازه کاری MPPT داخلی</p>
          </div>

          <div className="system-config-card-v15">
            <Cable size={30} />
            <h4>کابل DC/AC</h4>
            <p>افت ولتاژ، سطح مقطع و جریان مجاز کابل</p>
          </div>

          <div className="system-config-card-v15">
            <ShieldCheck size={30} />
            <h4>حفاظت و ایمنی</h4>
            <p>فیوز، SPD، ارت و حفاظت اضافه‌ولتاژ</p>
          </div>
        </section>

        <section className="project-section-v15">
          <div className="project-section-head-v15">
            <h3>پارامترهای فنی سیستم</h3>
            <span>System Parameters</span>
          </div>

          <div className="project-field-v15">
            <label>توان پنل انتخابی</label>
            <input type="number" placeholder="مثلاً 585 W" />
          </div>

          <div className="project-field-v15">
            <label>ولتاژ سیستم باتری</label>
            <select>
              <option>12V</option>
              <option>24V</option>
              <option>48V</option>
              <option>96V</option>
            </select>
          </div>

          <div className="project-field-v15">
            <label>توان نامی اینورتر</label>
            <input type="number" placeholder="مثلاً 5000 W" />
          </div>

          <div className="project-field-v15">
            <label>مدل تلفات</label>
            <select>
              <option>Standard Loss Model</option>
              <option>High Temperature Site</option>
              <option>Dust / Desert Site</option>
              <option>Custom Loss Model</option>
            </select>
          </div>
        </section>

        <EngineeringStatusPanel
          title="وضعیت تنظیمات سیستم"
          items={[
            { label: "PV String", value: "Ready" },
            { label: "MPPT Check", value: "Ready" },
            { label: "Cable Check", value: "Ready" },
            { label: "Protection", value: "Ready" },
          ]}
        />

        <section className="system-warning-v15">
          <Gauge size={22} />
          <p>
            کنترل MPPT در نسخه جدید داخل کارت اینورتر انجام می‌شود و شارژکنترلر خارجی
            به‌عنوان تجهیز مستقل در UI اصلی نمایش داده نمی‌شود.
          </p>
        </section>
      </main>

      <ProjectActionBar />
      <DashboardBottomNav />
    </div>
  );
}
