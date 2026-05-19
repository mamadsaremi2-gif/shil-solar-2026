import React from "react";

const logs = [

  {
    title: "PV String Validation",
    status: "PASS",
  },

  {
    title: "Battery Autonomy",
    status: "READY",
  },

  {
    title: "Inverter Matching",
    status: "PASS",
  },

  {
    title: "Cable Voltage Drop",
    status: "1.8%",
  },

];

export default function EngineeringLogWidget() {

  return (

    <div className="engineering-log-widget-v15">

      <div className="widget-head-v15">

        <div>

          <span>ENGINE LOG</span>

          <h3>لاگ مهندسی سیستم</h3>

        </div>

      </div>

      <div className="engineering-log-list-v15">

        {logs.map((item) => (

          <div
            key={item.title}
            className="engineering-log-row-v15"
          >

            <p>
              {item.title}
            </p>

            <strong>
              {item.status}
            </strong>

          </div>

        ))}

      </div>

    </div>

  );
}
