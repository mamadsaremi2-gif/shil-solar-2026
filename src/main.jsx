import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./app/App";
import "./styles/globals.css";

registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log("نسخه جدید برنامه آماده است");
  },
  onOfflineReady() {
    console.log("برنامه برای استفاده آفلاین آماده شد");
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
