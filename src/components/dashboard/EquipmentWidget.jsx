import React from "react";

const equipments = [

  {
    title: "??? JA Solar",
    qty: 24,
  },

  {
    title: "????? Lithium",
    qty: 8,
  },

  {
    title: "??????? Hybrid",
    qty: 2,
  },

  {
    title: "???? DC",
    qty: 340,
  },

];

export default function EquipmentWidget() {

  return (

    <div className="equipment-widget-v15">

      <div className="widget-head-v15">

        <div>

          <span>EQUIPMENT</span>

          <h3>??????? ?????</h3>

        </div>

      </div>

      <div className="equipment-list-v15">

        {equipments.map((item) => (

          <div
            key={item.title}
            className="equipment-item-v15"
          >

            <p>{item.title}</p>

            <strong>
              {item.qty}
            </strong>

          </div>

        ))}

      </div>

    </div>

  );
}
