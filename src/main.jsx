import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App.jsx";

import "./styles/shil-ui.css";
import "./styles/app.css";
import "./styles/shil-ui-final-100.css";
import "./styles/shil-ux-flow-100.css";
import "./styles/shil-project-management-100.css";
import "./styles/shil-final-hotfix.css";

window.React = React;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
