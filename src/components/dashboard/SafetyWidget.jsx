import React from "react";

const alerts = [

  {
    title: "High Temperature",
    value: "46°C",
  },

  {
    title: "Dust Condition",
    value: "LOW",
  },

  {
    title: "Wind Load",
    value: "SAFE",
  },

  {
    title: "SPD Status",
    value: "ACTIVE",
  },

];

export default function SafetyWidget() {

  return (

    <div className="safety-widget-v15">

      <div className="widget-head-v15">

        <div>

          <span>SAFETY</span>

          <h3>وضعیت ایمنی سیستم</h3>

        </div>

      </div>

      <div className="safety-grid-v15">

        {alerts.map((item) => (

          <div
            key={item.title}
            className="safety-card-v15"
          >

            <h4>
              {item.title}
            </h4>

            <p>
              {item.value}
            </p>

          </div>

        ))}

      </div>

    </div>

  );
}
