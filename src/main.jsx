import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/v14-minimal-industrial.css";
import App from "./app/App";
import "./styles/modular-appearance.css";

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
