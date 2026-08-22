import React from "react";

const strings = [

  {
    title: "STRING 1",
    value: "12 Panels",
    status: "OK",
  },

  {
    title: "STRING 2",
    value: "12 Panels",
    status: "OK",
  },

  {
    title: "VOC CHECK",
    value: "478V",
    status: "PASS",
  },

  {
    title: "CURRENT",
    value: "18A",
    status: "SAFE",
  },

];

export default function PVStringWidget() {

  return (

    <div className="pv-string-widget-v15">

      <div className="widget-head-v15">

        <div>

          <span>PV STRING</span>

          <h3>????? ??????? ??????</h3>

        </div>

      </div>

      <div className="pv-string-grid-v15">

        {strings.map((item) => (

          <div
            key={item.title}
            className="pv-string-card-v15"
          >

            <h4>
              {item.title}
            </h4>

            <p>
              {item.value}
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
