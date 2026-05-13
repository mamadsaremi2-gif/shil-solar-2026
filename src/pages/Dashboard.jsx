import React from "react";
import MobileShell from "../components/MobileShell.jsx";
import DashboardCard from "../components/DashboardCard.jsx";

export default function Dashboard() {
  return (
    <MobileShell title="داشبورد">
      <section className="hero-card">
        <div className="eyebrow">SHIL Mobile V15</div>
        <h1>طراحی هوشمند سامانه‌های خورشیدی و برق اضطراری</h1>
        <p>رابط واقعی موبایل‌فرست، فشرده، بدون اسکرول افقی سراسری و آماده اتصال به موتور محاسبات.</p>
      </section>

      <section className="panel">
        <div className="section-head">
          <h2>دسترسی سریع</h2>
          <span>۲×۳</span>
        </div>

        <div className="grid">
          <DashboardCard to="/new-project" icon="+" title="پروژه جدید" subtitle="مسیر ۹ مرحله‌ای" />
          <DashboardCard to="/projects" icon="▦" title="پروژه‌ها" subtitle="جاری و نهایی" />
          <DashboardCard to="/scenarios" icon="⚡" title="سناریوهای آماده" subtitle="خورشیدی و اضطراری" />
          <DashboardCard to="/feedback" icon="◎" title="بازخورد کاربر" subtitle="ثبت مشکل/پیشنهاد" />
          <DashboardCard to="/contact" icon="☎" title="ارتباط با ما" subtitle="راه‌های تماس" />
          <DashboardCard to="/new-project" icon="AI" title="دستیار هوشمند" subtitle="کنترل مهندسی" />
        </div>
      </section>

      <section className="status-card">
        <h2>وضعیت زیرساخت</h2>
        <p>V15 فعال — آماده توسعه صفحات واقعی، فرم‌ها، محاسبات و ذخیره پروژه‌ها.</p>
      </section>
    </MobileShell>
  );
}
