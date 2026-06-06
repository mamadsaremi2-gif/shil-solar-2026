import React from "react";

const logs = [

  {
    time: "10:42",
    text: "????? ???? ???? ???? ??",
  },

  {
    time: "11:03",
    text: "????? ??? ?????? ??",
  },

  {
    time: "11:48",
    text: "?????????? ????? ????? ??",
  },

  {
    time: "12:14",
    text: "????? ???? ????? ??",
  },

];

export default function ActivityFeed() {

  return (

    <div className="activity-feed-v15">

      <div className="widget-head-v15">

        <div>

          <span>ACTIVITY</span>

          <h3>????????? ?????</h3>

        </div>

      </div>

      <div className="activity-list-v15">

        {logs.map((item, index) => (

          <div
            key={index}
            className="activity-item-v15"
          >

            <div className="activity-dot-v15" />

            <div className="activity-content-v15">

              <p>{item.text}</p>

              <span>{item.time}</span>

            </div>

          </div>

        ))}

      </div>

    </div>

  );
}
