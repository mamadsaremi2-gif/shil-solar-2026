import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App.jsx";
import "./styles/shil-ui.css";

window.React = React;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
import {
  startRealtimeSimulation,
} from "./realtime/streams/startRealtimeSimulation.js";

startRealtimeSimulation();
