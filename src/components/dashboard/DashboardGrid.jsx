import React from "react";
import DashboardCard from "./DashboardCard.jsx";

// آیکون‌های نئونی به‌صورت کامپوننت React
import {
  NeonProjects,
  NeonNewProject,
  NeonScenarios,
  NeonContact,
  NeonFeedback,
  NeonAssistant,
} from "../../mobile-ui/icons/NeonIcons.jsx";

const dashboardItems = [
  {
    to: "/projects",
    icon: <NeonProjects />,
    title: "پروژه‌ها",
    subtitle: "جاری و نهایی",
    tone: "cyan",
  },
  {
    to: "/new-project",
    icon: <NeonNewProject />,
    title: "پروژه جدید",
    subtitle: "مسیر ۸ مرحله‌ای",
    tone: "blue",
  },
  {
    to: "/scenarios",
    icon: <NeonScenarios />,
    title: "سناریوهای آماده",
    subtitle: "خورشیدی و اضطراری",
    tone: "amber",
  },
  {
    to: "/contact",
    icon: <NeonContact />,
    title: "ارتباط با ما",
    subtitle: "راه‌های تماس",
    tone: "purple",
  },
  {
    to: "/feedback",
    icon: <NeonFeedback />,
    title: "بازخورد کاربر",
    subtitle: "ثبت مشکل/پیشنهاد",
    tone: "pink",
  },
  {
    to: "/assistant",
    icon: <NeonAssistant />,
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
