import React from "react";

import {
  AlertTriangle,
  ShieldCheck,
  Cpu,
  Zap,
} from "lucide-react";

const alerts = [

  {
    title: "??? ?????",
    value: "2.1%",
    status: "warning",
    icon: <Zap size={20} />,
  },

  {
    title: "????? ?????",
    value: "GOOD",
    status: "success",
    icon: <ShieldCheck size={20} />,
  },

  {
    title: "????? ???????",
    value: "ONLINE",
    status: "success",
    icon: <Cpu size={20} />,
  },

  {
    title: "???? ?????",
    value: "47°C",
    status: "danger",
    icon: <AlertTriangle size={20} />,
  },

];

export default function EngineeringAlertsWidget() {

  return (

    <div className="engineering-alerts-v15">

      <div className="widget-head-v15">

        <div>

          <span>ENGINE STATUS</span>

          <h3>????? ??????? ? ???????</h3>

        </div>

      </div>

      <div className="engineering-alert-list-v15">

        {alerts.map((item) => (

          <div
            key={item.title}
            className={`
              engineering-alert-item-v15
              ${item.status}
            `}
          >

            <div className="engineering-alert-icon-v15">
              {item.icon}
            </div>

            <div className="engineering-alert-content-v15">

              <h4>{item.title}</h4>

              <p>{item.value}</p>

            </div>

          </div>

        ))}

      </div>

    </div>

  );
}
