import { useMemo, useRef, useState } from "react";
import { CitySearch } from "../../../shared/components/CitySearch";
import { Field } from "../../../shared/components/Field";
import { EquipmentRepository } from "../../../data/repositories/EquipmentRepository";
import { BATTERY_TYPES, CALCULATION_MODES } from "../../../domain/models/project";
import {
  BATTERY_DOD,
  DASHBOARD_LOGO,
  DESIGN_STEPS,
  METHOD_LABELS,
  PAGE_LOGO,
  PV_TYPES,
  SEASON_OPTIONS,
  STEP_META,
  applyCityPatch,
  averageLoadFactor,
  effectiveGlobalCoincidence,
  batteryArrangementText,
  buildRecoveryPlan,
  getCity,
  n,
  recommendation,
  systemLabel,
} from "../model/designModel";
import {
  deriveBatterySeriesCount,
  isBatteryVoltageCompatible,
  voltageCompatibilityMessage,
} from "../../../domain/engine/rules/engineeringRules";
import { runEngineeringDesign } from "../../../domain/engine/orchestrator/runEngineeringDesign";
import { fetchOnlineClimateIntelligence } from "../../../services/climateIntelligenceService";

export function FlowHeader({ title, onBack }) {
  return (
    <header className="mobile-fixed-header workspace-fixed-header">
      <button className="mobile-back-btn" type="button" onClick={onBack}>‹</button>
      <img className="mobile-header-logo" src="/images/branding/shil-logo.png" alt="SHIL IRAN" />
      <span className="mobile-title-pill">{title}</span>
    </header>
  );
}

export function FlowStepper({ activeIndex, goToStep, completedSteps = [] }) {
  const completedSet = new Set(completedSteps || []);
  return (
    <aside className="focus-stepper pro-stepper mobile-design-stepbar" aria-label="مسیر طراحی">
      {DESIGN_STEPS.map((step, index) => {
        const done = completedSet.has(index);
        return (
          <button key={step} type="button" onClick={() => goToStep(index)} className={`focus-step ${activeIndex === index ? "is-active" : ""} ${done ? "is-done" : ""}`}>
            <span>{index + 1}</span><em>{STEP_META[index].icon}</em><strong>{step}</strong>
          </button>
        );
      })}
    </aside>
  );
}



export function DesignOverview({ onStart }) {
  return (
    <section className="design-overview-card pro-design-overview v15-design-overview project-start-overview" aria-label="مسیر شروع پروژه">
      <div className="design-overview-card__title project-start-overview__title">
        <span>مسیر طراحی</span>
        <small>همه مراحل قبل از شروع پروژه جدید قابل بررسی هستند؛ برای شروع رسمی پروژه از مرحله اول اقدام نمایید.</small>
      </div>
      <div className="design-path-grid project-start-overview__grid">
        {DESIGN_STEPS.map((step, index) => (
          <button
            key={step}
            type="button"
            className="design-path-item pro-path-item v15-path-item project-start-step-card"
            style={{ "--delay": `${index * 95}ms`, "--spin-delay": `${index * -220}ms` }}
            onClick={() => onStart(index)}
          >
            <span className="project-start-step-card__number">{index + 1}</span>
            <i className="project-start-step-card__icon">{STEP_META[index].icon}</i>
            <strong>{step}</strong>
          </button>
        ))}
      </div>
    </section>
  );
}

export function ProjectInfo({ form, updateForm }) {
  return (
    <div className="focus-form-table">
      <Field label="نام پروژه"><input value={form.projectTitle || ""} onChange={(event) => updateForm({ projectTitle: event.target.value })} /></Field>
      <Field label="نام کارفرما"><input value={form.clientName || ""} onChange={(event) => updateForm({ clientName: event.target.value })} /></Field>
      <Field label="شهر اجرای پروژه"><CitySearch value={form.city || "اصفهان"} onSelect={(city) => applyCityPatch(city, updateForm)} /></Field>
      <Field label="حالت طراحی"><select value={form.modeType || "advanced"} onChange={(event) => updateForm({ modeType: event.target.value })}><option value="advanced">پیشرفته</option><option value="quick">سریع</option></select></Field>
    </div>
  );
}

export function PathSelect({ form, updateForm }) {
  const [solarOpen, setSolarOpen] = useState(false);
  if (solarOpen) {
    return (
      <div className="center-choice-stack">
        <div className="method-mini-title">پروژه‌های خورشیدی (PV)</div>
        <div className="method-card-grid three">
          {PV_TYPES.map((item) => (
            <button key={item.value} type="button" className={`method-choice ${form.systemType === item.value ? "is-selected" : ""}`} onClick={() => { updateForm({ systemType: item.value, backupHours: 0 }); }}>
              <strong>{item.label}</strong><span>{item.desc}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="center-choice-stack">
      <div className="method-card-grid two route-image-card-grid">
        <button type="button" className="method-choice big route-image-card route-image-card--solar" onClick={() => setSolarOpen(true)}>
          <span className="route-image-card__media"><img src="/images/cards/solar-project-card.png" alt="پروژه برق خورشیدی با پنل" /></span>
          <strong>پروژه برق خورشیدی با پنل</strong>
          <span>آفگرید، آنگرید یا هیبرید</span>
        </button>
        <button type="button" className="method-choice big route-image-card route-image-card--backup" onClick={() => { updateForm({ systemType: "backup", backupHours: form.backupHours || "2" }); }}>
          <span className="route-image-card__media"><img src="/images/cards/backup-power-card.png" alt="برق اضطراری" /></span>
          <strong>برق اضطراری</strong>
          <span>اینورتر، UPS و بانک باتری</span>
        </button>
      </div>
    </div>
  );
}

export function MethodSelect({ form, updateForm }) {
  const order = ["loads", "load_profile", "daily_energy", "power", "current"];
  const descriptions = {
    loads: "دقیق‌ترین روش بر اساس مصرف واقعی تجهیزات",
    load_profile: "تحلیل رفتار مصرف در بازه‌های روزانه",
    daily_energy: "محاسبه سریع بر اساس kWh روزانه، بدون ضریب همزمانی",
    power: "تخمین سریع از روی توان لحظه‌ای کل با ضریب همزمانی کلی",
    current: "مناسب طراحی الکتریکال از روی جریان کل با ضریب همزمانی کلی",
  };
  const items = order.map((value) => CALCULATION_MODES.find((item) => item.value === value)).filter(Boolean).map((item) => ({ ...item, label: METHOD_LABELS[item.value] || item.label }));
  return (
    <div className="method-select-stage">
      <div className="smart-note">پیشنهاد هوشمند اپ: برای دقت بیشتر، روش «لیست تجهیزات» انتخاب شود؛ روش‌های ساده خروجی تخمینی‌تری دارند.</div>
      <div className="method-card-grid five">
        {items.map((item) => (
          <button key={item.value} type="button" className={`method-choice ${form.calculationMode === item.value ? "is-selected" : ""}`} onClick={() => { updateForm({ calculationMode: item.value }); }}>
            <strong>{item.label}</strong>
            <span>{descriptions[item.value]}</span>
          </button>
        ))}
      </div>
      <div className="warning-card compact">روش انتخابی مستقیماً بر دقت طراحی سیستم اثر دارد؛ در روش انرژی روزانه، ضریب همزمانی دوباره اعمال نمی‌شود.</div>
    </div>
  );
}

export function EquipmentLoadBank({ form, updateLoadItem, addLoadItem, removeLoadItem }) {
  const [open, setOpen] = useState(true);
  const [advanced, setAdvanced] = useState(false);
  const [query, setQuery] = useState("");
  const [custom, setCustom] = useState({ name: "", power: 100, hours: 1, qty: 1, loadType: "mixed" });
  const isBackup = form.systemType === "backup";
  const options = EquipmentRepository.search({ category: "load", query }).slice(0, 40);
  const totalPower = (form.loadItems || []).reduce((sum, item) => sum + n(item.qty, 1) * n(item.power, 0) * n(item.coincidenceFactor, 1), 0);
  const totalEnergy = (form.loadItems || []).reduce((sum, item) => {
    const runtime = isBackup ? n(item.backupHours, n(form.backupHours, 0)) : n(item.hours, 1);
    const seasonal = isBackup ? 1 : n(item.seasonalUseFactor, 1);
    return sum + n(item.qty, 1) * n(item.power, 0) * runtime * n(item.coincidenceFactor, 1) * seasonal;
  }, 0) / 1000;
  const addFromBank = (item) => {
    addLoadItem({ ...(item.specs || {}), name: item.specs?.name || item.title, backupHours: isBackup ? (form.backupHours || 2) : undefined, powerFactor: item.specs?.powerFactor || 0.95, coincidenceFactor: item.specs?.coincidenceFactor || 1, seasonalUseFactor: isBackup ? 1 : item.specs?.seasonalUseFactor ?? 1, surgeFactor: item.specs?.surgeFactor || 1, source: item.isCustom ? "user" : "bank" });
  };
  const addCustom = () => {
    if (!String(custom.name || "").trim()) return;
    const loadType = custom.loadType || "mixed";
    const surgeFactor = loadType === "soft_start" ? 1.2 : loadType === "motor" ? 3 : 1;
    const payload = {
      category: "load",
      title: custom.name.trim(),
      summary: "تجهیز وارد شده توسط کاربر؛ در انتظار بررسی ادمین",
      specs: { name: custom.name.trim(), qty: n(custom.qty, 1), power: n(custom.power, 100), hours: n(custom.hours, 1), backupHours: isBackup ? n(custom.hours, n(form.backupHours, 2)) : undefined, powerFactor: 0.95, coincidenceFactor: 1, seasonalUseFactor: 1, surgeFactor, loadType },
      source: "user",
      approvalStatus: "pending_admin_review",
    };
    const saved = EquipmentRepository.addCustomEquipment(payload);
    addFromBank(saved);
    setCustom({ name: "", power: 100, hours: 1, qty: 1, loadType: "mixed" });
  };
  const updateType = (item, loadType) => updateLoadItem(item.id, { loadType, surgeFactor: loadType === "soft_start" ? 1.2 : loadType === "motor" ? 3 : 1 });
  return (
    <div className="load-bank-stage final-load-ui">
      <div className="smart-bank-summary mini"><div><span>توان همزمان</span><strong>{totalPower.toFixed(0)} W</strong></div><div><span>{isBackup ? "انرژی بکاپ" : "مصرف روزانه"}</span><strong>{totalEnergy.toFixed(2)} kWh</strong></div><div><span>تعداد تجهیزات</span><strong>{(form.loadItems || []).length}</strong></div></div>
      <div className="smart-note">{isBackup ? "در برق اضطراری، فقط مدت زمان برق اضطراری موردنیاز و توان بارها در محاسبه باتری اثر دارد؛ زمان مصرف روزانه، فصل کارکرد و ضریب فصل حذف شده‌اند." : "برای تجهیزات دارای اینورتر داخلی، سافت‌استارتر یا راه‌اندازی نرم، ضریب راه‌اندازی به‌صورت پیشنهادی روی 1.2 قرار می‌گیرد."}</div>
      <div className="load-toolbar"><button className="expand-bank-button" type="button" onClick={() => setOpen((value) => !value)}>بانک تجهیزات مصرفی ({EquipmentRepository.list("load").length} مورد)</button><button className="btn btn--ghost" type="button" onClick={() => setAdvanced((v) => !v)}>{advanced ? "حالت ساده" : "تنظیمات پیشرفته"}</button></div>
      {open ? (
        <div className="load-bank-box">
          <input className="search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="جستجوی تجهیز..." />
          <div className="load-bank-list">
            {options.map((item) => <button key={item.id} type="button" onClick={() => addFromBank(item)}><strong>{item.title}</strong><span>{item.summary}</span>{item.isCustom ? <em>کاربرساخت / در انتظار تایید ادمین</em> : null}</button>)}
          </div>
          <div className="custom-load-row extended">
            <input value={custom.name} onChange={(event) => setCustom({ ...custom, name: event.target.value })} placeholder="نام تجهیز جدید خارج از بانک" />
            <input inputMode="decimal" value={custom.power} onChange={(event) => setCustom({ ...custom, power: event.target.value })} placeholder="توان W" />
            <input inputMode="decimal" value={custom.hours} onChange={(event) => setCustom({ ...custom, hours: event.target.value })} placeholder={isBackup ? "ساعت بکاپ" : "ساعت"} />
            <select value={custom.loadType} onChange={(event) => setCustom({ ...custom, loadType: event.target.value })}><option value="mixed">عمومی</option><option value="motor">موتوری معمولی</option><option value="soft_start">موتوری سافت‌استارت/اینورتر داخلی</option><option value="resistive">مقاومتی</option></select>
            <button className="btn btn--secondary" type="button" onClick={addCustom}>افزودن و ذخیره</button>
          </div>
        </div>
      ) : null}
      <div className="selected-load-list">
        {(form.loadItems || []).map((item) => (
          <article key={item.id} className={`selected-load-card labeled-load-card ${item.source === "user" ? "is-user-added" : ""}`}>
            {item.source === "user" ? <div className="user-added-badge">کاربرساخت / در انتظار تایید ادمین</div> : null}
            <label className="load-field load-name"><span>نام کامل تجهیز</span><input value={item.name || ""} onChange={(event) => updateLoadItem(item.id, { name: event.target.value })} /></label>
            <label className="load-field"><span>تعداد</span><input inputMode="decimal" value={item.qty ?? 1} onChange={(event) => updateLoadItem(item.id, { qty: event.target.value })} /></label>
            <label className="load-field"><span>توان هر عدد (W)</span><input inputMode="decimal" value={item.power ?? ""} onChange={(event) => updateLoadItem(item.id, { power: event.target.value })} /></label>
            {isBackup ? <label className="load-field"><span>ساعت برق اضطراری</span><input inputMode="decimal" value={item.backupHours ?? form.backupHours ?? ""} onChange={(event) => updateLoadItem(item.id, { backupHours: event.target.value, hours: event.target.value })} /></label> : <label className="load-field"><span>ساعت کارکرد روزانه</span><input inputMode="decimal" value={item.hours ?? ""} onChange={(event) => updateLoadItem(item.id, { hours: event.target.value })} /></label>}
            <label className="load-field"><span>نوع تجهیز</span><select value={item.loadType || "mixed"} onChange={(event) => updateType(item, event.target.value)}><option value="mixed">عمومی</option><option value="resistive">روشنایی/مقاومتی</option><option value="motor">موتوری معمولی</option><option value="soft_start">سافت‌استارت/اینورتر داخلی</option></select></label>
            {advanced ? <>
              <label className="load-field"><span>ضریب توان</span><input inputMode="decimal" value={item.powerFactor ?? 0.95} onChange={(event) => updateLoadItem(item.id, { powerFactor: event.target.value })} /></label>
              <label className="load-field"><span>ضریب همزمانی</span><input inputMode="decimal" value={item.coincidenceFactor ?? 1} onChange={(event) => updateLoadItem(item.id, { coincidenceFactor: event.target.value })} /></label>
              {!isBackup ? <label className="load-field"><span>ضریب فصل کارکرد</span><input inputMode="decimal" value={item.seasonalUseFactor ?? 1} onChange={(event) => updateLoadItem(item.id, { seasonalUseFactor: event.target.value })} /></label> : null}
              <label className="load-field"><span>ضریب راه‌اندازی</span><input inputMode="decimal" value={item.surgeFactor ?? 1} onChange={(event) => updateLoadItem(item.id, { surgeFactor: event.target.value })} /></label>
            </> : null}
            <button className="btn btn--ghost danger" type="button" onClick={() => { if (confirm('این تجهیز حذف شود؟')) removeLoadItem(item.id); }}>حذف</button>
          </article>
        ))}
      </div>
    </div>
  );
}

export function CalculationInputs({ form, updateForm, updateLoadItem, addLoadItem, removeLoadItem }) {
  const backupField = form.systemType === "backup" && ["current", "power", "daily_energy", "load_profile"].includes(form.calculationMode);
  const updateProfilePart = (key, value) => {
    const next = { ...form, [key]: value };
    const total = n(next.profileMorningKwh) + n(next.profileNoonKwh) + n(next.profileEveningKwh) + n(next.profileNightKwh);
    updateForm({ [key]: value, dailyEnergyKwh: total > 0 ? total : form.dailyEnergyKwh });
  };
  if (form.calculationMode === "loads") return <EquipmentLoadBank form={form} updateLoadItem={updateLoadItem} addLoadItem={addLoadItem} removeLoadItem={removeLoadItem} />;
  return (
    <div className="focus-form-table">
      {form.calculationMode === "current" ? <Field label="جریان کل"><input inputMode="decimal" value={form.current ?? ""} onChange={(event) => updateForm({ current: event.target.value })} /></Field> : null}
      {form.calculationMode === "power" ? <Field label="توان کل"><input inputMode="decimal" value={form.loadPower ?? ""} onChange={(event) => updateForm({ loadPower: event.target.value })} /></Field> : null}
      {form.calculationMode === "daily_energy" ? <Field label={form.systemType === "backup" ? "انرژی اضطراری موردنیاز (kWh)" : "انرژی موردنیاز / روزانه (kWh)"}><input inputMode="decimal" value={form.dailyEnergyKwh ?? ""} onChange={(event) => updateForm({ dailyEnergyKwh: event.target.value })} /></Field> : null}
      {form.calculationMode === "load_profile" ? <>
        <Field label="مصرف صبح (kWh)"><input inputMode="decimal" value={form.profileMorningKwh ?? ""} onChange={(event) => updateProfilePart("profileMorningKwh", event.target.value)} /></Field>
        <Field label="مصرف ظهر (kWh)"><input inputMode="decimal" value={form.profileNoonKwh ?? ""} onChange={(event) => updateProfilePart("profileNoonKwh", event.target.value)} /></Field>
        <Field label="مصرف عصر (kWh)"><input inputMode="decimal" value={form.profileEveningKwh ?? ""} onChange={(event) => updateProfilePart("profileEveningKwh", event.target.value)} /></Field>
        <Field label="مصرف شب (kWh)"><input inputMode="decimal" value={form.profileNightKwh ?? ""} onChange={(event) => updateProfilePart("profileNightKwh", event.target.value)} /></Field>
        <Field label="ضریب پیک مصرف"><input inputMode="decimal" value={form.peakFactor ?? 2} onChange={(event) => updateForm({ peakFactor: event.target.value })} /></Field>
      </> : null}
      {["current", "power"].includes(form.calculationMode) ? <Field label="ولتاژ مصرف‌کننده"><input inputMode="decimal" value={form.loadVoltage ?? 220} onChange={(event) => updateForm({ loadVoltage: event.target.value })} /></Field> : null}
      {["current", "power"].includes(form.calculationMode) ? <Field label="ضریب توان"><input inputMode="decimal" value={form.powerFactor ?? 0.95} onChange={(event) => updateForm({ powerFactor: event.target.value })} /></Field> : null}
      {form.systemType !== "backup" && ["current", "power"].includes(form.calculationMode) ? <Field label="زمان مصرف روزانه برای محاسبه کل پروژه (ساعت)"><input inputMode="decimal" value={form.dailyUsageHours ?? 3} onChange={(event) => updateForm({ dailyUsageHours: event.target.value })} /></Field> : null}
      {backupField ? <Field label="مدت زمان برق اضطراری موردنیاز (ساعت)"><input inputMode="decimal" value={form.backupHours ?? ""} onChange={(event) => updateForm({ backupHours: event.target.value })} /></Field> : null}
      {['current', 'power'].includes(form.calculationMode) ? <Field label="ضریب همزمانی کل"><input inputMode="decimal" value={form.coincidenceFactor ?? 1} onChange={(event) => updateForm({ coincidenceFactor: event.target.value })} /></Field> : null}
      {form.systemType !== "backup" ? <Field label="فصل کارکرد غالب"><select value={form.seasonProfile || "annual"} onChange={(event) => { const selected = SEASON_OPTIONS.find((item) => item.value === event.target.value); updateForm({ seasonProfile: event.target.value, seasonUsageFactor: selected?.factor ?? 1 }); }}>{SEASON_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field> : null}
      {form.systemType !== "backup" ? <Field label="ضریب فصل کارکرد"><input inputMode="decimal" value={form.seasonUsageFactor ?? 1} onChange={(event) => updateForm({ seasonUsageFactor: event.target.value })} /></Field> : null}
      <Field label="ضریب راه‌اندازی / پیک"><input inputMode="decimal" value={form.surgeFactor ?? 1.7} onChange={(event) => updateForm({ surgeFactor: event.target.value })} /></Field>
    </div>
  );
}

export function SiteConditions({ form, updateForm }) {
  const [climateLoading, setClimateLoading] = useState(false);
  const [climateError, setClimateError] = useState("");
  const city = getCity(form.city);
  const shadowAngle = form.shadowObstacleHeightM && form.shadowObstacleDistanceM
    ? Math.atan(n(form.shadowObstacleHeightM, 0) / Math.max(n(form.shadowObstacleDistanceM, 1), 0.5)) * 180 / Math.PI
    : 0;
  const manualShadowPercent = n(form.shadowPercent, n(form.manualShadowPercent, 0));
  const estimatedShadowLoss = Math.min(Math.max(manualShadowPercent, shadowAngle * 0.85, (1 - n(form.shadingFactor, 0.95)) * 100), 45).toFixed(1);
  const tempMin = Number.isFinite(Number(form.realMinTemperature)) ? form.realMinTemperature : form.minTemperature;
  const tempMax = Number.isFinite(Number(form.realMaxTemperature)) ? form.realMaxTemperature : form.maxTemperature;
  const previewVocCold = (n(form.panelVoc, 53.1) * (1 + n(form.panelTempCoeffVoc, n(form.vocTemperatureCoeff, 0.0024)) * Math.max(25 - n(tempMin, 0), 0))).toFixed(2);
  const previewVmpHot = (n(form.panelVmp, 44.8) * Math.max(0.7, 1 - n(form.panelTempCoeffVmp, n(form.vmpTemperatureCoeff, 0.0029)) * Math.max(n(tempMax, 40) - 25, 0))).toFixed(2);
  const previewIscHot = (n(form.panelIsc, n(form.panelWatt, 585) / Math.max(n(form.panelVmp, 44.8), 1) * 1.08) * (1 + n(form.panelTempCoeffIsc, n(form.iscTemperatureCoeff, 0.0005)) * Math.max(n(tempMax, 40) - 25, 0))).toFixed(2);
  const correctedPshPreview = Math.max(0, n(form.sunHours, city.sunHours) * n(form.shadingFactor, 0.95) * n(form.dustFactor, 0.96)).toFixed(2);
  function captureGps() {
    if (!navigator.geolocation) {
      window.alert('GPS مرورگر در دسترس نیست؛ مختصات را دستی وارد کنید.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => updateForm({
        latitude: position.coords.latitude.toFixed(6),
        longitude: position.coords.longitude.toFixed(6),
        gpsAccuracyM: Math.round(position.coords.accuracy || 0),
        siteGps: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`,
        siteGpsCapturedAt: new Date().toISOString(),
        siteSurveyGpsStatus: 'registered',
      }),
      () => window.alert('دسترسی GPS تایید نشد؛ مختصات را دستی وارد کنید.'),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }
  function captureCompassHeading() {
    const applyHeading = (event) => {
      const heading = event.webkitCompassHeading ?? (typeof event.alpha === 'number' ? 360 - event.alpha : null);
      if (heading == null || Number.isNaN(heading)) return;
      const normalized = Math.round(((heading % 360) + 360) % 360);
      updateForm({ compassAzimuthDeg: normalized, azimuthDeg: normalized, compassCapturedAt: new Date().toISOString(), siteSurveyCompassStatus: 'registered' });
      window.removeEventListener('deviceorientationabsolute', applyHeading);
      window.removeEventListener('deviceorientation', applyHeading);
    };
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission().then((state) => {
        if (state === 'granted') {
          window.addEventListener('deviceorientationabsolute', applyHeading, { once: true });
          window.addEventListener('deviceorientation', applyHeading, { once: true });
        } else {
          window.alert('دسترسی قطب‌نما تایید نشد؛ جهت را دستی وارد کنید.');
        }
      }).catch(() => window.alert('قطب‌نما در این مرورگر فعال نشد؛ جهت را دستی وارد کنید.'));
      return;
    }
    if ('DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientationabsolute', applyHeading, { once: true });
      window.addEventListener('deviceorientation', applyHeading, { once: true });
      window.setTimeout(() => window.alert('اگر مقدار جهت ثبت نشد، سنسور قطب‌نمای دستگاه در دسترس نیست و باید دستی وارد شود.'), 900);
    } else {
      window.alert('سنسور قطب‌نما در دسترس نیست؛ جهت را دستی وارد کنید.');
    }
  }

  function captureCameraOrientation() {
    const applyOrientation = (event) => {
      const rawHeading = event.webkitCompassHeading ?? (typeof event.alpha === 'number' ? 360 - event.alpha : null);
      const beta = typeof event.beta === 'number' ? event.beta : 0;
      const gamma = typeof event.gamma === 'number' ? event.gamma : 0;
      const heading = rawHeading == null || Number.isNaN(rawHeading) ? n(form.compassAzimuthDeg, n(form.azimuthDeg, 180)) : Math.round(((rawHeading % 360) + 360) % 360);
      const tilt = Math.min(90, Math.max(0, Math.round(Math.abs(beta || gamma || n(form.tiltAngle, 30)))));
      updateForm({
        cameraAzimuthDeg: heading,
        compassAzimuthDeg: heading,
        azimuthDeg: heading,
        cameraTiltDeg: tilt,
        tiltAngle: tilt,
        cameraOrientationStatus: 'captured_from_device_orientation',
        cameraCaptureAt: new Date().toISOString(),
      });
      window.removeEventListener('deviceorientationabsolute', applyOrientation);
      window.removeEventListener('deviceorientation', applyOrientation);
    };
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission().then((state) => {
        if (state === 'granted') {
          window.addEventListener('deviceorientationabsolute', applyOrientation, { once: true });
          window.addEventListener('deviceorientation', applyOrientation, { once: true });
        } else {
          window.alert('دسترسی سنسور دوربین/جهت تایید نشد؛ Azimuth و Tilt را دستی وارد کنید.');
        }
      }).catch(() => window.alert('سنسور جهت/زاویه فعال نشد؛ مقادیر را دستی وارد کنید.'));
      return;
    }
    if ('DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientationabsolute', applyOrientation, { once: true });
      window.addEventListener('deviceorientation', applyOrientation, { once: true });
      window.setTimeout(() => window.alert('اگر مقدار Azimuth/Tilt ثبت نشد، دستگاه یا مرورگر اجازه دسترسی به سنسور نداده است.'), 900);
    } else {
      window.alert('سنسور جهت/زاویه در دسترس نیست؛ مقادیر را دستی وارد کنید.');
    }
  }

  function captureFile(key, file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateForm({
      [key]: reader.result,
      [`${key}Name`]: file.name,
      [`${key}CapturedAt`]: new Date().toISOString(),
      ...(key === 'sitePhotoUrl' ? { siteSurveyPhotoStatus: 'registered' } : {}),
      ...(key === 'compassScreenshotUrl' ? { siteSurveyCompassImageStatus: 'registered' } : {}),
    });
    reader.readAsDataURL(file);
  }

  async function fetchClimateData() {
    const latitude = n(form.latitude, city.latitude || 32);
    const longitude = n(form.longitude, city.longitude || 53);
    if (!latitude || !longitude) {
      window.alert('برای دریافت PSH واقعی ابتدا GPS یا مختصات محل نصب را ثبت کنید.');
      return;
    }
    setClimateLoading(true);
    setClimateError('');
    try {
      const installedPvKw = Math.max(n(form.panelWatt, 585) * Math.max(n(form.panelCount, 1), 1) / 1000, 1);
      const data = await fetchOnlineClimateIntelligence({
        latitude,
        longitude,
        installedPvKw,
        source: form.climateDataSource === 'solcast_online_forecast' ? 'solcast_online_forecast' : 'nasa_power_online',
        apiKey: import.meta.env.VITE_SOLCAST_API_KEY,
      });
      updateForm({
        climateDataSource: data.source,
        climateProvider: data.provider,
        climateOnlineStatus: data.rawStatus || 'online_success',
        climateFetchedAt: data.fetchedAt,
        climateFallbackReason: data.fallbackReason || '',
        realPsh: data.realPsh,
        realIrradianceKwhM2Day: data.realIrradianceKwhM2Day,
        clearSkyIrradianceKwhM2Day: data.clearSkyIrradianceKwhM2Day,
        realAverageTemperature: data.realAverageTemperature,
        realMinTemperature: data.realMinTemperature,
        realMaxTemperature: data.realMaxTemperature,
        autoTemperatureFactor: data.autoTemperatureFactor,
        autoIrradianceFactor: data.autoIrradianceFactor,
        autoDustFactor: data.autoDustFactor,
        autoSeasonalFactor: data.autoSeasonalFactor,
        environmentalAutoFactor: data.environmentalAutoFactor,
        predictedDailyProductionKwh: data.productionForecast?.dailyProductionKwh,
        predictedAnnualProductionKwh: data.productionForecast?.annualProductionKwh,
        climateMonthlyPshJson: JSON.stringify(data.monthlyPsh || []),
        climateProductionForecastJson: JSON.stringify(data.productionForecast || {}),
        sunHours: data.realPsh || form.sunHours,
        averageTemperature: data.realAverageTemperature || form.averageTemperature,
        minTemperature: data.realMinTemperature || form.minTemperature,
        maxTemperature: data.realMaxTemperature || form.maxTemperature,
        dustFactor: data.autoDustFactor || form.dustFactor,
        climateCorrectionEnabled: true,
      });
    } catch (error) {
      setClimateError(error.message || 'دریافت داده اقلیمی آنلاین ناموفق بود.');
    } finally {
      setClimateLoading(false);
    }
  }
  return (
    <div className="site-stage environmental-intelligence-stage phase-v3-site-survey">
      <div className="form-instruction-top">فاز Site Survey فعال است: GPS، عکس محل، قطب‌نما، سایه و Climate Cache همگی در موتور واحد ذخیره و وارد گزارش نهایی می‌شوند.</div>
      <section className="site-survey-capture-board" aria-label="ثبت اطلاعات محل نصب">
        <div className="site-survey-capture-board__head">
          <strong>ثبت اطلاعات محل نصب</strong>
          <span>این پنج داده به عنوان Snapshot مهندسی سایت ذخیره می‌شوند و در چکیده، گزارش نهایی و PDF نمایش داده خواهند شد.</span>
        </div>
        <div className="site-survey-capture-grid">
          <div className="site-survey-capture-item">
            <span>ثبت GPS</span>
            <strong>{form.siteGps || `${form.latitude || '—'}, ${form.longitude || '—'}`}</strong>
            <small>{form.gpsAccuracyM ? `دقت تقریبی ${form.gpsAccuracyM} متر` : 'قابل ثبت با موبایل یا ورود دستی'}</small>
            <button type="button" className="btn btn--ghost" onClick={captureGps}>دریافت GPS</button>
          </div>
          <div className="site-survey-capture-item">
            <span>ثبت جهت جغرافیایی</span>
            <strong>{form.compassAzimuthDeg || form.azimuthDeg || '—'}°</strong>
            <small>جنوب تقریبی = 180 درجه</small>
            <button type="button" className="btn btn--ghost" onClick={captureCompassHeading}>خواندن قطب‌نما</button>
          </div>
          <div className="site-survey-capture-item">
            <span>ثبت زاویه نصب</span>
            <strong>{form.tiltAngle || '—'}°</strong>
            <small>پیشنهاد اولیه بر اساس عرض جغرافیایی شهر تنظیم می‌شود.</small>
          </div>
          <div className="site-survey-capture-item media">
            <span>عکس محل نصب</span>
            {form.sitePhotoUrl ? <img src={form.sitePhotoUrl} alt="عکس محل نصب" /> : <strong>ثبت نشده</strong>}
            <small>{form.sitePhotoUrlName || 'دوربین یا آپلود تصویر'}</small>
          </div>
          <div className="site-survey-capture-item media">
            <span>اسکرین‌شات قطب‌نما</span>
            {form.compassScreenshotUrl ? <img src={form.compassScreenshotUrl} alt="اسکرین‌شات قطب‌نما" /> : <strong>ثبت نشده</strong>}
            <small>{form.compassScreenshotUrlName || 'برای مستندسازی جهت نصب'}</small>
          </div>
        </div>
      </section>
      <section className="camera-orientation-board" aria-label="تشخیص جهت و زاویه با دوربین">
        <div className="site-survey-capture-board__head">
          <strong>تشخیص جهت و زاویه با دوربین</strong>
          <span>مشابه SunSurveyor: اپ از سنسورهای دستگاه Azimuth و Tilt را می‌خواند؛ اگر سنسور در دسترس نبود، ورود دستی فعال می‌ماند.</span>
        </div>
        <div className="camera-orientation-grid">
          <Field label="Azimuth دوربین"><input inputMode="decimal" value={form.cameraAzimuthDeg ?? form.compassAzimuthDeg ?? form.azimuthDeg ?? ""} onChange={(event) => updateForm({ cameraAzimuthDeg: event.target.value, compassAzimuthDeg: event.target.value, azimuthDeg: event.target.value, cameraOrientationStatus: 'manual' })} /></Field>
          <Field label="Tilt دوربین"><input inputMode="decimal" value={form.cameraTiltDeg ?? form.tiltAngle ?? ""} onChange={(event) => updateForm({ cameraTiltDeg: event.target.value, tiltAngle: event.target.value, cameraOrientationStatus: 'manual' })} /></Field>
          <Field label="تشخیص با سنسور موبایل"><button type="button" className="btn btn--primary" onClick={captureCameraOrientation}>خواندن Azimuth / Tilt</button></Field>
          <Field label="وضعیت تشخیص"><input value={form.cameraOrientationStatus || 'ثبت نشده'} readOnly /></Field>
        </div>
      </section>
      <div className="environmental-intelligence-layout">
        <section className="environment-map-panel" aria-label="نقشه تابش ایران">
          <img src="/images/branding/environment-map.jpg" alt="نقشه تابش و شرایط اقلیمی ایران" />
          <div className="environment-map-panel__overlay">
            <strong>{form.city || "انتخاب شهر"}</strong>
            <span>{city.province || "استان"}</span>
          </div>
        </section>
        <section className="environment-fields-panel">
          <div className="focus-form-table environment-fields-grid">
            <Field label="جستجوی شهر پروژه"><CitySearch value={form.city || "اصفهان"} onSelect={(selected) => applyCityPatch(selected, updateForm)} /></Field>
            <Field label="تابش موثر"><input inputMode="decimal" value={form.sunHours ?? city.sunHours} onChange={(event) => updateForm({ sunHours: event.target.value })} /></Field>
            <Field label="کلاس تابش"><input value={n(form.sunHours, city.sunHours) >= 5.5 ? "عالی" : n(form.sunHours, city.sunHours) >= 4.8 ? "خوب" : "متوسط"} readOnly /></Field>
            <Field label="محدوده دمای محیطی"><input value={`${form.minTemperature ?? city.minTemperature} تا ${form.maxTemperature ?? city.maxTemperature} درجه`} readOnly /></Field>
            <Field label="ضریب سایه"><input inputMode="decimal" value={form.shadingFactor ?? 0.95} onChange={(event) => updateForm({ shadingFactor: event.target.value })} /></Field>
            <Field label="ضریب گرد و غبار"><input inputMode="decimal" value={form.dustFactor ?? 0.96} onChange={(event) => updateForm({ dustFactor: event.target.value })} /></Field>
            <Field label="ثبت زاویه نصب"><input inputMode="decimal" value={form.tiltAngle ?? 30} onChange={(event) => updateForm({ tiltAngle: event.target.value })} /></Field>
            <Field label="ارتفاع از سطح دریا"><input inputMode="decimal" value={form.altitude ?? city.altitude} onChange={(event) => updateForm({ altitude: event.target.value })} /></Field>
            <Field label="ثبت GPS محل نصب"><div className="inline-action-field"><input value={form.siteGps || `${form.latitude || ''}, ${form.longitude || ''}`} onChange={(event) => updateForm({ siteGps: event.target.value })} placeholder="مثال: 32.65, 51.67" /><button type="button" className="btn btn--ghost" onClick={captureGps}>دریافت GPS</button></div></Field>
            <Field label="عرض جغرافیایی"><input inputMode="decimal" value={form.latitude ?? city.latitude ?? ""} onChange={(event) => updateForm({ latitude: event.target.value })} /></Field>
            <Field label="طول جغرافیایی"><input inputMode="decimal" value={form.longitude ?? city.longitude ?? ""} onChange={(event) => updateForm({ longitude: event.target.value })} /></Field>
            <Field label="ثبت جهت جغرافیایی / Azimuth"><input inputMode="decimal" value={form.compassAzimuthDeg ?? form.azimuthDeg ?? 180} onChange={(event) => updateForm({ compassAzimuthDeg: event.target.value, azimuthDeg: event.target.value })} placeholder="جنوب=180 یا انحراف از جنوب" /></Field>
            <Field label="عکس محل نصب"><input type="file" accept="image/*" capture="environment" onChange={(event) => captureFile('sitePhotoUrl', event.target.files?.[0])} /></Field>
            <Field label="اسکرین‌شات قطب‌نما"><input type="file" accept="image/*" onChange={(event) => captureFile('compassScreenshotUrl', event.target.files?.[0])} /></Field>
            <div className="engineering-subsection-title">تحلیل سایه اختصاصی</div>
            <Field label="ارتفاع موانع"><input inputMode="decimal" value={form.shadowObstacleHeightM ?? ""} onChange={(event) => updateForm({ shadowObstacleHeightM: event.target.value })} placeholder="متر" /></Field>
            <Field label="فاصله مانع تا پنل"><input inputMode="decimal" value={form.shadowObstacleDistanceM ?? ""} onChange={(event) => updateForm({ shadowObstacleDistanceM: event.target.value })} placeholder="متر" /></Field>
            <Field label="جهت مانع"><input inputMode="decimal" value={form.shadowObstacleDirectionDeg ?? 180} onChange={(event) => updateForm({ shadowObstacleDirectionDeg: event.target.value })} placeholder="درجه؛ جنوب=180" /></Field>
            <Field label="درصد سایه دستی"><input inputMode="decimal" value={form.shadowPercent ?? form.manualShadowPercent ?? ""} onChange={(event) => updateForm({ shadowPercent: event.target.value, manualShadowPercent: event.target.value })} placeholder="درصد، مثلا 8" /></Field>
            <Field label="ساعات بحرانی سایه"><input value={form.shadowCriticalHours || ""} onChange={(event) => updateForm({ shadowCriticalHours: event.target.value })} placeholder="مثال: 8-10 صبح / 15-17" /></Field>
            <Field label="تلفات سایه محاسبه‌شده"><input value={`${estimatedShadowLoss}%`} readOnly /></Field>
            <div className="engineering-subsection-title">Temperature & Voltage Correction</div>
            <Field label="دمای حداقل واقعی"><input inputMode="decimal" value={form.realMinTemperature ?? form.minTemperature ?? ""} onChange={(event) => updateForm({ realMinTemperature: event.target.value, minTemperature: event.target.value })} placeholder="°C" /></Field>
            <Field label="دمای حداکثر واقعی"><input inputMode="decimal" value={form.realMaxTemperature ?? form.maxTemperature ?? ""} onChange={(event) => updateForm({ realMaxTemperature: event.target.value, maxTemperature: event.target.value })} placeholder="°C" /></Field>
            <Field label="Voc correction"><input value={`${previewVocCold} V / module`} readOnly /></Field>
            <Field label="Vmp correction"><input value={`${previewVmpHot} V / module`} readOnly /></Field>
            <Field label="Isc correction"><input value={`${previewIscHot} A / module`} readOnly /></Field>
            <Field label="ضریب Voc / Vmp / Isc"><input value={`${form.panelTempCoeffVoc ?? form.vocTemperatureCoeff ?? 0.0024} / ${form.panelTempCoeffVmp ?? form.vmpTemperatureCoeff ?? 0.0029} / ${form.panelTempCoeffIsc ?? form.iscTemperatureCoeff ?? 0.0005}`} readOnly /></Field>
            <Field label="منبع داده اقلیمی"><select value={form.climateDataSource || 'offline_iran_climate_cache'} onChange={(event) => updateForm({ climateDataSource: event.target.value })}><option value="offline_iran_climate_cache">کش آفلاین ایران</option><option value="nasa_power_online">NASA POWER آنلاین</option><option value="solcast_online_forecast">Solcast Forecast آنلاین</option><option value="manual_engineering">ورود دستی مهندسی</option></select></Field>
            <Field label="اعمال اصلاح اقلیمی روی محاسبات"><select value={form.climateCorrectionEnabled ? 'yes' : 'no'} onChange={(event) => updateForm({ climateCorrectionEnabled: event.target.value === 'yes' })}><option value="no">فقط گزارش/پیش‌نمایش</option><option value="yes">اعمال در موتور محاسبات</option></select></Field>
            <Field label="دریافت PSH، دما و تابش واقعی"><button type="button" className="btn btn--primary" onClick={fetchClimateData} disabled={climateLoading}>{climateLoading ? 'در حال دریافت...' : 'دریافت داده آنلاین'}</button></Field>
            <Field label="PSH واقعی"><input inputMode="decimal" value={form.realPsh ?? ''} onChange={(event) => updateForm({ realPsh: event.target.value })} placeholder="پس از دریافت آنلاین تکمیل می‌شود" /></Field>
            <Field label="تابش واقعی kWh/m²/day"><input inputMode="decimal" value={form.realIrradianceKwhM2Day ?? ''} onChange={(event) => updateForm({ realIrradianceKwhM2Day: event.target.value })} /></Field>
            <Field label="دمای واقعی میانگین"><input inputMode="decimal" value={form.realAverageTemperature ?? ''} onChange={(event) => updateForm({ realAverageTemperature: event.target.value })} /></Field>
            <Field label="دمای واقعی حداقل / حداکثر"><input value={`${form.realMinTemperature ?? '—'} / ${form.realMaxTemperature ?? '—'}`} readOnly /></Field>
            <Field label="ضریب محیطی خودکار"><input value={form.environmentalAutoFactor ?? ''} readOnly /></Field>
            <Field label="پیش‌بینی تولید روزانه"><input value={form.predictedDailyProductionKwh ? `${form.predictedDailyProductionKwh} kWh/day` : 'بعد از دریافت داده آنلاین'} readOnly /></Field>
            <Field label="پیش‌بینی تولید سالانه"><input value={form.predictedAnnualProductionKwh ? `${form.predictedAnnualProductionKwh} kWh/year` : 'بعد از دریافت داده آنلاین'} readOnly /></Field>
          </div>
          {climateError ? <div className="climate-online-error">خطای دریافت اقلیم آنلاین: {climateError}</div> : null}
          <section className="env-table-card environment-summary-card">
            <div className="env-table-grid"><div><span>شهر</span><strong>{form.city}</strong></div><div><span>استان</span><strong>{city.province}</strong></div><div><span>تابش استاندارد</span><strong>{city.sunHours}</strong></div><div><span>PSH واقعی</span><strong>{form.realPsh || "—"}</strong></div><div><span>PSH اصلاح‌شده</span><strong>{correctedPshPreview}</strong></div><div><span>تابش واقعی</span><strong>{form.realIrradianceKwhM2Day || "—"}</strong></div><div><span>دمای واقعی</span><strong>{form.realAverageTemperature ? `${form.realAverageTemperature}°C` : "—"}</strong></div><div><span>ضریب محیطی خودکار</span><strong>{form.environmentalAutoFactor || "—"}</strong></div><div><span>تولید سالانه پیش‌بینی‌شده</span><strong>{form.predictedAnnualProductionKwh ? `${form.predictedAnnualProductionKwh} kWh` : "—"}</strong></div><div><span>منبع اقلیم</span><strong>{form.climateProvider || form.climateDataSource || "offline"}</strong></div><div><span>زاویه افق مانع</span><strong>{shadowAngle.toFixed(1)}°</strong></div><div><span>درصد سایه دستی</span><strong>{manualShadowPercent || '—'}%</strong></div><div><span>تلفات سایه تخمینی</span><strong>{estimatedShadowLoss}%</strong></div><div><span>Voc/Vmp/Isc اصلاحی</span><strong>{previewVocCold}V / {previewVmpHot}V / {previewIscHot}A</strong></div><div><span>عکس سایت</span><strong>{form.sitePhotoUrl ? "ثبت شده" : "ثبت نشده"}</strong></div><div><span>قطب‌نما</span><strong>{form.compassScreenshotUrl ? "ثبت شده" : "ثبت نشده"}</strong></div><div><span>Azimuth/Tilt دوربین</span><strong>{form.cameraAzimuthDeg || form.azimuthDeg || "—"}° / {form.cameraTiltDeg || form.tiltAngle || "—"}°</strong></div><div><span>وضعیت</span><strong>Site/Shadow/Climate Online فعال</strong></div></div>
          </section>
        </section>
      </div>
    </div>
  );
}

export function BankSelector({ label, category, selectedId, onSelect }) {
  const [open, setOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [custom, setCustom] = useState({ title: "", power: "", voltage: "", capacity: "" });
  const items = EquipmentRepository.search({ category, query: "" });
  const selected = selectedId ? EquipmentRepository.getById(selectedId) : null;
  function addCustomBankItem() {
    if (!custom.title.trim()) return;
    const specs = {};
    if (category === "panel") Object.assign(specs, { panelWatt: n(custom.power, 550), panelVoc: n(custom.voltage, 50), panelVmp: n(custom.voltage, 41) });
    if (category === "battery") Object.assign(specs, { batteryUnitAh: n(custom.capacity, 100), batteryUnitVoltage: n(custom.voltage, 48), batteryType: "LFP", dod: 0.8 });
    if (category === "inverter") Object.assign(specs, { ratedPowerW: n(custom.power, 5000), systemVoltage: n(custom.voltage, 48), maxPvVocV: 500, mpptMinVoltage: 30, mpptMaxVoltage: 450, mpptCount: 1, inverterMode: "hybrid" });
    const item = EquipmentRepository.addCustomEquipment({ category, title: custom.title.trim(), summary: "تجهیز کاربرساخت؛ در انتظار تایید ادمین", specs, source: "user", approvalStatus: "pending_admin_review" });
    onSelect(item);
    setCustom({ title: "", power: "", voltage: "", capacity: "" });
    setCustomOpen(false);
    setOpen(false);
  }
  return (
    <section className="bank-selector-card">
      <button type="button" className="bank-selector-head" onClick={() => setOpen((value) => !value)}><strong>{label}</strong><span>{selected?.title || "پیشنهاد هوشمند"}</span>{selected?.isCustom ? <em>کاربرساخت</em> : null}</button>
      {open ? <div className="bank-scroll-list">
        {items.map((item) => <button key={item.id} type="button" className={selectedId === item.id ? "is-active" : ""} onClick={() => onSelect(item)}><strong>{item.title}</strong><span>{item.summary}</span>{item.isCustom ? <em>کاربرساخت / در انتظار تایید ادمین</em> : null}</button>)}
        <button type="button" className="add-custom-bank" onClick={() => setCustomOpen((v) => !v)}>+ افزودن {label.replace('بانک ', '')} جدید</button>
        {customOpen ? <div className="custom-bank-form">
          <input value={custom.title} onChange={(e)=>setCustom({...custom,title:e.target.value})} placeholder="نام تجهیز" />
          <input inputMode="decimal" value={custom.power} onChange={(e)=>setCustom({...custom,power:e.target.value})} placeholder={category === 'battery' ? 'توان/اختیاری' : 'توان W'} />
          <input inputMode="decimal" value={custom.voltage} onChange={(e)=>setCustom({...custom,voltage:e.target.value})} placeholder="ولتاژ" />
          {category === 'battery' ? <input inputMode="decimal" value={custom.capacity} onChange={(e)=>setCustom({...custom,capacity:e.target.value})} placeholder="Ah" /> : null}
          <button className="btn btn--secondary" type="button" onClick={addCustomBankItem}>ذخیره در بانک کاربر</button>
        </div> : null}
      </div> : null}
    </section>
  );
}


export function SystemConfig({ form, updateForm }) {
  const rec = recommendation(form);
  const selectedInverter = form.selectedEquipment?.inverter ? EquipmentRepository.getById(form.selectedEquipment.inverter) : rec.inverter;
  const selectedPanel = form.selectedEquipment?.panel ? EquipmentRepository.getById(form.selectedEquipment.panel) : rec.panel;
  const selectedBattery = form.selectedEquipment?.battery ? EquipmentRepository.getById(form.selectedEquipment.battery) : rec.battery;
  const isBackup = form.systemType === "backup";
  const recovery = buildRecoveryPlan(form);
  const selectedRecoveryId = form.engineeringRecoveryChoice || "";
  const selectedRecovery = recovery.options.find((item) => item.id === selectedRecoveryId) || null;
  const pendingDecision = selectedRecovery || recovery.suggested || null;
  const inverterCount = Math.max(1, n(form.requestedParallelInverters, n(form.inverterParallelDesignCount, 1)));
  const unitInvW = n(selectedInverter?.specs?.ratedPowerW, n(form.inverterRatedPowerW, rec.requiredW));
  const unitSurgeW = n(selectedInverter?.specs?.surgePowerW, n(form.inverterUnitSurgeW, unitInvW * 2));
  const unitMppt = n(selectedInverter?.specs?.mpptCount, n(form.mpptUnitCount, n(form.mpptCount, 1) / Math.max(inverterCount, 1)));
  const unitMaxPv = n(selectedInverter?.specs?.maxPvPowerW, n(form.maxPvPowerW, 0) / Math.max(inverterCount, 1));
  const unitMaxPvPerMppt = n(selectedInverter?.specs?.maxPvPowerPerMpptW, n(form.maxPvPowerPerMpptW, 0));
  const designSource = form.scenarioId ? `سناریوی آماده${form.scenarioTitle ? `: ${form.scenarioTitle}` : ""}` : form.calculationMode ? `طراحی از مسیر ${METHOD_LABELS[form.calculationMode] || form.calculationMode}` : "مسیر طراحی هنوز کامل نشده";
  const topologyLabel = inverterCount > 1 ? `معماری چند اینورتری / ${inverterCount} واحد موازی` : "معماری تک اینورتر";
  const decisionLabel = form.engineeringDecisionSource === 'user_recovery_option'
    ? `انتخاب کاربر از پیشنهادات اپ: ${form.engineeringDecisionTitle || '—'}`
    : form.engineeringDecisionSource === 'app_auto_recovery'
      ? `پیشنهاد هوشمند اپ اعمال شده: ${form.engineeringDecisionTitle || '—'}`
      : form.engineeringRecoveryApplied
        ? `تصمیم اعمال‌شده: ${form.engineeringDecisionTitle || '—'}`
        : "تصمیم اصلاحی هنوز اعمال نشده";

  function select(role, item) {
    const specs = item.specs || {};
    const patch = { selectedEquipment: { ...(form.selectedEquipment || {}), [role]: item.id } };
    if (role === "panel") Object.assign(patch, { panelWatt: specs.panelWatt, panelVoc: specs.panelVoc, panelVmp: specs.panelVmp });
    if (role === "battery") Object.assign(patch, { batteryUnitAh: specs.batteryUnitAh, batteryUnitVoltage: specs.batteryUnitVoltage, batteryType: specs.batteryType || form.batteryType, dod: specs.dod || form.dod });
    if (role === "inverter") {
      const count = Math.max(1, n(form.requestedParallelInverters, 1));
      const mpptUnit = n(specs.mpptCount, 1);
      Object.assign(patch, {
        inverterEfficiency: specs.inverterEfficiency,
        systemVoltage: specs.systemVoltage || form.systemVoltage,
        inverterRatedPowerW: specs.inverterRatedPowerW || specs.ratedPowerW || form.inverterRatedPowerW,
        inverterAcPowerW: specs.inverterAcPowerW || specs.ratedPowerW || form.inverterAcPowerW,
        inverterUnitSurgeW: specs.surgePowerW || (specs.ratedPowerW || form.inverterRatedPowerW) * 2,
        maxPvVocV: specs.maxPvVocV || form.maxPvVocV,
        controllerMaxVoc: specs.controllerMaxVoc || specs.maxPvVocV || form.controllerMaxVoc,
        mpptMinVoltage: specs.mpptMinVoltage || form.mpptMinVoltage,
        mpptMaxVoltage: specs.mpptMaxVoltage || form.mpptMaxVoltage,
        mpptStartupVoltage: specs.mpptStartupVoltage || specs.mpptMinVoltage || form.mpptStartupVoltage,
        mpptUnitCount: mpptUnit,
        mpptCount: mpptUnit * count,
        maxPvPowerPerMpptW: specs.maxPvPowerPerMpptW || form.maxPvPowerPerMpptW,
        maxPvPowerW: n(specs.maxPvPowerW, n(form.maxPvPowerW, 0)) * count,
        offgridMpptProfileId: specs.offgridMpptProfileId || form.offgridMpptProfileId,
        offgridMpptProfileTitle: specs.offgridMpptProfileTitle || form.offgridMpptProfileTitle,
      });
    }
    updateForm(patch);
  }

  function changeInverterCount(value) {
    const count = Math.max(1, n(value, 1));
    const mpptUnit = n(selectedInverter?.specs?.mpptCount, unitMppt || 1);
    const maxPvUnit = n(selectedInverter?.specs?.maxPvPowerW, unitMaxPv || 0);
    updateForm({
      requestedParallelInverters: count,
      inverterParallelDesignCount: count,
      inverterParallelCapable: count > 1,
      mpptUnitCount: mpptUnit,
      mpptCount: mpptUnit * count,
      maxPvPowerW: maxPvUnit ? maxPvUnit * count : form.maxPvPowerW,
      engineeringRecoveryApplied: count > 1 || form.engineeringRecoveryApplied,
      engineeringDecisionSource: count > 1 ? 'manual_parallel_count' : form.engineeringDecisionSource,
      engineeringDecisionTitle: count > 1 ? `${count} عدد اینورتر موازی توسط کاربر تنظیم شد` : form.engineeringDecisionTitle,
    });
  }

  function chooseRecovery(option) {
    updateForm({
      engineeringRecoveryChoice: option.id,
      engineeringRecoverySelectedTitle: option.title,
      engineeringRecoverySelectedBadge: option.badge,
      engineeringRecoverySelectedDescription: option.description,
    });
  }

  function applyDecision() {
    const option = selectedRecovery || recovery.suggested;
    if (!option) return;
    updateForm({
      ...option.patch,
      engineeringRecoveryChoice: option.id,
      engineeringRecoveryApplied: true,
      engineeringDecisionSource: selectedRecovery ? 'user_recovery_option' : 'app_auto_recovery',
      engineeringDecisionTitle: option.title,
      engineeringDecisionDescription: option.description,
      designEvolution: [
        ...(form.designEvolution || []),
        {
          step: 'systemConfig',
          source: selectedRecovery ? 'user' : 'app',
          title: option.title,
          at: new Date().toISOString(),
        },
      ],
    });
  }

  const canPassCurrentChoice = (unitInvW * inverterCount) >= rec.demand.powerW && (unitSurgeW * inverterCount) >= rec.demand.surgeW;

  return (
    <div className="config-stage engineering-config-vnext">
      <section className="engineering-overview-header">
        <div className="engineering-overview-header__title">
          <span>خلاصه مهندسی سیستم</span>
          <strong>{systemLabel(form.systemType)} / {METHOD_LABELS[form.calculationMode] || "روش نامشخص"}</strong>
        </div>
        <div className="engineering-overview-grid">
          <div><span>مبنای طراحی</span><strong>{designSource}</strong></div>
          <div><span>مسیر تصمیم</span><strong>{decisionLabel}</strong></div>
          <div><span>توان موردنیاز</span><strong>{(rec.requiredW / 1000).toFixed(1)} kW</strong></div>
          <div><span>توان اینورتر کل</span><strong>{((unitInvW * inverterCount) / 1000).toFixed(1)} kW</strong></div>
          <div><span>تعداد اینورتر</span><strong>{inverterCount} عدد</strong></div>
          <div><span>وضعیت</span><strong>{canPassCurrentChoice ? "قابل ادامه" : "نیازمند اصلاح"}</strong></div>
          <div><span>توپولوژی اجرا</span><strong>{topologyLabel}</strong></div>
          <div><span>نسخه Flow</span><strong>Phase Engineering v2</strong></div>
        </div>
      </section>

      <section className="selected-equipment-strip">
        {!isBackup ? <BankSelector label="بانک پنل خورشیدی" category="panel" selectedId={form.selectedEquipment?.panel || selectedPanel?.id} onSelect={(item) => select("panel", item)} /> : null}
        <BankSelector label={isBackup ? "بانک UPS / سانورتر" : "بانک اینورتر"} category="inverter" selectedId={form.selectedEquipment?.inverter || selectedInverter?.id} onSelect={(item) => select("inverter", item)} />
        <BankSelector label="بانک باتری" category="battery" selectedId={form.selectedEquipment?.battery || selectedBattery?.id} onSelect={(item) => select("battery", item)} />
      </section>

      <section className="distributed-field-panel">
        <div className="distributed-field-panel__head"><strong>فیلدهای فنی تجهیزات</strong><span>مقادیر پایه برای یک اینورتر هستند؛ مقدار کل با ضریب تعداد اینورتر محاسبه می‌شود.</span></div>
        <div className="base-total-ribbon"><span>هر اینورتر: {(unitInvW/1000).toFixed(1)}kW / {unitMppt || 0} MPPT</span><span>کل سیستم: {((unitInvW*inverterCount)/1000).toFixed(1)}kW / {(unitMppt || 0)*inverterCount} MPPT</span><span>ضریب تعداد: ×{inverterCount}</span></div>
        <div className="focus-form-table">
          <Field label="تعداد اینورتر موازی"><input inputMode="decimal" value={inverterCount} onChange={(event) => changeInverterCount(event.target.value)} /></Field>
          <Field label="توان هر اینورتر"><input inputMode="decimal" value={unitInvW} onChange={(event) => updateForm({ inverterRatedPowerW: event.target.value, inverterAcPowerW: event.target.value })} /></Field>
          <Field label="توان کل با ضریب تعداد"><input readOnly value={`${((unitInvW * inverterCount) / 1000).toFixed(1)} kW = ${(unitInvW / 1000).toFixed(1)} × ${inverterCount}`} /></Field>
          <Field label="Surge هر اینورتر"><input inputMode="decimal" value={unitSurgeW} onChange={(event) => updateForm({ inverterUnitSurgeW: event.target.value })} /></Field>
          <Field label="Surge کل با ضریب تعداد"><input readOnly value={`${((unitSurgeW * inverterCount) / 1000).toFixed(1)} kW`} /></Field>
          {!isBackup ? <>
            <Field label="MPPT هر اینورتر"><input inputMode="decimal" value={unitMppt} onChange={(event) => updateForm({ mpptUnitCount: event.target.value, mpptCount: n(event.target.value, 1) * inverterCount })} /></Field>
            <Field label="MPPT کل سیستم"><input readOnly value={`${unitMppt * inverterCount} = ${unitMppt} × ${inverterCount}`} /></Field>
            <Field label="حداکثر Voc PV"><input inputMode="decimal" value={form.maxPvVocV ?? selectedInverter?.specs?.maxPvVocV ?? 500} onChange={(event) => updateForm({ maxPvVocV: event.target.value, controllerMaxVoc: event.target.value })} /></Field>
            <Field label="بازه MPPT"><input readOnly value={`${form.mpptMinVoltage ?? selectedInverter?.specs?.mpptMinVoltage ?? 30} تا ${form.mpptMaxVoltage ?? selectedInverter?.specs?.mpptMaxVoltage ?? 450} V`} /></Field>
            <Field label="توان PV هر اینورتر"><input inputMode="decimal" value={unitMaxPv || 0} onChange={(event) => updateForm({ maxPvPowerW: n(event.target.value, 0) * inverterCount })} /></Field>
            <Field label="توان PV کل"><input readOnly value={unitMaxPv ? `${(unitMaxPv * inverterCount / 1000).toFixed(1)} kWp` : "خودکار"} /></Field>
          </> : null}
          <Field label="ولتاژ بانک اینورتر/باتری"><input inputMode="decimal" value={form.systemVoltage ?? 48} onChange={(event) => updateForm({ systemVoltage: event.target.value })} /></Field>
          <Field label="ولتاژ هر باتری"><input inputMode="decimal" value={form.batteryUnitVoltage ?? selectedBattery?.specs?.batteryUnitVoltage ?? 51.2} onChange={(event) => updateForm({ batteryUnitVoltage: event.target.value })} /></Field>
          <Field label="ظرفیت هر باتری Ah"><input inputMode="decimal" value={form.batteryUnitAh ?? selectedBattery?.specs?.batteryUnitAh ?? 100} onChange={(event) => updateForm({ batteryUnitAh: event.target.value })} /></Field>
          <Field label="ضریب افزایش باتری"><input inputMode="decimal" value={form.batteryFactor ?? 1} onChange={(event) => updateForm({ batteryFactor: event.target.value })} /></Field>
          {isBackup ? <Field label="ساعت برق اضطراری"><input inputMode="decimal" value={form.backupHours ?? 2} onChange={(event) => updateForm({ backupHours: event.target.value })} /></Field> : <Field label="روز خودکفایی"><input inputMode="decimal" value={form.daysAutonomy ?? 0} onChange={(event) => updateForm({ daysAutonomy: event.target.value })} /></Field>}
          <Field label="نوع باتری"><select value={form.batteryType || "LFP"} onChange={(event) => updateForm({ batteryType: event.target.value, dod: BATTERY_DOD[event.target.value] || 0.8 })}>{BATTERY_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</select></Field>
          <Field label="DoD"><input inputMode="decimal" value={form.dod ?? 0.8} onChange={(event) => updateForm({ dod: event.target.value })} /></Field>
          <Field label="راندمان اینورتر"><input inputMode="decimal" value={form.inverterEfficiency ?? 0.93} onChange={(event) => updateForm({ inverterEfficiency: event.target.value })} /></Field>
          <Field label="ضریب تلفات کابل"><input inputMode="decimal" value={form.cableLossFactor ?? 0.97} onChange={(event) => updateForm({ cableLossFactor: event.target.value })} /></Field>
          <Field label="ضریب اطمینان طراحی"><input inputMode="decimal" value={form.designFactor ?? 1.2} onChange={(event) => updateForm({ designFactor: event.target.value })} /></Field>
        </div>
      </section>

      {recovery.needsRecovery ? <section className="engineering-recovery-card">
        <div className="engineering-recovery-card__head"><span>پیشنهادات اپ برای ادامه مسیر</span><strong>Multi Architecture Recovery</strong></div>
        <p>{recovery.decisionText}</p>
        {!canPassCurrentChoice ? <div className="engineering-choice-error">انتخاب فعلی قابل اجرا نیست؛ توان یا Surge کافی نیست. یکی از پیشنهادها را انتخاب کنید یا تعداد اینورتر را تا رسیدن به ظرفیت لازم افزایش دهید.</div> : null}
        <p className="engineering-recovery-note">توان پیشنهادی اینورتر جدید حدود {recovery.requiredKw} کیلووات است. یکی از معماری‌های زیر را انتخاب کنید؛ اگر انتخابی انجام نشود، تصمیم هوشمند اپ بهترین گزینه را اعمال می‌کند.</p>
        <div className="engineering-recovery-options">
          {recovery.options.map((option) => (
            <button key={option.id} type="button" className={selectedRecoveryId === option.id ? "is-active" : ""} onClick={() => chooseRecovery(option)}>
              <em>{option.badge}</em><strong>{option.title}</strong><span>{option.description}</span>
            </button>
          ))}
        </div>
      </section> : null}

      <section className="smart-decision-card decision-commit-card">
        <h3>تصمیم هوشمند اپ</h3>
        {recovery.needsRecovery ? <>
          <p><b>وضعیت انتخاب:</b> {selectedRecovery ? `کاربر انتخاب کرده: ${selectedRecovery.title}` : `انتخابی انجام نشده؛ اپ این پیشنهاد را اعمال می‌کند: ${recovery.suggested?.title || '—'}`}</p>
          <p>{selectedRecovery?.description || recovery.suggested?.description}</p>
          <button className="btn btn--primary smart-apply-button" type="button" onClick={applyDecision}>اعمال تصمیم هوشمند اپ</button>
        </> : <p>طراحی فعلی از نظر توان پیوسته و لحظه‌ای قابل ادامه است. در صورت تغییر تعداد اینورتر یا تجهیزات، تمام فیلدهای بالا و موتور محاسبات دوباره به‌روزرسانی می‌شوند.</p>}
      </section>
    </div>
  );
}

export function Review({ form, goToStep }) {
  const rec = recommendation(form);
  const result = runEngineeringDesign(form);
  const summary = result.result?.summary || {};
  const battery = result.result?.battery || {};
  const pv = result.result?.pv || {};
  const protection = result.result?.protection || {};
  const cabling = result.result?.cabling || {};
  const maintenancePlan = result.result?.maintenancePlan || {};
  const riskRegister = result.result?.riskRegister || {};
  const method = METHOD_LABELS[form.calculationMode] || "انتخاب نشده";
  const system = systemLabel(form.systemType);
  const isBackup = form.systemType === "backup";
  const inverterCount = Math.max(1, n(form.requestedParallelInverters, n(form.inverterParallelDesignCount, 1)));
  const unitInvW = n(form.inverterRatedPowerW, n(rec.inverter?.specs?.ratedPowerW, rec.requiredW));
  const unitSurgeW = n(form.inverterUnitSurgeW, unitInvW * 2);
  const reviewShadowAngle = form.shadowObstacleHeightM && form.shadowObstacleDistanceM
    ? Math.atan(n(form.shadowObstacleHeightM, 0) / Math.max(n(form.shadowObstacleDistanceM, 1), 0.5)) * 180 / Math.PI
    : 0;
  const reviewEstimatedShadowLoss = Math.min(Math.max(n(form.shadowPercent, n(form.manualShadowPercent, 0)), reviewShadowAngle * 0.85, (1 - n(form.shadingFactor, 0.95)) * 100), 45).toFixed(1);
  const reviewTempMin = Number.isFinite(Number(form.realMinTemperature)) ? form.realMinTemperature : form.minTemperature;
  const reviewTempMax = Number.isFinite(Number(form.realMaxTemperature)) ? form.realMaxTemperature : form.maxTemperature;
  const reviewVocCold = (n(form.panelVoc, 53.1) * (1 + n(form.panelTempCoeffVoc, n(form.vocTemperatureCoeff, 0.0024)) * Math.max(25 - n(reviewTempMin, 0), 0))).toFixed(2);
  const reviewVmpHot = (n(form.panelVmp, 44.8) * Math.max(0.7, 1 - n(form.panelTempCoeffVmp, n(form.vmpTemperatureCoeff, 0.0029)) * Math.max(n(reviewTempMax, 40) - 25, 0))).toFixed(2);
  const reviewIscHot = (n(form.panelIsc, n(form.panelWatt, 585) / Math.max(n(form.panelVmp, 44.8), 1) * 1.08) * (1 + n(form.panelTempCoeffIsc, n(form.iscTemperatureCoeff, 0.0005)) * Math.max(n(reviewTempMax, 40) - 25, 0))).toFixed(2);
  const tabs = [
    { id: 0, title: "مشخصات و مسیر", body: [["پروژه", form.projectTitle || "—"], ["کارفرما", form.clientName || "—"], ["شهر", form.city || "—"], ["مسیر طراحی", form.scenarioId ? "سناریوی آماده" : "طراحی دستی/مرحله‌ای"], ["منبع تصمیم", form.engineeringDecisionSource || "مسیر عادی"], ["نسخه Flow", "Phase Engineering v7 - Climate Intelligence"]] },
    { id: 1, title: "Site / Shadow / Camera / Climate", body: [["GPS", form.siteGps || `${form.latitude || '—'}, ${form.longitude || '—'}`], ["دقت GPS", form.gpsAccuracyM ? `${form.gpsAccuracyM} متر` : "ثبت نشده"], ["Azimuth دوربین", `${form.cameraAzimuthDeg || form.compassAzimuthDeg || form.azimuthDeg || '—'}°`], ["Tilt دوربین", `${form.cameraTiltDeg || form.tiltAngle || '—'}°`], ["وضعیت تشخیص دوربین", form.cameraOrientationStatus || "ثبت نشده"], ["عکس محل نصب", form.sitePhotoUrl ? "ثبت شده" : "ثبت نشده"], ["اسکرین‌شات قطب‌نما", form.compassScreenshotUrl ? "ثبت شده" : "ثبت نشده"], ["منبع اقلیم", summary.climateSource || form.climateProvider || form.climateDataSource || "کش آفلاین ایران"], ["وضعیت آنلاین", summary.climateOnlineStatus || form.climateOnlineStatus || "offline/cache"], ["PSH واقعی", form.realPsh || summary.climateCorrectedPsh || "ثبت نشده"], ["تابش واقعی", form.realIrradianceKwhM2Day ? `${form.realIrradianceKwhM2Day} kWh/m²/day` : "ثبت نشده"], ["دمای واقعی", form.realAverageTemperature ? `${form.realAverageTemperature}°C` : "ثبت نشده"], ["ضریب محیطی خودکار", form.environmentalAutoFactor || summary.climateDerateFactor || "—"], ["پیش‌بینی تولید سالانه", summary.climateForecastAnnualKwh ? `${summary.climateForecastAnnualKwh} kWh` : form.predictedAnnualProductionKwh ? `${form.predictedAnnualProductionKwh} kWh` : "—"], ["سایه", form.shadowObstacleHeightM ? `${form.shadowObstacleHeightM}m در فاصله ${form.shadowObstacleDistanceM || '—'}m، تلفات ${summary.shadowLossPercent ?? reviewEstimatedShadowLoss}%` : "ثبت نشده"], ["ساعات بحرانی", form.shadowCriticalHours || summary.shadowCriticalHours || "ثبت نشده"], ["Voc سرد اصلاحی", summary.vocColdCorrectedV ? `${summary.vocColdCorrectedV}V` : `${reviewVocCold}V/module`], ["Vmp گرم اصلاحی", summary.vmpHotCorrectedV ? `${summary.vmpHotCorrectedV}V` : `${reviewVmpHot}V/module`], ["Isc اصلاحی", summary.iscHotCorrectedA ? `${summary.iscHotCorrectedA}A` : `${reviewIscHot}A/module`]] },
    { id: 4, title: "نیاز مصرف", body: [["روش", method], ["توان طراحی", `${(rec.requiredW / 1000).toFixed(1)} kW`], ["مصرف/بکاپ", isBackup ? `${form.backupHours || 0} ساعت` : `${((rec.demand.dailyWh || 0) / 1000).toFixed(1)} kWh/day`], ["Surge", `${(rec.demand.surgeW / 1000).toFixed(1)} kW`]] },
    { id: 5, title: "اینورتر و تصمیم", body: [["نوع سیستم", system], ["تصمیم", form.engineeringDecisionTitle || "بدون Recovery"], ["نحوه اعمال", form.engineeringDecisionSource === "user_recovery_option" ? "انتخاب دستی کاربر از پیشنهادات اپ" : form.engineeringDecisionSource === "app_auto_recovery" ? "اعمال خودکار پیشنهاد اپ" : form.engineeringDecisionSource === "manual_parallel_count" ? "تعداد اینورتر توسط کاربر تنظیم شد" : "مسیر عادی"], ["تعداد اینورتر", `${inverterCount} عدد`], ["توان هر اینورتر", `${(unitInvW/1000).toFixed(1)} kW`], ["توان کل", `${((unitInvW * inverterCount) / 1000).toFixed(1)} kW`], ["Surge کل", `${((unitSurgeW * inverterCount) / 1000).toFixed(1)} kW`]] },
    { id: 5, title: "پنل / باتری", body: [["پنل", isBackup ? "ندارد" : `${summary.panelCount ?? rec.pvCount} عدد`], ["توان PV", isBackup ? "ندارد" : `${(((summary.pvInstalledPowerW || ((summary.panelCount ?? rec.pvCount) * n(form.panelWatt, 585))) || 0) / 1000).toFixed(2)} kWp`], ["باتری", `${summary.batteryCount ?? rec.batteryCount} عدد`], ["آرایش باتری", batteryArrangementText(battery, form)]] },
    { id: 5, title: "کابل، حفاظت و String Design", body: [["آرایش سری/موازی", isBackup ? "ندارد" : `${summary.pvStringSeries || pv?.panelSeriesCount || '—'}S × ${summary.pvStringParallel || pv?.panelParallelCount || '—'}P`], ["Voc سرد رشته", summary.pvStringVocColdV ? `${summary.pvStringVocColdV}V` : "—"], ["جریان رشته/MPPT", summary.pvStringCurrentA ? `${summary.pvStringCurrentA}A` : "—"], ["وضعیت MPPT", summary.mpptCompatibilityStatus || "—"], ["Over Voltage", summary.pvOverVoltageStatus || "—"], ["Over Current", summary.pvOverCurrentStatus || "—"], ["کابل DC", isBackup ? "ندارد" : `${cabling.dcCableSizeMm2 || '—'} mm² / افت ${summary.dcVoltageDropPercent || cabling.dcVoltageDropPercent || '—'}%`], ["کابل باتری", `${cabling.batteryCableSizeMm2 || '—'} mm² / افت ${summary.batteryVoltageDropPercent || cabling.batteryVoltageDropPercent || '—'}%`], ["کابل AC", `${cabling.acCableSizeMm2 || '—'} mm² / افت ${summary.acVoltageDropPercent || cabling.acVoltageDropPercent || '—'}%`], ["هشدار افت ولتاژ", summary.cableStatus === 'warning' ? "نیازمند بازبینی" : "مجاز"]] },
    { id: 6, title: "Loss Model جامع", body: [["تلفات کل", summary.lossModelTotalPercent ? `${summary.lossModelTotalPercent}%` : "—"], ["PR خالص", summary.lossModelNetPerformanceRatio || "—"], ["تلفات دما", `${summary.lossTemperaturePercent || 0}%`], ["تلفات کابل", `${summary.lossCablePercent || 0}%`], ["تلفات گردوغبار", `${summary.lossDustPercent || 0}%`], ["تلفات زاویه", `${summary.lossAnglePercent || 0}%`], ["تلفات mismatch", `${summary.lossMismatchPercent || 0}%`], ["تلفات MPPT", `${summary.lossMpptPercent || 0}%`], ["تولید خالص روزانه", summary.lossModelNetDailyProductionWh ? `${(summary.lossModelNetDailyProductionWh/1000).toFixed(2)} kWh` : "—"]] },
    { id: 7, title: "ضرایب و تاریخچه", body: [["ضریب طراحی", form.designFactor || 1.2], ["ضریب کابل", form.cableLossFactor || 0.97], ["ضریب باتری", form.batteryFactor || 1], ["منبع تصمیم", form.engineeringDecisionSource || "مسیر عادی"], ["آخرین Recovery", form.engineeringDecisionDescription || "ثبت نشده"]] },
    { id: 6, title: "ریسک و نگهداری", body: [["Risk Register", riskRegister.status || "clear"], ["ریسک بحرانی", riskRegister.criticalCount || 0], ["ریسک High", riskRegister.highCount || 0], ["برنامه سرویس", maintenancePlan.status || "normal"], ["سرویس بعدی", maintenancePlan.nextServiceLabel || "ثبت نشده"]] },
  ];
  return (
    <div className="review-stage v15-review-stage engineering-review-center">
      <section className="engineering-overview-header review-overview">
        <div className="engineering-overview-header__title"><span>چکیده اطلاعات مهندسی</span><strong>{system} / {method}</strong></div>
        <div className="engineering-overview-grid">
          <div><span>مسیر ورود</span><strong>{form.scenarioId ? "سناریوی آماده" : "مسیر انتخاب کاربر"}</strong></div>
          <div><span>تصمیم اعمال‌شده</span><strong>{form.engineeringDecisionTitle || "مسیر عادی بدون Recovery"}</strong></div>
          <div><span>تعداد اینورتر</span><strong>{inverterCount}</strong></div>
          <div><span>وضعیت</span><strong>{result.ok ? "قابل اجرا" : "نیازمند بررسی"}</strong></div>
          <div><span>ریسک پروژه</span><strong>{riskRegister.status || "clear"}</strong></div>
          <div><span>سرویس بعدی</span><strong>{maintenancePlan.nextServiceLabel || "ثبت نشده"}</strong></div>
        </div>
      </section>
      <div className="summary-tab-grid">
        {tabs.map((tab) => (
          <section key={tab.title} className="summary-tab-card">
            <button type="button" className="summary-tab-edit" onClick={() => goToStep(tab.id)}>ویرایش/مرور</button>
            <h3>{tab.title}</h3>
            <div className="summary-table-like">
              {tab.body.map(([k, v]) => <p key={k}><span>{k}</span><strong>{v}</strong></p>)}
            </div>
          </section>
        ))}
      </div>
      <section className="smart-decision-card"><h3>تصمیم هوشمند اپ</h3><p>این چکیده فقط از داده‌های مراحل قبلی و Unified Engineering State ساخته شده است. برای اصلاح هر قسمت، دکمه «ویرایش/مرور» همان تب را بزنید؛ بعد از تغییر، موتور کامل دوباره محاسبه می‌کند و به همین صفحه برمی‌گردید.</p></section>
    </div>
  );
}
async function captureFinalReport(reportElement, { fileType = "pdf" } = {}) {
  if (!reportElement) throw new Error("REPORT_ELEMENT_MISSING");
  const [{ default: html2canvas }, jsPdfModule] = await Promise.all([
    import("html2canvas"),
    fileType === "pdf" ? import("jspdf") : Promise.resolve(null),
  ]);

  const sandbox = document.createElement("div");
  sandbox.style.position = "fixed";
  sandbox.style.left = "-20000px";
  sandbox.style.top = "0";
  sandbox.style.width = "794px";
  sandbox.style.pointerEvents = "none";
  sandbox.style.opacity = "1";
  sandbox.style.zIndex = "-1";

  const clone = reportElement.cloneNode(true);
  clone.classList.add("a4-export-capture", "mobile-export-table-mode");
  sandbox.appendChild(clone);
  document.body.appendChild(sandbox);

  try {
    const images = Array.from(clone.querySelectorAll("img"));
    await Promise.all(images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.addEventListener("load", resolve, { once: true });
        img.addEventListener("error", resolve, { once: true });
      });
    }));

    const canvas = await html2canvas(clone, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      windowWidth: 794,
      windowHeight: Math.max(1123, clone.scrollHeight),
    });

    if (fileType === "png") {
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = "shil-executive-a4-report.png";
      a.click();
      return;
    }

    const jsPDF = jsPdfModule.default;
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = 210;
    const pdfHeight = 297;
    const ratio = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);
    const imageWidth = canvas.width * ratio;
    const imageHeight = canvas.height * ratio;
    const x = (pdfWidth - imageWidth) / 2;
    const y = (pdfHeight - imageHeight) / 2;
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", x, y, imageWidth, imageHeight, undefined, "FAST");
    pdf.save("shil-executive-a4-report.pdf");
  } finally {
    sandbox.remove();
  }
}

export function FinalResult({ form, locked = false }) {
  const reportRef = useRef(null);
  const rec = recommendation(form);
  const result = useMemo(() => {
    if (locked) return { ok: false, advisor: [{ severity: "warning", title: "مرحله نهایی هنوز فعال نیست", message: "برای اجرای محاسبات، ابتدا چکیده اطلاعات را تایید کنید." }] };
    try { return runEngineeringDesign(form); } catch (error) { return { ok: false, advisor: [{ severity: "error", title: "خطا", message: error.message }] }; }
  }, [form, locked]);
  async function exportPdf() {
    await captureFinalReport(reportRef.current, { fileType: "pdf" });
  }
  async function exportPng() {
    await captureFinalReport(reportRef.current, { fileType: "png" });
  }
  const summary = result.result?.summary || {};
  const advisor = result.result?.advisor || result.advisor || [];
  const financials = result.result?.financials || {};
  const reportSnapshot = result.result?.reportSnapshot || {};
  const productionDailyKwh = summary.lossModelNetDailyProductionWh ? Number(summary.lossModelNetDailyProductionWh) / 1000 : Number(summary.climateForecastDailyKwh || form.predictedDailyProductionKwh || 0);
  const productionAnnualKwh = Number(summary.lossModelAnnualNetProductionKwh || summary.climateForecastAnnualKwh || form.predictedAnnualProductionKwh || 0);
  const shadowLossForChart = Number(summary.shadowLossPercent ?? result.result?.shadowAnalysis?.totalLossPercent ?? form.shadowPercent ?? form.manualShadowPercent ?? 0);
  const lossBars = [
    ['دما', Number(summary.lossTemperaturePercent || 0)],
    ['کابل', Number(summary.lossCablePercent || 0)],
    ['گردوغبار', Number(summary.lossDustPercent || 0)],
    ['زاویه', Number(summary.lossAnglePercent || 0)],
    ['سایه', Number(summary.shadowLossPercent || shadowLossForChart || 0)],
    ['Mismatch', Number(summary.lossMismatchPercent || 0)],
    ['MPPT', Number(summary.lossMpptPercent || 0)],
  ];
  const maintenancePlan = result.result?.maintenancePlan || {};
  const riskRegister = result.result?.riskRegister || {};
  const status = locked ? "locked" : (summary.designStatus || (result.ok ? "success" : "error"));
  const today = new Date().toLocaleDateString("fa-IR");
  const method = METHOD_LABELS[form.calculationMode] || "انتخاب نشده";
  const system = systemLabel(form.systemType);
  const demandDailyKwh = ((summary.totalDailyEnergyWh || rec.demand.dailyWh || 0) / 1000).toFixed(1);
  const pvCount = summary.panelCount ?? rec.pvCount;
  const batteryCount = summary.batteryCount ?? rec.batteryCount;
  const inverterKw = ((summary.inverterPowerW || rec.requiredW || 0) / 1000).toFixed(1);
  const pvKwp = summary.pvInstalledPowerW ? (summary.pvInstalledPowerW / 1000).toFixed(2) : ((pvCount * n(form.panelWatt, 585)) / 1000).toFixed(2);
  const netProduction = result.result?.pv?.netDailyProductionWh || result.result?.installation?.losses?.netProductionWhDay || 0;
  const protection = result.result?.protection || {};
  const isBackup = form.systemType === "backup";
  const protectionItems = protection.bom?.length ? protection.bom.filter((item) => !isBackup || !/(PV|MPPT|پنل|خورشیدی|استرینگ|رشته|Voc|Vmp)/i.test(`${item.item || ""} ${item.rating || ""}`)) : [];
  return (
    <div className="final-stage">
      <section ref={reportRef} className="a4-report-card executive-a4-v2" dir="rtl">
        <header className="a4-letterhead">
          <img src={PAGE_LOGO} alt="SHIL" />
          <div><h2>{isBackup ? "گزارش اجرایی طراحی برق اضطراری" : "گزارش اجرایی طراحی سیستم خورشیدی"}</h2><span>نسخه مهندسی محاسبات و اجرا</span></div>
          <strong>{today}</strong>
        </header>
        <div className={`status-pill ${status === "success" ? "ok" : status === "warning" ? "warn" : status === "locked" ? "warn" : "danger"}`}>{status === "success" ? "ایمن و قابل اجرا" : status === "warning" ? "قابل اجرا با هشدار" : status === "locked" ? "در انتظار تایید مرحله قبل" : "نیازمند اصلاح"}</div>
        <section className="a4-section compact professional-report-v4"><h3>مسیر طراحی، کد گزارش و تصمیمات اعمال‌شده</h3><p><b>کد گزارش:</b> {reportSnapshot.projectCode || summary.reportProjectCode || "—"}</p><p><b>نسخه گزارش:</b> {reportSnapshot.reportVersion || summary.professionalReportVersion || "Industrial PDF Report v10"}</p><p><b>مسیر ورود:</b> {reportSnapshot.designSource || (form.scenarioId ? "سناریوی آماده" : "مسیر انتخاب کاربر")}</p><p><b>تصمیم مهندسی:</b> {form.engineeringDecisionTitle || reportSnapshot.decisionTitle || "مسیر عادی بدون Recovery"}</p><p><b>نحوه اعمال:</b> {form.engineeringDecisionSource || reportSnapshot.decisionSource || "Unified Engineering State"}</p><p><b>تعداد اینورتر موازی:</b> {form.requestedParallelInverters || form.inverterParallelDesignCount || summary.inverterParallelCount || 1}</p><div className="report-section-chips">{(reportSnapshot.sections || []).map((section) => <span key={section.key} className={section.status}>{section.title}</span>)}</div></section>
        <section className="a4-section compact"><h3>Site Survey، سایه و Climate Intelligence</h3><p><b>GPS:</b> {form.siteGps || `${form.latitude || '—'}, ${form.longitude || '—'}`} {form.gpsAccuracyM ? `(دقت ${form.gpsAccuracyM} متر)` : ''}</p><p><b>Azimuth / Tilt:</b> {form.cameraAzimuthDeg || form.compassAzimuthDeg || form.azimuthDeg || '—'}° / {form.cameraTiltDeg || form.tiltAngle || '—'}° | <b>وضعیت دوربین:</b> {form.cameraOrientationStatus || 'ثبت نشده'}</p><p><b>عکس محل نصب:</b> {form.sitePhotoUrl ? "ثبت شده" : "ثبت نشده"} | <b>اسکرین‌شات قطب‌نما:</b> {form.compassScreenshotUrl ? "ثبت شده" : "ثبت نشده"}</p><p><b>تحلیل سایه:</b> ارتفاع مانع {form.shadowObstacleHeightM || '—'}m، فاصله {form.shadowObstacleDistanceM || '—'}m، جهت {form.shadowObstacleDirectionDeg || '—'}°، درصد سایه {form.shadowPercent || form.manualShadowPercent || '—'}%، تلفات نهایی {summary.shadowLossPercent ?? result.result?.shadowAnalysis?.totalLossPercent ?? '—'}%، ساعات بحرانی: {result.result?.shadowAnalysis?.criticalHours || form.shadowCriticalHours || 'ثبت نشده'}</p><p><b>اقلیم:</b> منبع {result.result?.climate?.source || form.climateProvider || form.climateDataSource || 'offline'}، وضعیت {summary.climateOnlineStatus || form.climateOnlineStatus || 'offline/cache'}</p><p><b>PSH واقعی/اصلاح‌شده:</b> {form.realPsh || '—'} / {summary.climateCorrectedPsh || result.result?.climate?.correctedPsh || form.sunHours || '—'} | <b>تابش واقعی:</b> {form.realIrradianceKwhM2Day || summary.realIrradianceKwhM2Day || '—'} kWh/m²/day</p><p><b>دمای واقعی:</b> میانگین {form.realAverageTemperature || summary.realAverageTemperature || '—'}°C، حداقل {form.realMinTemperature || summary.realMinTemperature || '—'}°C، حداکثر {form.realMaxTemperature || summary.realMaxTemperature || '—'}°C</p><p><b>Temperature & Voltage Correction:</b> Voc سرد {summary.vocColdCorrectedV || result.result?.pv?.temperatureVoltageCorrection?.stringVocColdV || '—'}V، Vmp گرم {summary.vmpHotCorrectedV || result.result?.pv?.temperatureVoltageCorrection?.stringVmpHotV || '—'}V، Isc اصلاحی {summary.iscHotCorrectedA || result.result?.pv?.temperatureVoltageCorrection?.moduleIscHotA || '—'}A</p><p><b>ضرایب خودکار:</b> محیطی {form.environmentalAutoFactor || summary.climateDerateFactor || '—'}، تلفات اقلیمی {summary.climateDerateFactor || '—'} | <b>پیش‌بینی تولید:</b> {summary.climateForecastDailyKwh || form.predictedDailyProductionKwh || '—'} kWh/day و {summary.climateForecastAnnualKwh || form.predictedAnnualProductionKwh || '—'} kWh/year</p><div className="site-survey-report-media">{form.sitePhotoUrl ? <figure><img src={form.sitePhotoUrl} alt="عکس محل نصب" /><figcaption>عکس محل نصب</figcaption></figure> : null}{form.compassScreenshotUrl ? <figure><img src={form.compassScreenshotUrl} alt="اسکرین‌شات قطب‌نما" /><figcaption>اسکرین‌شات قطب‌نما</figcaption></figure> : null}</div></section>
        <section className="a4-section compact industrial-report-charts-v10"><h3>نمودار تولید، سایه و تلفات</h3><div className="industrial-chart-grid-v10"><div className="industrial-chart-card-v10"><strong>پیش‌بینی تولید</strong><div className="bar-line-v10"><span style={{ width: `${Math.min(100, Math.max(8, productionDailyKwh * 3))}%` }} /></div><p>روزانه: {productionDailyKwh ? productionDailyKwh.toFixed(2) : '—'} kWh | سالانه: {productionAnnualKwh ? productionAnnualKwh.toLocaleString('fa-IR') : '—'} kWh</p></div><div className="industrial-chart-card-v10"><strong>نمودار سایه</strong><div className="bar-line-v10 warning"><span style={{ width: `${Math.min(100, Math.max(4, shadowLossForChart * 2))}%` }} /></div><p>تلفات سایه: {shadowLossForChart || '—'}% | ساعات بحرانی: {result.result?.shadowAnalysis?.criticalHours || form.shadowCriticalHours || '—'}</p></div><div className="industrial-chart-card-v10"><strong>مدل تلفات</strong><div className="loss-stack-v10">{lossBars.map(([label, value]) => <span key={label} title={`${label}: ${value}%`} style={{ flexGrow: Math.max(0.5, value || 0.5) }}>{label}</span>)}</div><p>تلفات کل: {summary.lossModelTotalPercent || result.result?.lossModel?.totalLossPercent || '—'}%</p></div></div></section>
        <div className="a4-section-grid two">
          <section className="a4-section"><h3>مشخصات مشتری و پروژه</h3><p><b>پروژه:</b> {form.projectTitle || "—"}</p><p><b>کارفرما:</b> {form.clientName || "—"}</p><p><b>شهر اجرا:</b> {form.city || "—"}</p><p><b>تاریخ تکمیل فرآیند:</b> {today}</p></section>
          <section className="a4-section"><h3>نیازها و روش محاسبات</h3><p><b>نوع سیستم:</b> {system}</p><p><b>روش محاسبه:</b> {method}</p><p><b>مصرف روزانه:</b> {demandDailyKwh} kWh</p><p><b>توان طراحی:</b> {(summary.demandPowerW || rec.requiredW || 0).toFixed(0)} W</p></section>
        </div>
        <div className="a4-metric-strip">{!isBackup ? <div><span>پنل</span><strong>{pvCount} عدد</strong><small>{pvKwp} kWp</small></div> : <div><span>زمان بکاپ</span><strong>{form.backupHours || 2} h</strong><small>مورد نیاز مشتری</small></div>}<div><span>{isBackup ? "UPS / سانورتر" : "اینورتر"}</span><strong>{inverterKw} kW</strong><small>{form.systemVoltage || 48}V بانک</small></div><div><span>باتری</span><strong>{batteryCount} عدد</strong><small>DoD {form.dod ?? 0.8}</small></div>{!isBackup ? <div><span>تولید خالص</span><strong>{netProduction ? (netProduction / 1000).toFixed(1) : "—"} kWh</strong><small>بعد از تلفات</small></div> : <div><span>مصرف اضطراری</span><strong>{demandDailyKwh} kWh</strong><small>بر اساس زمان بکاپ</small></div>}</div>
        <div className="a4-section-grid two">
          {!isBackup ? <section className="a4-section"><h3>PV، MPPT و نصب</h3><p>آرایه پیشنهادی: {summary.panelCount ?? rec.pvCount} پنل با توان نامی {form.panelWatt || 585}W.</p><p>بازه MPPT: {form.mpptMinVoltage || "—"} تا {form.mpptMaxVoltage || "—"} VDC، حداکثر Voc: {form.maxPvVocV || form.controllerMaxVoc || 500} VDC.</p><p><b>String Design:</b> {summary.pvStringSeries || result.result?.pv?.panelSeriesCount || "—"}S × {summary.pvStringParallel || result.result?.pv?.panelParallelCount || "—"}P، Voc سرد {summary.pvStringVocColdV || result.result?.pv?.stringVocCold || "—"}V، جریان {summary.pvStringCurrentA || result.result?.pv?.stringCurrentA || "—"}A. وضعیت Over Voltage: {summary.pvOverVoltageStatus || "—"}، Over Current: {summary.pvOverCurrentStatus || "—"}.</p><p>شرایط نصب: تابش {form.sunHours || "—"} ساعت، زاویه {form.tiltAngle || "—"} درجه، ضریب سایه {form.shadingFactor || "—"} و گردوغبار {form.dustFactor || "—"}.</p></section> : <section className="a4-section"><h3>UPS، باتری و زمان پشتیبانی</h3><p>مبنای طراحی برق اضطراری، توان مصرف‌کننده و مدت زمان برق اضطراری موردنیاز است؛ پنل، MPPT و تابش در این مسیر دخالت ندارند.</p><p>زمان بکاپ موردنیاز: {form.backupHours || 2} ساعت. ولتاژ بانک: {form.systemVoltage || 48}V.</p><p>انتخاب تجهیزات بر اساس توان لحظه‌ای، Surge بارها، راندمان اینورتر و DoD باتری انجام می‌شود.</p></section>}
          <section className="a4-section"><h3>باتری و همخوانی ولتاژ</h3><p>{form.systemType === "backup" ? (result.result?.battery?.voltagePolicy || "انتخاب باتری بر اساس ولتاژ بانک سانورتر انجام می‌شود.") : "اولویت انتخاب باتری با همخوانی مستقیم ولتاژ بانک اینورتر است؛ سپس سری‌سازی باتری‌های ولتاژ پایین‌تر برای ساخت ولتاژ موردنیاز انجام می‌شود."}</p><p>ولتاژ بانک: {result.result?.battery?.bankVoltage || form.batteryUnitVoltage || form.systemVoltage || "—"}V، ظرفیت واحد: {form.batteryUnitAh || "—"}Ah، نوع: {form.batteryType || "—"}.</p></section>
        </div>
        <section className="a4-section"><h3>تجهیزات حفاظتی، تابلو و اجرای DC/AC</h3><div className="a4-equipment-list v15-bom-list">{protectionItems.length ? protectionItems.slice(0, 10).map((item, index) => <span key={index}><b>{item.item}</b><small>{item.rating}</small></span>) : <><span><b>DC Isolator</b><small>{protection.dcIsolatorRating || "بر اساس Voc"}</small></span><span><b>SPD DC</b><small>{protection.dcSpdType || "Type II DC"}</small></span><span><b>AC Breaker</b><small>{protection.acBreakerRating || "طبق جریان بار"}</small></span><span><b>Combiner</b><small>{protection.combinerBoxRequired ? "لازم" : "در صورت چند استرینگ"}</small></span></>}</div></section>
        <section className="a4-section compact"><h3>کابل IEC و معماری صنعتی</h3><p><b>کابل DC/Battery/AC:</b> {result.result?.cabling?.dcCableSizeMm2 || '—'} / {result.result?.cabling?.batteryCableSizeMm2 || '—'} / {result.result?.cabling?.acCableSizeMm2 || '—'} mm²</p><p><b>Derating:</b> {result.result?.cabling?.deratingFactor || '—'}، افت DC/AC: {result.result?.cabling?.dcVoltageDropPercent || '—'}% / {result.result?.cabling?.acVoltageDropPercent || '—'}%</p><p><b>معماری:</b> {summary.inverterArchitecture || 'Unified'}، MPPT کل: {summary.mpptArchitecture || form.mpptCount || '—'}</p></section><section className="a4-section compact"><h3>Loss Model جامع</h3><p><b>تلفات کل:</b> {summary.lossModelTotalPercent || result.result?.lossModel?.totalLossPercent || '—'}% | <b>PR خالص:</b> {summary.lossModelNetPerformanceRatio || result.result?.lossModel?.netPerformanceRatio || '—'}</p><p><b>دما/کابل/گردوغبار/زاویه/mismatch/MPPT:</b> {summary.lossTemperaturePercent || 0}% / {summary.lossCablePercent || 0}% / {summary.lossDustPercent || 0}% / {summary.lossAnglePercent || 0}% / {summary.lossMismatchPercent || 0}% / {summary.lossMpptPercent || 0}%</p><p><b>تولید خالص:</b> {summary.lossModelNetDailyProductionWh ? `${(summary.lossModelNetDailyProductionWh/1000).toFixed(2)} kWh/day` : '—'}، سالانه {summary.lossModelAnnualNetProductionKwh || '—'} kWh</p></section>
        <section className="a4-section compact"><h3>برآورد مالی و تولید سالانه</h3><p><b>وضعیت قیمت‌گذاری:</b> {financials.costCompleteness === "estimated" ? "برآورد اولیه فعال" : "قیمت تجهیزات ثبت نشده"}</p><p><b>هزینه تخمینی کل:</b> {financials.totalEstimatedCost ? financials.totalEstimatedCost.toLocaleString("fa-IR") : "—"}</p><p><b>تولید سالانه:</b> {financials.annualProductionKwh ? `${financials.annualProductionKwh.toLocaleString("fa-IR")} kWh` : "—"}</p><p><b>صرفه‌جویی سالانه:</b> {financials.annualSavings ? financials.annualSavings.toLocaleString("fa-IR") : "—"}</p><p><b>بازگشت ساده سرمایه:</b> {financials.simplePaybackYears ? `${financials.simplePaybackYears} سال` : "—"}</p></section>
        <section className="a4-section compact management-handoff"><h3>کارتابل مدیریت و رخدادهای حیاتی</h3><p><b>نیاز به ارجاع مدیریت:</b> {result.result?.engineeringAudit?.shouldSendToManagement ? "بله" : "خیر"}</p><p><b>وضعیت ممیزی:</b> {result.result?.engineeringAudit?.status || "clear"}</p><p><b>تعداد رخدادها:</b> {result.result?.engineeringAudit?.eventCount || 0}</p></section>
        <section className="a4-section compact operations-v5"><h3>Risk Register و برنامه نگهداری</h3><p><b>وضعیت ریسک:</b> {riskRegister.status || "clear"} | بحرانی: {riskRegister.criticalCount || 0} | High: {riskRegister.highCount || 0}</p><p><b>سرویس بعدی:</b> {maintenancePlan.nextServiceLabel || "ثبت نشده"}</p><div className="advisor-list">{(riskRegister.risks || []).slice(0, 4).map((item) => <div key={item.id} className={`advisor-item ${item.level === "critical" ? "error" : item.level === "high" ? "warning" : "info"}`}><strong>{item.title}</strong><span>{item.action}</span></div>)}</div><div className="a4-equipment-list v15-bom-list">{(maintenancePlan.tasks || []).slice(0, 4).map((task) => <span key={task.id}><b>{task.title}</b><small>هر {task.intervalDays} روز - {task.priority}</small></span>)}</div></section>
        <section className="a4-section compact"><h3>پیام‌های مهندسی و اصلاحات لازم</h3><div className="advisor-list">{advisor.length ? advisor.slice(0, 5).map((item, index) => <div key={index} className={`advisor-item ${item.severity || "info"}`}><strong>{item.title || item.severity}</strong><span>{item.message || item.text}</span></div>) : <p>مورد بحرانی گزارش نشده است.</p>}</div></section>
      </section>
      <div className="final-actions"><button className="btn btn--primary" type="button" onClick={exportPdf} disabled={locked}>ذخیره PDF</button><button className="btn btn--secondary" type="button" onClick={exportPng} disabled={locked}>ذخیره PNG</button><button className="btn btn--ghost" type="button" onClick={() => window.print()}>چاپ</button></div>
    </div>
  );
}

