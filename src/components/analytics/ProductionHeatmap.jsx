import React from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";

const values = Array.from({ length: 120 }).map((_, index) => {
  const date = new Date();
  date.setDate(date.getDate() - index);

  return {
    date: date.toISOString().slice(0, 10),
    count: Math.floor(Math.random() * 5),
  };
});

export default function ProductionHeatmap() {
  return (
    <div className="analytics-card-v15">
      <div className="widget-head-v15">
        <div>
          <span>PRODUCTION HEATMAP</span>
          <h3>نقشه حرارتی تولید انرژی</h3>
        </div>
      </div>

      <div className="heatmap-wrap-v15">
        <CalendarHeatmap
          startDate={new Date(new Date().setDate(new Date().getDate() - 120))}
          endDate={new Date()}
          values={values}
          classForValue={(value) => {
            if (!value) return "color-empty";
            return `color-scale-${value.count}`;
          }}
        />
      </div>
    </div>
  );
}
