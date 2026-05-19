import React from "react";
import { Wifi, Cpu, BatteryCharging, Zap } from "lucide-react";
import { useTelemetryStore } from "../../industrial/telemetry/telemetryStore.js";

export default function IndustrialTelemetryPanel() {
  const { connected, inverter } = useTelemetryStore();

  return (
    <section className="industrial-panel-v15">
      <div className="widget-head-v15">
        <div>
          <span>INDUSTRIAL TELEMETRY</span>
          <h3>مانیتورینگ صنعتی تجهیزات</h3>
        </div>

        <div className={`industrial-chip-v15 ${connected ? "online" : "offline"}`}>
          <Wifi size={14} />
          {connected ? "LIVE" : "SIM"}
        </div>
      </div>

      <div className="industrial-grid-v15">
        <div>
          <Zap size={22} />
          <h4>PV Power</h4>
          <strong>{inverter.pvPower} W</strong>
        </div>

        <div>
          <BatteryCharging size={22} />
          <h4>Battery</h4>
          <strong>{inverter.batterySoc}%</strong>
        </div>

        <div>
          <Cpu size={22} />
          <h4>Load</h4>
          <strong>{inverter.loadPower} W</strong>
        </div>

        <div>
          <Wifi size={22} />
          <h4>Grid</h4>
          <strong>{inverter.gridStatus}</strong>
        </div>
      </div>
    </section>
  );
}
