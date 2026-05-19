import React from "react";

const realtime = [

  {
    label: "GRID",
    value: "ONLINE",
  },

  {
    label: "BATTERY",
    value: "CHARGING",
  },

  {
    label: "LOAD",
    value: "4.2 kW",
  },

  {
    label: "PV",
    value: "8.8 kW",
  },

];

export default function RealtimeMonitorWidget() {

  return (

    <div className="realtime-monitor-v15">

      <div className="widget-head-v15">

        <div>

          <span>REALTIME MONITOR</span>

          <h3>مانیتورینگ لحظه‌ای</h3>

        </div>

      </div>

      <div className="realtime-monitor-list-v15">

        {realtime.map((item) => (

          <div
            key={item.label}
            className="realtime-monitor-row-v15"
          >

            <p>
              {item.label}
            </p>

            <strong>
              {item.value}
            </strong>

          </div>

        ))}

      </div>

    </div>

  );
}
