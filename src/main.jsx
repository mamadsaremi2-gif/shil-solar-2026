import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import "./styles/shil-mobile-standard-v28.css";

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
