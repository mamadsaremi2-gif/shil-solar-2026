import React from "react";
import DashboardCard from "./DashboardCard.jsx";

import { SHIL_ASSETS } from "../../config/shilAssetPaths.js";

const dashboardItems = [
  {
    to: "/projects",
    icon: <img src={SHIL_ASSETS.icons.dashboard.projects} alt="" loading="lazy" decoding="async" />,
    title: "پروژه‌ها",
    subtitle: "جاری و نهایی",
    tone: "cyan",
  },
  {
    to: "/new-project",
    icon: <img src={SHIL_ASSETS.icons.dashboard.newProject} alt="" loading="lazy" decoding="async" />,
    title: "پروژه جدید",
    subtitle: "مسیر ۸ مرحله‌ای",
    tone: "blue",
  },
  {
    to: "/scenarios",
    icon: <img src={SHIL_ASSETS.icons.dashboard.scenarios} alt="" loading="lazy" decoding="async" />,
    title: "سناریوهای آماده",
    subtitle: "خورشیدی و اضطراری",
    tone: "amber",
  },
  {
    to: "/contact",
    icon: <img src={SHIL_ASSETS.icons.dashboard.contact} alt="" loading="lazy" decoding="async" />,
    title: "ارتباط با ما",
    subtitle: "راه‌های تماس",
    tone: "purple",
  },
  {
    to: "/feedback",
    icon: <img src={SHIL_ASSETS.icons.dashboard.feedback} alt="" loading="lazy" decoding="async" />,
    title: "بازخورد کاربر",
    subtitle: "ثبت مشکل/پیشنهاد",
    tone: "pink",
  },
  {
    to: "/assistant",
    icon: <img src={SHIL_ASSETS.icons.dashboard.assistant} alt="" loading="lazy" decoding="async" />,
    title: "دستیار هوشمند",
    subtitle: "کنترل مهندسی",
    tone: "violet",
  },
];

export default function DashboardGrid() {
  return (
    <section className="dash-panel-v15">
      <div className="dash-section-head">
        <h2>دسترسی سریع</h2>
        <span>۲×۳</span>
      </div>

      <div className="dash-grid-v15">
        {dashboardItems.map((item) => (
          <DashboardCard key={item.title} {...item} />
        ))}
      </div>
    </section>
  );
}
