import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { approveProjectStep } from "../../workflow/projectWorkflow.js";
import EngineeringPageShell from "../../components/EngineeringPageShell.jsx";

const fallbackOptions = [
  {
    key: "solar",
    title: "اجرای پروژه با پنل خورشیدی",
    description: "طراحی سیستم خورشیدی با پنل، باتری، اینورتر و حفاظت",
    image: "/assets/shil/execution/solar-execution.svg",
    calculationDomain: "solar",
  },
  {
    key: "emergency",
    title: "اجرای پروژه با برق اضطراری",
    description: "طراحی سیستم پشتیبان با اینورتر و باتری",
    image: "/assets/shil/execution/emergency-inverter-battery.svg",
    calculationDomain: "emergency",
  },
];

function normalizeCards(cards) {
  if (!Array.isArray(cards)) return fallbackOptions;
  const safeCards = cards
    .filter((item) => item && item.key && item.title)
    .slice(0, 2)
    .map((item) => ({
      key: String(item.key),
      title: String(item.title),
      description: String(item.description || ""),
      image: String(item.image || ""),
      calculationDomain: String(item.calculationDomain || item.key),
    }));

  return safeCards.length ? safeCards : fallbackOptions;
}

export default function ProjectPath() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState("");
  const [warning, setWarning] = useState("");
  const [options, setOptions] = useState(fallbackOptions);

  useEffect(() => {
    let alive = true;
    fetch(`/project-path-cards.json?v=${Date.now()}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : fallbackOptions))
      .then((cards) => {
        if (alive) setOptions(normalizeCards(cards));
      })
      .catch(() => {
        if (alive) setOptions(fallbackOptions);
      });

    return () => { alive = false; };
  }, []);

  const selectedOption = useMemo(
    () => options.find((item) => item.key === selected),
    [options, selected]
  );

  const confirm = () => {
    if (!selectedOption) {
      setWarning("لطفاً یکی از دو مسیر پروژه را انتخاب کنید.");
      return;
    }

    const domain = selectedOption.calculationDomain || selectedOption.key;

    approveProjectStep("path");
    localStorage.setItem("shil:projectPath", selectedOption.key);
    localStorage.setItem("shil:selectedProjectPath", JSON.stringify(selectedOption));
    localStorage.setItem("shil:executionMethod", selectedOption.key);
    localStorage.setItem("shil:calculationDomain", domain);
    localStorage.setItem("shil:scenarioDomain", domain);

    if (domain === "emergency") {
      approveProjectStep("method");
      approveProjectStep("inputs");
      localStorage.setItem("shil:selectedCalculationMethod", JSON.stringify({ key: "emergency", title: "برق اضطراری" }));
      navigate("/new-project/summary/emergency", { state: { method: "برق اضطراری" } });
      return;
    }

    navigate(`/new-project/method?domain=${encodeURIComponent(domain)}&from=project-path`);
  };

  return (
    <EngineeringPageShell title="انتخاب مسیر پروژه">
      <section className="shil-card-stack">
        <div className="shil-section-card">
          <div className="shil-section-head">
            <h2>مسیر پروژه را انتخاب کنید</h2>
            <span>Project Path</span>
          </div>

          <p className="shil-section-note">
            بعد از تأیید مسیر خورشیدی وارد روش محاسبات می‌شوید؛ مسیر برق اضطراری مستقیم به چکیده اطلاعات می‌رود.
          </p>

          <div className="shil-execution-grid shil-project-path-two-cards">
            {options.map((option) => (
              <button
                type="button"
                key={option.key}
                className={`shil-execution-card ${selected === option.key ? "active" : ""}`}
                onClick={() => { setSelected(option.key); setWarning(""); }}
              >
                {option.image ? <img src={option.image} alt="" className="shil-execution-image" /> : null}
                <span className="shil-execution-check">{selected === option.key ? "✓" : ""}</span>
                <h3>{option.title}</h3>
                <p>{option.description}</p>
              </button>
            ))}
          </div>

          {warning ? <div className="shil-inline-warning">{warning}</div> : null}
          <button type="button" className="shil-primary-wide" onClick={confirm}>تأیید مسیر پروژه</button>
        </div>
      </section>
    </EngineeringPageShell>
  );
}
