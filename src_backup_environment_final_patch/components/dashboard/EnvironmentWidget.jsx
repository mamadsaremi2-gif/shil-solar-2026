import React from "react";

const weather = [
  {
    title: "????",
    value: "5.8 kWh/m²",
  },

  {
    title: "???? ????",
    value: "31°C",
  },

  {
    title: "???? ???",
    value: "12 km/h",
  },

  {
    title: "??????? ???",
    value: "88%",
  },
];

export default function EnvironmentWidget() {

  return (

    <div className="environment-widget-v15">

      <div className="widget-head-v15">

        <div>

          <span>ENVIRONMENT</span>

          <h3>????? ????? ?????</h3>

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
