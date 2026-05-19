import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ShilPageShell from "../../components/ShilPageShell.jsx";
import ProjectMiniRail from "../../components/ProjectMiniRail.jsx";
import { consumerEquipmentLibrary, searchConsumerEquipment } from "../../data/catalogs/consumerEquipmentLibrary.js";
import { buildScenarioCalculationInput } from "../../core/scenario/scenarioToEngineeringForm.js";
import { METHOD_LABELS, persistLoadEngineResult, runLoadEngine } from "../../core/calculation/loadEngine.js";
import { runSolarPanelPowerEngine } from "../../core/calculation/solarPanelPowerEngine.js";

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
  const [panelPowerW, setPanelPowerW] = useState("620");
  const [panelCount, setPanelCount] = useState("10");
  const [psh, setPsh] = useState("5");
  const [lossPercent, setLossPercent] = useState("15");
  const [dailyLoadKWh, setDailyLoadKWh] = useState("");
  const [daysAutonomy, setDaysAutonomy] = useState("1");
  const [batteryDod, setBatteryDod] = useState("0.9");
  const [systemEta, setSystemEta] = useState("0.9");
  const [batteryUnitKWh, setBatteryUnitKWh] = useState("5");

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
    const solarPanelEnergyWh = method === "solar_panel_power" && dailyLoadKWh ? Number(dailyLoadKWh) * 1000 : 0;
    const solarPanelPowerW = method === "solar_panel_power" ? Number(panelPowerW || 0) * Number(panelCount || 0) : 0;
    return runLoadEngine({
      domain,
      method,
      scenario,
      environment,
      environmentAssessment,
      selectedItems,
      voltageAC: voltage,
      manualEnergyWh: energyFromManual || solarPanelEnergyWh,
      manualPowerW: powerFromCurrent || powerFromManual || solarPanelPowerW,
      manualHours: Number(manualHours || psh || 0),
    });
  }, [domain, method, scenario, environment, environmentAssessment, selectedItems, manualEnergyKWh, manualPowerW, manualCurrentA, manualVoltage, manualHours, panelPowerW, panelCount, psh, dailyLoadKWh]);

  const solarPanelPreview = useMemo(() => {
    if (method !== "solar_panel_power") return null;
    const count = Math.max(0, Math.round(Number(panelCount || 0)));
    const pwr = Number(panelPowerW || 0);
    const seriesCount = count > 0 ? Math.max(1, Math.min(count, Math.round(Math.sqrt(count)))) : 1;
    const parallelCount = count > 0 ? Math.ceil(count / seriesCount) : 1;
    const loadKWh = Number(dailyLoadKWh || 0);
    const lossRatio = Math.min(0.95, Math.max(0, Number(lossPercent || 0) / 100));
    const eta = Math.min(1, Math.max(0.1, Number(systemEta || 0.9)));
    const dod = Math.min(1, Math.max(0.1, Number(batteryDod || 0.9)));
    const batteryNeedKWh = loadKWh > 0 ? (loadKWh * Number(daysAutonomy || 1)) / (dod * eta) : 0;
    const unitKWh = Number(batteryUnitKWh || 0);
    const batteryCount = unitKWh > 0 ? Math.ceil(batteryNeedKWh / unitKWh) : 0;
    return {
      ...runSolarPanelPowerEngine({
        panel: { powerW: pwr, voc: 49.5, vmp: 41.5, imp: pwr > 0 ? pwr / 41.5 : 0, isc: pwr > 0 ? (pwr / 41.5) * 1.08 : 0, areaM2: 2.6 },
        pvArray: { panelCount: count, seriesCount, parallelCount },
        env: { psh: Number(psh || 0), effectiveEfficiency: 1 - lossRatio, minTempC: environmentAssessment?.minTempC ?? -5, maxTempC: environmentAssessment?.maxTempC ?? 45 },
        load: { totalEnergyWh: loadKWh * 1000 },
        solarSizing: { input: { P_panel: pwr, N_panel: count, PSH: Number(psh || 0), lossRatio } },
      }),
      batteryNeedKWh,
      batteryCount,
      batteryUnitKWh: unitKWh,
      batteryDod: dod,
      systemEta: eta,
      daysAutonomy: Number(daysAutonomy || 1),
    };
  }, [method, panelPowerW, panelCount, psh, lossPercent, dailyLoadKWh, daysAutonomy, batteryDod, systemEta, batteryUnitKWh, environmentAssessment]);

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
    if (method === "solar_panel_power") {
      localStorage.setItem("shil:solarPanelPowerInput", JSON.stringify({
        panelPowerW: Number(panelPowerW || 0),
        panelCount: Number(panelCount || 0),
        psh: Number(psh || 0),
        lossPercent: Number(lossPercent || 0),
        dailyLoadKWh: Number(dailyLoadKWh || 0),
        daysAutonomy: Number(daysAutonomy || 1),
        batteryDod: Number(batteryDod || 0.9),
        systemEta: Number(systemEta || 0.9),
        batteryUnitKWh: Number(batteryUnitKWh || 0),
      }));
      localStorage.setItem("shil:solarPanelPowerPreview", JSON.stringify(solarPanelPreview));
    }

    const result = persistLoadEngineResult({
      domain,
      method,
      scenario,
      environment,
      environmentAssessment,
      selectedItems,
      voltageAC: Number(manualVoltage || 220),
      manualEnergyWh: method === "energy" && manualEnergyKWh ? Number(manualEnergyKWh) * 1000 : method === "solar_panel_power" && dailyLoadKWh ? Number(dailyLoadKWh) * 1000 : 0,
      manualPowerW: method === "current" && manualCurrentA ? Number(manualCurrentA) * Number(manualVoltage || 220) : method === "solar_panel_power" ? Number(panelPowerW || 0) * Number(panelCount || 0) : Number(manualPowerW || 0),
      manualHours: Number(method === "solar_panel_power" ? psh || 0 : manualHours || 0),
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
            {method === "solar_panel_power" ? (
              <>
                <div className="shil-form-grid">
                  <label>توان هر پنل W<input className="shil-input" value={panelPowerW} onChange={(e) => setPanelPowerW(e.target.value)} placeholder="مثلاً 620" inputMode="decimal" /></label>
                  <label>تعداد پنل<input className="shil-input" value={panelCount} onChange={(e) => setPanelCount(e.target.value)} placeholder="مثلاً 24" inputMode="numeric" /></label>
                  <label>ساعات آفتاب مؤثر PSH<input className="shil-input" value={psh} onChange={(e) => setPsh(e.target.value)} placeholder="مثلاً 5" inputMode="decimal" /></label>
                  <label>تلفات کل سیستم ٪<input className="shil-input" value={lossPercent} onChange={(e) => setLossPercent(e.target.value)} placeholder="مثلاً 15" inputMode="decimal" /></label>
                  <label>مصرف روزانه kWh<input className="shil-input" value={dailyLoadKWh} onChange={(e) => setDailyLoadKWh(e.target.value)} placeholder="اختیاری؛ مثلاً 35" inputMode="decimal" /></label>
                  <label>روز خودکفایی<input className="shil-input" value={daysAutonomy} onChange={(e) => setDaysAutonomy(e.target.value)} placeholder="مثلاً 1 یا 2" inputMode="decimal" /></label>
                  <label>DoD باتری<input className="shil-input" value={batteryDod} onChange={(e) => setBatteryDod(e.target.value)} placeholder="لیتیوم 0.9" inputMode="decimal" /></label>
                  <label>راندمان کلی<input className="shil-input" value={systemEta} onChange={(e) => setSystemEta(e.target.value)} placeholder="مثلاً 0.9" inputMode="decimal" /></label>
                  <label>ظرفیت هر باتری kWh<input className="shil-input" value={batteryUnitKWh} onChange={(e) => setBatteryUnitKWh(e.target.value)} placeholder="مثلاً 5" inputMode="decimal" /></label>
                </div>
                <p className="shil-muted-note">این روش محاسبات را از سمت پنل شروع می‌کند؛ خروجی آن به پیکربندی سیستم، باتری، اینورتر، چکیده و خروجی نهایی منتقل می‌شود.</p>
              </>
            ) : (
              <div className="shil-form-grid">
                {method === "energy" ? <label>انرژی روزانه kWh<input className="shil-input" value={manualEnergyKWh} onChange={(e) => setManualEnergyKWh(e.target.value)} placeholder="مثلاً 12.5" inputMode="decimal" /></label> : null}
                {method === "power" ? <label>توان کل W<input className="shil-input" value={manualPowerW} onChange={(e) => setManualPowerW(e.target.value)} placeholder="مثلاً 3500" inputMode="numeric" /></label> : null}
                {method === "current" ? <label>جریان کل A<input className="shil-input" value={manualCurrentA} onChange={(e) => setManualCurrentA(e.target.value)} placeholder="مثلاً 16" inputMode="decimal" /></label> : null}
                <label>ولتاژ AC<input className="shil-input" value={manualVoltage} onChange={(e) => setManualVoltage(e.target.value)} inputMode="numeric" /></label>
                <label>ساعت استفاده / زمان برق اضطراری مورد نظر<input className="shil-input" value={manualHours} onChange={(e) => setManualHours(e.target.value)} inputMode="decimal" /></label>
              </div>
            )}
          </section>
        ) : null}

        {method === "solar_panel_power" && solarPanelPreview ? (
          <section className="shil-env-card">
            <h3 className="shil-section-title">خروجی زنده توان پنل خورشیدی</h3>
            <div className="shil-summary-grid">
              <div><span>توان پیک DC</span><strong>{solarPanelPreview.array?.powerKW} kW</strong></div>
              <div><span>تولید روزانه PV</span><strong>{solarPanelPreview.array?.dailyEnergyKWh} kWh</strong></div>
              <div><span>پوشش مصرف</span><strong>{solarPanelPreview.array?.coveragePercent ? `${solarPanelPreview.array.coveragePercent}%` : "نیازمند مصرف"}</strong></div>
              <div><span>آرایش پنل</span><strong>{solarPanelPreview.input?.seriesCount} سری × {solarPanelPreview.input?.parallelCount} موازی</strong></div>
              <div><span>باتری مورد نیاز</span><strong>{solarPanelPreview.batteryNeedKWh.toFixed(2)} kWh</strong></div>
              <div><span>تعداد باتری</span><strong>{solarPanelPreview.batteryCount ? `${solarPanelPreview.batteryCount} عدد × ${solarPanelPreview.batteryUnitKWh} kWh` : "در انتظار ظرفیت"}</strong></div>
              <div><span>امتیاز مهندسی</span><strong>{solarPanelPreview.score} / 100</strong></div>
              <div><span>وضعیت</span><strong>{solarPanelPreview.levelLabel}</strong></div>
            </div>
            {solarPanelPreview.recommendations?.length ? (
              <ul className="shil-warning-list">
                {solarPanelPreview.recommendations.slice(0, 3).map((item) => <li key={item}>{item}</li>)}
              </ul>
            ) : null}
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
