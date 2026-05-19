import React from "react";
import { BrainCircuit, TrendingUp, ShieldAlert } from "lucide-react";
import { forecastEnergy } from "../../enterprise/ai/energyForecast.js";

export default function EnterpriseFinalPanel() {
  const forecast = forecastEnergy({});

  return (
    <section className="enterprise-final-panel-v15">
      <div className="widget-head-v15">
        <div>
          <span>ENTERPRISE READY</span>
          <h3>لایه نهایی محصول</h3>
        </div>

        <div className="enterprise-ready-chip-v15">
          READY
        </div>
      </div>

      <div className="enterprise-final-grid-v15">
        <div>
          <BrainCircuit size={24} />
          <h4>AI Forecast</h4>
          <p>{forecast[0].energy} kWh فردا</p>
        </div>

        <div>
          <TrendingUp size={24} />
          <h4>Telemetry</h4>
          <p>Vitals / Events / Logs</p>
        </div>

        <div>
          <ShieldAlert size={24} />
          <h4>Security</h4>
          <p>Sanitize / Guard / Safe Input</p>
        </div>
      </div>
    </section>
  );
}
