import React from "react";
import {
  FolderOpen,
  Plus,
  Zap,
  Headphones,
  MessageCircle,
  Cpu,
} from "lucide-react";
import DashboardCard from "./DashboardCard.jsx";

const dashboardItems = [
  {
    to: "/projects",
    icon: <FolderOpen size={38} />,
    title: "پروژه‌ها",
    subtitle: "جاری و نهایی",
    tone: "cyan",
  },
  {
    to: "/new-project",
    icon: <Plus size={42} />,
    title: "پروژه جدید",
    subtitle: "مسیر ۸ مرحله‌ای",
    tone: "blue",
  },
  {
    to: "/scenarios",
    icon: <Zap size={38} />,
    title: "سناریوهای آماده",
    subtitle: "خورشیدی و اضطراری",
    tone: "amber",
  },
  {
    to: "/contact",
    icon: <Headphones size={38} />,
    title: "ارتباط با ما",
    subtitle: "راه‌های تماس",
    tone: "purple",
  },
  {
    to: "/feedback",
    icon: <MessageCircle size={38} />,
    title: "بازخورد کاربر",
    subtitle: "ثبت مشکل/پیشنهاد",
    tone: "pink",
  },
  {
    to: "/assistant",
    icon: <Cpu size={38} />,
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