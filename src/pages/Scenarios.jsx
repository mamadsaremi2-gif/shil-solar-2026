import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ShilPageShell from "../components/ShilPageShell.jsx";
import { getScenarioList, levelMeta } from "../data/scenarios/scenarioLibrary.js";
import { scenarioToEngineeringForm } from "../core/scenario/scenarioToEngineeringForm.js";
import { startScenarioFlow } from "../workflow/flowIsolation.js";
import { loadAdminReadyScenarios } from "../data/scenarios/adminReadyScenarioLibrary.js";
import {
  formatCurrent,
  formatEnergy,
  formatPower,
  formatPowerTitle,
  parseScenarioSearchIntent,
  scenarioMatchesEmergencyFilters,
  scenarioMatchesQuery,
} from "../data/scenarios/scenarioPresentation.js";
import { safeLocalSetItem } from "../services/storageQuotaGuard.js";

const domainLabels = {
  solar: "سناریوهای آماده انرژی های خورشیدی",
  emergency: "سناریوهای آماده برق اضطراری",
};

const levelLabels = {
  light: "سبک",
  medium: "متوسط",
  heavy: "سنگین",
};

function searchHint(query) {
  const intent = parseScenarioSearchIntent(query);
  if (intent.type === "power") return `بازه توان: ${Math.round(intent.min).toLocaleString("en-US")} تا ${Math.floor(intent.max).toLocaleString("en-US")} W`;
  if (intent.type === "energy") return `بازه انرژی: ${Math.round(intent.min).toLocaleString("en-US")} تا ${Math.floor(intent.max).toLocaleString("en-US")} WH`;
  return "اولویت جستجو: توان تقریبی، انرژی روزانه، سپس شهر و مشخصات سناریو";
}

export default function Scenarios() {
  const navigate = useNavigate();
  const { domain, level } = useParams();

  const [query, setQuery] = useState("");
  const [emergencySearch, setEmergencySearch] = useState({ power: "", current: "", backup: "" });
  const [adminScenarios, setAdminScenarios] = useState([]);

  useEffect(() => {
    let active = true;
    loadAdminReadyScenarios().then((items) => { if (active) setAdminScenarios(Array.isArray(items) ? items : []); });
    return () => { active = false; };
  }, []);

  const allScenarios = useMemo(() => {
    if (!domain || !level) return [];
    const curated = adminScenarios.filter((item) => item.domain === domain && (item.levelKey === level || item.level === level));
    const generated = getScenarioList(domain, level);
    return [...curated, ...generated.filter((item) => !curated.some((curatedItem) => curatedItem.id === item.id))];
  }, [domain, level, adminScenarios]);

  const domainScenarios = useMemo(() => {
    if (!domain) return [];

    const levels = ["light", "medium", "heavy"];
    const merged = [];
    const seen = new Set();

    for (const levelKey of levels) {
      const curated = adminScenarios.filter(
        (item) => item.domain === domain && (item.levelKey === levelKey || item.level === levelKey),
      );
      const generated = getScenarioList(domain, levelKey);

      for (const item of [...curated, ...generated]) {
        const key = String(item?.id || `${levelKey}-${merged.length}`);
        if (seen.has(key)) continue;
        seen.add(key);
        merged.push({ ...item, levelKey: item.levelKey || levelKey });
      }
    }

    return merged;
  }, [domain, adminScenarios]);

  const hasEmergencySearch = Boolean(
    emergencySearch.power.trim() || emergencySearch.current.trim() || emergencySearch.backup.trim(),
  );

  const scenarios = useMemo(() => {
    if (domain === "emergency") {
      if (!hasEmergencySearch) return allScenarios;
      return allScenarios.filter((scenario) => scenarioMatchesEmergencyFilters(scenario, emergencySearch));
    }
    const q = query.trim();
    if (!q) return allScenarios;
    return allScenarios.filter((scenario) => scenarioMatchesQuery(scenario, q));
  }, [allScenarios, query, domain, emergencySearch, hasEmergencySearch]);

  const domainSearchResults = useMemo(() => {
    if (domain === "emergency") {
      if (!hasEmergencySearch) return [];
      return domainScenarios.filter((scenario) => scenarioMatchesEmergencyFilters(scenario, emergencySearch));
    }
    const q = query.trim();
    if (!q) return [];
    return domainScenarios.filter((scenario) => scenarioMatchesQuery(scenario, q));
  }, [domainScenarios, query, domain, emergencySearch, hasEmergencySearch]);

  const selectScenario = (scenario) => {
    const form = scenarioToEngineeringForm(scenario);
    startScenarioFlow(scenario);
    safeLocalSetItem("shil:engineeringFormDraft", JSON.stringify(form));
    navigate(`/new-project/environment/${scenario.domain}?from=scenario&scenarioId=${scenario.id}`);
  };

  if (!domain) {
    return (
      <ShilPageShell title="سناریوهای آماده" className="shil-scenarios-shell shil-scenarios-shell--hub">
        <div id="shil-scenarios-root" className="shil-scenario-hub shil-scenario-hub--domains">
          <button onClick={() => navigate("/scenarios/solar")} className="shil-big-route-card">سناریوهای آماده انرژی های خورشیدی</button>
          <button onClick={() => navigate("/scenarios/emergency")} className="shil-big-route-card">سناریوهای آماده برق اضطراری</button>
        </div>
      </ShilPageShell>
    );
  }

  if (domain && !level) {
    const hasDomainQuery = domain === "emergency" ? hasEmergencySearch : Boolean(query.trim());

    return (
      <ShilPageShell title={domain === "solar" ? "خورشیدی" : (domainLabels[domain] || "سناریوهای آماده")} className="shil-scenarios-shell shil-scenarios-shell--levels">
        <div id="shil-scenarios-root" className="shil-scenario-list-root shil-scenario-domain-search-root" dir="rtl">
          {domain === "solar" ? (
            <div className="shil-scenario-search-card" dir="auto">
              <label htmlFor="scenario-domain-search">جستجوی همه سناریوهای خورشیدی</label>
              <input
                id="scenario-domain-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="مثال: 3KW، سه کیلو وات، 3000 W، 10 KWH، تهران..."
                dir="auto"
              />
              <small>
                {hasDomainQuery
                  ? `${domainSearchResults.length} سناریو از مجموع سبک، متوسط و سنگین پیدا شد. ${searchHint(query)}`
                  : `جستجو همزمان در هر سه سطح انجام می‌شود. ${domainScenarios.length} سناریوی خورشیدی در دسترس است.`}
              </small>
            </div>
          ) : (
            <div className="shil-scenario-search-card shil-emergency-search-card" dir="rtl">
              <strong className="shil-emergency-search-title">جستجوی همه سناریوهای برق اضطراری</strong>
              <div className="shil-emergency-search-grid">
                <label>
                  <span>توان</span>
                  <input type="search" value={emergencySearch.power} onChange={(event) => setEmergencySearch((prev) => ({ ...prev, power: event.target.value }))} placeholder="3KW / 3000 W / سه کیلو وات" dir="auto" />
                </label>
                <label>
                  <span>جریان کل</span>
                  <input type="search" value={emergencySearch.current} onChange={(event) => setEmergencySearch((prev) => ({ ...prev, current: event.target.value }))} placeholder="25A / ۲۵ آمپر / بیست و پنج آمپر" dir="auto" />
                </label>
                <label>
                  <span>ساعت بکاپ</span>
                  <input type="search" value={emergencySearch.backup} onChange={(event) => setEmergencySearch((prev) => ({ ...prev, backup: event.target.value }))} placeholder="3 ساعت / سه ساعت" dir="auto" />
                </label>
              </div>
              <small>
                {hasDomainQuery
                  ? `${domainSearchResults.length} سناریو از مجموع سبک، متوسط و سنگین مطابق فیلترهای برق اضطراری پیدا شد.`
                  : `جستجو همزمان روی توان، جریان کل و ساعت بکاپ در ${domainScenarios.length} سناریوی برق اضطراری انجام می‌شود.`}
              </small>
            </div>
          )}

          {!hasDomainQuery ? (
            <div className="shil-scenario-hub shil-scenario-hub--levels">
              <button onClick={() => navigate(`/scenarios/${domain}/light`)} className="shil-big-route-card">سبک<br /><small>100 سناریوی اختصاصی</small></button>
              <button onClick={() => navigate(`/scenarios/${domain}/medium`)} className="shil-big-route-card">متوسط<br /><small>100 سناریوی اختصاصی</small></button>
              <button onClick={() => navigate(`/scenarios/${domain}/heavy`)} className="shil-big-route-card">سنگین<br /><small>100 سناریوی اختصاصی</small></button>
            </div>
          ) : (
            <div className="shil-scenario-page shil-scenario-page--filtered shil-scenario-page--domain-results">
              {domainSearchResults.length === 0 ? (
                <div className="shil-scenario-search-empty">سناریوی منطبق پیدا نشد. برای برق اضطراری می‌توانی توان، جریان کل یا ساعت بکاپ را جداگانه یا همزمان جستجو کنی.</div>
              ) : null}

              {domainSearchResults.map((scenario) => (
                <article id={`scenario-${scenario.id}`} key={`${scenario.levelKey || scenario.level}-${scenario.id}`} className={`shil-scenario-detail-card shil-scenario-accordion-card ${scenario.source === "admin-approved-project" ? "shil-scenario-detail-card--admin" : ""}`}>
                  <div className="shil-scenario-card-heading">
                    <h3>{scenario.title}</h3>
                    <strong className="shil-scenario-title-power" dir="ltr">{formatPowerTitle(scenario.loadEstimate)}</strong>
                  </div>

                  <div className="shil-scenario-search-level-badge">سطح: {levelLabels[scenario.levelKey] || scenario.level || "-"}</div>
                  {scenario.source === "admin-approved-project" ? <span className="shil-scenario-admin-badge">پروژه واقعی تاییدشده</span> : null}

                  <details className="shil-scenario-details-accordion">
                    <summary>مشاهده جزئیات سناریو</summary>
                    <div className="shil-scenario-accordion-body">
                      <p>{scenario.description}</p>
                      <div className="shil-scenario-detail-grid">
                        <span>نوع پروژه</span><strong>{scenario.category}</strong>
                        <span>سطح</span><strong>{levelLabels[scenario.levelKey] || scenario.level}</strong>
                        <span>توان تقریبی</span><strong dir="ltr">{formatPower(scenario.loadEstimate)}</strong>
                        {scenario.domain === "emergency" ? <><span>جریان کل</span><strong dir="ltr">{formatCurrent(scenario.totalCurrentA)}</strong><span>ساعت بکاپ</span><strong><bdi dir="ltr">{scenario.backupHours}</bdi> ساعت</strong></> : <><span>انرژی روزانه</span><strong dir="ltr">{formatEnergy(scenario.dailyEnergyWh)}</strong></>}
                        {scenario.city ? <><span>شهر</span><strong>{scenario.city}</strong></> : null}
                        <span>هسته محاسباتی</span><strong>{scenario.calculationEngine === "solar" ? "Solar Core" : "Emergency Core"}</strong>
                        <span>اینورتر</span><strong>{scenario.inverter}</strong>
                        <span>نوع باتری</span><strong>{scenario.batteryType}</strong>
                        <span>باتری پیشنهادی</span><strong>{scenario.suggestedBattery}</strong>
                        {scenario.domain === "solar" ? <><span>تعداد پنل</span><strong>{scenario.suggestedPanels}</strong></> : null}
                      </div>
                    </div>
                  </details>

                  <button className="shil-primary-action" type="button" onClick={() => selectScenario(scenario)}>
                    انتخاب سناریو و ادامه به شرایط محیطی
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      </ShilPageShell>
    );
  }

  const hasQuery = domain === "emergency" ? hasEmergencySearch : Boolean(query.trim());

  return (
    <ShilPageShell title={`${domainLabels[domain]} - ${levelLabels[level] || levelMeta[level]?.fa || ""}`} className="shil-scenarios-shell shil-scenarios-shell--list">
      <div id="shil-scenarios-root" className="shil-scenario-list-root" dir="rtl">
        {domain === "emergency" ? (
          <div className="shil-scenario-search-card shil-emergency-search-card" dir="rtl">
            <strong className="shil-emergency-search-title">جستجوی سناریوهای برق اضطراری این سطح</strong>
            <div className="shil-emergency-search-grid">
              <label><span>توان</span><input type="search" value={emergencySearch.power} onChange={(event) => setEmergencySearch((prev) => ({ ...prev, power: event.target.value }))} placeholder="3KW / 3000 W" dir="auto" /></label>
              <label><span>جریان کل</span><input type="search" value={emergencySearch.current} onChange={(event) => setEmergencySearch((prev) => ({ ...prev, current: event.target.value }))} placeholder="25A / ۲۵ آمپر" dir="auto" /></label>
              <label><span>ساعت بکاپ</span><input type="search" value={emergencySearch.backup} onChange={(event) => setEmergencySearch((prev) => ({ ...prev, backup: event.target.value }))} placeholder="3 ساعت / سه ساعت" dir="auto" /></label>
            </div>
            <small>{hasQuery ? `${scenarios.length} سناریو مطابق فیلترها پیدا شد.` : `${allScenarios.length} سناریو در این سطح موجود است.`}</small>
          </div>
        ) : (
          <div className="shil-scenario-search-card" dir="auto">
            <label htmlFor="scenario-search">جستجوی سناریو</label>
            <input
              id="scenario-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="مثال: 3KW، سه کیلو وات، 3000 W، تهران، 10 KWH..."
              dir="auto"
            />
            <small>
              {hasQuery
                ? `${scenarios.length} سناریو مطابق جستجو پیدا شد. ${searchHint(query)}`
                : `برای جستجو ابتدا توان تقریبی، انرژی روزانه یا شهر را وارد کنید. ${allScenarios.length} سناریو در این گروه موجود است.`}
            </small>
          </div>
        )}

        <div className={`shil-scenario-page ${hasQuery ? "shil-scenario-page--filtered" : ""}`}>
          {hasQuery && scenarios.length === 0 ? (
            <div className="shil-scenario-search-empty">سناریوی منطبق پیدا نشد. توان، جریان کل یا ساعت بکاپ را تغییر بده.</div>
          ) : null}

          {scenarios.map((scenario) => (
            <article id={`scenario-${scenario.id}`} key={scenario.id} className={`shil-scenario-detail-card shil-scenario-accordion-card ${scenario.source === "admin-approved-project" ? "shil-scenario-detail-card--admin" : ""}`}>
              <div className="shil-scenario-card-heading">
                <h3>{scenario.title}</h3>
                <strong className="shil-scenario-title-power" dir="ltr">{formatPowerTitle(scenario.loadEstimate)}</strong>
              </div>

              {scenario.source === "admin-approved-project" ? <span className="shil-scenario-admin-badge">پروژه واقعی تاییدشده</span> : null}

              <details className="shil-scenario-details-accordion">
                <summary>مشاهده جزئیات سناریو</summary>
                <div className="shil-scenario-accordion-body">
                  <p>{scenario.description}</p>
                  <div className="shil-scenario-detail-grid">
                    <span>نوع پروژه</span><strong>{scenario.category}</strong>
                    <span>سطح</span><strong>{scenario.level}</strong>
                    <span>توان تقریبی</span><strong dir="ltr">{formatPower(scenario.loadEstimate)}</strong>
                    {scenario.domain === "emergency" ? <><span>جریان کل</span><strong dir="ltr">{formatCurrent(scenario.totalCurrentA)}</strong><span>ساعت بکاپ</span><strong><bdi dir="ltr">{scenario.backupHours}</bdi> ساعت</strong></> : <><span>انرژی روزانه</span><strong dir="ltr">{formatEnergy(scenario.dailyEnergyWh)}</strong></>}
                    {scenario.city ? <><span>شهر</span><strong>{scenario.city}</strong></> : null}
                    <span>هسته محاسباتی</span><strong>{scenario.calculationEngine === "solar" ? "Solar Core" : "Emergency Core"}</strong>
                    <span>اینورتر</span><strong>{scenario.inverter}</strong>
                    <span>نوع باتری</span><strong>{scenario.batteryType}</strong>
                    <span>باتری پیشنهادی</span><strong>{scenario.suggestedBattery}</strong>
                    {scenario.domain === "solar" ? <><span>تعداد پنل</span><strong>{scenario.suggestedPanels}</strong></> : null}
                  </div>
                </div>
              </details>

              <button className="shil-primary-action" type="button" onClick={() => selectScenario(scenario)}>
                انتخاب سناریو و ادامه به شرایط محیطی
              </button>
            </article>
          ))}
        </div>
      </div>
    </ShilPageShell>
  );
}
