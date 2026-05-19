import React from "react";

export default function StepProgress({ current = 1 }) {
  const steps = [
    "اطلاعات",
    "محیط",
    "مسیر",
    "روش",
    "ورودی",
    "سیستم",
    "چکیده",
    "اجرا",
  ];

  return (
    <div className="step-progress-v15">
      {steps.map((step, index) => {
        const active = current === index + 1;
        const completed = current > index + 1;

        return (
          <div className="step-progress-item-v15" key={step}>
            <div
              className={`step-progress-dot-v15 ${active ? "active" : ""} ${
                completed ? "completed" : ""
              }`}
            >
              {index + 1}
            </div>
            <span>{step}</span>
          </div>
        );
      })}
    </div>
  );
}
