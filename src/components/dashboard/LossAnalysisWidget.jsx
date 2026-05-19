import React from "react";

const losses = [

  {
    title: "PV Loss",
    value: "3.4%",
  },

  {
    title: "Cable Loss",
    value: "1.8%",
  },

  {
    title: "Inverter Loss",
    value: "2.6%",
  },

  {
    title: "Battery Loss",
    value: "4.1%",
  },

];

export default function LossAnalysisWidget() {

  return (

    <div className="loss-widget-v15">

      <div className="widget-head-v15">

        <div>

          <span>LOSS ANALYSIS</span>

          <h3>تحلیل تلفات سیستم</h3>

        </div>

      </div>

      <div className="loss-grid-v15">

        {losses.map((item) => (

          <div
            key={item.title}
            className="loss-card-v15"
          >

            <h4>{item.title}</h4>

            <p>{item.value}</p>

          </div>

        ))}

      </div>

    </div>

  );
}
