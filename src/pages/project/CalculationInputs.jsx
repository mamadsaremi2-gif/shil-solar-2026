import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ShilPageShell from "../../components/ShilPageShell.jsx";
import ProjectMiniRail from "../../components/ProjectMiniRail.jsx";
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
  const [isEquipmentPickerOpen, setIsEquipmentPickerOpen] = useState(false);
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
    return results.slice(0, 250);
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

  const applySmartDetails = () => {
    setShowExpert(true);
    setItemOverrides((prev) => {
      const next = { ...prev };
      consumerEquipmentLibrary.forEach((item) => {
        if (!selectedIds.has(item.id)) return;
        const isMotor = item.type === "inductive" || Number(item.startupFactor || item.surgeFactor || 1) > 1.7;
        next[item.id] = {
          ...(next[item.id] || {}),
          quantity: next[item.id]?.quantity ?? 1,
          usageHoursPerDay: next[item.id]?.usageHoursPerDay ?? item.usageHoursPerDay,
          simultaneityFactor: next[item.id]?.simultaneityFactor ?? item.simultaneityFactor ?? item.diversityFactor ?? 1,
          powerFactor: next[item.id]?.powerFactor ?? item.powerFactor ?? (isMotor ? 0.82 : 0.95),
          isMotor,
          hasSoftStarter: next[item.id]?.hasSoftStarter ?? false,
          loadKind: isMotor ? "motor" : "resistive/electronic",
        };
      });
      return next;
    });
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
    navigate(`/new-project/system/${domain}?from=calculation-inputs`);
  };

  return (
    <ShilPageShell title={METHOD_LABELS[method] || "ورودی محاسبات"}>
      <ProjectMiniRail />
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
          <section className="shil-env-card shil-equipment-picker-card">
            <h3 className="shil-section-title">لیست تجهیزات</h3>
            <button type="button" className="shil-equipment-field" onClick={() => setIsEquipmentPickerOpen((v) => !v)}>
              <span>انتخاب از بانک ۲۵۰ تجهیز</span>
              <strong>{selectedItems.length ? `${selectedItems.length} تجهیز انتخاب شده` : "باز کردن لیست"}</strong>
            </button>

            {isEquipmentPickerOpen ? (
              <div className="shil-equipment-picker-panel">
                <input
                  className="shil-input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="جستجو: پمپ، روشنایی، کولر، سرور..."
                />
                <div className="shil-equipment-scroll-list">
                  {items.map((item) => {
                    const selected = selectedIds.has(item.id);
                    const isMotor = item.type === "inductive" || Number(item.surgeFactor || item.startupFactor || 1) > 1.7;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`shil-equipment-option ${selected ? "active" : ""}`}
                        onClick={() => toggleItem(item)}
                      >
                        <strong>{item.title}</strong>
                        <span>{item.ratedPowerW}W · {item.usageHoursPerDay}h · {isMotor ? "موتوری" : "مصرفی"}</span>
                      </button>
                    );
                  })}
                </div>
                <button type="button" className="shil-secondary-wide" onClick={() => setIsEquipmentPickerOpen(false)}>
                  بستن لیست تجهیزات
                </button>
              </div>
            ) : null}

            <div className="shil-equipment-actions">
              <button type="button" className="shil-secondary-wide" onClick={applySmartDetails}>
                اعمال هوشمند
              </button>
              <button type="button" className="shil-secondary-wide" onClick={() => setShowExpert((v) => !v)}>
                {showExpert ? "خلاصه ساده" : "نمایش جزئیات تخصصی"}
              </button>
            </div>

            <p className="shil-muted-note">انتخاب تجهیزات فقط داخل همین فیلد انجام می‌شود؛ با جستجو یا اسکرول انتخاب کن، سپس لیست را ببند و تجهیزات انتخابی را اصلاح کن.</p>
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
          <section className="shil-selected-equipment-list">
            <h3 className="shil-section-title">تجهیزات انتخابی</h3>
            {!selectedItems.length ? (
              <div className="shil-empty-selection">هنوز تجهیزی انتخاب نشده است.</div>
            ) : selectedItems.map((item) => {
              const override = itemOverrides[item.id] || {};
              const preview = enginePreview.selectedItems?.find((x) => x.id === item.id);
              const isMotor = item.type === "inductive" || Number(item.surgeFactor || item.startupFactor || 1) > 1.7;
              return (
                <article key={item.id} className="shil-equipment-card active">
                  <div className="shil-selected-equipment-head">
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.category} | {isMotor ? "موتوری" : "مقاومتی/الکترونیکی"}</span>
                    </div>
                    <button type="button" className="shil-remove-equipment" onClick={() => toggleItem(item)}>حذف</button>
                  </div>
                  <div className="shil-equipment-controls">
                    <label>تعداد<input className="shil-input" value={override.quantity ?? item.quantity ?? 1} onChange={(e) => patchOverride(item.id, { quantity: e.target.value })} inputMode="numeric" /></label>
                    <label>ساعت مصرف<input className="shil-input" value={override.usageHoursPerDay ?? item.usageHoursPerDay} onChange={(e) => patchOverride(item.id, { usageHoursPerDay: e.target.value })} inputMode="decimal" /></label>
                    {showExpert ? (
                      <>
                        <label>ضریب همزمانی<input className="shil-input" value={override.simultaneityFactor ?? item.simultaneityFactor ?? item.diversityFactor ?? 1} onChange={(e) => patchOverride(item.id, { simultaneityFactor: e.target.value })} inputMode="decimal" /></label>
                        <label>راندمان/PF<input className="shil-input" value={override.powerFactor ?? item.powerFactor ?? 0.95} onChange={(e) => patchOverride(item.id, { powerFactor: e.target.value })} inputMode="decimal" /></label>
                      </>
                    ) : null}
                    {isMotor ? (
                      <label className="shil-check-row">
                        <input type="checkbox" checked={Boolean(override.hasSoftStarter)} onChange={(e) => patchOverride(item.id, { hasSoftStarter: e.target.checked })} />
                        سافت‌استارتر دارد؛ جریان راه‌اندازی از ۲.۵× به ۱.۲× جریان نامی کاهش یابد
                      </label>
                    ) : showExpert ? (
                      <div className="shil-load-kind-note">نوع بار: مقاومتی/الکترونیکی</div>
                    ) : null}
                    {showExpert && preview ? (
                      <div className="shil-expert-mini">
                        <span>جریان نامی: {preview.nominalCurrentA} A</span>
                        <span>جریان کارکرد: {preview.runningCurrentA} A</span>
                        <span>جریان راه‌اندازی: {preview.startCurrentA} A</span>
                        <span>ضریب استارت: ×{preview.currentStartFactor}</span>
                        <small>{preview.expertReason}</small>
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </section>
        ) : null}

        <button type="button" className="shil-primary-wide" onClick={confirmLoad}>
          تأیید اطلاعات و ورود به پیکربندی تنظیمات
        </button>
      </div>
    </ShilPageShell>
  );
}
