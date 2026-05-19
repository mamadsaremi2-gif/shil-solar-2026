import React from "react";

const equipments = [

  {
    title: "پنل JA Solar",
    qty: 24,
  },

  {
    title: "باتری Lithium",
    qty: 8,
  },

  {
    title: "اینورتر Hybrid",
    qty: 2,
  },

  {
    title: "کابل DC",
    qty: 340,
  },

];

export default function EquipmentWidget() {

  return (

    <div className="equipment-widget-v15">

      <div className="widget-head-v15">

        <div>

          <span>EQUIPMENT</span>

          <h3>تجهیزات پروژه</h3>

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
