import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import EngineeringPageShell from "../../components/EngineeringPageShell.jsx";
import { approveProjectStep } from "../../workflow/projectWorkflow.js";
import { runSolarAutoDesign } from "../../core/calculation/solarAutoDesignEngine.js";
import { SHIL_LITHIUM_BATTERIES, SHIL_SOLAR_INVERTERS, SHIL_SOLAR_PANELS } from "../../data/shilSolarBanks.js";

function readDraft(key, fallback = null) {
  try { return JSON.parse(localStorage.getItem(key) || "null") || fallback; }
  catch { return fallback; }
}

function Toast({ message }) {
  return message ? <div className="shil-floating-warning">{message}</div> : null;
}

const optionTitle = (item) => item?.title || "-";
const faNumber = (value) => Number(value || 0).toLocaleString("fa-IR");
const kw = (w) => `${faNumber(Math.round(Number(w || 0) / 100) / 10)} کیلووات`;

function DetailsToggle({ title, children, defaultOpen = false, attached = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={attached ? "shil-details-box shil-details-attached" : "shil-details-box"}>
      <button type="button" className="shil-details-toggle" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>{title}</span>
        <b>{open ? "بستن" : "نمایش جزئیات"}</b>
      </button>
      {open ? <div className="shil-details-content">{children}</div> : null}
    </div>
  );
}

function DesignModeCards({ value, onChange }) {
  const items = [
    { key: "offgrid", label: "آفگرید", hint: "باتری محور", note: "مناسب نقاط بدون شبکه یا نیازمند استقلال کامل" },
    { key: "ongrid", label: "آنگرید", hint: "شبکه محور", note: "مناسب تزریق یا مصرف همزمان با شبکه" },
    { key: "hybrid", label: "هیبرید", hint: "ترکیبی", note: "ترکیب شبکه، PV و ذخیره‌ساز" }
  ];
  return (
    <div className="shil-system-type-cards shil-design-mode-cards">
      {items.map((item) => (
        <button key={item.key} type="button" className={value === item.key ? "active" : ""} onClick={() => onChange(item.key)}>
          <span className="shil-mode-icon">{item.key === "offgrid" ? "⛭" : item.key === "ongrid" ? "⌁" : "◇"}</span>
          <strong>{item.label}</strong>
          <small>{item.hint}</small>
          <em>{item.note}</em>
        </button>
      ))}
    </div>
  );
}

function BankSelect({ title, subtitle, value, extraFactor, onValue, onExtraFactor, items, renderMeta, renderReason, smartValue, smartTitle }) {
  const selected = items.find((item) => item.id === value);
  return (
    <div className="shil-bank-card shil-bank-card-final shil-bank-collapsed-field">
      <div className="shil-bank-topline">
        <div>
          <h2>{title}</h2>
          <span>{subtitle}</span>
        </div>
        <b>{smartValue}</b>
      </div>

      <div className="shil-smart-pick-box">
        <span>انتخاب هوشمند اپ</span>
        <strong>{smartTitle || optionTitle(selected)}</strong>
        <small>{smartValue}</small>
      </div>

      <DetailsToggle title="تغییر بانک و توسعه آینده">
        <div className="shil-bank-body">
          <label className="shil-bank-field">
            <span>انتخاب از بانک SHIL</span>
            <select value={value} onChange={(e) => onValue(e.target.value)}>
              {items.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
          </label>

          <label className="shil-bank-field shil-bank-count-field">
            <span>ضریب اضافه کردن</span>
            <input type="number" step="0.05" min="1" value={extraFactor} onChange={(e) => onExtraFactor(e.target.value)} />
          </label>
        </div>
      </DetailsToggle>

      <DetailsToggle title="توضیحات این بانک">
        <div className="shil-bank-meta">{renderMeta(selected)}</div>
        {renderReason ? <div className="shil-bank-reason">{renderReason(selected)}</div> : null}
      </DetailsToggle>
    </div>
  );
}

function ConfigurationLinkedDetails({ design }) {
  const protectionReport = design.protection?.report || [];
  const explanations = design.explanations || [];
  const detailRows = [
    {
      title: "اینورتر خورشیدی",
      value: `${optionTitle(design.inverter)} / ${faNumber(design.inverter.count)} عدد`,
      details: [
        `توان مبنای طراحی از جدول نتیجه خوانده می‌شود: ${faNumber(design.load.totalPowerW)} وات × ضریب ${design.settings.reserveFactor} = ${faNumber(design.load.totalPowerW * design.settings.reserveFactor)} وات.`,
        `نوع اجرا: ${design.settings.systemType === "offgrid" ? "آفگرید" : design.settings.systemType === "hybrid" ? "هیبرید" : "آنگرید"}. این مقدار نوع اینورتر نهایی را در چکیده و اجرای محاسبات مشخص می‌کند.`,
        `ولتاژ DC اینورتر ${design.inverter.dcVoltage} ولت است؛ باتری باید با بازه شناور همان کلاس ولتاژ همخوان باشد.`
      ]
    },
    {
      title: "باتری و خودکفایی",
      value: `${design.battery.battery.title} / ${faNumber(design.battery.totalCount)} عدد`,
      details: [
        `روز خودکفایی ${design.settings.autonomyDays} روز است و مستقیم روی تعداد باتری اثر می‌گذارد.`,
        `ساختار از جدول نتیجه: ${faNumber(design.battery.seriesCount)} سری × ${faNumber(design.battery.parallelCount)} موازی.`,
        `بازه ولتاژ شناور ${design.battery.voltageRange} است و با ورودی DC اینورتر کنترل می‌شود.`
      ]
    },
    {
      title: "پنل خورشیدی و آرایه PV",
      value: `${design.panel.title} / ${faNumber(design.pvArray.panelCount)} عدد`,
      details: [
        `توان آرایه ${faNumber(design.pvArray.arrayPowerW)} وات است و از تعداد پنل و توان پنل انتخاب‌شده محاسبه می‌شود.`,
        `ساختار آرایه: ${faNumber(design.pvArray.seriesCount)} سری × ${faNumber(design.pvArray.parallelCount)} موازی.`,
        "سری پنل‌ها برای قرار گرفتن در محدوده MPPT اینورتر و موازی‌ها برای پوشش توان و توسعه آینده انتخاب شده‌اند."
      ]
    },
    {
      title: "فضا، کابل و حفاظت",
      value: `${design.space.maintenanceAreaM2} m² / DC ${design.protection.dcBreakerA}A / AC ${design.protection.acBreakerA}A`,
      details: [
        `فضای نصب با تعداد پنل، مساحت پنل و فضای سرویس محاسبه شده است: ${design.space.note}`,
        `کابل‌ها: DC ${design.protection.dcCable}، PV ${design.protection.pvCable}، باتری ${design.protection.batteryCable}.`,
        "حفاظت با تفکیک سمت DC/AC، جریان کاری، ضریب اطمینان و اضافه‌بار انتخاب می‌شود."
      ]
    }
  ];

  return (
    <DetailsToggle title="نمایش جزئیات جدول، کابل و حفاظت" attached>
      <div className="shil-linked-details-grid">
        {detailRows.map((row) => (
          <div className="shil-linked-detail-card" key={row.title}>
            <div className="shil-linked-detail-head">
              <span>{row.title}</span>
              <strong>{row.value}</strong>
            </div>
            <ul>
              {row.details.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="shil-expert-box shil-linked-protection-report">
        {protectionReport.map((item) => <div key={item}><span>حفاظت</span><strong>{item}</strong></div>)}
        {explanations.map((item) => <div key={item}><span>SHIL</span><strong>{item}</strong></div>)}
      </div>
    </DetailsToggle>
  );
}

function ResultTable({ design }) {
  const rows = [
    ["نوع اجرا", design.settings.systemType === "offgrid" ? "آفگرید" : design.settings.systemType === "hybrid" ? "هیبرید" : "آنگرید", "نوع اینورتر و ساختار نهایی طراحی"],
    ["توان طراحی", `${faNumber(design.load.totalPowerW)}W × ضریب ${design.settings.reserveFactor}`, `${kw(design.load.totalPowerW * design.settings.reserveFactor)} مبنای انتخاب اینورتر`],
    ["اینورتر", `${optionTitle(design.inverter)} / ${faNumber(design.inverter.count)} عدد`, design.inverter.parallelRequired ? "نیازمند کارکرد موازی" : "پوشش مستقیم توان"],
    ["باتری", `${design.battery.battery.title} / ${faNumber(design.battery.totalCount)} عدد`, `${faNumber(design.battery.seriesCount)} سری × ${faNumber(design.battery.parallelCount)} موازی / بازه ${design.battery.voltageRange}`],
    ["پنل", `${design.panel.title} / ${faNumber(design.pvArray.panelCount)} عدد`, `${faNumber(design.pvArray.seriesCount)} سری × ${faNumber(design.pvArray.parallelCount)} موازی / ${faNumber(design.pvArray.arrayPowerW)}W`],
    ["فضای نصب", `${design.space.maintenanceAreaM2} m²`, design.space.note],
    ["حفاظت", `DC ${design.protection.dcBreakerA}A / AC ${design.protection.acBreakerA}A`, "بر اساس جریان کاری، ضریب اطمینان و حفاظت اضافه‌بار"],
    ["کابل", `DC ${design.protection.dcCable}`, `PV ${design.protection.pvCable} / باتری ${design.protection.batteryCable}`]
  ];

  return (
    <div className="shil-result-table shil-result-table-final" role="table" aria-label="نتیجه پیکربندی سیستم">
      <div className="shil-result-row shil-result-header" role="row">
        <span>بخش</span>
        <strong>مقدار محاسبه‌شده</strong>
        <small>دلیل / اثر در محاسبات</small>
      </div>
      {rows.map(([name, value, reason]) => (
        <div className="shil-result-row" role="row" key={name}>
          <span>{name}</span>
          <strong>{value}</strong>
          <small>{reason}</small>
        </div>
      ))}
    </div>
  );
}

export default function SystemSettings() {
  const { domain = "solar" } = useParams();
  const navigate = useNavigate();
  const emergency = domain === "emergency";
  const load = useMemo(() => readDraft("shil:loadEngineResult", {}), []);
  const environment = useMemo(() => readDraft("shil:environmentDraft", {}), []);

  const [systemType, setSystemType] = useState("offgrid");
  const [autonomyDays, setAutonomyDays] = useState(1);
  const [reserveFactor, setReserveFactor] = useState(1.2);
  const [equipmentManualMode, setEquipmentManualMode] = useState(false);
  const [parameterManualMode, setParameterManualMode] = useState(false);
  const [panelId, setPanelId] = useState(SHIL_SOLAR_PANELS.at(-1)?.id || "");
  const [inverterId, setInverterId] = useState(SHIL_SOLAR_INVERTERS.find((i) => i.ratedPowerW >= 5000)?.id || SHIL_SOLAR_INVERTERS[0]?.id || "");
  const [batteryId, setBatteryId] = useState(SHIL_LITHIUM_BATTERIES.find((b) => b.nominalVoltage === 48 && b.capacityAh === 200)?.id || SHIL_LITHIUM_BATTERIES[0]?.id || "");
  const [panelExtraFactor, setPanelExtraFactor] = useState(1);
  const [inverterExtraFactor, setInverterExtraFactor] = useState(1);
  const [batteryExtraFactor, setBatteryExtraFactor] = useState(1);
  const [warning, setWarning] = useState("");

  const settings = useMemo(() => ({
    systemType,
    autonomyDays: Number(autonomyDays) || 1,
    reserveFactor: Number(reserveFactor) || 1.2,
    panelId: equipmentManualMode ? panelId : undefined,
    inverterId: equipmentManualMode ? inverterId : undefined,
    batteryId: equipmentManualMode ? batteryId : undefined,
    panelExtraFactor: Number(panelExtraFactor) || 1,
    inverterExtraFactor: Number(inverterExtraFactor) || 1,
    batteryExtraFactor: Number(batteryExtraFactor) || 1,
    manualMode: equipmentManualMode || parameterManualMode,
    equipmentManualMode,
    parameterManualMode
  }), [systemType, autonomyDays, reserveFactor, equipmentManualMode, parameterManualMode, panelId, inverterId, batteryId, panelExtraFactor, inverterExtraFactor, batteryExtraFactor]);

  const solarDesign = useMemo(() => runSolarAutoDesign({ load, environment, settings }), [load, environment, settings]);

  useEffect(() => {
    if (equipmentManualMode) return;
    setPanelId(solarDesign.panel.id);
    setInverterId(solarDesign.inverter.id);
    setBatteryId(solarDesign.battery.battery.id);
  }, [equipmentManualMode, solarDesign.panel.id, solarDesign.inverter.id, solarDesign.battery.battery.id]);

  useEffect(() => {
    if (!warning) return undefined;
    const timer = setTimeout(() => setWarning(""), 5200);
    return () => clearTimeout(timer);
  }, [warning]);

  const applySmart = () => {
    setEquipmentManualMode(false);
    setParameterManualMode(false);
    setPanelExtraFactor(1);
    setInverterExtraFactor(1);
    setBatteryExtraFactor(1);
    setPanelId(solarDesign.panel.id);
    setInverterId(solarDesign.inverter.id);
    setBatteryId(solarDesign.battery.battery.id);
  };

  const confirmSolar = () => {
    if (!solarDesign.valid) {
      setWarning(solarDesign.nextBlockedReason || "پیکربندی با توان مصرفی همخوانی ندارد؛ علت خطا را اصلاح کنید.");
      return;
    }
    approveProjectStep("system");
    localStorage.setItem("shil:solarSystemDesign", JSON.stringify(solarDesign));
    localStorage.setItem("shil:systemSettingsDraft", JSON.stringify({ domain: "solar", ...settings, design: solarDesign }));
    navigate("/new-project/summary/solar");
  };

  const confirmEmergency = () => {
    approveProjectStep("system");
    localStorage.setItem("shil:systemSettingsDraft", JSON.stringify({ domain: "emergency", displayName: "برق اضطراری با اینورتر و باتری", calculationModel: "ups_like_battery_inverter" }));
    navigate("/new-project/summary/emergency");
  };

  if (emergency) {
    return (
      <EngineeringPageShell title="تنظیمات برق اضطراری">
        <section className="shil-card-stack">
          <div className="shil-section-card">
            <div className="shil-section-head"><h2>پیکربندی برق اضطراری</h2><span>Battery + Inverter Core</span></div>
            <p className="shil-muted-line">مسیر برق اضطراری از همان بانک باتری و اینورتر استفاده می‌کند و در چکیده نهایی ثبت می‌شود.</p>
          </div>
          <button type="button" className="shil-primary-wide" onClick={confirmEmergency}>تأیید و مشاهده چکیده</button>
        </section>
      </EngineeringPageShell>
    );
  }

  return (
    <EngineeringPageShell title="پیکربندی تجهیزات سیستم">
      <section className="shil-card-stack shil-solar-config-page shil-system-final-page">
        <Toast message={warning} />

        <div className="shil-section-card shil-config-block">
          <div className="shil-section-head"><h2>کنترل طراحی</h2><span>نوع اجرای اینورتر خورشیدی</span></div>
          <DesignModeCards value={systemType} onChange={setSystemType} />
        </div>

        <div className="shil-section-card shil-config-block">
          <div className="shil-section-head"><h2>پارامترهای اثرگذار</h2><span>مستقیم در انتخاب تجهیزات</span></div>
          <div className="shil-form-grid shil-param-grid">
            <label><span>روزهای خودکفایی</span><input type="number" min="1" max="7" value={autonomyDays} onChange={(e) => { setParameterManualMode(true); setAutonomyDays(e.target.value); }} /></label>
            <label><span>ضریب اطمینان استاندارد</span><input type="number" step="0.05" min="1" value={reserveFactor} onChange={(e) => { setParameterManualMode(true); setReserveFactor(e.target.value); }} /></label>
          </div>
          <div className="shil-action-row shil-smart-mode-row">
            <button type="button" className={!equipmentManualMode && !parameterManualMode ? "shil-soft-button active" : "shil-soft-button"} onClick={applySmart}>اعمال هوشمند SHIL</button>
            <button type="button" className={equipmentManualMode ? "shil-soft-button active" : "shil-soft-button"} onClick={() => setEquipmentManualMode(!equipmentManualMode)}>{equipmentManualMode ? "ورود دستی تجهیزات فعال" : "ورود دستی تجهیزات"}</button>
          </div>
          <p className="shil-muted-line">در حالت پیش‌فرض، روزهای خودکفایی و ضریب اطمینان استاندارد مستقیم روی موتور محاسبات وارپ می‌شوند؛ با ورود عدد جدید، همان لحظه حالت دستی پارامتر فعال و محاسبات دوباره انجام می‌شود.</p>
        </div>

        <div className="shil-system-banks-grid shil-system-banks-grid-final">
          <BankSelect
            title="بانک اینورتر خورشیدی"
            subtitle="1.6kW تا 30kW"
            value={inverterId}
            extraFactor={inverterExtraFactor}
            onValue={(v) => { setEquipmentManualMode(true); setInverterId(v); }}
            onExtraFactor={(v) => { setEquipmentManualMode(true); setInverterExtraFactor(v); }}
            smartTitle={optionTitle(solarDesign.inverter)}
            items={SHIL_SOLAR_INVERTERS}
            smartValue={`${kw(solarDesign.inverter.ratedPowerW)} / ${solarDesign.inverter.dcVoltage}V`}
            renderMeta={(item) => <>{item?.ratedPowerW}W / ورودی باتری {item?.dcVoltage}V / MPPT {item?.mpptMinV}-{item?.mpptMaxV}V / سقف PV {item?.maxPvPowerW}W</>}
            renderReason={(item) => <>{item?.title} زمانی مجاز است که توان دائم، توان لحظه‌ای و بازه ولتاژ شناور باتری با نیاز مصرف‌کننده همخوانی داشته باشد.</>}
          />
          <BankSelect
            title="بانک باتری"
            subtitle="12V / 24V / 48V"
            value={batteryId}
            extraFactor={batteryExtraFactor}
            onValue={(v) => { setEquipmentManualMode(true); setBatteryId(v); }}
            onExtraFactor={(v) => { setEquipmentManualMode(true); setBatteryExtraFactor(v); }}
            smartTitle={solarDesign.battery.battery.title}
            items={SHIL_LITHIUM_BATTERIES}
            smartValue={`${solarDesign.battery.battery.nominalVoltage}V / ${faNumber(solarDesign.battery.totalCount)} عدد`}
            renderMeta={(item) => <>{item?.nominalVoltage}V / {item?.capacityAh}Ah / بازه شناور {item?.minVoltage}-{item?.maxVoltage}V / انرژی خام {item?.energyWh}Wh</>}
            renderReason={() => <>ولتاژ باتری به صورت شناور کنترل می‌شود؛ برای اینورتر 12، 24 و 48 ولت، بازه باتری معادل همان ولتاژ باید داخل محدوده مجاز اینورتر باشد.</>}
          />
          <BankSelect
            title="بانک پنل خورشیدی"
            subtitle="400W تا 700W"
            value={panelId}
            extraFactor={panelExtraFactor}
            onValue={(v) => { setEquipmentManualMode(true); setPanelId(v); }}
            onExtraFactor={(v) => { setEquipmentManualMode(true); setPanelExtraFactor(v); }}
            smartTitle={solarDesign.panel.title}
            items={SHIL_SOLAR_PANELS}
            smartValue={`${solarDesign.panel.powerW}W / ${faNumber(solarDesign.pvArray.panelCount)} عدد`}
            renderMeta={(item) => <>{item?.powerW}W / Vmp {item?.vmp}V / Voc {item?.voc}V / مساحت تقریبی {item?.areaM2}m²</>}
            renderReason={() => <>تعداد سری پنل‌ها طوری تعیین می‌شود که ولتاژ رشته داخل محدوده MPPT اینورتر بماند و تعداد موازی توان مورد نیاز و توسعه آینده را پوشش دهد.</>}
          />
        </div>

        <div className="shil-section-card shil-auto-result-card shil-result-card-final">
          <div className="shil-section-head"><h2>نتیجه پیکربندی</h2><span>{solarDesign.valid ? "قابل تأیید" : "نیازمند اصلاح"}</span></div>
          <ResultTable design={solarDesign} />
          {solarDesign.warnings.map((item) => <div key={item} className="shil-inline-warning">{item}</div>)}
          <ConfigurationLinkedDetails design={solarDesign} />
        </div>

        <button type="button" className="shil-primary-wide shil-confirm-config-button" onClick={confirmSolar}>تأیید پیکربندی و رفتن به چکیده</button>
      </section>
    </EngineeringPageShell>
  );
}
