import React from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  FolderOpen,
  BarChart3,
  MapPinned,
  FileText,
  Bot,
  Zap,
  BatteryCharging,
  SunMedium,
  Activity,
} from "lucide-react";

import DashboardBottomNav from "../components/dashboard/DashboardBottomNav.jsx";
import LiveEnergyWidget from "../components/dashboard/LiveEnergyWidget.jsx";
import SystemStatusGrid from "../components/dashboard/SystemStatusGrid.jsx";
import EnergyDistributionWidget from "../components/dashboard/EnergyDistributionWidget.jsx";
import ActivityFeed from "../components/dashboard/ActivityFeed.jsx";
import EnvironmentWidget from "../components/dashboard/EnvironmentWidget.jsx";
import EngineeringAlertsWidget from "../components/dashboard/EngineeringAlertsWidget.jsx";
import ProjectProgressWidget from "../components/dashboard/ProjectProgressWidget.jsx";
import EquipmentWidget from "../components/dashboard/EquipmentWidget.jsx";
import EngineeringRadarWidget from "../components/dashboard/EngineeringRadarWidget.jsx";
import TaskPipelineWidget from "../components/dashboard/TaskPipelineWidget.jsx";
import EngineeringStatsWidget from "../components/dashboard/EngineeringStatsWidget.jsx";
import BatteryHealthWidget from "../components/dashboard/BatteryHealthWidget.jsx";
import LiveSystemTable from "../components/dashboard/LiveSystemTable.jsx";
import ReportsWidget from "../components/dashboard/ReportsWidget.jsx";

const metrics = [
  { title: "پروژه‌ها", value: "12", unit: "فعال", icon: <FolderOpen size={24} /> },
  { title: "تولید روزانه", value: "24.8", unit: "kWh", icon: <SunMedium size={24} /> },
  { title: "ظرفیت باتری", value: "200", unit: "Ah", icon: <BatteryCharging size={24} /> },
  { title: "راندمان", value: "88", unit: "%", icon: <Activity size={24} /> },
];

const quick = [
  { title: "پروژه جدید", desc: "شروع طراحی مهندسی", to: "/new-project", icon: <Plus size={34} /> },
  { title: "پروژه‌ها", desc: "مدیریت پروژه‌ها", to: "/projects", icon: <FolderOpen size={34} /> },
  { title: "نمودار انرژی", desc: "تحلیل تولید و مصرف", to: "/new-project/run", icon: <BarChart3 size={34} /> },
  { title: "نقشه پروژه", desc: "موقعیت و اقلیم", to: "/new-project/environment", icon: <MapPinned size={34} /> },
  { title: "گزارش نهایی", desc: "PDF و خروجی", to: "/new-project/summary", icon: <FileText size={34} /> },
  { title: "دستیار هوشمند", desc: "AI Engineering", to: "/assistant", icon: <Bot size={34} /> },
];

export default function Dashboard() {
  return (
    <div className="dashboard-shell-v15" dir="rtl">
      <header className="dashboard-header-v15">
        <Link to="/new-project" className="header-btn-v15">
          پروژه جدید
        </Link>

        <div className="brand-v15">
          <h1>SHIL</h1>
          <span>SMART ENGINEERING SUITE</span>
        </div>

        <Link to="/contact" className="header-btn-v15">
          ارتباط
        </Link>
      </header>

      <main className="dashboard-main-v15">
        <section className="hero-card-v15">
          <div className="hero-row-v15">
            <span>SHIL V15</span>
            <span>LIVE PLATFORM</span>
          </div>

          <div className="hero-content-v15">
            <h1>داشبورد مهندسی فعال</h1>
            <h2>
              مانیتورینگ، تحلیل انرژی، وضعیت تجهیزات،
              گزارش‌ها و مسیر طراحی پروژه در یک داشبورد یکپارچه.
            </h2>
          </div>
        </section>

        <section className="integration-metrics-v15">
          {metrics.map((item) => (
            <div className="integration-metric-v15" key={item.title}>
              <div className="integration-metric-icon-v15">{item.icon}</div>
              <div>
                <h3>{item.value}</h3>
                <p>{item.title}</p>
                <span>{item.unit}</span>
              </div>
            </div>
          ))}
        </section>

        <section className="integration-live-card-v15">
          <div>
            <span className="status-chip">ENGINE ONLINE</span>
            <h2>موتور SHIL آماده اتصال واقعی است</h2>
            <p>
              داشبورد حالا ویجت‌های تحلیلی، مانیتورینگ و گزارش را به‌صورت واقعی نمایش می‌دهد.
            </p>
          </div>

          <div className="integration-orb-v15">
            <Zap size={42} />
          </div>
        </section>

        <section className="dashboard-grid-v15">
          {quick.map((item) => (
            <Link to={item.to} className="dash-card-v15" key={item.title}>
              <div className="dash-card-top-v15">
                <div className="dash-mini-dots">
                  <span />
                  <span />
                  <span />
                </div>
              </div>

              <div className="dash-icon-v15">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
              <div className="dash-status-dot" />
            </Link>
          ))}
        </section>

        <LiveEnergyWidget />
        <SystemStatusGrid />
        <EnergyDistributionWidget />
        <EngineeringStatsWidget />
        <EngineeringRadarWidget />
        <BatteryHealthWidget />
        <LiveSystemTable />
        <EngineeringAlertsWidget />
        <ProjectProgressWidget />
        <EquipmentWidget />
        <TaskPipelineWidget />
        <ReportsWidget />
        <EnvironmentWidget />
        <ActivityFeed />
      </main>

      <DashboardBottomNav />
    </div>
  );
}
