import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./ShilFrame.css";

const titles = {
  "/dashboard": "??????? SHIL",
  "/new-project": "????? ????",
  "/new-project/info": "??????? ?????",
  "/new-project/environment": "????? ?????",
  "/new-project/path": "?????? ???? ?????",
  "/new-project/method": "??? ???????",
  "/new-project/inputs": "????? ???????",
  "/new-project/system": "??????? ?????",
  "/new-project/summary": "????? ???????",
  "/new-project/run": "????? ???????",
  "/projects": "?????? ????????",
  "/contact": "?????? ?? ??",
  "/feedback": "????? ???????",
  "/assistant": "?????? ??????",
  "/education": "?????",
};

export default function ShilFrame({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const path = location.pathname;
  const hidden = path === "/" || path === "/login" || path === "/welcome";

  const title =
    titles[path] ||
    (path.startsWith("/new-project") ? "????? ????" : "SHIL");

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
