import React from "react";

import {
  Cpu,
  BatteryCharging,
  Sun,
  Wifi,
} from "lucide-react";

const systems = [
  {
    title: "??? ???????",
    value: "ACTIVE",
    icon: <Sun size={20} />,
  },

  {
    title: "?????",
    value: "92%",
    icon: <BatteryCharging size={20} />,
  },

  {
    title: "???????",
    value: "RUNNING",
    icon: <Cpu size={20} />,
  },

  {
    title: "?????",
    value: "ONLINE",
    icon: <Wifi size={20} />,
  },
];

export default function SystemStatusGrid() {

  return (

    <div className="system-grid-v15">

      {systems.map((item) => (

        <div
          key={item.title}
          className="system-card-v15"
        >

          <div className="system-icon-v15">
            {item.icon}
          </div>

          <h4>{item.title}</h4>

          <p>{item.value}</p>

        </div>

      ))}

    </div>

  );
}
