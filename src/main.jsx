import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import "./styles/globals.css";
import "./index.css";
import "./styles/final-production-overrides.css";
import "./styles/mobile-standalone-v1.css";
import "./styles/mobile-refinement-patch-v4.css";
import "./styles/shil-final-ui-v5.css";
import "./styles/shil-final-ui-v6-fixes.css";
import "./styles/shil-final-ui-v7-last-polish.css";
import "./styles/shil-final-ui-v8-mobile-master.css";
import "./styles/shil-final-ui-v9-mobile-safe.css";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations?.().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
