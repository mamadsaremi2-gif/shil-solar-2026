import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import ShilPageShell from "../components/ShilPageShell.jsx";
import { getScenarioList, levelMeta } from "../data/scenarios/scenarioLibrary.js";
import { scenarioToEngineeringForm } from "../core/scenario/scenarioToEngineeringForm.js";
import { startScenarioFlow } from "../workflow/flowIsolation.js";

const domainLabels = {
  solar: "سناریوهای آماده انرژی های خورشیدی",
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

  const [query, setQuery] = React.useState("");

  const scenarios = React.useMemo(() => {
    if (!domain || !level) return [];
    const q = query.trim().toLowerCase();
    const list = getScenarioList(domain, level).slice(0, 100);
    if (!q) return list;
    return list.filter((scenario) => {
      const searchable = [
        scenario.title,
        scenario.description,
        scenario.category,
        scenario.level,
        scenario.city,
        scenario.province,
        scenario.inverter,
        scenario.batteryType,
        scenario.suggestedBattery,
        scenario.suggestedPanels,
        scenario.loadEstimate,
        scenario.dailyEnergyWh,
        ...(scenario.requiredEquipment?.recommendedItems || []),
      ].filter(Boolean).join(" ").toLowerCase();
      return searchable.includes(q);
    });
  }, [domain, level, query]);

  const selectScenario = (scenario) => {
    const form = scenarioToEngineeringForm(scenario);
    startScenarioFlow(scenario);
    localStorage.setItem("shil:engineeringFormDraft", JSON.stringify(form));
    navigate(`/new-project/environment/${scenario.domain}?from=scenario&scenarioId=${scenario.id}`);
  };

  if (!domain) {
    return (
      <ShilPageShell title="سناریوهای آماده">
        <div className="shil-scenario-hub">
          <button onClick={() => navigate("/scenarios/solar")} className="shil-big-route-card">
            سناریوهای آماده انرژی های خورشیدی
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
            سبک<br /><small>100 سناریوی اختصاصی</small>
          </button>

          <button onClick={() => navigate(`/scenarios/${domain}/medium`)} className="shil-big-route-card">
            متوسط<br /><small>100 سناریوی اختصاصی</small>
          </button>

          <button onClick={() => navigate(`/scenarios/${domain}/heavy`)} className="shil-big-route-card">
            سنگین<br /><small>100 سناریوی اختصاصی</small>
          </button>
        </div>
      </ShilPageShell>
    );
  }

  return (
    <ShilPageShell title={`${domainLabels[domain]} - ${levelLabels[level] || levelMeta[level]?.fa || ""}`}>
      <div className="shil-scenario-search-card" dir="auto">
        <label htmlFor="scenario-search">جستجوی سناریو</label>
        <input
          id="scenario-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="جستجو بر اساس شهر، توان، جریان، تجهیزات، باتری، اینورتر..."
          dir="auto"
        />
        <small>{scenarios.length} سناریو مطابق جستجو آماده انتخاب است. بعد از انتخاب، مسیر به شرایط محیطی و سپس لیست تجهیزات همان شاخه متصل می‌شود.</small>
      </div>
      <div className="shil-scenario-page">
        {scenarios.map((scenario) => (
          <article key={scenario.id} className="shil-scenario-detail-card">
            <h3>{scenario.title}</h3>
            <p>{scenario.description}</p>

            <div className="shil-scenario-detail-grid">
              <span>نوع پروژه</span><strong>{scenario.category}</strong>
              <span>سطح</span><strong>{scenario.level}</strong>
              <span>توان تقریبی</span><strong>{scenario.loadEstimate} W</strong>
              <span>انرژی روزانه</span><strong>{scenario.dailyEnergyWh} Wh</strong>
              <span>هسته محاسباتی</span><strong>{scenario.calculationEngine === "solar" ? "Solar Core" : "Emergency Core"}</strong>
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
              انتخاب سناریو و ادامه به شرایط محیطی
            </button>
          </article>
        ))}
      </div>
    </ShilPageShell>
  );
}
