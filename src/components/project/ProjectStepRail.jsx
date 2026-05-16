import React from "react";
import { Link, useLocation } from "react-router-dom";

const steps = [
  { id: 1, title: "اطلاعات", path: "/new-project/info" },
  { id: 2, title: "محیط", path: "/new-project/environment" },
  { id: 3, title: "مسیر", path: "/new-project/path" },
  { id: 4, title: "روش", path: "/new-project/method" },
  { id: 5, title: "ورودی", path: "/new-project/inputs" },
  { id: 6, title: "سیستم", path: "/new-project/system" },
  { id: 7, title: "چکیده", path: "/new-project/summary" },
  { id: 8, title: "اجرا", path: "/new-project/run" },
];

export default function ProjectStepRail() {
  const location = useLocation();

  return (
    <div className="project-step-rail-v15">
      {steps.map((step) => {
        const active = location.pathname === step.path;

        return (
          <Link
            key={step.id}
            to={step.path}
            className={`project-step-pill-v15 ${active ? "active" : ""}`}
          >
            <span>{step.id}</span>
            <p>{step.title}</p>
          </Link>
        );
      })}
    </div>
  );
}
