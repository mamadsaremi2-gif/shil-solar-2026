import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import EngineeringPageShell from "../../components/EngineeringPageShell.jsx";
import { approveProjectStep } from "../../workflow/projectWorkflow.js";

function readDraft(key) {
  try { return JSON.parse(localStorage.getItem(key) || "null"); }
  catch { return null; }
}

const EXECUTION_OPTIONS = [
  {
    key: "solar",
    title: "Ø§Ø¬Ø±Ø§ÛŒ Ù¾Ø±ÙˆÚ˜Ù‡ Ø¨Ø§ Ù¾Ù†Ù„ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ",
    subtitle: "Ø·Ø±Ø§Ø­ÛŒ Ø³ÛŒØ³ØªÙ… Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ Ø¨Ø§ Ù¾Ù†Ù„ØŒ Ø¨Ø§ØªØ±ÛŒØŒ Ø§ÛŒÙ†ÙˆØ±ØªØ± Ùˆ Ø­ÙØ§Ø¸Øª",
    image: "/assets/shil/execution/solar-execution.svg",
    next: "/new-project/system/solar",
    engineLabel: "Solar Engineering Core",
  },
  {
    key: "emergency",
    title: "Ø§Ø¬Ø±Ø§ÛŒ Ù¾Ø±ÙˆÚ˜Ù‡ Ø¨Ø§ Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ",
    subtitle: "Ø·Ø±Ø§Ø­ÛŒ Ø³ÛŒØ³ØªÙ… Ù¾Ø´ØªÛŒØ¨Ø§Ù† Ø¨Ø§ Ø§ÛŒÙ†ÙˆØ±ØªØ± Ùˆ Ø¨Ø§ØªØ±ÛŒ",
    image: "/assets/shil/execution/emergency-inverter-battery.svg",
    next: "/new-project/system/emergency",
    engineLabel: "Emergency Battery Inverter Core",
  },
];

export default function ExecutionMethod() {
  const navigate = useNavigate();
  const params = useParams();
  const preferredDomain = params.domain || localStorage.getItem("shil:calculationDomain") || localStorage.getItem("shil:scenarioDomain") || "solar";
  const [selected, setSelected] = useState(preferredDomain === "emergency" ? "emergency" : "solar");
  const [warning, setWarning] = useState("");

  const load = useMemo(() => readDraft("shil:loadEngineResult"), []);
  const environment = useMemo(() => readDraft("shil:environmentDraft"), []);
  const selectedOption = EXECUTION_OPTIONS.find((item) => item.key === selected);

  const confirm = () => {
    if (!selectedOption) {
      setWarning("Ù„Ø·ÙØ§Ù‹ Ø±ÙˆØ´ Ø§Ø¬Ø±Ø§ÛŒ Ù¾Ø±ÙˆÚ˜Ù‡ Ø±Ø§ Ø§Ù†ØªØ®Ø§Ø¨ Ú©Ù†ÛŒØ¯.");
      return;
    }

    approveProjectStep("execution");
    localStorage.setItem("shil:executionMethod", selectedOption.key);
    localStorage.setItem("shil:calculationDomain", selectedOption.key);
    localStorage.setItem("shil:executionMethodDraft", JSON.stringify({
      method: selectedOption.key,
      label: selectedOption.title,
      description: selectedOption.subtitle,
      engineLabel: selectedOption.engineLabel,
      source: "execution-method-gateway",
      confirmedAt: new Date().toISOString(),
    }));
    navigate(`${selectedOption.next}?from=execution-method`);
  };

  return (
    <EngineeringPageShell title="Ù†ÙˆØ¹ Ø§Ø¬Ø±Ø§ÛŒ Ù¾Ø±ÙˆÚ˜Ù‡">
      <section className="shil-card-stack shil-execution-method-page">
        <div className="shil-section-card">
          <div className="shil-section-head">
            <h2>Ø±ÙˆØ´ Ø§Ø¬Ø±Ø§ÛŒ Ù¾Ø±ÙˆÚ˜Ù‡ Ø±Ø§ Ø§Ù†ØªØ®Ø§Ø¨ Ú©Ù†ÛŒØ¯</h2>
            <span>Decision Gateway</span>
          </div>

          <div className="shil-summary-grid">
            <div><span>Ø´Ù‡Ø±</span><strong>{environment?.city || "Ø§ØµÙÙ‡Ø§Ù†"}</strong></div>
            <div><span>ØªÙˆØ§Ù† Ù…Ø±Ø¬Ø¹</span><strong>{load?.totalPowerW ? `${load.totalPowerW} W` : "Ø¯Ø± Ø§Ù†ØªØ¸Ø§Ø± Ù…Ø­Ø§Ø³Ø¨Ù‡"}</strong></div>
            <div><span>Ø§Ù†Ø±Ú˜ÛŒ Ø±ÙˆØ²Ø§Ù†Ù‡</span><strong>{load?.totalEnergyKWh ? `${load.totalEnergyKWh} kWh` : "Ø¯Ø± Ø§Ù†ØªØ¸Ø§Ø± Ù…Ø­Ø§Ø³Ø¨Ù‡"}</strong></div>
            <div><span>Ù…Ø±Ø­Ù„Ù‡ Ø¨Ø¹Ø¯</span><strong>Ø·Ø±Ø§Ø­ÛŒ Ø³ÛŒØ³ØªÙ… Ø§Ù†ØªØ®Ø§Ø¨â€ŒØ´Ø¯Ù‡</strong></div>
          </div>

          <div className="shil-execution-grid">
            {EXECUTION_OPTIONS.map((option) => {
              const active = selected === option.key;
              return (
                <button
                  type="button"
                  key={option.key}
                  className={`shil-execution-card ${active ? "active" : ""}`}
                  onClick={() => { setSelected(option.key); setWarning(""); }}
                  aria-pressed={active}
                >
                  <img src={option.image} alt="" className="shil-execution-image" />
                  <span className="shil-execution-check">{active ? "âœ“" : ""}</span>
                  <h3>{option.title}</h3>
                  <p>{option.subtitle}</p>
                  <small>{option.key === "emergency" ? "Ù†Ø§Ù… Ù†Ù…Ø§ÛŒØ´ÛŒ Ú©Ø§Ø±Ø¨Ø±: Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ Ø¨Ø§ Ø§ÛŒÙ†ÙˆØ±ØªØ± Ùˆ Ø¨Ø§ØªØ±ÛŒ" : "Ù…Ù†Ø§Ø³Ø¨ Ø¨Ø±Ø§ÛŒ Ø¢ÙÚ¯Ø±ÛŒØ¯ØŒ Ù‡ÛŒØ¨Ø±ÛŒØ¯ Ùˆ Ø¢Ù†Ú¯Ø±ÛŒØ¯"}</small>
                </button>
              );
            })}
          </div>

          {warning ? <div className="shil-inline-warning">{warning}</div> : null}

          <button type="button" className="shil-primary-wide" onClick={confirm} disabled={!selectedOption}>
            ØªØ£ÛŒÛŒØ¯ Ù…Ø±Ø­Ù„Ù‡ Ùˆ Ø§Ø¯Ø§Ù…Ù‡
          </button>
        </div>
      </section>
    </EngineeringPageShell>
  );
}
