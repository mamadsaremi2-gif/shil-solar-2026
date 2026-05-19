import React from "react";

export default function EngineeringStatusPanel({
  title = "وضعیت مهندسی",
  items = [],
}) {
  return (
    <section className="engineering-status-panel-v15">
      <div className="widget-head-v15">
        <div>
          <span>ENGINE STATUS</span>
          <h3>{title}</h3>
        </div>
      </div>

      <div className="engineering-status-list-v15">
        {items.map((item) => (
          <div className="engineering-status-row-v15" key={item.label}>
            <p>{item.label}</p>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
