import React from "react";
import { Link, useLocation } from "react-router-dom";

const steps = [
  { id: 1, title: "???????", path: "/new-project/info" },
  { id: 2, title: "????", path: "/new-project/environment" },
  { id: 3, title: "????", path: "/new-project/path" },
  { id: 4, title: "???", path: "/new-project/method" },
  { id: 5, title: "?????", path: "/new-project/inputs" },
  { id: 6, title: "?????", path: "/new-project/system" },
  { id: 7, title: "?????", path: "/new-project/summary" },
  { id: 8, title: "????", path: "/new-project/run" },
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
