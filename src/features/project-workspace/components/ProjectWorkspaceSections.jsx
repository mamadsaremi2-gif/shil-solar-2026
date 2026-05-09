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

export function FlowHeader({ title, onBack, onDashboard }) {
  return (
    <section className="flow-top-card pro-flow-header v15-flow-header">
      <div className="flow-header-actions">
        <button className="btn btn--ghost dashboard-button" type="button" onClick={onDashboard}>داشبورد</button>
        <button className="btn btn--ghost back-button-inline" type="button" onClick={onBack}>مرحله قبل</button>
      </div>
      <div className="page-brand-lockup">
        <div className="flow-top-title"><strong>{title}</strong><small>SHIL Smart Solar Design</small></div>
      </div>
      <img className="header-brand-logo" src={PAGE_LOGO} alt="SHIL IRAN" />
    </section>
  );
}

export function FlowStepper({ activeIndex, form, goToStep, completedSteps = [] }) {
  const chips = [form.systemType ? systemLabel(form.systemType) : null, form.calculationMode ? METHOD_LABELS[form.calculationMode] : null].filter(Boolean);
  const completedSet = new Set(completedSteps || []);
  return (
    <aside className="focus-stepper pro-stepper">
      <div className="focus-stepper__badges">
        {chips.length ? chips.map((chip) => <span key={chip}>{chip}</span>) : <span>مسیر و روش هنوز انتخاب نشده</span>}
      </div>
      {DESIGN_STEPS.map((step, index) => {
        const done = completedSet.has(index);
        const waiting = index > 0 && !completedSet.has(index - 1);
        return (
          <button key={step} type="button" onClick={() => goToStep(index)} className={`focus-step ${activeIndex === index ? "is-active" : ""} ${done ? "is-done" : ""} ${waiting && !done ? "is-waiting" : ""}`}>
            <span>{done ? "✓" : index + 1}</span>
            <em>{STEP_META[index].icon}</em>
            <strong>{step}</strong>
            {waiting && !done ? <small>نیازمند تایید مرحله قبل</small> : done ? <small>تکمیل شده</small> : <small>قابل بازدید</small>}
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
  const options = EquipmentRepository.search({ category: "load", query }).slice(0, 40);
  const totalPower = (form.loadItems || []).reduce((sum, item) => sum + n(item.qty, 1) * n(item.power, 0) * n(item.coincidenceFactor, 1), 0);
  const totalEnergy = (form.loadItems || []).reduce((sum, item) => sum + n(item.qty, 1) * n(item.power, 0) * n(item.hours, 1) * n(item.coincidenceFactor, 1) * n(item.seasonalUseFactor, 1), 0) / 1000;
  const addFromBank = (item) => {
    addLoadItem({ ...(item.specs || {}), name: item.specs?.name || item.title, powerFactor: item.specs?.powerFactor || 0.95, coincidenceFactor: item.specs?.coincidenceFactor || 1, seasonalUseFactor: item.specs?.seasonalUseFactor ?? 1, surgeFactor: item.specs?.surgeFactor || 1, source: item.isCustom ? "user" : "bank" });
  };
  const addCustom = () => {
    if (!String(custom.name || "").trim()) return;
    const loadType = custom.loadType || "mixed";
    const surgeFactor = loadType === "soft_start" ? 1.2 : loadType === "motor" ? 3 : 1;
    const payload = {
      category: "load",
      title: custom.name.trim(),
      summary: "تجهیز وارد شده توسط کاربر؛ در انتظار بررسی ادمین",
      specs: { name: custom.name.trim(), qty: n(custom.qty, 1), power: n(custom.power, 100), hours: n(custom.hours, 1), powerFactor: 0.95, coincidenceFactor: 1, seasonalUseFactor: 1, surgeFactor, loadType },
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
      <div className="smart-bank-summary mini"><div><span>توان همزمان</span><strong>{totalPower.toFixed(0)} W</strong></div><div><span>مصرف روزانه</span><strong>{totalEnergy.toFixed(2)} kWh</strong></div><div><span>تعداد تجهیزات</span><strong>{(form.loadItems || []).length}</strong></div></div>
      <div className="smart-note">برای تجهیزات دارای اینورتر داخلی، سافت‌استارتر یا راه‌اندازی نرم، ضریب راه‌اندازی به‌صورت پیشنهادی روی 1.2 قرار می‌گیرد.</div>
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
            <input inputMode="decimal" value={custom.hours} onChange={(event) => setCustom({ ...custom, hours: event.target.value })} placeholder="ساعت" />
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
            <label className="load-field"><span>ساعت کارکرد روزانه</span><input inputMode="decimal" value={item.hours ?? ""} onChange={(event) => updateLoadItem(item.id, { hours: event.target.value })} /></label>
            <label className="load-field"><span>نوع تجهیز</span><select value={item.loadType || "mixed"} onChange={(event) => updateType(item, event.target.value)}><option value="mixed">عمومی</option><option value="resistive">روشنایی/مقاومتی</option><option value="motor">موتوری معمولی</option><option value="soft_start">سافت‌استارت/اینورتر داخلی</option></select></label>
            {advanced ? <>
              <label className="load-field"><span>ضریب توان</span><input inputMode="decimal" value={item.powerFactor ?? 0.95} onChange={(event) => updateLoadItem(item.id, { powerFactor: event.target.value })} /></label>
              <label className="load-field"><span>ضریب همزمانی</span><input inputMode="decimal" value={item.coincidenceFactor ?? 1} onChange={(event) => updateLoadItem(item.id, { coincidenceFactor: event.target.value })} /></label>
              <label className="load-field"><span>ضریب فصل کارکرد</span><input inputMode="decimal" value={item.seasonalUseFactor ?? 1} onChange={(event) => updateLoadItem(item.id, { seasonalUseFactor: event.target.value })} /></label>
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
      {form.calculationMode === "daily_energy" ? <Field label="انرژی موردنیاز / روزانه (kWh)"><input inputMode="decimal" value={form.dailyEnergyKwh ?? ""} onChange={(event) => updateForm({ dailyEnergyKwh: event.target.value })} /></Field> : null}
      {form.calculationMode === "load_profile" ? <>
        <Field label="مصرف صبح (kWh)"><input inputMode="decimal" value={form.profileMorningKwh ?? ""} onChange={(event) => updateProfilePart("profileMorningKwh", event.target.value)} /></Field>
        <Field label="مصرف ظهر (kWh)"><input inputMode="decimal" value={form.profileNoonKwh ?? ""} onChange={(event) => updateProfilePart("profileNoonKwh", event.target.value)} /></Field>
        <Field label="مصرف عصر (kWh)"><input inputMode="decimal" value={form.profileEveningKwh ?? ""} onChange={(event) => updateProfilePart("profileEveningKwh", event.target.value)} /></Field>
        <Field label="مصرف شب (kWh)"><input inputMode="decimal" value={form.profileNightKwh ?? ""} onChange={(event) => updateProfilePart("profileNightKwh", event.target.value)} /></Field>
        <Field label="ضریب پیک مصرف"><input inputMode="decimal" value={form.peakFactor ?? 2} onChange={(event) => updateForm({ peakFactor: event.target.value })} /></Field>
      </> : null}
      {["current", "power"].includes(form.calculationMode) ? <Field label="ولتاژ مصرف‌کننده"><input inputMode="decimal" value={form.loadVoltage ?? 220} onChange={(event) => updateForm({ loadVoltage: event.target.value })} /></Field> : null}
      {["current", "power"].includes(form.calculationMode) ? <Field label="ضریب توان"><input inputMode="decimal" value={form.powerFactor ?? 0.95} onChange={(event) => updateForm({ powerFactor: event.target.value })} /></Field> : null}
      {["current", "power"].includes(form.calculationMode) ? <Field label="زمان مصرف روزانه برای محاسبه کل پروژه (ساعت)"><input inputMode="decimal" value={form.dailyUsageHours ?? 3} onChange={(event) => updateForm({ dailyUsageHours: event.target.value })} /></Field> : null}
      {backupField ? <Field label="مدت زمان برق اضطراری موردنیاز (ساعت)"><input inputMode="decimal" value={form.backupHours ?? ""} onChange={(event) => updateForm({ backupHours: event.target.value })} /></Field> : null}
      {['current', 'power'].includes(form.calculationMode) ? <Field label="ضریب همزمانی کل"><input inputMode="decimal" value={form.coincidenceFactor ?? 1} onChange={(event) => updateForm({ coincidenceFactor: event.target.value })} /></Field> : null}
      <Field label="فصل کارکرد غالب"><select value={form.seasonProfile || "annual"} onChange={(event) => { const selected = SEASON_OPTIONS.find((item) => item.value === event.target.value); updateForm({ seasonProfile: event.target.value, seasonUsageFactor: selected?.factor ?? 1 }); }}>{SEASON_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field>
      <Field label="ضریب فصل کارکرد"><input inputMode="decimal" value={form.seasonUsageFactor ?? 1} onChange={(event) => updateForm({ seasonUsageFactor: event.target.value })} /></Field>
      <Field label="ضریب راه‌اندازی / پیک"><input inputMode="decimal" value={form.surgeFactor ?? 1.7} onChange={(event) => updateForm({ surgeFactor: event.target.value })} /></Field>
    </div>
  );
}

export function SiteConditions({ form, updateForm }) {
  const city = getCity(form.city);
  return (
    <div className="site-stage environmental-intelligence-stage">
      <div className="form-instruction-top">شهر پروژه را جستجو کنید؛ ضرایب اقلیمی، تابش و شرایط محیطی در همان محدوده تصویر تکمیل می‌شوند.</div>
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
            <Field label="زاویه نصب"><input inputMode="decimal" value={form.tiltAngle ?? 30} onChange={(event) => updateForm({ tiltAngle: event.target.value })} /></Field>
            <Field label="ارتفاع از سطح دریا"><input inputMode="decimal" value={form.altitude ?? city.altitude} onChange={(event) => updateForm({ altitude: event.target.value })} /></Field>
          </div>
          <section className="env-table-card environment-summary-card">
            <div className="env-table-grid"><div><span>شهر</span><strong>{form.city}</strong></div><div><span>استان</span><strong>{city.province}</strong></div><div><span>تابش استاندارد</span><strong>{city.sunHours}</strong></div><div><span>ارتفاع استاندارد</span><strong>{city.altitude}</strong></div><div><span>دمای استاندارد</span><strong>{city.averageTemperature}</strong></div><div><span>وضعیت</span><strong>ضرایب محاسباتی فعال</strong></div></div>
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
  const bankLimit = Math.max(...rec.inverters.map((item) => n(item.specs?.ratedPowerW, 0)), 0);
  const heavyOffgrid = form.systemType === "offgrid" && rec.requiredW > bankLimit;
  function select(role, item) {
    const specs = item.specs || {};
    const patch = { selectedEquipment: { ...(form.selectedEquipment || {}), [role]: item.id } };
    if (role === "panel") Object.assign(patch, { panelWatt: specs.panelWatt, panelVoc: specs.panelVoc, panelVmp: specs.panelVmp });
    if (role === "battery") Object.assign(patch, { batteryUnitAh: specs.batteryUnitAh, batteryUnitVoltage: specs.batteryUnitVoltage, batteryType: specs.batteryType || form.batteryType, dod: specs.dod || form.dod });
    if (role === "inverter") Object.assign(patch, { inverterEfficiency: specs.inverterEfficiency, systemVoltage: specs.systemVoltage || form.systemVoltage, inverterRatedPowerW: specs.inverterRatedPowerW || specs.ratedPowerW || form.inverterRatedPowerW, inverterAcPowerW: specs.inverterAcPowerW || specs.ratedPowerW || form.inverterAcPowerW, maxPvVocV: specs.maxPvVocV || form.maxPvVocV, controllerMaxVoc: specs.controllerMaxVoc || specs.maxPvVocV || form.controllerMaxVoc, mpptMinVoltage: specs.mpptMinVoltage || form.mpptMinVoltage, mpptMaxVoltage: specs.mpptMaxVoltage || form.mpptMaxVoltage, mpptStartupVoltage: specs.mpptStartupVoltage || specs.mpptMinVoltage || form.mpptStartupVoltage, mpptCount: specs.mpptCount || form.mpptCount, maxPvPowerPerMpptW: specs.maxPvPowerPerMpptW || form.maxPvPowerPerMpptW, maxPvPowerW: specs.maxPvPowerW || form.maxPvPowerW, offgridMpptProfileId: specs.offgridMpptProfileId || form.offgridMpptProfileId, offgridMpptProfileTitle: specs.offgridMpptProfileTitle || form.offgridMpptProfileTitle });
    updateForm(patch);
  }
  return (
    <div className="config-stage">
      {heavyOffgrid ? <section className="warning-card">توان موردنیاز از بانک آفگرید موجود بیشتر است. اینورتر آفگرید مناسب در بانک موجود نیست. توان پیشنهادی اینورتر جدید حدود {Math.ceil(rec.requiredW / 1000)} کیلووات است؛ گزینه جایگزین: {rec.bestHybrid?.title || "اینورتر هیبرید"} به تعداد {rec.hybridParallelCount || 2} عدد به صورت پارالل.</section> : null}
      <div className="smart-bank-summary"><div><span>توان طراحی</span><strong>{rec.requiredW.toFixed(0)} W</strong></div><div><span>مصرف روزانه</span><strong>{(rec.demand.dailyWh / 1000).toFixed(1)} kWh</strong></div><div><span>مبنای مصرف روزانه</span><strong>{["current", "power"].includes(form.calculationMode) ? `${form.dailyUsageHours || 3} ساعت در روز` : form.systemType === "backup" ? `${form.backupHours || 0} ساعت بکاپ` : "براساس ورودی انرژی/تجهیزات"}</strong></div><div><span>آرایش پیشنهادی پنل</span><strong>{form.systemType !== "backup" ? `${Math.max(1, Math.ceil(rec.pvCount / 2))} سری × 2 موازی` : "ندارد"}</strong></div><div><span>انتخاب باتری</span><strong>{`اولویت با باتری هم‌ولتاژ ${form.systemVoltage || 48}V؛ سپس سری‌سازی`}</strong></div></div>
      <section className="smart-decision-card"><h3>تصمیم هوشمند اپ</h3><p>پیشنهاد تجهیزات بر اساس توان لحظه‌ای، انرژی روزانه، ضریب همزمانی، جریان راه‌اندازی موتور، مصرف شب و ضرایب محیطی شهر محاسبه شده است. کاربر می‌تواند ظرفیت را بیشتر کند، اما انتخاب کمتر از حد استاندارد با هشدار و توقف مرحله بعد کنترل می‌شود.</p></section>
      <div className="smart-bank-grid">
        {form.systemType !== "backup" ? <BankSelector label="بانک پنل خورشیدی" category="panel" selectedId={form.selectedEquipment?.panel || rec.panel?.id} onSelect={(item) => select("panel", item)} /> : null}
        <BankSelector label="بانک اینورتر خورشیدی" category="inverter" selectedId={form.selectedEquipment?.inverter || rec.inverter?.id} onSelect={(item) => select("inverter", item)} />
        <BankSelector label="بانک باتری" category="battery" selectedId={form.selectedEquipment?.battery || rec.battery?.id} onSelect={(item) => select("battery", item)} />
      </div>
      <div className="focus-form-table">
        <Field label="حداکثر ولتاژ مدار باز PV"><input inputMode="decimal" value={form.maxPvVocV ?? selectedInverter?.specs?.maxPvVocV ?? 500} onChange={(event) => updateForm({ maxPvVocV: event.target.value, controllerMaxVoc: event.target.value })} /></Field>
        <Field label="حداقل ولتاژ MPPT"><input inputMode="decimal" value={form.mpptMinVoltage ?? selectedInverter?.specs?.mpptMinVoltage ?? 30} onChange={(event) => updateForm({ mpptMinVoltage: event.target.value, mpptStartupVoltage: event.target.value })} /></Field>
        <Field label="حداکثر ولتاژ MPPT"><input inputMode="decimal" value={form.mpptMaxVoltage ?? selectedInverter?.specs?.mpptMaxVoltage ?? 450} onChange={(event) => updateForm({ mpptMaxVoltage: event.target.value })} /></Field>
        <Field label="تعداد MPPT"><input inputMode="decimal" value={form.mpptCount ?? selectedInverter?.specs?.mpptCount ?? 1} onChange={(event) => updateForm({ mpptCount: event.target.value })} /></Field>
        <Field label="حداکثر توان PV هر MPPT"><input inputMode="decimal" value={form.maxPvPowerPerMpptW ?? selectedInverter?.specs?.maxPvPowerPerMpptW ?? 0} onChange={(event) => updateForm({ maxPvPowerPerMpptW: event.target.value })} /></Field>
        <Field label="حداکثر جریان ورودی MPPT"><input inputMode="decimal" value={form.mpptMaxInputCurrent ?? selectedInverter?.specs?.mpptMaxInputCurrent ?? 100} onChange={(event) => updateForm({ mpptMaxInputCurrent: event.target.value })} /></Field>
        <Field label="ولتاژ بانک اینورتر / باتری"><input inputMode="decimal" value={form.systemVoltage ?? 48} onChange={(event) => updateForm({ systemVoltage: event.target.value })} /></Field>
        <Field label="ولتاژ هر باتری انتخابی"><input inputMode="decimal" value={form.batteryUnitVoltage ?? 51.2} onChange={(event) => updateForm({ batteryUnitVoltage: event.target.value })} /></Field>
        <Field label="جریان‌ساعت باتری"><input inputMode="decimal" value={form.batteryUnitAh ?? 100} onChange={(event) => updateForm({ batteryUnitAh: event.target.value })} /></Field>
        <Field label="ضریب افزایش باتری"><input inputMode="decimal" value={form.batteryFactor ?? 1} onChange={(event) => updateForm({ batteryFactor: event.target.value })} /></Field>
        <Field label="روز خودکفایی"><input inputMode="decimal" value={form.daysAutonomy ?? 0} onChange={(event) => updateForm({ daysAutonomy: event.target.value })} /></Field>
        <Field label="نوع باتری"><select value={form.batteryType || "LFP"} onChange={(event) => updateForm({ batteryType: event.target.value, dod: BATTERY_DOD[event.target.value] || 0.8 })}>{BATTERY_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</select></Field>
        <Field label="عمق دشارژ"><input inputMode="decimal" value={form.dod ?? 0.8} onChange={(event) => updateForm({ dod: event.target.value })} /></Field>
        <Field label="راندمان اینورتر"><input inputMode="decimal" value={form.inverterEfficiency ?? 0.93} onChange={(event) => updateForm({ inverterEfficiency: event.target.value })} /></Field>
        <Field label="ضریب تلفات کابل"><input inputMode="decimal" value={form.cableLossFactor ?? 0.97} onChange={(event) => updateForm({ cableLossFactor: event.target.value })} /></Field>
        <Field label="ضریب اطمینان طراحی"><input inputMode="decimal" value={form.designFactor ?? 1.2} onChange={(event) => updateForm({ designFactor: event.target.value })} /></Field>
      </div>
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
  const installation = result.result?.installation || {};
  const method = METHOD_LABELS[form.calculationMode] || "انتخاب نشده";
  const system = systemLabel(form.systemType);
  const demandKwh = ((summary.totalDailyEnergyWh || rec.demand.dailyWh || 0) / 1000).toFixed(2);
  const selectedPanel = form.selectedEquipment?.panel ? EquipmentRepository.getById(form.selectedEquipment.panel) : rec.panel;
  const selectedInverter = form.selectedEquipment?.inverter ? EquipmentRepository.getById(form.selectedEquipment.inverter) : rec.inverter;
  const selectedBattery = form.selectedEquipment?.battery ? EquipmentRepository.getById(form.selectedEquipment.battery) : rec.battery;
  const avgKs = form.calculationMode === 'loads' ? averageLoadFactor(form.loadItems, 'coincidenceFactor', 1).toFixed(2) : effectiveGlobalCoincidence(form).toFixed(2);
  const avgSurge = form.calculationMode === 'loads' ? averageLoadFactor(form.loadItems, 'surgeFactor', 1).toFixed(2) : n(form.surgeFactor, 1.7).toFixed(2);
  const batteryText = batteryArrangementText(battery, form);
  return (
    <div className="review-stage v15-review-stage">
      <div className="smart-decision-card"><h3>تصمیم هوشمند اپ</h3><p>پیشنهاد زیر بر اساس روش محاسبات، ضرایب واقعی مصرف، شرایط محیطی شهر، بانک تجهیزات، جریان راه‌اندازی و محدودیت‌های اینورتر انتخاب شده است.</p></div>
      <div className="review-grid final-summary-grid">
        <section className="review-card"><h3>مشخصات پروژه</h3><p><b>پروژه:</b> {form.projectTitle}</p><p><b>کارفرما:</b> {form.clientName}</p><p><b>شهر:</b> {form.city}</p><p><b>نوع سیستم:</b> {system}</p><p><b>روش محاسبات:</b> {method}</p><p><b>مسیر ورود:</b> {form.selectedScenarioId ? 'سناریوی آماده' : 'طراحی دستی'}</p></section>
        <section className="review-card"><h3>نیاز مصرف</h3><p><b>توان طراحی:</b> {(summary.demandPowerW || rec.requiredW || 0).toFixed(0)} W</p><p><b>مصرف روزانه:</b> {demandKwh} kWh</p><p><b>زمان مصرف روزانه:</b> {form.dailyUsageHours || 3} ساعت</p><p><b>میانگین ضریب همزمانی:</b> {avgKs}</p><p><b>میانگین ضریب راه‌اندازی:</b> {avgSurge}</p></section>
        <section className="review-card"><h3>پنل خورشیدی</h3><p><b>پنل پیشنهادی:</b> {selectedPanel?.title || '—'}</p><p><b>توان پنل:</b> {selectedPanel?.specs?.panelWatt || form.panelWatt || '—'} W</p><p><b>تعداد پنل:</b> {summary.panelCount ?? rec.pvCount} عدد</p><p><b>آرایش:</b> {pv.panelSeriesCount || '—'} سری × {pv.panelParallelCount || '—'} موازی</p><p><b>Voc سرد:</b> {pv.stringVocCold || '—'} V</p></section>
        <section className="review-card"><h3>اینورتر و MPPT</h3><p><b>مدل پیشنهادی:</b> {selectedInverter?.title || '—'}</p><p><b>توان نامی:</b> {((summary.inverterPowerW || selectedInverter?.specs?.ratedPowerW || rec.requiredW || 0) / 1000).toFixed(1)} kW</p><p><b>ولتاژ بانک:</b> {form.systemVoltage || 48} V</p><p><b>تعداد MPPT:</b> {form.mpptCount || selectedInverter?.specs?.mpptCount || 1}</p><p><b>بازه MPPT:</b> {form.mpptMinVoltage || selectedInverter?.specs?.mpptMinVoltage || '—'} تا {form.mpptMaxVoltage || selectedInverter?.specs?.mpptMaxVoltage || '—'} V</p><p><b>حداکثر Voc:</b> {form.maxPvVocV || 500} VDC</p></section>
        <section className="review-card"><h3>باتری</h3><p><b>باتری پیشنهادی:</b> {selectedBattery?.title || '—'}</p><p><b>تعداد کل:</b> {battery.totalCount ?? rec.batteryCount} عدد</p><p><b>توضیح سری/موازی:</b> {batteryText}</p></section>
        <section className="review-card"><h3>نصب و فضا</h3><p><b>فضای نصب پیشنهادی:</b> {installation.area?.requiredAreaM2 || '—'} m²</p><p><b>زاویه نصب:</b> {form.tiltAngle || '—'} درجه</p><p><b>جهت پیشنهادی:</b> جنوب / رو به تابش غالب</p></section>
        <section className="review-card"><h3>حفاظت و ایمنی</h3><p><b>DC Isolator:</b> {protection.dcIsolatorRating || '≥ Voc_max آرایه'}</p><p><b>SPD DC:</b> {protection.dcSpdType || 'Type II DC، یا Type I+II در صورت صاعقه‌گیر'}</p><p><b>فیوز/MCB استرینگ:</b> {protection.stringFuseRating || '1.25 تا 1.5 × Isc'}</p><p><b>کابل DC:</b> {cabling.dcCableSizeMm2 || '—'} mm²</p><p><b>AC/SPD/Earthing:</b> کلید AC، سرج AC و ارتینگ مناسب در گزارش نهایی درج می‌شود.</p></section>
      </div>
    </div>
  );
}

export function FinalResult({ form, locked = false }) {
  const reportRef = useRef(null);
  const rec = recommendation(form);
  const result = useMemo(() => {
    if (locked) return { ok: false, advisor: [{ severity: "warning", title: "مرحله نهایی هنوز فعال نیست", message: "برای اجرای محاسبات، ابتدا چکیده اطلاعات را تایید کنید." }] };
    try { return runEngineeringDesign(form); } catch (error) { return { ok: false, advisor: [{ severity: "error", title: "خطا", message: error.message }] }; }
  }, [form, locked]);
  async function exportPdf() {
    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
    const canvas = await html2canvas(reportRef.current, { scale: 2.8, backgroundColor: "#ffffff", useCORS: true });
    const pdf = new jsPDF("p", "mm", "a4");
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 210, 297);
    pdf.save("shil-executive-a4-report.pdf");
  }
  async function exportPng() {
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(reportRef.current, { scale: 2.8, backgroundColor: "#ffffff", useCORS: true });
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "shil-executive-a4-report.png";
    a.click();
  }
  const summary = result.result?.summary || {};
  const advisor = result.result?.advisor || result.advisor || [];
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
  const protectionItems = protection.bom?.length ? protection.bom : [];
  return (
    <div className="final-stage">
      <section ref={reportRef} className="a4-report-card executive-a4-v2" dir="rtl">
        <header className="a4-letterhead">
          <img src={PAGE_LOGO} alt="SHIL" />
          <div><h2>گزارش اجرایی طراحی سیستم خورشیدی</h2><span>نسخه مهندسی محاسبات و اجرا</span></div>
          <strong>{today}</strong>
        </header>
        <div className={`status-pill ${status === "success" ? "ok" : status === "warning" ? "warn" : status === "locked" ? "warn" : "danger"}`}>{status === "success" ? "ایمن و قابل اجرا" : status === "warning" ? "قابل اجرا با هشدار" : status === "locked" ? "در انتظار تایید مرحله قبل" : "نیازمند اصلاح"}</div>
        <div className="a4-section-grid two">
          <section className="a4-section"><h3>مشخصات مشتری و پروژه</h3><p><b>پروژه:</b> {form.projectTitle || "—"}</p><p><b>کارفرما:</b> {form.clientName || "—"}</p><p><b>شهر اجرا:</b> {form.city || "—"}</p><p><b>تاریخ تکمیل فرآیند:</b> {today}</p></section>
          <section className="a4-section"><h3>نیازها و روش محاسبات</h3><p><b>نوع سیستم:</b> {system}</p><p><b>روش محاسبه:</b> {method}</p><p><b>مصرف روزانه:</b> {demandDailyKwh} kWh</p><p><b>توان طراحی:</b> {(summary.demandPowerW || rec.requiredW || 0).toFixed(0)} W</p></section>
        </div>
        <div className="a4-metric-strip"><div><span>پنل</span><strong>{pvCount} عدد</strong><small>{pvKwp} kWp</small></div><div><span>اینورتر</span><strong>{inverterKw} kW</strong><small>{form.systemVoltage || 48}V بانک</small></div><div><span>باتری</span><strong>{batteryCount} عدد</strong><small>DoD {form.dod ?? 0.8}</small></div><div><span>تولید خالص</span><strong>{netProduction ? (netProduction / 1000).toFixed(1) : "—"} kWh</strong><small>بعد از تلفات</small></div></div>
        <div className="a4-section-grid two">
          <section className="a4-section"><h3>PV، MPPT و نصب</h3><p>آرایه پیشنهادی: {summary.panelCount ?? rec.pvCount} پنل با توان نامی {form.panelWatt || 585}W.</p><p>بازه MPPT: {form.mpptMinVoltage || "—"} تا {form.mpptMaxVoltage || "—"} VDC، حداکثر Voc: {form.maxPvVocV || form.controllerMaxVoc || 500} VDC.</p><p>شرایط نصب: تابش {form.sunHours || "—"} ساعت، زاویه {form.tiltAngle || "—"} درجه، ضریب سایه {form.shadingFactor || "—"} و گردوغبار {form.dustFactor || "—"}.</p></section>
          <section className="a4-section"><h3>باتری و همخوانی ولتاژ</h3><p>اولویت انتخاب باتری با همخوانی مستقیم ولتاژ بانک اینورتر است؛ سپس سری‌سازی باتری‌های ولتاژ پایین‌تر برای ساخت ولتاژ موردنیاز انجام می‌شود.</p><p>ولتاژ بانک: {result.result?.battery?.bankVoltage || form.batteryUnitVoltage || form.systemVoltage || "—"}V، ظرفیت واحد: {form.batteryUnitAh || "—"}Ah، نوع: {form.batteryType || "—"}.</p></section>
        </div>
        <section className="a4-section"><h3>تجهیزات حفاظتی، تابلو و اجرای DC/AC</h3><div className="a4-equipment-list v15-bom-list">{protectionItems.length ? protectionItems.slice(0, 10).map((item, index) => <span key={index}><b>{item.item}</b><small>{item.rating}</small></span>) : <><span><b>DC Isolator</b><small>{protection.dcIsolatorRating || "بر اساس Voc"}</small></span><span><b>SPD DC</b><small>{protection.dcSpdType || "Type II DC"}</small></span><span><b>AC Breaker</b><small>{protection.acBreakerRating || "طبق جریان بار"}</small></span><span><b>Combiner</b><small>{protection.combinerBoxRequired ? "لازم" : "در صورت چند استرینگ"}</small></span></>}</div></section>
        <section className="a4-section compact"><h3>پیام‌های مهندسی و اصلاحات لازم</h3><div className="advisor-list">{advisor.length ? advisor.slice(0, 5).map((item, index) => <div key={index} className={`advisor-item ${item.severity || "info"}`}><strong>{item.title || item.severity}</strong><span>{item.message || item.text}</span></div>) : <p>مورد بحرانی گزارش نشده است.</p>}</div></section>
      </section>
      <div className="final-actions"><button className="btn btn--primary" type="button" onClick={exportPdf} disabled={locked}>ذخیره PDF</button><button className="btn btn--secondary" type="button" onClick={exportPng} disabled={locked}>ذخیره PNG</button><button className="btn btn--ghost" type="button" onClick={() => window.print()}>چاپ</button></div>
    </div>
  );
}

