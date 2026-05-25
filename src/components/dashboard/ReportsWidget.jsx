import React from "react";

const reports = [

  {
    title: "Solar Report",
    size: "2.4 MB",
  },

  {
    title: "Battery Analysis",
    size: "1.1 MB",
  },

  {
    title: "Energy Export",
    size: "860 KB",
  },

];

export default function ReportsWidget() {

  return (

    <div className="reports-widget-v15">

      <div className="widget-head-v15">

        <div>

          <span>REPORT CENTER</span>

          <h3>????????? ????????</h3>

        </div>

      </div>

      <div className="reports-list-v15">

        {reports.map((item) => (

          <div
            key={item.title}
            className="report-item-v15"
          >

            <div>

              <h4>{item.title}</h4>

              <p>{item.size}</p>

            </div>

            <button>
              OPEN
            </button>

          </div>

        ))}

      </div>

    </div>

  );
}
