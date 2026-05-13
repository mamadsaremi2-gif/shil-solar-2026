import React from "react";
import MobileShell from "../components/MobileShell.jsx";

export default function Projects() {
  return (
    <MobileShell title="پروژه‌ها">
      <section className="page-card">
        <h1>پروژه‌ها</h1>
        <p>مدیریت پروژه‌های جاری و نهایی.</p>

        <div className="list-card">
          <h3>پروژه‌های در حال اجرا</h3>
          <p>هنوز پروژه‌ای ثبت نشده است.</p>
        </div>

        <div className="list-card">
          <h3>پروژه‌های نهایی</h3>
          <p>گزارش‌های تکمیل‌شده اینجا نمایش داده می‌شوند.</p>
        </div>
      </section>
    </MobileShell>
  );
}
