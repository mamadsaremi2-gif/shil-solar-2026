import React from "react";
import { Link, useNavigate } from "react-router-dom";

function ShilHeader({ title }) {
  const navigate = useNavigate();

  return (
    <header className="shil-fixed-header">
      <button
        type="button"
        className="shil-header-action"
        onClick={() => navigate(-1)}
      >
        بازگشت
      </button>

      <div className="shil-header-title">{normalizeShilTitle(title)}</div>

      <Link className="shil-header-action" to="/dashboard">
        داشبورد
      </Link>
    </header>
  );
}

function ShilFooter({ compact = false }) {
  return (
    <footer className="shil-fixed-footer">
      <Link to="/dashboard">خانه</Link>
      {!compact && <Link to="/new-project">پروژه جدید</Link>}
      {!compact && <Link to="/projects">پروژه‌ها</Link>}
      <Link to="/contact">ارتباط</Link>
    </footer>
  );
}

function getShilPageKey(title, className = "") {
  const source = `${String(title || "")} ${String(className || "")}`;
  const rules = [
    [/اطلاعات پروژه|project-info/i, "project-info"],
    [/محیط|environment/i, "environment"],
    [/مسیر پروژه|project-path/i, "project-path"],
    [/روش طراحی|calculation-method/i, "calculation-method"],
    [/ورودی محاسبات|calculation-input/i, "calculation-inputs"],
    [/تنظیمات برق اضطراری|emergency/i, "emergency-settings"],
    [/تنظیمات نیروگاه|utility/i, "utility-settings"],
    [/تنظیمات|system-settings/i, "system-settings"],
    [/چکیده|summary/i, "summary"],
    [/اجرا و خروجی|خروجی نهایی|run/i, "run-output"],
    [/مدیریت پروژه|پروژه‌ها|projects/i, "projects"],
    [/سناریو|scenario/i, "scenarios"],
    [/دستیار|assistant/i, "assistant"],
    [/آموزش|education/i, "education"],
    [/ارتباط|contact/i, "contact"],
    [/نظر|feedback/i, "feedback"],
    [/ادمین|admin/i, "admin"],
    [/داشبورد|dashboard|home-shell/i, "dashboard"],
    [/پروژه جدید|new-project/i, "new-project"],
    [/ورود|login|auth/i, "auth"],
  ];

  return rules.find(([pattern]) => pattern.test(source))?.[1] || "standard";
}

function normalizeShilTitle(title) {
  const t = String(title || "").trim();
  if (t.includes("روش طراحی")) return "روش طراحی";
  if (t.includes("تنظیمات")) return "تنظیمات";
  if (t.includes("چکیده طراحی سیستم")) return "چکیده طراحی";
  return t;
}

export default function ShilPageShell({
  title,
  children,
  className = "",
  hideHeader = false,
  hideFooter = false,
  compactFooter = false,
}) {
  const pageKey = getShilPageKey(title, className);
  const shellClassName = [
    "shil-page-shell",
    `shil-page--${pageKey}`,
    hideHeader ? "shil-no-header" : "",
    hideFooter ? "shil-no-footer" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={shellClassName} dir="rtl">
      <div className="shil-master-bg" />

      {!hideHeader && <ShilHeader title={title} />}

      <main className="shil-page-content shil-ds-page-root">{children}</main>

      {!hideFooter && <ShilFooter compact={compactFooter} />}
    </div>
  );
}