import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { approveProjectStep } from "../../workflow/projectWorkflow.js";
import EngineeringPageShell from "../../components/EngineeringPageShell.jsx";
import { readAdminDefaults, readAdminProjectPathCards } from "../../admin/adminStore.js";

const fallbackOptions = [
  {
    key: "solar",
    title: "Ø§Ø¬Ø±Ø§ÛŒ Ù¾Ø±ÙˆÚ˜Ù‡ Ø¨Ø§ Ù¾Ù†Ù„ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ",
    description: "Ø·Ø±Ø§Ø­ÛŒ Ø³ÛŒØ³ØªÙ… Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ Ø¨Ø§ Ù¾Ù†Ù„ØŒ Ø¨Ø§ØªØ±ÛŒØŒ Ø§ÛŒÙ†ÙˆØ±ØªØ± Ùˆ Ø­ÙØ§Ø¸Øª",
    image: "/assets/shil/execution/solar-execution.svg",
    calculationDomain: "solar",
  },
  {
    key: "emergency",
    title: "Ø§Ø¬Ø±Ø§ÛŒ Ù¾Ø±ÙˆÚ˜Ù‡ Ø¨Ø§ Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ",
    description: "Ø·Ø±Ø§Ø­ÛŒ Ø³ÛŒØ³ØªÙ… Ù¾Ø´ØªÛŒØ¨Ø§Ù† Ø¨Ø§ Ø§ÛŒÙ†ÙˆØ±ØªØ± Ùˆ Ø¨Ø§ØªØ±ÛŒ",
    image: "/assets/shil/execution/emergency-inverter-battery.svg",
    calculationDomain: "emergency",
  },
];

function normalizeCards(cards) {
  if (!Array.isArray(cards)) return fallbackOptions;
  const safeCards = cards
    .filter((item) => item && item.key && item.title && item.active !== false)
    .map((item) => ({
      key: String(item.key),
      title: String(item.title),
      description: String(item.description || ""),
      image: String(item.image || ""),
      calculationDomain: String(item.calculationDomain || item.key),
      order: Number(item.order || 99),
    }));

  return safeCards.length ? safeCards.sort((a, b) => a.order - b.order) : fallbackOptions;
}

export default function ProjectPath() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState("");
  const [warning, setWarning] = useState("");
  const [options, setOptions] = useState(() => normalizeCards(readAdminProjectPathCards()));

  useEffect(() => {
    let alive = true;
    const adminCards = normalizeCards(readAdminProjectPathCards());
    if (adminCards.length) {
      setOptions(adminCards);
      return () => { alive = false; };
    }

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
      setWarning("Ù„Ø·ÙØ§Ù‹ ÛŒÚ©ÛŒ Ø§Ø² Ù…Ø³ÛŒØ±Ù‡Ø§ÛŒ Ù¾Ø±ÙˆÚ˜Ù‡ Ø±Ø§ Ø§Ù†ØªØ®Ø§Ø¨ Ú©Ù†ÛŒØ¯.");
      return;
    }

    const domain = selectedOption.calculationDomain || selectedOption.key;

    approveProjectStep("path");
    localStorage.setItem("shil:projectPath", selectedOption.key);
    localStorage.setItem("shil:selectedProjectPath", JSON.stringify(selectedOption));
    localStorage.setItem("shil:executionMethod", selectedOption.key);
    localStorage.setItem("shil:calculationDomain", domain);
    localStorage.setItem("shil:scenarioDomain", domain);

    if (domain === "future") {
      navigate("/new-project/future");
      return;
    }

    if (domain === "emergency") {
      approveProjectStep("method");
      approveProjectStep("inputs");
      approveProjectStep("system");
      localStorage.setItem("shil:selectedCalculationMethod", JSON.stringify({ key: "emergency", title: "Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ" }));
      const adminDefaults = readAdminDefaults();
      localStorage.setItem("shil:emergencyPowerSettings", JSON.stringify({ requiredEmergencyHours: adminDefaults.emergencyRequiredHours || 2, safetyFactor: adminDefaults.emergencySafetyFactor || 1.25, autoMode: true }));
      navigate("/new-project/summary/emergency", { state: { method: "Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ" } });
      return;
    }

    navigate(`/new-project/method?domain=${encodeURIComponent(domain)}&from=project-path`);
  };

  return (
    <EngineeringPageShell title="Ø§Ù†ØªØ®Ø§Ø¨ Ù…Ø³ÛŒØ± Ù¾Ø±ÙˆÚ˜Ù‡">
      <section className="shil-card-stack">
        <div className="shil-section-card">
          <div className="shil-section-head">
            <h2>Ù…Ø³ÛŒØ± Ù¾Ø±ÙˆÚ˜Ù‡ Ø±Ø§ Ø§Ù†ØªØ®Ø§Ø¨ Ú©Ù†ÛŒØ¯</h2>
            <span>Project Path</span>
          </div>

          <p className="shil-section-note">
            Ø¨Ø¹Ø¯ Ø§Ø² ØªØ£ÛŒÛŒØ¯ Ù…Ø³ÛŒØ± Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ ÙˆØ§Ø±Ø¯ Ø±ÙˆØ´ Ù…Ø­Ø§Ø³Ø¨Ø§Øª Ù…ÛŒâ€ŒØ´ÙˆÛŒØ¯Ø› Ù…Ø³ÛŒØ± Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ Ù…Ø³ØªÙ‚ÛŒÙ… Ø¨Ù‡ Ú†Ú©ÛŒØ¯Ù‡ Ø§Ø·Ù„Ø§Ø¹Ø§Øª Ù…ÛŒâ€ŒØ±ÙˆØ¯.
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
                <span className="shil-execution-check">{selected === option.key ? "âœ“" : ""}</span>
                <h3>{option.title}</h3>
                <p>{option.description}</p>
              </button>
            ))}
          </div>

          {warning ? <div className="shil-inline-warning">{warning}</div> : null}
          <button type="button" className="shil-primary-wide" onClick={confirm}>ØªØ£ÛŒÛŒØ¯ Ù…Ø³ÛŒØ± Ù¾Ø±ÙˆÚ˜Ù‡</button>
        </div>
      </section>
    </EngineeringPageShell>
  );
}
