import * as React from "react";
import { useLocation } from "react-router-dom";
import { captureCurrentProjectSnapshot } from "../workflow/uxFlowController.js";

export default function UXFlowController() {
  const location = useLocation();
  const [toast, setToast] = React.useState(null);
  const lastSavedPath = React.useRef("");
  const debounceRef = React.useRef(null);

  function softSave(pathname = window.location.pathname, showToast = false) {
    const record = captureCurrentProjectSnapshot(pathname);
    if (record && showToast && lastSavedPath.current !== pathname) {
      lastSavedPath.current = pathname;
      setToast({ text: "پروژه در بخش در حال اجرا ذخیره شد", type: "success" });
      window.setTimeout(() => setToast(null), 1600);
    }
    return record;
  }

  React.useEffect(() => {
    softSave(location.pathname, true);
  }, [location.pathname]);

  React.useEffect(() => {
    const saveNow = () => softSave(window.location.pathname, false);
    const debouncedSave = () => {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(saveNow, 700);
    };
    const toastHandler = (event) => {
      setToast({ text: event.detail?.message || "انجام شد", type: event.detail?.type || "info" });
      window.setTimeout(() => setToast(null), 1800);
    };
    window.addEventListener("beforeunload", saveNow);
    window.addEventListener("visibilitychange", saveNow);
    window.addEventListener("input", debouncedSave, true);
    window.addEventListener("change", debouncedSave, true);
    window.addEventListener("shil-ux-toast", toastHandler);
    return () => {
      window.clearTimeout(debounceRef.current);
      window.removeEventListener("beforeunload", saveNow);
      window.removeEventListener("visibilitychange", saveNow);
      window.removeEventListener("input", debouncedSave, true);
      window.removeEventListener("change", debouncedSave, true);
      window.removeEventListener("shil-ux-toast", toastHandler);
    };
  }, []);

  if (!toast) return null;
  return <div className={`shil-ux-toast ${toast.type}`}>{toast.text}</div>;
}
