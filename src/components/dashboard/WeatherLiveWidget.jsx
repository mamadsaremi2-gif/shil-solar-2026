import React from "react";

const weather = [

  {
    title: "Cloud",
    value: "12%",
  },

  {
    title: "Humidity",
    value: "34%",
  },

  {
    title: "Wind",
    value: "14 km/h",
  },

  {
    title: "UV Index",
    value: "8.2",
  },

];

export default function WeatherLiveWidget() {

  return (

    <div className="weather-widget-v15">

      <div className="widget-head-v15">

        <div>

          <span>LIVE WEATHER</span>

          <h3>وضعیت آب‌وهوا</h3>

        </div>

      </div>

      <div className="weather-grid-v15">

        {weather.map((item) => (

          <div
            key={item.title}
            className="weather-card-v15"
          >

            <h4>{item.title}</h4>

            <p>{item.value}</p>

          </div>

        ))}

      </div>

    </div>

  );
}
