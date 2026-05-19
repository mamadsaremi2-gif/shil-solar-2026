import React from "react";

const mppt = [

  {
    title: "MPPT 1",
    voltage: "480V",
    current: "18A",
    status: "ACTIVE",
  },

  {
    title: "MPPT 2",
    voltage: "472V",
    current: "17A",
    status: "ACTIVE",
  },

  {
    title: "MPPT 3",
    voltage: "0V",
    current: "0A",
    status: "STANDBY",
  },

];

export default function MPPTStatusWidget() {

  return (

    <div className="mppt-widget-v15">

      <div className="widget-head-v15">

        <div>

          <span>MPPT STATUS</span>

          <h3>وضعیت ورودی‌های MPPT</h3>

        </div>

      </div>

      <div className="mppt-list-v15">

        {mppt.map((item) => (

          <div
            key={item.title}
            className="mppt-item-v15"
          >

            <div>

              <h4>{item.title}</h4>

              <p>
                {item.voltage} / {item.current}
              </p>

            </div>

            <strong>
              {item.status}
            </strong>

          </div>

        ))}

      </div>

    </div>

  );
}
