import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./ShilFrame.css";

const titles = {
  "/dashboard": "داشبورد",
  "/new-project": "مسیر پروژه",
  "/new-project/info": "اطلاعات پروژه",
  "/new-project/environment": "شرایط محیطی",
  "/new-project/path": "مسیر پروژه",
  "/new-project/method": "روش طراحی",
  "/new-project/inputs": "ورودی محاسبات",
  "/new-project/system": "تنظیمات",
  "/new-project/summary": "چکیده طراحی",
  "/new-project/run": "اجرا",
  "/projects": "پروژه‌ها",
  "/contact": "ارتباط",
  "/feedback": "بازخورد",
  "/assistant": "دستیار",
  "/education": "آموزش",
};

export default function ShilFrame({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const path = location.pathname;
  const hidden = path === "/" || path === "/login" || path === "/welcome";

  const title =
    titles[path] ||
    (path.startsWith("/new-project") ? "مسیر پروژه" : "SHIL");

  const isStepPage = path.startsWith("/new-project");

  if (hidden) return children;

  return (
    <div className="shil-frame">
      <header className="shil-header">
        <button className="shil-header-btn" onClick={() => navigate(-1)}>
          ??????
        </button>

        <div className="shil-header-title">
          <strong>{title}</strong>
          <span>SHIL Energy OS</span>
        </div>

        <div className="shil-header-status">
          <i />
          ??????
        </div>
      </header>

      <main className="shil-frame-main">{children}</main>

      <footer className="shil-footer">
        {isStepPage ? (
          <>
            <button className="shil-footer-btn" onClick={() => navigate(-1)}>
              ????? ???
            </button>

            <button
              className="shil-footer-btn"
              onClick={() => console.info("[SHIL] Draft saved")}
            >
              ????? ????????
            </button>

            <button
              className="shil-footer-btn shil-footer-primary"
              onClick={() => console.info("[SHIL] Step confirmed")}
            >
              ????? ?????
            </button>
          </>
        ) : (
          <>
            <button className="shil-footer-btn" onClick={() => navigate("/dashboard")}>
              ????
            </button>

            <button className="shil-footer-btn" onClick={() => navigate("/projects")}>
              ????????
            </button>

            <button className="shil-footer-btn shil-footer-primary" onClick={() => navigate("/new-project")}>
              ????? ????
            </button>
          </>
        )}
      </footer>
    </div>
  );
}
