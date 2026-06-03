import './appearance/styles/shil-force-welcome-after-login.js';
import './appearance/styles/shil-auth-page-body-class.js';
import "./appearance/styles/shil-mobile-design-system.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App.jsx";
window.React = React;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
