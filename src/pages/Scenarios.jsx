import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ShilPageShell from "../components/ShilPageShell.jsx";
import { getScenarioList, levelMeta } from "../data/scenarios/scenarioLibrary.js";
import { scenarioToEngineeringForm } from "../core/scenario/scenarioToEngineeringForm.js";

const domainLabels = {
  solar: "Ø³Ù†Ø§Ø±ÛŒÙˆÙ‡Ø§ÛŒ Ø¢Ù…Ø§Ø¯Ù‡ Ø§Ù†Ø±Ú˜ÛŒ Ù‡Ø§ÛŒ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ",
  emergency: "Ø³Ù†Ø§Ø±ÛŒÙˆÙ‡Ø§ÛŒ Ø¢Ù…Ø§Ø¯Ù‡ Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ",
};

const levelLabels = {
  light: "Ø³Ø¨Ú©",
  medium: "Ù…ØªÙˆØ³Ø·",
  heavy: "Ø³Ù†Ú¯ÛŒÙ†",
};

export default function Scenarios() {
  const navigate = useNavigate();
  const { domain, level } = useParams();

  const scenarios = useMemo(() => {
    if (!domain || !level) return [];
    return getScenarioList(domain, level).slice(0, 100);
  }, [domain, level]);

  const selectScenario = (scenario) => {
    const form = scenarioToEngineeringForm(scenario);
    localStorage.setItem("shil:selectedScenario", JSON.stringify(scenario));
    localStorage.setItem("shil:scenarioDomain", scenario.domain);
    localStorage.setItem("shil:scenarioLevel", scenario.levelKey);
    localStorage.setItem("shil:engineeringFormDraft", JSON.stringify(form));
    localStorage.setItem("shil:scenarioFlowActive", "true");
    navigate(`/new-project/environment/${scenario.domain}?from=scenario&scenarioId=${scenario.id}`);
  };

  if (!domain) {
    return (
      <ShilPageShell title="Ø³Ù†Ø§Ø±ÛŒÙˆÙ‡Ø§ÛŒ Ø¢Ù…Ø§Ø¯Ù‡">
        <div className="shil-scenario-hub">
          <button onClick={() => navigate("/scenarios/solar")} className="shil-big-route-card">
            Ø³Ù†Ø§Ø±ÛŒÙˆÙ‡Ø§ÛŒ Ø¢Ù…Ø§Ø¯Ù‡ Ø§Ù†Ø±Ú˜ÛŒ Ù‡Ø§ÛŒ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ
          </button>

          <button onClick={() => navigate("/scenarios/emergency")} className="shil-big-route-card">
            Ø³Ù†Ø§Ø±ÛŒÙˆÙ‡Ø§ÛŒ Ø¢Ù…Ø§Ø¯Ù‡ Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ
          </button>
        </div>
      </ShilPageShell>
    );
  }

  if (domain && !level) {
    return (
      <ShilPageShell title={domainLabels[domain] || "Ø³Ù†Ø§Ø±ÛŒÙˆÙ‡Ø§ÛŒ Ø¢Ù…Ø§Ø¯Ù‡"}>
        <div className="shil-scenario-hub">
          <button onClick={() => navigate(`/scenarios/${domain}/light`)} className="shil-big-route-card">
            Ø³Ø¨Ú©<br /><small>100 Ø³Ù†Ø§Ø±ÛŒÙˆÛŒ Ø§Ø®ØªØµØ§ØµÛŒ</small>
          </button>

          <button onClick={() => navigate(`/scenarios/${domain}/medium`)} className="shil-big-route-card">
            Ù…ØªÙˆØ³Ø·<br /><small>100 Ø³Ù†Ø§Ø±ÛŒÙˆÛŒ Ø§Ø®ØªØµØ§ØµÛŒ</small>
          </button>

          <button onClick={() => navigate(`/scenarios/${domain}/heavy`)} className="shil-big-route-card">
            Ø³Ù†Ú¯ÛŒÙ†<br /><small>100 Ø³Ù†Ø§Ø±ÛŒÙˆÛŒ Ø§Ø®ØªØµØ§ØµÛŒ</small>
          </button>
        </div>
      </ShilPageShell>
    );
  }

  return (
    <ShilPageShell title={`${domainLabels[domain]} - ${levelLabels[level] || levelMeta[level]?.fa || ""}`}>
      <div className="shil-scenario-page">
        {scenarios.map((scenario) => (
          <article key={scenario.id} className="shil-scenario-detail-card">
            <h3>{scenario.title}</h3>
            <p>{scenario.description}</p>

            <div className="shil-scenario-detail-grid">
              <span>Ù†ÙˆØ¹ Ù¾Ø±ÙˆÚ˜Ù‡</span><strong>{scenario.category}</strong>
              <span>Ø³Ø·Ø­</span><strong>{scenario.level}</strong>
              <span>ØªÙˆØ§Ù† ØªÙ‚Ø±ÛŒØ¨ÛŒ</span><strong>{scenario.loadEstimate} W</strong>
              <span>Ø§Ù†Ø±Ú˜ÛŒ Ø±ÙˆØ²Ø§Ù†Ù‡</span><strong>{scenario.dailyEnergyWh} Wh</strong>
              <span>Ù‡Ø³ØªÙ‡ Ù…Ø­Ø§Ø³Ø¨Ø§ØªÛŒ</span><strong>{scenario.calculationEngine === "solar" ? "Solar Core" : "Emergency Core"}</strong>
              <span>Ø§ÛŒÙ†ÙˆØ±ØªØ±</span><strong>{scenario.inverter}</strong>
              <span>Ù†ÙˆØ¹ Ø¨Ø§ØªØ±ÛŒ</span><strong>{scenario.batteryType}</strong>
              <span>Ø¨Ø§ØªØ±ÛŒ Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯ÛŒ</span><strong>{scenario.suggestedBattery}</strong>
              <span>ØªØ¹Ø¯Ø§Ø¯ Ù¾Ù†Ù„</span><strong>{scenario.suggestedPanels}</strong>
            </div>

            <button
              className="shil-primary-action"
              type="button"
              onClick={() => selectScenario(scenario)}
            >
              Ø§Ù†ØªØ®Ø§Ø¨ Ø³Ù†Ø§Ø±ÛŒÙˆ Ùˆ Ø§Ø¯Ø§Ù…Ù‡ Ø¨Ù‡ Ø´Ø±Ø§ÛŒØ· Ù…Ø­ÛŒØ·ÛŒ
            </button>
          </article>
        ))}
      </div>
    </ShilPageShell>
  );
}
