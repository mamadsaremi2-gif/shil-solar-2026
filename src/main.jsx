import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import "./styles/modular-appearance.css";
import './styles/v23-enterprise-polish.css';
import './styles/v24-production-lock.css';

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
