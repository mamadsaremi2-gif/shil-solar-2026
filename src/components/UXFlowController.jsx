import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { captureCurrentProjectSnapshot, markCurrentProjectFinal } from "../workflow/uxFlowController.js";

function isProjectLandingPath(pathname) {
  return pathname === "/new-project" || pathname === "/new-project/path";
}

export default function UXFlowController() {
  const location = useLocation();
  const [toast, setToast] = useState(null);
  const lastSavedPath = useRef("");
  const debounceRef = useRef(null);

  function softSave(pathname = window.location.pathname, showToast = false) {
    if (isProjectLandingPath(pathname)) return null;
    const isFinalRoute = pathname.includes("/new-project/run/");
    const record = isFinalRoute ? markCurrentProjectFinal() : captureCurrentProjectSnapshot(pathname);
    if (record && showToast && lastSavedPath.current !== pathname) {
      lastSavedPath.current = pathname;
      setToast({ text: "پروژه در بخش در حال اجرا ذخیره شد", type: "success" });
      window.setTimeout(() => setToast(null), 1600);
    }
    return record;
  }

  useEffect(() => {
    softSave(location.pathname, true);
  }, [location.pathname]);

  useEffect(() => {
    const saveNow = () => softSave(window.location.pathname, false);
    const debouncedSave = () => {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(saveNow, 700);
    };
    const toastHandler = (event) => {
      setToast({ text: event.detail?.message || "انجام شد", type: event.detail?.type || "info" });
      window.setTimeout(() => setToast(null), 1800);
    };
    const saveOnVisibilityChange = () => {
      if (document.visibilityState === "hidden") saveNow();
    };
    window.addEventListener("beforeunload", saveNow);
    window.addEventListener("visibilitychange", saveOnVisibilityChange);
    window.addEventListener("input", debouncedSave, true);
    window.addEventListener("change", debouncedSave, true);
    window.addEventListener("shil-ux-toast", toastHandler);
    return () => {
      window.clearTimeout(debounceRef.current);
      window.removeEventListener("beforeunload", saveNow);
      window.removeEventListener("visibilitychange", saveOnVisibilityChange);
      window.removeEventListener("input", debouncedSave, true);
      window.removeEventListener("change", debouncedSave, true);
      window.removeEventListener("shil-ux-toast", toastHandler);
    };
  }, []);

  if (!toast) return null;
  return <div className={`shil-ux-toast ${toast.type}`}>{toast.text}</div>;
}
