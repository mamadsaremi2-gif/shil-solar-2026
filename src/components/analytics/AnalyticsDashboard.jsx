import React from "react";

import EngineeringComposedChart from "./EngineeringComposedChart.jsx";
import EfficiencyGauge from "./EfficiencyGauge.jsx";
import ProductionHeatmap from "./ProductionHeatmap.jsx";
import SystemHealthRadar from "./SystemHealthRadar.jsx";
import AnalysisBars from "./AnalysisBars.jsx";

export default function AnalyticsDashboard() {
  return (
    <section className="analytics-dashboard-v15">
      <EngineeringComposedChart />
      <EfficiencyGauge />
      <ProductionHeatmap />
      <SystemHealthRadar />
      <AnalysisBars />
    </section>
  );
}
