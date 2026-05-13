import React from "react";
import * as ReactDOM from "react-dom/client";
import App from "./app/App.jsx";

window.React = React;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);