import React from "react";

const stats = [

  {
    title: "توان سیستم",
    value: "12.5 kW",
  },

  {
    title: "تعداد پنل",
    value: "24",
  },

  {
    title: "ولتاژ DC",
    value: "480V",
  },

  {
    title: "زمان بکاپ",
    value: "8h",
  },

];

export default function EngineeringStatsWidget() {

  return (

    <div className="engineering-stats-v15">

      <div className="widget-head-v15">

        <div>

          <span>ENGINEERING DATA</span>

          <h3>مشخصات فنی سیستم</h3>

        </div>

      </div>

      <div className="engineering-stats-grid-v15">

        {stats.map((item) => (

          <div
            key={item.title}
            className="engineering-stat-box-v15"
          >

            <h4>{item.title}</h4>

            <p>{item.value}</p>

          </div>

        ))}

      </div>

    </div>

  );
}
