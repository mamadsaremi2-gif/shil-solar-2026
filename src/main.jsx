import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App.jsx";
import "./styles/shil-ui.css";
import "./styles/app.css";
import "./styles/shil-ui-final-100.css";
import "./styles/shil-ux-flow-100.css";
import "./styles/shil-project-management-100.css";

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
import { reportWebVitals } from "./production/performance/webVitals.js";
import { preloadCriticalAssets } from "./production/performance/preloadAssets.js";
import { registerGlobalErrorHandlers } from "./production/errors/globalErrors.js";

registerGlobalErrorHandlers();
preloadCriticalAssets();
reportWebVitals();
import { initSentry } from "./enterprise/telemetry/sentry.js";
import { initTelemetry } from "./enterprise/telemetry/telemetry.js";

initSentry();
initTelemetry();
