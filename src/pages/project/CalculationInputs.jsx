import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ShilPageShell from "../../components/ShilPageShell.jsx";
import { consumerEquipmentLibrary, searchConsumerEquipment } from "../../data/catalogs/consumerEquipmentLibrary.js";
import { buildScenarioCalculationInput } from "../../core/scenario/scenarioToEngineeringForm.js";
import { METHOD_LABELS, persistLoadEngineResult, runLoadEngine } from "../../core/calculation/loadEngine.js";

function readDraft(key) {
  try { return JSON.parse(localStorage.getItem(key) || "null"); }
  catch { return null; }
}

function mergeItemWithOverride(item, override = {}) {
  return {
    ...item,
    ...override,
    quantity: Number(override.quantity ?? item.quantity ?? 1) || 1,
    usageHoursPerDay: Number(override.usageHoursPerDay ?? item.usageHoursPerDay ?? 0) || 0,
    hasSoftStarter: Boolean(override.hasSoftStarter ?? item.hasSoftStarter ?? false),
  };
}

export default function CalculationInputs() {
  const navigate = useNavigate();
  const params = useParams();
  const domain = params.domain || localStorage.getItem("shil:scenarioDomain") || "solar";
  const method = params.method || localStorage.getItem("shil:calculationMethod") || "equipment";

  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [itemOverrides, setItemOverrides] = useState({});
  const [showExpert, setShowExpert] = useState(false);
  const [manualEnergyKWh, setManualEnergyKWh] = useState("");
  const [manualPowerW, setManualPowerW] = useState("");
  const [manualCurrentA, setManualCurrentA] = useState("");
  const [manualVoltage, setManualVoltage] = useState(domain === "emergency" ? "220" : "220");
  const [manualHours, setManualHours] = useState(domain === "emergency" ? "6" : "5");

  const scenario = useMemo(() => readDraft("shil:selectedScenario"), []);
  const environment = useMemo(() => readDraft("shil:environmentDraft"), []);
  const environmentAssessment = useMemo(() => readDraft("shil:environmentAssessment"), []);

  const items = useMemo(() => {
    const results = searchConsumerEquipment(query);
    return query.trim() ? results.slice(0, 120) : consumerEquipmentLibrary.slice(0, 100);
  }, [query]);

  const selectedItems = useMemo(() => {
    return consumerEquipmentLibrary
      .filter((item) => selectedIds.has(item.id))
      .map((item) => mergeItemWithOverride(item, itemOverrides[item.id]));
  }, [selectedIds, itemOverrides]);

  const enginePreview = useMemo(() => {
    const voltage = Number(manualVoltage || 220);
    const powerFromCurrent = method === "current" && manualCurrentA ? Number(manualCurrentA) * voltage : 0;
    const energyFromManual = method === "energy" && manualEnergyKWh ? Number(manualEnergyKWh) * 1000 : 0;
    const powerFromManual = method === "power" && manualPowerW ? Number(manualPowerW) : 0;
    return runLoadEngine({
      domain,
      method,
      scenario,
      environment,
      environmentAssessment,
      selectedItems,
      voltageAC: voltage,
      manualEnergyWh: energyFromManual,
      manualPowerW: powerFromCurrent || powerFromManual,
      manualHours: Number(manualHours || 0),
    });
  }, [domain, method, scenario, environment, environmentAssessment, selectedItems, manualEnergyKWh, manualPowerW, manualCurrentA, manualVoltage, manualHours]);

  const toggleItem = (item) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) next.delete(item.id);
      else {
        next.add(item.id);
        setItemOverrides((old) => ({
          ...old,
          [item.id]: {
            quantity: old[item.id]?.quantity ?? 1,
            usageHoursPerDay: old[item.id]?.usageHoursPerDay ?? item.usageHoursPerDay,
            hasSoftStarter: old[item.id]?.hasSoftStarter ?? false,
          },
        }));
      }
      return next;
    });
  };

  const patchOverride = (id, patch) => {
    setItemOverrides((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), ...patch } }));
  };

  const confirmLoad = () => {
    const result = persistLoadEngineResult({
      domain,
      method,
      scenario,
      environment,
      environmentAssessment,
      selectedItems,
      voltageAC: Number(manualVoltage || 220),
      manualEnergyWh: method === "energy" && manualEnergyKWh ? Number(manualEnergyKWh) * 1000 : 0,
      manualPowerW: method === "current" && manualCurrentA ? Number(manualCurrentA) * Number(manualVoltage || 220) : Number(manualPowerW || 0),
      manualHours: Number(manualHours || 0),
    });

    localStorage.setItem("shil:loadEngineResult", JSON.stringify(result));
    buildScenarioCalculationInput();
    navigate(`/new-project/execution/${domain}?from=load-method`);
  };

  return (
    <ShilPageShell title={METHOD_LABELS[method] || "ورودی محاسبات"}>
      <div className="shil-equipment-page">
        <section className="shil-env-card">
          <h3 className="shil-section-title">زمینه محاسبات</h3>
          <div className="shil-summary-grid">
            <div><span>روش</span><strong>{METHOD_LABELS[method] || method}</strong></div>
            <div><span>هسته</span><strong>{domain === "emergency" ? "برق اضطراری" : "خورشیدی"}</strong></div>
            <div><span>سناریو</span><strong>{scenario?.title || "دستی"}</strong></div>
            <div><span>شهر</span><strong>{environment?.city || "اصفهان"}</strong></div>
          </div>
        </section>

        {method === "equipment" || method === "profile" ? (
          <section className="shil-env-card">
            <h3 className="shil-section-title">جستجوی تجهیزات مصرفی</h3>
            <input
              className="shil-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="مثلاً یخچال، کولر، پمپ، روشنایی، سرور..."
            />
            <p className="shil-muted-note">بانک داخلی شامل ۲۵۰ تجهیز با توان، جریان، ساعت پیش‌فرض، ضریب همزمانی، ضریب توان و منطق راه‌اندازی موتوری است.</p>
            <button type="button" className="shil-secondary-wide" onClick={() => setShowExpert((v) => !v)}>
              {showExpert ? "مخفی کردن محاسبات هوشمند" : "نمایش محاسبات هوشمند"}
            </button>
          </section>
        ) : null}

        {method !== "equipment" ? (
          <section className="shil-env-card">
            <h3 className="shil-section-title">ورودی مستقیم روش انتخاب‌شده</h3>
            <div className="shil-form-grid">
              {method === "energy" ? <label>انرژی روزانه kWh<input className="shil-input" value={manualEnergyKWh} onChange={(e) => setManualEnergyKWh(e.target.value)} placeholder="مثلاً 12.5" inputMode="decimal" /></label> : null}
              {method === "power" ? <label>توان کل W<input className="shil-input" value={manualPowerW} onChange={(e) => setManualPowerW(e.target.value)} placeholder="مثلاً 3500" inputMode="numeric" /></label> : null}
              {method === "current" ? <label>جریان کل A<input className="shil-input" value={manualCurrentA} onChange={(e) => setManualCurrentA(e.target.value)} placeholder="مثلاً 16" inputMode="decimal" /></label> : null}
              <label>ولتاژ AC<input className="shil-input" value={manualVoltage} onChange={(e) => setManualVoltage(e.target.value)} inputMode="numeric" /></label>
              <label>ساعت استفاده / زمان برق اضطراری مورد نظر<input className="shil-input" value={manualHours} onChange={(e) => setManualHours(e.target.value)} inputMode="decimal" /></label>
            </div>
          </section>
        ) : null}

        <section className="shil-env-card">
          <h3 className="shil-section-title">خروجی زنده موتور بار</h3>
          <div className="shil-summary-grid">
            <div><span>تعداد تجهیزات</span><strong>{enginePreview.selectedCount || "Auto"}</strong></div>
            <div><span>توان کل</span><strong>{enginePreview.totalPowerW} W</strong></div>
            <div><span>انرژی روزانه</span><strong>{enginePreview.totalEnergyKWh} kWh</strong></div>
            <div><span>جریان AC</span><strong>{enginePreview.acCurrentA} A</strong></div>
            <div><span>جریان راه‌اندازی</span><strong>{enginePreview.startCurrentA} A</strong></div>
            <div><span>پیک استارت</span><strong>{enginePreview.surgePowerW} W</strong></div>
            <div><span>موتوری/سافت</span><strong>{enginePreview.motorCount || 0}/{enginePreview.softStarterCount || 0}</strong></div>
            <div><span>باتری مرجع</span><strong>{Math.round(enginePreview.recommendedBatteryWh / 1000)} kWh</strong></div>
          </div>
          {showExpert ? (
            <div className="shil-expert-box">
              <strong>منطق پشت پرده:</strong>
              <p>{enginePreview.expertSummary?.rule}</p>
              <p>{enginePreview.expertSummary?.motorStartRule}</p>
            </div>
          ) : null}
          {enginePreview.warnings?.length ? (
            <ul className="shil-warning-list">
              {enginePreview.warnings.map((warning) => <li key={warning}>{warning}</li>)}
            </ul>
          ) : null}
        </section>

        {method === "profile" ? (
          <section className="shil-env-card">
            <h3 className="shil-section-title">پروفایل مصرف تخمینی</h3>
            <div className="shil-summary-grid">
              <div><span>صبح</span><strong>{Math.round(enginePreview.loadProfile.buckets.morning / 1000)} kWh</strong></div>
              <div><span>ظهر</span><strong>{Math.round(enginePreview.loadProfile.buckets.noon / 1000)} kWh</strong></div>
              <div><span>عصر</span><strong>{Math.round(enginePreview.loadProfile.buckets.evening / 1000)} kWh</strong></div>
              <div><span>شب</span><strong>{Math.round(enginePreview.loadProfile.buckets.night / 1000)} kWh</strong></div>
            </div>
          </section>
        ) : null}

        {method === "equipment" || method === "profile" ? (
          <section className="shil-equipment-list">
            {items.map((item) => {
              const selected = selectedIds.has(item.id);
              const override = itemOverrides[item.id] || {};
              const preview = enginePreview.selectedItems?.find((x) => x.id === item.id);
              const isMotor = item.type === "inductive" || Number(item.surgeFactor || 1) > 1.7;
              return (
                <article key={item.id} className={`shil-equipment-card ${selected ? "active" : ""}`}>
                  <button type="button" className="shil-equipment-main" onClick={() => toggleItem(item)}>
                    <strong>{item.title}</strong>
                    <span>{item.category} | {item.class}</span>
                    <small>{item.ratedPowerW} W | {item.usageHoursPerDay} h | PF {item.powerFactor || "Auto"} | همزمانی {item.simultaneityFactor || item.diversityFactor}</small>
                  </button>
                  {selected ? (
                    <div className="shil-equipment-controls">
                      <label>تعداد<input className="shil-input" value={override.quantity ?? 1} onChange={(e) => patchOverride(item.id, { quantity: e.target.value })} inputMode="numeric" /></label>
                      <label>ساعت استفاده<input className="shil-input" value={override.usageHoursPerDay ?? item.usageHoursPerDay} onChange={(e) => patchOverride(item.id, { usageHoursPerDay: e.target.value })} inputMode="decimal" /></label>
                      {isMotor ? (
                        <label className="shil-check-row">
                          <input type="checkbox" checked={Boolean(override.hasSoftStarter)} onChange={(e) => patchOverride(item.id, { hasSoftStarter: e.target.checked })} />
                          سافت‌استارتر دارد
                        </label>
                      ) : null}
                      {showExpert && preview ? (
                        <div className="shil-expert-mini">
                          <span>جریان نامی: {preview.nominalCurrentA} A</span>
                          <span>جریان کارکرد: {preview.runningCurrentA} A</span>
                          <span>جریان راه‌اندازی: {preview.startCurrentA} A</span>
                          <span>ضریب راه‌اندازی: ×{preview.currentStartFactor}</span>
                          <small>{preview.expertReason}</small>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </section>
        ) : null}

        <button type="button" className="shil-primary-wide" onClick={confirmLoad}>
          تأیید روش محاسبات و انتخاب نوع اجرای پروژه
        </button>
      </div>
    </ShilPageShell>
  );
}
