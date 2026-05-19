import React from "react";

const weather = [
  {
    title: "تابش",
    value: "5.8 kWh/m²",
  },

  {
    title: "دمای محیط",
    value: "31°C",
  },

  {
    title: "سرعت باد",
    value: "12 km/h",
  },

  {
    title: "راندمان پنل",
    value: "88%",
  },
];

export default function EnvironmentWidget() {

  return (

    <div className="environment-widget-v15">

      <div className="widget-head-v15">

        <div>

          <span>ENVIRONMENT</span>

          <h3>شرایط محیطی پروژه</h3>

        </div>

      </div>

      <div className="environment-grid-v15">

        {weather.map((item) => (

          <div
            key={item.title}
            className="environment-card-v15"
          >

            <h4>{item.title}</h4>

            <p>{item.value}</p>

          </div>

        ))}

      </div>

    </div>

  );
}
