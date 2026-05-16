import ShilPageShell from "../components/ShilPageShell.jsx";
import { getScenarioList } from "../data/scenarios/scenarioLibrary.js";

const getDomainFromPath = () => {
  const path = window.location.pathname.toLowerCase();
  if (path.includes("emergency")) return "emergency";
  if (path.includes("solar")) return "solar";
  return "";
};

const getLevelFromPath = () => {
  const path = window.location.pathname.toLowerCase();
  if (path.includes("light")) return "سبک";
  if (path.includes("medium")) return "متوسط";
  if (path.includes("heavy")) return "سنگین";
  return "";
};

export default function Scenarios() {
  const domain = getDomainFromPath();
  const level = getLevelFromPath();
  const scenarios = getScenarioList(domain, level);

  return (
    <ShilPageShell title={level ? `سناریوهای آماده ${level}` : "سناریوهای آماده"}>
      <div className="shil-scenario-page">
        {scenarios.map((scenario) => (
          <article key={scenario.id} className="shil-scenario-detail-card">
            <h3>{scenario.title}</h3>

            <div className="shil-scenario-detail-grid">
              <span>دسته</span><strong>{scenario.category}</strong>
              <span>نوع سیستم</span><strong>{scenario.systemType || scenario.domain}</strong>
              <span>توان تقریبی</span><strong>{scenario.loadEstimate} W</strong>
              <span>اینورتر</span><strong>{scenario.inverter}</strong>
              <span>باتری</span><strong>{scenario.suggestedBattery}</strong>
              <span>پنل پیشنهادی</span><strong>{scenario.suggestedPanels}</strong>
            </div>

            <button className="shil-primary-action" type="button">
              استفاده از این سناریو
            </button>
          </article>
        ))}
      </div>
    </ShilPageShell>
  );
}
