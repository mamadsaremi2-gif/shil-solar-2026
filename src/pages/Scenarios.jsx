import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ShilPageShell from "../components/ShilPageShell.jsx";
import { getScenarioList } from "../data/scenarios/scenarioLibrary.js";

const domainLabels = {
  solar: "سناریوهای آماده پروژه‌های خورشیدی",
  emergency: "سناریوهای آماده برق اضطراری",
};

const levelLabels = {
  light: "سبک",
  medium: "متوسط",
  heavy: "سنگین",
};

export default function Scenarios() {
  const navigate = useNavigate();
  const { domain, level } = useParams();

  const scenarios = useMemo(() => {
    if (!domain || !level) return [];
    return getScenarioList(domain, levelLabels[level]).slice(0, 100);
  }, [domain, level]);

  const selectScenario = (scenario) => {
    localStorage.setItem("shil:selectedScenario", JSON.stringify(scenario));
    localStorage.setItem("shil:scenarioDomain", domain);

    if (domain === "solar") {
      navigate("/new-project/environment?from=scenario");
    } else {
      navigate("/new-project/inputs?from=scenario&domain=emergency");
    }
  };

  if (!domain) {
    return (
      <ShilPageShell title="سناریوهای آماده">
        <div className="shil-scenario-hub">
          <button onClick={() => navigate("/scenarios/solar")} className="shil-big-route-card">
            سناریوهای آماده پروژه‌های خورشیدی
          </button>

          <button onClick={() => navigate("/scenarios/emergency")} className="shil-big-route-card">
            سناریوهای آماده برق اضطراری
          </button>
        </div>
      </ShilPageShell>
    );
  }

  if (domain && !level) {
    return (
      <ShilPageShell title={domainLabels[domain] || "سناریوهای آماده"}>
        <div className="shil-scenario-hub">
          <button onClick={() => navigate(`/scenarios/${domain}/light`)} className="shil-big-route-card">
            سبک
          </button>

          <button onClick={() => navigate(`/scenarios/${domain}/medium`)} className="shil-big-route-card">
            متوسط
          </button>

          <button onClick={() => navigate(`/scenarios/${domain}/heavy`)} className="shil-big-route-card">
            سنگین
          </button>
        </div>
      </ShilPageShell>
    );
  }

  return (
    <ShilPageShell title={`${domainLabels[domain]} - ${levelLabels[level]}`}>
      <div className="shil-scenario-page">
        {scenarios.map((scenario) => (
          <article key={scenario.id} className="shil-scenario-detail-card">
            <h3>{scenario.title}</h3>

            <div className="shil-scenario-detail-grid">
              <span>نوع پروژه</span><strong>{scenario.category}</strong>
              <span>سطح</span><strong>{scenario.level}</strong>
              <span>توان تقریبی</span><strong>{scenario.loadEstimate} W</strong>
              <span>اینورتر</span><strong>{scenario.inverter}</strong>
              <span>نوع باتری</span><strong>{scenario.batteryType}</strong>
              <span>باتری پیشنهادی</span><strong>{scenario.suggestedBattery}</strong>
              <span>تعداد پنل</span><strong>{scenario.suggestedPanels}</strong>
            </div>

            <button
              className="shil-primary-action"
              type="button"
              onClick={() => selectScenario(scenario)}
            >
              انتخاب سناریو و ادامه
            </button>
          </article>
        ))}
      </div>
    </ShilPageShell>
  );
}
