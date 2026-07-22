import React from "react";

const cables = [

  {
    title: "PV DC Cable",
    size: "6mm²",
  },

  {
    title: "Battery Cable",
    size: "35mm²",
  },

  {
    title: "AC Output",
    size: "10mm²",
  },

  {
    title: "Ground Cable",
    size: "16mm²",
  },

];

export default function CableSizingWidget() {

  return (

    <div className="cable-widget-v15">

      <div className="widget-head-v15">

        <div>

          <span>CABLE ANALYSIS</span>

          <h3>????? ???? ???????</h3>

        </div>

      </div>

      <div className="cable-list-v15">

        {cables.map((item) => (

          <div
            key={item.title}
            className="cable-item-v15"
          >

            <div>

              <h4>{item.title}</h4>

              <p>Recommended Size</p>

            </div>

            <strong>
              {item.size}
            </strong>

          </div>

        ))}

      </div>

    </div>

  );
}
