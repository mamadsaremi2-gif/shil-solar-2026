import React from "react";

const logs = [

  {
    time: "10:42",
    text: "باتری وارد حالت شارژ شد",
  },

  {
    time: "11:03",
    text: "ولتاژ پنل پایدار شد",
  },

  {
    time: "11:48",
    text: "همگام‌سازی پروژه انجام شد",
  },

  {
    time: "12:14",
    text: "گزارش جدید تولید شد",
  },

];

export default function ActivityFeed() {

  return (

    <div className="activity-feed-v15">

      <div className="widget-head-v15">

        <div>

          <span>ACTIVITY</span>

          <h3>رویدادهای سیستم</h3>

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
