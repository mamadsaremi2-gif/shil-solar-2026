import React from "react";

import IndustrialTelemetryPanel from "./IndustrialTelemetryPanel.jsx";
import AlarmCenterPanel from "./AlarmCenterPanel.jsx";
import GISAnalysisPanel from "./GISAnalysisPanel.jsx";
import InstallerModePanel from "./InstallerModePanel.jsx";

export default function IndustrialExpansionDashboard() {
  return (
    <>
      <IndustrialTelemetryPanel />
      <AlarmCenterPanel />
      <GISAnalysisPanel />
      <InstallerModePanel />
    </>
  );
}
