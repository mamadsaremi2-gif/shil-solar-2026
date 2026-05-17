import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { approveProjectStep } from "../../workflow/projectWorkflow.js";
import EngineeringPageShell from "../../components/EngineeringPageShell.jsx";

const options = [
  {
    key: "solar",
    title: "اجرای پروژه با پنل خورشیدی",
    description: "طراحی سیستم خورشیدی با پنل، باتری، اینورتر و حفاظت",
    image: "/assets/shil/execution/solar-execution.svg",
    to: "/new-project/solar/select",
  },
  {
    key: "emergency",
    title: "اجرای پروژه با برق اضطراری",
    description: "طراحی سیستم پشتیبان با اینورتر و باتری",
    image: "/assets/shil/execution/emergency-inverter-battery.svg",
    to: "/new-project/emergency",
  },
];

export default function ProjectPath() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState("");
  const [warning, setWarning] = useState("");
  const selectedOption = options.find((item) => item.key === selected);

  const confirm = () => {
    if (!selectedOption) {
      setWarning("لطفاً روش اجرای پروژه را انتخاب کنید.");
      return;
    }
    approveProjectStep("path");
    localStorage.setItem("shil:executionMethod", selectedOption.key);
    localStorage.setItem("shil:calculationDomain", selectedOption.key);
    navigate(selectedOption.to);
  };

  return (
    <EngineeringPageShell title="انتخاب مسیر پروژه">
      <section className="shil-card-stack">
        <div className="shil-section-card">
          <div className="shil-section-head">
            <h2>روش اجرای پروژه را انتخاب کنید</h2>
            <span>Project Path</span>
          </div>
          <div className="shil-execution-grid">
            {options.map((option) => (
              <button
                type="button"
                key={option.key}
                className={`shil-execution-card ${selected === option.key ? "active" : ""}`}
                onClick={() => { setSelected(option.key); setWarning(""); }}
              >
                <img src={option.image} alt="" className="shil-execution-image" />
                <span className="shil-execution-check">{selected === option.key ? "✓" : ""}</span>
                <h3>{option.title}</h3>
                <p>{option.description}</p>
              </button>
            ))}
          </div>
          {warning ? <div className="shil-inline-warning">{warning}</div> : null}
          <button type="button" className="shil-primary-wide" onClick={confirm}>تأیید مرحله</button>
        </div>
      </section>
    </EngineeringPageShell>
  );
}
