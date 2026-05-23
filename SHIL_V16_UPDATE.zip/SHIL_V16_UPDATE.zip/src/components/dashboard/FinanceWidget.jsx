import React from "react";

const finance = [

  {
    title: "Daily Saving",
    value: "$24",
  },

  {
    title: "Monthly Saving",
    value: "$712",
  },

  {
    title: "Yearly ROI",
    value: "28%",
  },

  {
    title: "Payback",
    value: "3.1y",
  },

];

export default function FinanceWidget() {

  return (

    <div className="finance-widget-v15">

      <div className="widget-head-v15">

        <div>

          <span>FINANCIAL</span>

          <h3>تحلیل اقتصادی</h3>

        </div>

      </div>

      <div className="finance-grid-v15">

        {finance.map((item) => (

          <div
            key={item.title}
            className="finance-card-v15"
          >

            <h4>{item.title}</h4>

            <p>{item.value}</p>

          </div>

        ))}

      </div>

    </div>

  );
}
