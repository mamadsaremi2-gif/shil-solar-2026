import React from "react";

import {
  Activity,
  BatteryCharging,
  Zap,
  Wifi,
} from "lucide-react";

import {
  useRealtimeStore,
} from "../../realtime/streams/realtimeStore.js";

export default function LiveRealtimePanel() {

  const {

    connected,
    pvPower,
    batterySOC,
    loadPower,
    grid,

  } = useRealtimeStore();

  return (

    <section className="live-realtime-panel-v15">

      <div className="widget-head-v15">

        <div>

          <span>REALTIME CORE</span>

          <h3>هسته لحظه‌ای سیستم</h3>

        </div>

        <div className={`
          realtime-chip-v15
          ${connected ? "online" : "offline"}
        `}>

          <Wifi size={14} />

          {connected
            ? "CONNECTED"
            : "SIMULATION"}

        </div>

      </div>

      <div className="live-realtime-grid-v15">

        <div className="live-realtime-card-v15">

          <Zap size={22} />

          <h4>PV POWER</h4>

          <strong>
            {pvPower} W
          </strong>

        </div>

        <div className="live-realtime-card-v15">

          <BatteryCharging size={22} />

          <h4>BATTERY</h4>

          <strong>
            {batterySOC}%
          </strong>

        </div>

        <div className="live-realtime-card-v15">

          <Activity size={22} />

          <h4>LOAD</h4>

          <strong>
            {loadPower} W
          </strong>

        </div>

        <div className="live-realtime-card-v15">

          <Wifi size={22} />

          <h4>GRID</h4>

          <strong>
            {grid}
          </strong>

        </div>

      </div>

    </section>

  );
}
