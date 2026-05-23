import React from "react";

const rows = [

  {
    title: "PV Array",
    status: "ONLINE",
  },

  {
    title: "Hybrid Inverter",
    status: "RUNNING",
  },

  {
    title: "Battery Bank",
    status: "CHARGING",
  },

  {
    title: "Monitoring",
    status: "SYNCED",
  },

];

export default function LiveSystemTable() {

  return (

    <div className="live-system-table-v15">

      <div className="widget-head-v15">

        <div>

          <span>LIVE SYSTEM</span>

          <h3>وضعیت لحظه‌ای سیستم</h3>

        </div>

      </div>

      <div className="live-system-list-v15">

        {rows.map((item) => (

          <div
            key={item.title}
            className="live-system-row-v15"
          >

            <p>{item.title}</p>

            <strong>
              {item.status}
            </strong>

          </div>

        ))}

      </div>

    </div>

  );
}
