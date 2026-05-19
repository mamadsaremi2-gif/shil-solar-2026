import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./ShilFrame.css";

const titles = {
  "/dashboard": "داشبورد SHIL",
  "/new-project": "پروژه جدید",
  "/new-project/info": "اطلاعات پروژه",
  "/new-project/environment": "شرایط محیطی",
  "/new-project/path": "انتخاب مسیر پروژه",
  "/new-project/method": "روش محاسبات",
  "/new-project/inputs": "ورودی محاسبات",
  "/new-project/system": "تنظیمات سیستم",
  "/new-project/summary": "چکیده اطلاعات",
  "/new-project/run": "اجرای محاسبات",
  "/projects": "مدیریت پروژه‌ها",
  "/contact": "ارتباط با ما",
  "/feedback": "نظرات کاربران",
  "/assistant": "دستیار هوشمند",
  "/education": "آموزش",
};

export default function ShilFrame({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const path = location.pathname;
  const hidden = path === "/" || path === "/login" || path === "/welcome";

  const title =
    titles[path] ||
    (path.startsWith("/new-project") ? "پروژه جدید" : "SHIL");

  const isStepPage = path.startsWith("/new-project");

  if (hidden) return children;

  return (
    <div className="shil-frame">
      <header className="shil-header">
        <button className="shil-header-btn" onClick={() => navigate(-1)}>
          بازگشت
        </button>

        <div className="shil-header-title">
          <strong>{title}</strong>
          <span>SHIL Energy OS</span>
        </div>

        <div className="shil-header-status">
          <i />
          آنلاین
        </div>
      </header>

      <main className="shil-frame-main">{children}</main>

      <footer className="shil-footer">
        {isStepPage ? (
          <>
            <button className="shil-footer-btn" onClick={() => navigate(-1)}>
              مرحله قبل
            </button>

            <button
              className="shil-footer-btn"
              onClick={() => console.info("[SHIL] Draft saved")}
            >
              ذخیره پیش‌نویس
            </button>

            <button
              className="shil-footer-btn shil-footer-primary"
              onClick={() => console.info("[SHIL] Step confirmed")}
            >
              تأیید مرحله
            </button>
          </>
        ) : (
          <>
            <button className="shil-footer-btn" onClick={() => navigate("/dashboard")}>
              خانه
            </button>

            <button className="shil-footer-btn" onClick={() => navigate("/projects")}>
              پروژه‌ها
            </button>

            <button className="shil-footer-btn shil-footer-primary" onClick={() => navigate("/new-project")}>
              پروژه جدید
            </button>
          </>
        )}
      </footer>
    </div>
  );
}
