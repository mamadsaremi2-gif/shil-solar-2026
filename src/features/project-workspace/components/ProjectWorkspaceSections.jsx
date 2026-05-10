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
  const designSource = form.scenarioId ? "سناریوی آماده" : form.calculationMode ? `طراحی از مسیر ${METHOD_LABELS[form.calculationMode] || form.calculationMode}` : "مسیر طراحی هنوز کامل نشده";
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
        </div>
      </section>

      <section className="selected-equipment-strip">
        {!isBackup ? <BankSelector label="بانک پنل خورشیدی" category="panel" selectedId={form.selectedEquipment?.panel || selectedPanel?.id} onSelect={(item) => select("panel", item)} /> : null}
        <BankSelector label={isBackup ? "بانک UPS / سانورتر" : "بانک اینورتر"} category="inverter" selectedId={form.selectedEquipment?.inverter || selectedInverter?.id} onSelect={(item) => select("inverter", item)} />
        <BankSelector label="بانک باتری" category="battery" selectedId={form.selectedEquipment?.battery || selectedBattery?.id} onSelect={(item) => select("battery", item)} />
      </section>

      <section className="distributed-field-panel">
        <div className="distributed-field-panel__head"><strong>فیلدهای فنی تجهیزات</strong><span>مقادیر پایه برای یک اینورتر هستند؛ مقدار کل با ضریب تعداد اینورتر محاسبه می‌شود.</span></div>
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
  const method = METHOD_LABELS[form.calculationMode] || "انتخاب نشده";
  const system = systemLabel(form.systemType);
  const isBackup = form.systemType === "backup";
  const inverterCount = Math.max(1, n(form.requestedParallelInverters, n(form.inverterParallelDesignCount, 1)));
  const unitInvW = n(form.inverterRatedPowerW, n(rec.inverter?.specs?.ratedPowerW, rec.requiredW));
  const unitSurgeW = n(form.inverterUnitSurgeW, unitInvW * 2);
  const tabs = [
    { id: 0, title: "مشخصات", body: [["پروژه", form.projectTitle || "—"], ["کارفرما", form.clientName || "—"], ["شهر", form.city || "—"], ["مسیر طراحی", form.scenarioId ? "سناریوی آماده" : "طراحی دستی/مرحله‌ای"]] },
    { id: 4, title: "نیاز مصرف", body: [["روش", method], ["توان طراحی", `${(rec.requiredW / 1000).toFixed(1)} kW`], ["مصرف/بکاپ", isBackup ? `${form.backupHours || 0} ساعت` : `${((rec.demand.dailyWh || 0) / 1000).toFixed(1)} kWh/day`], ["Surge", `${(rec.demand.surgeW / 1000).toFixed(1)} kW`]] },
    { id: 5, title: "اینورتر و تصمیم", body: [["نوع سیستم", system], ["تصمیم", form.engineeringDecisionTitle || "بدون Recovery"], ["تعداد اینورتر", `${inverterCount} عدد`], ["توان کل", `${((unitInvW * inverterCount) / 1000).toFixed(1)} kW`], ["Surge کل", `${((unitSurgeW * inverterCount) / 1000).toFixed(1)} kW`]] },
    { id: 5, title: "پنل / باتری", body: [["پنل", isBackup ? "ندارد" : `${summary.panelCount ?? rec.pvCount} عدد`], ["توان PV", isBackup ? "ندارد" : `${(((summary.pvInstalledPowerW || ((summary.panelCount ?? rec.pvCount) * n(form.panelWatt, 585))) || 0) / 1000).toFixed(2)} kWp`], ["باتری", `${summary.batteryCount ?? rec.batteryCount} عدد`], ["آرایش باتری", batteryArrangementText(battery, form)]] },
    { id: 5, title: "کابل و حفاظت", body: [["کابل DC", isBackup ? "ندارد" : `${cabling.dcCableSizeMm2 || '—'} mm²`], ["کابل باتری", `${cabling.batteryCableSizeMm2 || '—'} mm²`], ["کابل AC", `${cabling.acCableSizeMm2 || '—'} mm²`], ["حفاظت", protection.combinerBoxRequired ? "Combiner لازم" : "طبق محاسبات"]] },
    { id: 6, title: "ضرایب و تاریخچه", body: [["ضریب طراحی", form.designFactor || 1.2], ["ضریب کابل", form.cableLossFactor || 0.97], ["ضریب باتری", form.batteryFactor || 1], ["منبع تصمیم", form.engineeringDecisionSource || "مسیر عادی"], ["آخرین Recovery", form.engineeringDecisionDescription || "ثبت نشده"]] },
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
        <div className="a4-section-grid two">
          <section className="a4-section"><h3>مشخصات مشتری و پروژه</h3><p><b>پروژه:</b> {form.projectTitle || "—"}</p><p><b>کارفرما:</b> {form.clientName || "—"}</p><p><b>شهر اجرا:</b> {form.city || "—"}</p><p><b>تاریخ تکمیل فرآیند:</b> {today}</p></section>
          <section className="a4-section"><h3>نیازها و روش محاسبات</h3><p><b>نوع سیستم:</b> {system}</p><p><b>روش محاسبه:</b> {method}</p><p><b>مصرف روزانه:</b> {demandDailyKwh} kWh</p><p><b>توان طراحی:</b> {(summary.demandPowerW || rec.requiredW || 0).toFixed(0)} W</p></section>
        </div>
        <div className="a4-metric-strip">{!isBackup ? <div><span>پنل</span><strong>{pvCount} عدد</strong><small>{pvKwp} kWp</small></div> : <div><span>زمان بکاپ</span><strong>{form.backupHours || 2} h</strong><small>مورد نیاز مشتری</small></div>}<div><span>{isBackup ? "UPS / سانورتر" : "اینورتر"}</span><strong>{inverterKw} kW</strong><small>{form.systemVoltage || 48}V بانک</small></div><div><span>باتری</span><strong>{batteryCount} عدد</strong><small>DoD {form.dod ?? 0.8}</small></div>{!isBackup ? <div><span>تولید خالص</span><strong>{netProduction ? (netProduction / 1000).toFixed(1) : "—"} kWh</strong><small>بعد از تلفات</small></div> : <div><span>مصرف اضطراری</span><strong>{demandDailyKwh} kWh</strong><small>بر اساس زمان بکاپ</small></div>}</div>
        <div className="a4-section-grid two">
          {!isBackup ? <section className="a4-section"><h3>PV، MPPT و نصب</h3><p>آرایه پیشنهادی: {summary.panelCount ?? rec.pvCount} پنل با توان نامی {form.panelWatt || 585}W.</p><p>بازه MPPT: {form.mpptMinVoltage || "—"} تا {form.mpptMaxVoltage || "—"} VDC، حداکثر Voc: {form.maxPvVocV || form.controllerMaxVoc || 500} VDC.</p><p>شرایط نصب: تابش {form.sunHours || "—"} ساعت، زاویه {form.tiltAngle || "—"} درجه، ضریب سایه {form.shadingFactor || "—"} و گردوغبار {form.dustFactor || "—"}.</p></section> : <section className="a4-section"><h3>UPS، باتری و زمان پشتیبانی</h3><p>مبنای طراحی برق اضطراری، توان مصرف‌کننده و مدت زمان برق اضطراری موردنیاز است؛ پنل، MPPT و تابش در این مسیر دخالت ندارند.</p><p>زمان بکاپ موردنیاز: {form.backupHours || 2} ساعت. ولتاژ بانک: {form.systemVoltage || 48}V.</p><p>انتخاب تجهیزات بر اساس توان لحظه‌ای، Surge بارها، راندمان اینورتر و DoD باتری انجام می‌شود.</p></section>}
          <section className="a4-section"><h3>باتری و همخوانی ولتاژ</h3><p>{form.systemType === "backup" ? (result.result?.battery?.voltagePolicy || "انتخاب باتری بر اساس ولتاژ بانک سانورتر انجام می‌شود.") : "اولویت انتخاب باتری با همخوانی مستقیم ولتاژ بانک اینورتر است؛ سپس سری‌سازی باتری‌های ولتاژ پایین‌تر برای ساخت ولتاژ موردنیاز انجام می‌شود."}</p><p>ولتاژ بانک: {result.result?.battery?.bankVoltage || form.batteryUnitVoltage || form.systemVoltage || "—"}V، ظرفیت واحد: {form.batteryUnitAh || "—"}Ah، نوع: {form.batteryType || "—"}.</p></section>
        </div>
        <section className="a4-section"><h3>تجهیزات حفاظتی، تابلو و اجرای DC/AC</h3><div className="a4-equipment-list v15-bom-list">{protectionItems.length ? protectionItems.slice(0, 10).map((item, index) => <span key={index}><b>{item.item}</b><small>{item.rating}</small></span>) : <><span><b>DC Isolator</b><small>{protection.dcIsolatorRating || "بر اساس Voc"}</small></span><span><b>SPD DC</b><small>{protection.dcSpdType || "Type II DC"}</small></span><span><b>AC Breaker</b><small>{protection.acBreakerRating || "طبق جریان بار"}</small></span><span><b>Combiner</b><small>{protection.combinerBoxRequired ? "لازم" : "در صورت چند استرینگ"}</small></span></>}</div></section>
        <section className="a4-section compact"><h3>پیام‌های مهندسی و اصلاحات لازم</h3><div className="advisor-list">{advisor.length ? advisor.slice(0, 5).map((item, index) => <div key={index} className={`advisor-item ${item.severity || "info"}`}><strong>{item.title || item.severity}</strong><span>{item.message || item.text}</span></div>) : <p>مورد بحرانی گزارش نشده است.</p>}</div></section>
      </section>
      <div className="final-actions"><button className="btn btn--primary" type="button" onClick={exportPdf} disabled={locked}>ذخیره PDF</button><button className="btn btn--secondary" type="button" onClick={exportPng} disabled={locked}>ذخیره PNG</button><button className="btn btn--ghost" type="button" onClick={() => window.print()}>چاپ</button></div>
    </div>
  );
}

