import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import EngineeringPageShell from "../../components/EngineeringPageShell.jsx";
import { approveProjectStep } from "../../workflow/projectWorkflow.js";
// Debug mode: calculation engine detached from SystemSettings to isolate UI/runtime issues.
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
const mw = (w) => `${faNumber(Math.round(Number(w || 0) / 10000) / 100)} مگاوات`;
const normalizePersianInput = (value) => String(value ?? "")
  .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
  .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
  .replace(/٫/g, ".")
  .replace(/٬|,/g, "")
  .trim();
const toNumber = (value, fallback = 0) => {
  const n = Number(normalizePersianInput(value));
  return Number.isFinite(n) ? n : fallback;
};

const firstItem = (items = []) => Array.isArray(items) && items.length ? items[0] : {};
const defaultPanel = () => SHIL_SOLAR_PANELS.find((p) => Number(p.powerW) === 620) || firstItem(SHIL_SOLAR_PANELS);
const defaultInverter = () => SHIL_SOLAR_INVERTERS.find((i) => Number(i.ratedPowerW) >= 5000) || firstItem(SHIL_SOLAR_INVERTERS);
const defaultBattery = () => SHIL_LITHIUM_BATTERIES.find((b) => Number(b.nominalVoltage) === 48 && Number(b.capacityAh) === 200) || firstItem(SHIL_LITHIUM_BATTERIES);


function getDesignModeLabel(systemType = "offgrid") {
  if (systemType === "ongrid") return "آنگرید";
  if (systemType === "hybrid") return "هیبرید";
  return "آفگرید";
}

function pickInverterFromBank({ targetPowerW = 0, systemType = "offgrid", preferredId = "" } = {}) {
  if (preferredId) {
    const manual = SHIL_SOLAR_INVERTERS.find((item) => item.id === preferredId);
    if (manual) return manual;
  }
  const normalizedMode = String(systemType || "offgrid").toLowerCase();
  const modeItems = SHIL_SOLAR_INVERTERS.filter((item) => {
    const type = String(item.type || "").toLowerCase();
    if (normalizedMode === "ongrid") return type.includes("on");
    if (normalizedMode === "hybrid") return type.includes("hybrid");
    return type.includes("off") || type.includes("si");
  });
  const source = modeItems.length ? modeItems : SHIL_SOLAR_INVERTERS;
  return source
    .slice()
    .sort((a, b) => Number(a.ratedPowerW || 0) - Number(b.ratedPowerW || 0))
    .find((item) => Number(item.ratedPowerW || 0) >= Number(targetPowerW || 0)) || source[source.length - 1] || defaultInverter();
}

function pickBatteryFromBank({ inverter = {}, autonomyDays = 0, required = false, preferredId = "" } = {}) {
  if (preferredId) {
    const manual = SHIL_LITHIUM_BATTERIES.find((item) => item.id === preferredId);
    if (manual) return manual;
  }
  if (!required && Number(autonomyDays || 0) <= 0) return defaultBattery();
  const dc = Number(inverter.dcVoltage || inverter.batteryVoltage || 48);
  const source = SHIL_LITHIUM_BATTERIES.filter((item) => Math.abs(Number(item.nominalVoltage || 0) - dc) <= 3) || [];
  return (source.length ? source : SHIL_LITHIUM_BATTERIES)
    .slice()
    .sort((a, b) => Number(b.energyWh || 0) - Number(a.energyWh || 0))[0] || defaultBattery();
}

function pickPanelFromBank({ targetPowerW = 0, preferredId = "" } = {}) {
  if (preferredId) {
    const manual = SHIL_SOLAR_PANELS.find((item) => item.id === preferredId);
    if (manual) return manual;
  }
  const sorted = SHIL_SOLAR_PANELS.slice().sort((a, b) => Number(b.powerW || 0) - Number(a.powerW || 0));
  if (Number(targetPowerW || 0) > 10000) return sorted[0] || defaultPanel();
  return SHIL_SOLAR_PANELS.find((item) => Number(item.powerW || 0) >= 620) || sorted[0] || defaultPanel();
}

function buildPreviousMethodRows({ load = {}, method = "equipment", solarPanelPowerInput = {}, environment = {}, autonomyDays = 0, reserveFactor = 1.2 } = {}) {
  const voltage = Number(load.voltageAC || solarPanelPowerInput.acVoltageRoute || 220);
  const phase = voltage >= 380 ? "۳۸۰ ولت سه‌فاز" : "۲۲۰ ولت تک‌فاز";
  const baseRows = [
    ["روش محاسبات", METHOD_TITLE_MAP[method] || METHOD_TITLE_MAP[load.method] || "لیست تجهیزات"],
    ["شهر و منبع شرایط محیطی", environment?.city || "ثبت نشده"],
  ];
  if (method === "solar_panel_power") {
    baseRows.push(
      ["توان کل پنل‌ها", `${faNumber(solarPanelPowerInput.totalPanelPowerW || 0)} W`],
      ["تولید روزانه بدون تلفات", solarPanelPowerInput.rawDailyEnergyKWh ? `${solarPanelPowerInput.rawDailyEnergyKWh} kWh` : "-"],
      ["ساعت تابش / تلفات", `${solarPanelPowerInput.psh || environment?.peakSunHours || "-"} h / ${solarPanelPowerInput.lossPercent ?? environment?.totalLossPercent ?? "-"}%`],
      ["ولتاژ خروجی", phase],
    );
  } else if (method === "current") {
    baseRows.push(
      ["جریان کل واردشده", `${load.totalCurrentA || load.acCurrentA || 0} A`],
      ["ولتاژ شبکه", phase],
      ["توان محاسبه‌شده", `${faNumber(load.totalPowerW || 0)} W`],
    );
  } else if (method === "power") {
    baseRows.push(
      ["توان کل واردشده", `${faNumber(load.totalPowerW || 0)} W`],
      ["انرژی روزانه", `${load.totalEnergyKWh || 0} kWh`],
      ["جریان محاسبه‌شده", `${load.acCurrentA || load.totalCurrentA || 0} A`],
      ["ولتاژ شبکه", phase],
    );
  } else {
    baseRows.push(
      ["تجهیزات / منبع بار", load.selectedCount ? `${faNumber(load.selectedCount)} مورد` : "دیتای مرحله قبل"],
      ["توان کل", `${faNumber(load.totalPowerW || 0)} W`],
      ["انرژی روزانه", `${load.totalEnergyKWh || 0} kWh`],
      ["جریان کل", `${load.acCurrentA || load.totalCurrentA || 0} A`],
    );
  }
  baseRows.push(
    ["روزهای خودکفایی", `${faNumber(autonomyDays || 0)} روز`],
    ["ضریب اطمینان استاندارد", `${reserveFactor || 1.2}`],
  );
  return baseRows;
}

function normalizeSolarDesign(design = {}) {
  const panel = { ...defaultPanel(), ...(design.panel || {}) };
  const inverter = { ...defaultInverter(), count: 1, dcVoltage: 48, ratedPowerW: 0, ...(design.inverter || {}) };
  const batteryItem = { ...defaultBattery(), ...((design.battery || {}).battery || {}) };
  const pvArray = { panelCount: 0, arrayPowerW: 0, ...(design.pvArray || {}) };
  const battery = {
    totalCount: 0,
    unitVoltageV: batteryItem.nominalVoltage || batteryItem.voltageV || 48,
    unitEnergyKWh: batteryItem.energyWh ? Math.round(Number(batteryItem.energyWh) / 10) / 100 : undefined,
    ...(design.battery || {}),
    battery: batteryItem,
  };

  const safeSettings = { systemType: "offgrid", reserveFactor: 1.2, autonomyDays: 0, calculationMethod: "debug_detached", ...(design.settings || {}) };
  const safeLoad = { totalPowerW: 0, totalEnergyKWh: 0, voltageAC: 220, ...(design.load || {}) };
  const safeDesign = { designPowerW: pvArray.arrayPowerW || safeLoad.totalPowerW || 0, ...(design.design || {}) };
  const safeSpace = { maintenanceAreaM2: 0, note: "موتور محاسبات در این نسخه تستی از صفحه تنظیمات جدا شده است.", ...(design.space || {}) };
  const safeProtection = { dcBreakerA: 0, acBreakerA: 0, dcCable: "-", pvCable: "-", batteryCable: "-", report: [], ...(design.protection || {}) };

  return {
    valid: true,
    detachedCalculationMode: true,
    ...design,
    panel,
    inverter,
    battery,
    pvArray,
    load: safeLoad,
    settings: safeSettings,
    space: safeSpace,
    protection: safeProtection,
    design: safeDesign,
    panelPowerAnalysis: design.panelPowerAnalysis || { status: "detached", score: 0, array: {}, electrical: {}, physical: {}, checks: [], recommendations: ["موتور محاسبات فعلاً برای تست از صفحه تنظیمات جدا شده است."] },
    inverterTopology: design.inverterTopology || { panelDistribution: [], rows: [], notes: [] },
    solarSizing: design.solarSizing || {},
    systemScale: design.systemScale || {},
    utilityElectrical: design.utilityElectrical || {},
    enterpriseUtility: design.enterpriseUtility || {},
    warnings: Array.isArray(design.warnings) ? design.warnings : [],
    explanations: Array.isArray(design.explanations) ? design.explanations : [],
  };
}


function batterySpecText(bank = {}) {
  const b = bank.battery || {};
  const count = bank.totalCount || bank.count || "-";
  const voltage = bank.unitVoltageV || bank.voltageV || b.nominalVoltage || b.voltageV || "-";
  const ah = bank.unitCapacityAh || bank.capacityAh || b.capacityAh || "-";
  const unitKWh = bank.unitEnergyKWh || (voltage !== "-" && ah !== "-" ? Math.round((Number(voltage) * Number(ah)) / 10) / 100 : "-");
  const totalKWh = bank.grossEnergyKWh || (bank.grossEnergyWh ? Math.round(bank.grossEnergyWh / 10) / 100 : "-");
  return `${count} عدد / ${voltage}V / ${ah}Ah / ${unitKWh}kWh هر باتری / ${totalKWh}kWh کل`;
}

function batteryNoteText(bank = {}) {
  const series = bank.seriesCount || "-";
  const parallel = bank.parallelCount || "-";
  const bankVoltage = bank.bankVoltageV || "-";
  const bankAh = bank.bankCurrentAh || bank.installedAh || "-";
  const branchCurrent = bank.branchCurrentA ? ` / جریان شاخه ${bank.branchCurrentA}A` : "";
  return `${series} سری × ${parallel} موازی / ولتاژ بانک ${bankVoltage}V / ظرفیت جریان ${bankAh}Ah${branchCurrent}`;
}

function DetailsToggle({ title, children, defaultOpen = false, attached = false }) {
  const [open, setOpen] = React.useState(defaultOpen);
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

function BankSelect({ title, subtitle, value, onValue, items, renderMeta, renderReason, smartValue, smartTitle }) {
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
      value: `${design.battery.battery.title} / ${batterySpecText(design.battery)}`,
      details: [
        `روز خودکفایی ${design.settings.autonomyDays} روز است و مستقیم روی تعداد باتری اثر می‌گذارد.`,
        `مشخصات کامل باتری: ${batterySpecText(design.battery)}.`,
        `ساختار از جدول نتیجه: ${batteryNoteText(design.battery)}.`,
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

function SolarPanelPowerResultTable({ design, solarPanelPowerInput = {}, batteryScope = "none", unifiedPvResult = null }) {
  const input = solarPanelPowerInput || {};
  const rawDaily = input.rawDailyEnergyKWh || (input.totalPanelPowerW && input.psh ? Math.round((input.totalPanelPowerW / 1000) * input.psh * 100) / 100 : null);
  const usableDaily = input.generatedDailyKWh || input.usableDailyEnergyKWh || design.panelPowerAnalysis?.array?.dailyEnergyKWh || design.solarSizing?.ePvDailyKWh;
  const panelDistribution = Array.isArray(input.inverterPanelDistribution) && input.inverterPanelDistribution.length
    ? input.inverterPanelDistribution.join(" / ")
    : (design.inverterTopology?.panelDistribution || []).join(" / ");
  const inputPanelCount = toNumber(input.panelCount, design.pvArray?.panelCount || 0);
  const inputPanelPowerW = toNumber(input.panelPowerW || design.panel?.powerW, design.panel?.powerW || 0);
  const inputTotalPowerW = toNumber(input.totalPanelPowerW, inputPanelCount * inputPanelPowerW || design.pvArray?.arrayPowerW || 0);
  const effectivePowerW = toNumber(input.effectivePanelPowerW, inputTotalPowerW * Math.max(0, Math.min(1, (100 - toNumber(input.lossPercent, 0)) / 100)));
  const s = unifiedPvResult?.summary?.important_results || {};
  const rows = [
    ["روش محاسبات", unifiedPvResult?.summary?.title_fa || METHOD_TITLE_MAP[design?.settings?.calculationMethod] || "موتور یکپارچه PV"],
    ["توان پنل", `${faNumber(s.panel_power_W || inputPanelPowerW || design.panel?.powerW)} W`],
    ["توان مجموعه پنل‌ها", `${faNumber(s.panel_array_power_W || inputTotalPowerW)} W`],
    ["توان موثر پس از تلفات", `${faNumber(s.effective_power_after_losses_W || effectivePowerW)} W`],
    ["ضریب راه‌اندازی", `${design.settings.reserveFactor || 1.2}`],
    ["توان نهایی طراحی", `${faNumber(s.final_design_power_W || design.design.designPowerW)} W`],
    ["توان اینورتر اعمال شده در بانک", `${faNumber(s.inverter_power_W || design.inverter?.ratedPowerW)} W`],
    ["تعداد اینورتر مشخص شده", `${faNumber(s.inverter_count || design.inverter?.count || 1)} عدد`],
    ["تولید خام روزانه", s.raw_daily_production_Wh ? `${Math.round(s.raw_daily_production_Wh / 100) / 10} kWh` : (rawDaily ? `${rawDaily} kWh` : "-")],
    ["تولید واقعی با تلفات", s.real_daily_production_Wh ? `${Math.round(s.real_daily_production_Wh / 100) / 10} kWh` : (usableDaily ? `${usableDaily} kWh` : "-")],
    ["باتری اعمال شده پیش فرض بانک", s.default_battery || design.battery?.battery?.title || "-"],
    ["روزهای خودکفایی", `${faNumber(s.autonomy_days || design.settings?.autonomyDays || 0)} روز`],
    ["باتری اعمال شده متناسب با روزهای خودکفایی", `${faNumber(s.battery_count_for_autonomy || design.battery?.totalCount || 0)} عدد`],
  ];

  return <ResultTableFrame rows={rows} ariaLabel="نتیجه پیکربندی مسیر توان پنل خورشیدی" />;
}

function GeneralLoadResultTable({ load = {}, design = {} }) {
  const rows = [
    ["روش محاسبات", METHOD_TITLE_MAP[load.method] || "لیست تجهیزات"],
    ["تعداد تجهیزات", load.selectedCount ? `${faNumber(load.selectedCount)} مورد` : "بدون تجهیز انتخابی / سناریوی آماده"],
    ["توان کل مصرفی", `${faNumber(load.totalPowerW || 0)} W`],
    ["انرژی روزانه", `${load.totalEnergyKWh || 0} kWh`],
    ["جریان AC", `${load.acCurrentA || load.totalCurrentA || 0} A`],
    ["جریان راه‌اندازی", `${load.startCurrentA || 0} A`],
    ["پیک استارت", `${faNumber(load.surgePowerW || 0)} W`],
    ["مسیر AC", load.phaseAC === "three" ? "۳۸۰ ولت سه‌فاز" : `${faNumber(load.voltageAC || 220)} ولت تک‌فاز`],
    ["اینورتر پیشنهادی", `${faNumber(load.recommendedInverterW || design.inverter?.ratedPowerW || 0)} W`],
  ];
  return <ResultTableFrame rows={rows} ariaLabel="نتیجه پیکربندی عمومی بار" />;
}

function ResultTableFrame({ rows, ariaLabel }) {
  return (
    <div className="shil-result-table shil-result-table-final" role="table" aria-label={ariaLabel}>
      <div className="shil-result-row shil-result-header" role="row">
        <span>بخش</span>
        <strong>نتیجه نهایی</strong>
      </div>
      {rows.map(([name, value]) => (
        <div className="shil-result-row" role="row" key={name}>
          <span>{name}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

const METHOD_TITLE_MAP = {
  equipment: "لیست تجهیزات",
  profile: "پروفایل مصرف",
  energy: "انرژی روزانه",
  power: "توان کل",
  current: "جریان کل",
  solar_panel_power: "توان پنل خورشیدی",
};


function PreviousMethodDataBlock({ rows, parameterManualMode, autonomyDays, reserveFactor, onAutonomyDays, onReserveFactor, onManualMode }) {
  return (
    <div className="shil-section-card shil-config-block">
      <div className="shil-section-head"><h2>دیتاها و پارامترهای وارد شده مرحله قبل</h2><span>{parameterManualMode ? "حالت دستی فعال" : "خوانده‌شده از مسیر قبل"}</span></div>
      <ResultTableFrame rows={rows} ariaLabel="دیتاها و پارامترهای مرحله قبل" />
      <div className="shil-form-grid shil-param-grid">
        <label><span>روزهای خودکفایی</span><input type="text" inputMode="decimal" min="0" max="7" value={autonomyDays} onChange={(e) => { onManualMode(true); onAutonomyDays(e.target.value); }} /></label>
        <label><span>ضریب اطمینان استاندارد</span><input type="text" inputMode="decimal" value={reserveFactor} onChange={(e) => { onManualMode(true); onReserveFactor(e.target.value); }} /></label>
      </div>
    </div>
  );
}

function EfficiencyCalculationBlock({ design, environment = {}, solarPanelPowerInput = {}, method = "equipment" }) {
  const psh = solarPanelPowerInput?.psh || environment?.peakSunHours || environment?.sunHours || "-";
  const loss = solarPanelPowerInput?.lossPercent ?? environment?.totalLossPercent ?? "-";
  const efficiencyPercent = loss === "-" ? "-" : Math.max(0, Math.round((100 - Number(loss || 0)) * 10) / 10);
  const rows = [
    ["روش محاسبات", METHOD_TITLE_MAP[method] || "لیست تجهیزات"],
    ["نوع اجرای سیستم", getDesignModeLabel(design.settings?.systemType)],
    ["توان مبنای محاسبه", `${faNumber(design.load?.totalPowerW || design.pvArray?.arrayPowerW || 0)} W`],
    ["ضریب اطمینان", `${design.settings?.reserveFactor || 1.2}`],
    ["توان نهایی طراحی", `${faNumber(design.design?.designPowerW || 0)} W`],
    ["راندمان/تلفات محیطی", efficiencyPercent === "-" ? "ثبت نشده" : `${efficiencyPercent}% / تلفات ${loss}%`],
    ["منبع تابش", psh === "-" ? "ثبت نشده" : `${psh} ساعت موثر`],
  ];
  return (
    <div className="shil-section-card shil-config-block">
      <div className="shil-section-head"><h2>محاسبات با راندمان‌ها</h2><span>پیش‌محاسبه سیستم</span></div>
      <ResultTableFrame rows={rows} ariaLabel="محاسبات راندمان و توان نهایی" />
    </div>
  );
}

function BankRecommendationSummary({ design }) {
  const rows = [
    ["اینورتر پیشنهادی", `${optionTitle(design.inverter)} / ${faNumber(design.inverter?.ratedPowerW || 0)} W`],
    ["بانک باتری پیشنهادی", design.settings?.systemType === "ongrid" ? "باتری برای آنگرید ضروری نیست" : `${design.battery?.battery?.title || "-"} / ${faNumber(design.battery?.totalCount || 0)} عدد`],
    ["بانک پنل خورشیدی پیشنهادی", `${design.panel?.title || "-"} / ${faNumber(design.pvArray?.panelCount || 0)} عدد`],
    ["ولتاژ/کلاس DC", `${design.inverter?.dcVoltage || design.inverter?.batteryVoltage || "-"} V`],
  ];
  return <ResultTableFrame rows={rows} ariaLabel="بانک‌های پیشنهادی متصل به نتیجه" />;
}

function PanelPowerProCard({ design }) {
  const analysis = design.panelPowerAnalysis || {};
  const array = analysis.array || {};
  const electrical = analysis.electrical || {};
  const physical = analysis.physical || {};
  const checks = analysis.checks || [];
  const recommendations = analysis.recommendations || [];
  const statusLabel = analysis.status === "error" ? "نیازمند اصلاح" : analysis.status === "warning" ? "دارای هشدار" : "کامل";

  return (
    <div className="shil-section-card shil-config-block shil-panel-power-pro-card">
      <div className="shil-section-head">
        <h2>توان پنل خورشیدی</h2>
        <span>{statusLabel} / امتیاز {faNumber(analysis.score || 0)} از ۱۰۰</span>
      </div>

      <div className="shil-summary-grid shil-solar-sizing-preview">
        <div><span>توان هر پنل</span><strong>{faNumber(design.panel.powerW)} W</strong></div>
        <div><span>تعداد پنل</span><strong>{faNumber(design.pvArray.panelCount)} عدد</strong></div>
        <div><span>توان پیک DC</span><strong>{array.powerKW || design.solarSizing?.pArrayKW || "-"} kW</strong></div>
        <div><span>تولید روزانه</span><strong>{array.dailyEnergyKWh || design.solarSizing?.ePvDailyKWh || "-"} kWh</strong></div>
        <div><span>پوشش مصرف</span><strong>{array.coveragePercent ? `${array.coveragePercent}%` : "نامشخص"}</strong></div>
        <div><span>راندمان مؤثر</span><strong>{Math.round((analysis.input?.effectiveEfficiency || 0) * 100)}%</strong></div>
      </div>

      <DetailsToggle title="جزئیات کامل مهندسی توان پنل" defaultOpen>
        <div className="shil-linked-details-grid">
          <div className="shil-linked-detail-card">
            <div className="shil-linked-detail-head"><span>آرایش الکتریکی</span><strong>{faNumber(design.pvArray.seriesCount)} سری × {faNumber(design.pvArray.parallelCount)} موازی</strong></div>
            <ul>
              <li>Vmp نامی رشته: {electrical.stringVmp || "-"}V</li>
              <li>Vmp گرم رشته: {electrical.hotStringVmp || "-"}V</li>
              <li>Voc سرد رشته: {electrical.coldStringVoc || "-"}V</li>
              <li>جریان آرایه: Imp {electrical.arrayImp || "-"}A / Isc {electrical.arrayIsc || "-"}A</li>
            </ul>
          </div>
          <div className="shil-linked-detail-card">
            <div className="shil-linked-detail-head"><span>MPPT و ورودی PV</span><strong>{electrical.mpptMinV || "-"} تا {electrical.mpptMaxV || "-"}V</strong></div>
            <ul>
              <li>سقف ولتاژ DC: {electrical.maxDcVoltage || "-"}V</li>
              <li>سقف توان PV اینورترها: {faNumber(electrical.maxPvPowerW || 0)}W</li>
              <li>نسبت توان آرایه به ورودی PV: {electrical.pvInputPowerRatio ? `${Math.round(electrical.pvInputPowerRatio * 100)}%` : "ثبت نشده"}</li>
            </ul>
          </div>
          <div className="shil-linked-detail-card">
            <div className="shil-linked-detail-head"><span>فضا و چگالی توان</span><strong>{physical.maintenanceAreaM2 || design.space?.maintenanceAreaM2 || "-"} m²</strong></div>
            <ul>
              <li>مساحت خالص آرایه: {physical.arrayAreaM2 || "-"} m²</li>
              <li>چگالی توان پنل: {physical.powerDensityWm2 || "-"} W/m²</li>
              <li>راندمان تقریبی ماژول: {physical.moduleEfficiencyPercent || "-"}%</li>
            </ul>
          </div>
          <div className="shil-linked-detail-card">
            <div className="shil-linked-detail-head"><span>هدف پوشش مصرف</span><strong>{array.targetPanelCount100 ? `${faNumber(array.targetPanelCount100)} پنل` : "نیازمند مصرف"}</strong></div>
            <ul>
              <li>تعداد لازم برای پوشش ۱۰۰٪: {array.targetPanelCount100 ? faNumber(array.targetPanelCount100) : "-"}</li>
              <li>تعداد پیشنهادی با حاشیه ۲۰٪: {array.targetPanelCount120 ? faNumber(array.targetPanelCount120) : "-"}</li>
              <li>کمبود پنل برای پوشش کامل: {faNumber(array.requiredAdditionalPanelsFor100 || 0)} عدد</li>
            </ul>
          </div>
        </div>
      </DetailsToggle>

      <DetailsToggle title="کنترل‌های اعتبارسنجی توان پنل">
        <div className="shil-linked-details-grid">
          {checks.map((item) => (
            <div key={item.code} className="shil-linked-detail-card">
              <div className="shil-linked-detail-head"><span>{item.title}</span><strong>{item.ok ? "تأیید" : item.level === "error" ? "خطا" : item.level === "warning" ? "هشدار" : "اطلاع"}</strong></div>
              <ul>
                <li>{item.message}</li>
                {!item.ok && item.fix ? <li>{item.fix}</li> : null}
              </ul>
            </div>
          ))}
        </div>
      </DetailsToggle>

      <div className="shil-expert-box shil-linked-protection-report">
        {recommendations.map((item) => <div key={item}><span>پیشنهاد مهندسی</span><strong>{item}</strong></div>)}
      </div>
    </div>
  );
}


function InverterMpptTopologyCard({ design, mpptCount, onMpptCount, enabled }) {
  const topology = design.inverterTopology || {};
  if (!enabled) return null;
  return (
    <div className="shil-section-card shil-config-block shil-inverter-mppt-card">
      <div className="shil-section-head">
        <h2>تقسیم اینورتر و MPPT</h2>
        <span>{topology.inverterCount || design.inverter?.count || 1} اینورتر / {topology.totalMppt || 1} MPPT</span>
      </div>
      <div className="shil-form-grid shil-param-grid">
        <label><span>تعداد MPPT هر اینورتر</span><input type="number" min="1" max="12" value={mpptCount} onChange={(e) => onMpptCount(e.target.value)} /></label>
      </div>
      <div className="shil-summary-grid shil-solar-sizing-preview">
        <div><span>سهم توان هر اینورتر</span><strong>{topology.pvPowerPerInverterKW || "-"} kW</strong></div>
        <div><span>پنل تقریبی هر اینورتر</span><strong>{faNumber(topology.panelsPerInverter || 0)} عدد</strong></div>
        <div><span>رشته هر اینورتر</span><strong>{faNumber(topology.stringsPerInverter || 0)} رشته</strong></div>
        <div><span>رشته هر MPPT</span><strong>{faNumber(topology.stringsPerMppt || 0)} رشته</strong></div>
        <div><span>جریان هر MPPT</span><strong>{topology.mpptCurrentA || "-"} A</strong></div>
        <div><span>بریکر AC هر اینورتر</span><strong>{topology.protectionPerInverter?.acBreakerA || "-"} A</strong></div>
      </div>
      {topology.rows?.length ? (
        <DetailsToggle title="جدول تقسیم پنل‌ها بین اینورتر و MPPT" attached>
          <div className="shil-result-table shil-result-table-final" role="table" aria-label="تقسیم MPPT">
            <div className="shil-result-row shil-result-header" role="row"><span>اینورتر</span><strong>تقسیم پنل و توان</strong><small>MPPT و حفاظت</small></div>
            {topology.rows.map((row) => (
              <div className="shil-result-row" role="row" key={row.inverterNo}>
                <span>اینورتر {faNumber(row.inverterNo)}</span>
                <strong>{faNumber(row.panelsApprox)} پنل / {row.pvPowerKW}kW</strong>
                <small>{faNumber(row.mpptCount)} MPPT / حدود {faNumber(row.stringsApprox)} رشته / بریکر AC {topology.protectionPerInverter?.acBreakerA || "-"}A</small>
              </div>
            ))}
          </div>
          <div className="shil-expert-box">
            {(topology.notes || []).map((note) => <div key={note}><span>MPPT</span><strong>{note}</strong></div>)}
          </div>
        </DetailsToggle>
      ) : null}
    </div>
  );
}


function ProductTraceabilityBlock({ design, inverterId, batteryId, panelId }) {
  const selectedInverter = SHIL_SOLAR_INVERTERS.find((item) => item.id === inverterId) || design.inverter || {};
  const selectedBattery = SHIL_LITHIUM_BATTERIES.find((item) => item.id === batteryId) || design.battery?.battery || {};
  const selectedPanel = SHIL_SOLAR_PANELS.find((item) => item.id === panelId) || design.panel || {};
  const rows = [
    ["اینورتر پیشنهادی بانک", optionTitle(design.inverter)],
    ["اینورتر انتخاب‌شده کاربر", optionTitle(selectedInverter)],
    ["باتری پیشنهادی بانک", design.battery?.battery?.title || "-"],
    ["باتری انتخاب‌شده کاربر", selectedBattery?.title || "-"],
    ["پنل پیشنهادی بانک", design.panel?.title || "-"],
    ["پنل انتخاب‌شده کاربر", selectedPanel?.title || "-"],
  ];
  return (
    <div className="shil-section-card shil-config-block">
      <div className="shil-section-head"><h2>ردیابی محصول پیشنهادی و انتخاب کاربر</h2><span>بانک محصولات SHIL</span></div>
      <ResultTableFrame rows={rows} ariaLabel="ردیابی انتخاب محصولات" />
      <p className="shil-muted-line">اگر کاربر برند، مدل، توسعه آینده یا توان اینورتر/باتری را تغییر دهد، همین انتخاب به محاسبات، هشدارها و خروجی نهایی منتقل می‌شود.</p>
    </div>
  );
}

function MpptQuestionBlock({ hasMppt, onHasMppt, count, onCount }) {
  return (
    <div className="shil-section-card shil-config-block">
      <div className="shil-section-head"><h2>اطلاعات MPPT اینورتر</h2><span>برای آرایش رشته پنل‌ها</span></div>
      <div className="shil-form-grid shil-param-grid">
        <label><span>آیا اینورتر MPPT دارد؟</span><select value={hasMppt} onChange={(e) => onHasMppt(e.target.value)}><option value="yes">دارد</option><option value="no">ندارد</option></select></label>
        <label><span>تعداد MPPT</span><input type="number" min="0" max="12" value={hasMppt === "no" ? 0 : count} onChange={(e) => onCount(e.target.value)} disabled={hasMppt === "no"} /></label>
      </div>
      <p className="shil-muted-line">تعداد MPPT برای تقسیم شاخه‌های پنل، کنترل جریان هر مسیر و گزارش نهایی حفاظتی ذخیره می‌شود.</p>
    </div>
  );
}

function ProtectionBranchesBlock({ design, settings }) {
  const rows = [
    ["شاخه پنل تا اینورتر", `DC / پنل ${faNumber(design.pvArray?.panelCount || 0)} عدد / بریکر ${design.protection?.dcBreakerA || "-"}A`],
    ["شاخه باتری تا اینورتر", settings.systemType === "ongrid" ? "باتری ضروری نیست" : `باتری ${faNumber(design.battery?.totalCount || 0)} عدد / کابل ${design.protection?.batteryCable || "-"}`],
    ["شاخه اینورتر تا مصرف‌کننده", `AC / توان ${faNumber(design.design?.designPowerW || design.load?.totalPowerW || 0)}W / بریکر ${design.protection?.acBreakerA || "-"}A`],
    ["شاخه برق شهری / شبکه", settings.systemType === "offgrid" ? "غیرفعال در آفگرید" : `${settings.outputAcVoltage || 220}V / ${settings.outputPhase === "three" ? "سه‌فاز" : "تک‌فاز"}`],
  ];
  return (
    <div className="shil-section-card shil-config-block">
      <div className="shil-section-head"><h2>تفکیک شاخه‌های مصرف و حفاظت</h2><span>آماده خروجی نهایی</span></div>
      <ResultTableFrame rows={rows} ariaLabel="شاخه‌بندی حفاظتی سیستم" />
    </div>
  );
}

export default function SystemSettings() {
  const { domain = "solar" } = useParams();
  const navigate = useNavigate();
  const emergency = domain === "emergency";
  const utilityGateway = domain === "utility";
  const load = React.useMemo(() => readDraft("shil:loadEngineResult", {}), []);
  const environment = React.useMemo(() => readDraft("shil:environmentDraft", {}), []);
  const solarPanelPowerDraft = React.useMemo(() => readDraft("shil:solarPanelPowerInput", {}), []);
  const calculationMethod = localStorage.getItem("shil:calculationMethod") || "";
  const isSolarPanelPowerRoute = calculationMethod === "solar_panel_power";
  const solarPanelPowerInput = isSolarPanelPowerRoute ? solarPanelPowerDraft : {};

  const [systemType, setSystemType] = React.useState("offgrid");
  const [autonomyDays, setAutonomyDays] = React.useState(isSolarPanelPowerRoute ? 0 : 1);
  const [reserveFactor, setReserveFactor] = React.useState(1.2);
  const [batteryRequired, setBatteryRequired] = React.useState(!isSolarPanelPowerRoute);
  const [batteryScope, setBatteryScope] = React.useState("none");
  const [equipmentManualMode, setEquipmentManualMode] = React.useState(false);
  const [parameterManualMode, setParameterManualMode] = React.useState(false);
  const [panelId, setPanelId] = React.useState(SHIL_SOLAR_PANELS.find((p) => p.powerW === 620)?.id || SHIL_SOLAR_PANELS[0]?.id || "");
  const [inverterId, setInverterId] = React.useState(SHIL_SOLAR_INVERTERS.find((i) => i.ratedPowerW >= 5000)?.id || SHIL_SOLAR_INVERTERS[0]?.id || "");
  const [batteryId, setBatteryId] = React.useState(SHIL_LITHIUM_BATTERIES.find((b) => b.nominalVoltage === 48 && b.capacityAh === 200)?.id || SHIL_LITHIUM_BATTERIES[0]?.id || "");
  const [panelExtraFactor, setPanelExtraFactor] = React.useState(1);
  const [liveSaved, setLiveSaved] = React.useState(false);
  const [inverterExtraFactor, setInverterExtraFactor] = React.useState(1);
  const [batteryExtraFactor, setBatteryExtraFactor] = React.useState(1);
  const [projectScale, setProjectScale] = React.useState(() => domain === "utility" ? (localStorage.getItem("shil:projectScale") || "utility") : "auto");
  const [targetPlantPowerMW, setTargetPlantPowerMW] = React.useState("");
  const [powerBlockSizeKW, setPowerBlockSizeKW] = React.useState("");
  const [mvVoltageKV, setMvVoltageKV] = React.useState("");
  const [blockStationMW, setBlockStationMW] = React.useState("");
  const [exportLimitMW, setExportLimitMW] = React.useState("");
  const [groundCoverageRatio, setGroundCoverageRatio] = React.useState("");
  const [trackerMode, setTrackerMode] = React.useState("auto");
  const [terrainSlopeDeg, setTerrainSlopeDeg] = React.useState("");
  const [usableLandPercent, setUsableLandPercent] = React.useState("");
  const [gridShortCircuitMVA, setGridShortCircuitMVA] = React.useState("");
  const [estimatedMvFaultKA, setEstimatedMvFaultKA] = React.useState("");
  const [plantAvailabilityPercent, setPlantAvailabilityPercent] = React.useState("");
  const [annualDegradationPercent, setAnnualDegradationPercent] = React.useState("");
  const [mpptCountPerInverter, setMpptCountPerInverter] = React.useState("1");
  const [hasMppt, setHasMppt] = React.useState("yes");
  const [warning, setWarning] = React.useState("");

  const activeCalculationMethod = localStorage.getItem("shil:calculationMethod") || (isSolarPanelPowerRoute ? "solar_panel_power" : "equipment");

  const settings = React.useMemo(() => ({
    systemType,
    method: activeCalculationMethod,
    calculationMethod: activeCalculationMethod,
    autonomyDays: toNumber(autonomyDays, isSolarPanelPowerRoute ? 0 : 1),
    reserveFactor: toNumber(reserveFactor, 1.2),
    panelId: equipmentManualMode ? panelId : (isSolarPanelPowerRoute ? (solarPanelPowerInput?.selectedPanelId || undefined) : undefined),
    inverterId: equipmentManualMode ? inverterId : undefined,
    batteryId: equipmentManualMode ? batteryId : (isSolarPanelPowerRoute ? (solarPanelPowerInput?.batteryId || undefined) : undefined),
    panelCount: isSolarPanelPowerRoute ? (toNumber(solarPanelPowerInput?.panelCount, 0) || undefined) : undefined,
    inverterCount: isSolarPanelPowerRoute ? (toNumber(solarPanelPowerInput?.inverterSplitCount, 0) || undefined) : undefined,
    outputAcVoltage: toNumber((isSolarPanelPowerRoute ? solarPanelPowerInput?.acVoltageRoute : null) || load?.voltageAC || 220, 220),
    outputPhase: toNumber((isSolarPanelPowerRoute ? solarPanelPowerInput?.acVoltageRoute : null) || load?.voltageAC || 220, 220) >= 380 ? "three" : "single",
    batteryRequired: isSolarPanelPowerRoute ? toNumber(autonomyDays, 0) > 0 : Boolean(batteryRequired),
    batteryScope,
    inverterPanelDistribution: isSolarPanelPowerRoute && Array.isArray(solarPanelPowerInput?.inverterPanelDistribution) ? solarPanelPowerInput.inverterPanelDistribution : undefined,
    hasMppt: hasMppt === "yes",
    mpptCountPerInverter: hasMppt === "no" ? 0 : Math.max(1, Math.round(toNumber(mpptCountPerInverter, 1))),
    panelExtraFactor: isSolarPanelPowerRoute ? 1 : toNumber(panelExtraFactor, 1),
    inverterExtraFactor: isSolarPanelPowerRoute ? 1 : toNumber(inverterExtraFactor, 1),
    batteryExtraFactor: isSolarPanelPowerRoute ? 1 : toNumber(batteryExtraFactor, 1),
    projectScale,
    targetPlantPowerMW: toNumber(targetPlantPowerMW, 0),
    powerBlockSizeKW: toNumber(powerBlockSizeKW, 0),
    mvVoltageKV: toNumber(mvVoltageKV, 0),
    blockStationMW: toNumber(blockStationMW, 0),
    exportLimitMW: toNumber(exportLimitMW, 0),
    groundCoverageRatio: toNumber(groundCoverageRatio, 0),
    trackerMode,
    terrainSlopeDeg: toNumber(terrainSlopeDeg, 0),
    usableLandPercent: toNumber(usableLandPercent, 0),
    gridShortCircuitMVA: toNumber(gridShortCircuitMVA, 0),
    estimatedMvFaultKA: toNumber(estimatedMvFaultKA, 0),
    plantAvailabilityPercent: toNumber(plantAvailabilityPercent, 0),
    annualDegradationPercent: toNumber(annualDegradationPercent, 0),
    manualMode: equipmentManualMode || parameterManualMode,
    equipmentManualMode,
    parameterManualMode
  }), [systemType, activeCalculationMethod, autonomyDays, reserveFactor, equipmentManualMode, parameterManualMode, panelId, inverterId, batteryId, panelExtraFactor, inverterExtraFactor, batteryExtraFactor, projectScale, targetPlantPowerMW, powerBlockSizeKW, mvVoltageKV, blockStationMW, exportLimitMW, groundCoverageRatio, trackerMode, terrainSlopeDeg, usableLandPercent, gridShortCircuitMVA, estimatedMvFaultKA, plantAvailabilityPercent, annualDegradationPercent, solarPanelPowerInput, load, mpptCountPerInverter, hasMppt, batteryRequired, batteryScope, isSolarPanelPowerRoute]);

  const previousMethodRows = React.useMemo(() => buildPreviousMethodRows({
    load,
    method: activeCalculationMethod,
    solarPanelPowerInput,
    environment,
    autonomyDays: toNumber(autonomyDays, isSolarPanelPowerRoute ? 0 : 1),
    reserveFactor: toNumber(reserveFactor, 1.2),
  }), [load, activeCalculationMethod, solarPanelPowerInput, environment, autonomyDays, reserveFactor, isSolarPanelPowerRoute]);

  const legacySolarDesign = React.useMemo(() => {
    const methodPowerW = isSolarPanelPowerRoute
      ? toNumber(solarPanelPowerInput?.totalPanelPowerW, 0)
      : toNumber(load?.totalPowerW || load?.recommendedInverterW, 0);
    const safeReserve = toNumber(reserveFactor, 1.2);
    const designPowerW = Math.max(0, Math.round(methodPowerW * safeReserve));
    const selectedInverter = pickInverterFromBank({
      targetPowerW: designPowerW || methodPowerW,
      systemType,
      preferredId: equipmentManualMode ? inverterId : "",
    });
    const batteryNeeded = systemType !== "ongrid" && (Boolean(batteryRequired) || toNumber(autonomyDays, 0) > 0);
    const selectedBattery = pickBatteryFromBank({
      inverter: selectedInverter,
      autonomyDays: toNumber(autonomyDays, 0),
      required: batteryNeeded,
      preferredId: equipmentManualMode ? batteryId : "",
    });
    const selectedPanel = pickPanelFromBank({
      targetPowerW: methodPowerW,
      preferredId: equipmentManualMode ? panelId : (isSolarPanelPowerRoute ? solarPanelPowerInput?.selectedPanelId : ""),
    });
    const panelCountFromInput = isSolarPanelPowerRoute
      ? toNumber(solarPanelPowerInput?.panelCount, 0)
      : Math.max(1, Math.ceil((designPowerW || methodPowerW || selectedInverter.ratedPowerW || 0) / Math.max(1, Number(selectedPanel.powerW || 620))));
    const arrayPowerW = isSolarPanelPowerRoute ? toNumber(solarPanelPowerInput?.totalPanelPowerW, panelCountFromInput * Number(selectedPanel.powerW || 0)) : panelCountFromInput * Number(selectedPanel.powerW || 0);
    const autonomy = toNumber(autonomyDays, 0);
    const dailyKWh = isSolarPanelPowerRoute ? toNumber(solarPanelPowerInput?.generatedDailyKWh || solarPanelPowerInput?.rawDailyEnergyKWh, 0) : toNumber(load?.totalEnergyKWh, 0);
    const batteryUnitKWh = Number(selectedBattery.energyWh || 0) / 1000;
    const batteryCount = batteryNeeded && batteryUnitKWh > 0 ? Math.max(1, Math.ceil((dailyKWh * Math.max(1, autonomy || 1)) / (batteryUnitKWh * 0.9))) : 0;

    return normalizeSolarDesign({
      valid: true,
      previewOnly: true,
      panel: { ...selectedPanel, title: selectedPanel.title || "پنل پیشنهادی" },
      inverter: { ...selectedInverter, title: selectedInverter.title || "اینورتر پیشنهادی", count: 1, ratedPowerW: selectedInverter.ratedPowerW || designPowerW || 3000, dcVoltage: selectedInverter.dcVoltage || selectedInverter.batteryVoltage || 48 },
      battery: { totalCount: batteryCount, unitVoltageV: selectedBattery.nominalVoltage || selectedBattery.voltageV || 48, unitEnergyKWh: batteryUnitKWh ? Math.round(batteryUnitKWh * 100) / 100 : undefined, battery: selectedBattery },
      pvArray: { panelCount: panelCountFromInput, arrayPowerW, seriesCount: 1, parallelCount: panelCountFromInput },
      load: { ...load, totalPowerW: methodPowerW, totalEnergyKWh: dailyKWh, voltageAC: load?.voltageAC || solarPanelPowerInput?.acVoltageRoute || 220 },
      settings: { ...settings, systemType, autonomyDays: autonomy, reserveFactor: safeReserve, calculationMethod: activeCalculationMethod },
      design: { designPowerW: designPowerW || methodPowerW },
      explanations: [
        `نوع اجرای ${getDesignModeLabel(systemType)} به انتخاب کاربر اعمال شد.`,
        "دیتاهای مرحله قبل با روزهای خودکفایی و ضریب اطمینان استاندارد وارد پیکربندی شدند.",
        "اینورتر، باتری و پنل از بانک‌های SHIL مطابق توان و ولتاژ مسیر پیشنهاد می‌شوند."
      ]
    });
  }, [load, settings, activeCalculationMethod, isSolarPanelPowerRoute, solarPanelPowerInput, reserveFactor, autonomyDays, systemType, equipmentManualMode, inverterId, batteryId, panelId, batteryRequired]);
  // Temporary diagnostic mode: keep SystemSettings independent from all calculation rules/engines.
  const useUnifiedPvEngine = false;
  const unifiedPvResult = null;
  const solarDesign = React.useMemo(() => normalizeSolarDesign(legacySolarDesign), [legacySolarDesign]);
  const scaleTargetPowerW = Number(solarDesign.systemScale?.targetPowerW || solarDesign.design?.designPowerW || 0);
  const utilityScaleActive = utilityGateway && (scaleTargetPowerW > 30000 || !["auto", "small"].includes(projectScale));
  const utilityScaleStatusText = utilityGateway
    ? (utilityScaleActive ? "فعال؛ مسیر مستقل نیروگاهی" : "آماده؛ توان هدف نیروگاهی را وارد کنید")
    : "غیرفعال؛ فقط در درگاه مستقل نیروگاهی نمایش داده می‌شود";

  React.useEffect(() => {
    if (equipmentManualMode) return;
    setPanelId((isSolarPanelPowerRoute ? solarPanelPowerInput?.selectedPanelId : null) || SHIL_SOLAR_PANELS.find((p) => p.powerW === 620)?.id || solarDesign.panel.id);
    setInverterId(solarDesign.inverter.id);
    setBatteryId(solarDesign.battery.battery.id);
  }, [equipmentManualMode, isSolarPanelPowerRoute, solarPanelPowerInput?.selectedPanelId, solarDesign.panel.id, solarDesign.inverter.id, solarDesign.battery.battery.id]);

  React.useEffect(() => {
    if (!warning) return undefined;
    const timer = setTimeout(() => setWarning(""), 5200);
    return () => clearTimeout(timer);
  }, [warning]);

  React.useEffect(() => {
    try {
      localStorage.setItem("shil:solarSystemDesign:live", JSON.stringify(solarDesign));
      if (unifiedPvResult) localStorage.setItem("shil:unifiedPvEngineResult:live", JSON.stringify(unifiedPvResult));
      localStorage.setItem("shil:systemSettingsDraft:live", JSON.stringify({ domain: domain || "solar", ...settings, design: solarDesign, unifiedPvEngineResult: unifiedPvResult }));
      setLiveSaved(true);
      const timer = setTimeout(() => setLiveSaved(false), 900);
      return () => clearTimeout(timer);
    } catch {
      return undefined;
    }
  }, [solarDesign, settings, unifiedPvResult]);

  const applySmart = () => {
    setEquipmentManualMode(false);
    setParameterManualMode(false);
    setPanelExtraFactor(1);
    setInverterExtraFactor(1);
    setBatteryExtraFactor(1);
    setMpptCountPerInverter("1");
    setHasMppt("yes");
    setBatteryRequired(isSolarPanelPowerRoute ? false : systemType !== "ongrid");
    if (isSolarPanelPowerRoute) { setAutonomyDays(0); setBatteryScope("none"); }
    setProjectScale("auto");
    setTargetPlantPowerMW("");
    setPowerBlockSizeKW("");
    setPanelId((isSolarPanelPowerRoute ? solarPanelPowerInput?.selectedPanelId : null) || SHIL_SOLAR_PANELS.find((p) => p.powerW === 620)?.id || solarDesign.panel.id);
    setInverterId(solarDesign.inverter.id);
    setBatteryId(solarDesign.battery.battery.id);
  };

  const confirmSolar = () => {
    const finalDesign = { ...solarDesign, mppt: { hasMppt: hasMppt === "yes", countPerInverter: hasMppt === "no" ? 0 : Math.max(1, Math.round(toNumber(mpptCountPerInverter, 1))) }, protectionBranches: { pvToInverter: true, batteryToInverter: systemType !== "ongrid", inverterToLoad: true, gridInput: systemType !== "offgrid" }, solarPanelPowerInput: isSolarPanelPowerRoute ? solarPanelPowerInput : {}, unifiedPvEngineResult: unifiedPvResult, batteryScope: isSolarPanelPowerRoute ? batteryScope : "default", unifiedEngineApplied: false, calculationDetached: true, calculationPipeline: unifiedPvResult?.pipeline_order || [], confirmedAt: new Date().toISOString(), confirmedWithWarnings: !solarDesign.valid };
    approveProjectStep("system");
    localStorage.setItem("shil:solarSystemDesign", JSON.stringify(finalDesign));
    if (unifiedPvResult) localStorage.setItem("shil:unifiedPvEngineResult", JSON.stringify(unifiedPvResult));
    localStorage.setItem("shil:systemSettingsDraft", JSON.stringify({ domain: domain || "solar", ...settings, design: finalDesign, unifiedPvEngineResult: unifiedPvResult }));
    if (!solarDesign.valid) {
      setWarning(solarDesign.nextBlockedReason || "پیکربندی با هشدار ثبت شد و در چکیده قابل بررسی است.");
    }
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
          <div className="shil-section-head"><h2>انتخاب اینورتر خورشیدی</h2><span>آفگرید، آنگرید یا هیبرید</span></div>
          <DesignModeCards value={systemType} onChange={(nextType) => { setSystemType(nextType); setEquipmentManualMode(false); setWarning(`مدل طراحی ${nextType === "offgrid" ? "آفگرید" : nextType === "ongrid" ? "آنگرید" : "هیبرید"} در فرمان ادامه مسیر اعمال شد.`); }} />
          <p className="shil-muted-line">انتخاب آفگرید، آنگرید یا هیبرید مسیر فرمان‌دهی بانک اینورتر، باتری و پنل را مشخص می‌کند.</p>
        </div>

        <PreviousMethodDataBlock
          rows={previousMethodRows}
          parameterManualMode={parameterManualMode}
          autonomyDays={autonomyDays}
          reserveFactor={reserveFactor}
          onAutonomyDays={(value) => { setAutonomyDays(value); setBatteryRequired(toNumber(value, 0) > 0 || systemType !== "ongrid"); if (isSolarPanelPowerRoute && toNumber(value, 0) <= 0) setBatteryScope("none"); else if (isSolarPanelPowerRoute && batteryScope === "none") setBatteryScope("all"); }}
          onReserveFactor={setReserveFactor}
          onManualMode={setParameterManualMode}
        />

        {utilityGateway ? (
        <div className={utilityScaleActive ? "shil-section-card shil-config-block shil-scale-config-block is-active" : "shil-section-card shil-config-block shil-scale-config-block is-locked"}>
          <div className="shil-section-head"><h2>مقیاس پروژه نیروگاهی</h2><span>{utilityScaleStatusText}</span></div>
          <div className="shil-summary-grid shil-solar-sizing-preview shil-scale-compact-status">
            <div><span>توان طراحی فعلی</span><strong>{scaleTargetPowerW > 999999 ? mw(scaleTargetPowerW) : kw(scaleTargetPowerW)}</strong></div>
            <div><span>حالت تحلیل</span><strong>{solarDesign.systemScale?.designModeLabel}</strong></div>
            <div><span>آستانه فعال‌سازی</span><strong>۳۰ کیلووات</strong></div>
            <div><span>مسیر خروجی AC</span><strong>{settings.outputAcVoltage === 380 ? "۳۸۰ ولت سه‌فاز" : "۲۲۰ ولت تک‌فاز"}</strong></div>
            <div><span>وضعیت بلوک‌های نیروگاهی</span><strong>{utilityScaleActive ? "فعال" : "بسته"}</strong></div>
          </div>

          {!utilityScaleActive ? (
            <>
              <p className="shil-muted-line">چون توان مسیر انتخاب‌شده هنوز از ۳۰kW بالاتر نرفته، فیلدهای نیروگاهی، MV، ترانس، Grid Study، Tracker/GIS و SCADA بسته می‌مانند تا صفحه پیکربندی شلوغ نشود.</p>
              <DetailsToggle title="نمایش دستی تنظیمات نیروگاهی پیشرفته">
                <div className="shil-form-grid shil-param-grid">
                  <label><span>مقیاس پروژه</span><select value={projectScale} onChange={(e) => { setParameterManualMode(true); setProjectScale(e.target.value); }}><option value="auto">خودکار</option><option value="small">خانگی / کوچک</option><option value="commercial">تجاری / صنعتی سبک</option><option value="industrial">صنعتی بزرگ</option><option value="utility">نیروگاهی</option><option value="mega_utility">نیروگاهی بزرگ</option></select></label>
                  <label><span>توان هدف نیروگاه MW</span><input type="number" step="0.1" min="0" max="30" value={targetPlantPowerMW} onChange={(e) => { setParameterManualMode(true); setTargetPlantPowerMW(e.target.value); }} placeholder="مثلاً 5 یا 10 یا 25" /></label>
                </div>
                <p className="shil-muted-line">با وارد کردن توان بالاتر از ۰.۰۳MW یا انتخاب مقیاس صنعتی/نیروگاهی، بلوک کامل نیروگاهی فعال می‌شود.</p>
              </DetailsToggle>
            </>
          ) : (
            <>
              <div className="shil-form-grid shil-param-grid">
                <label><span>مقیاس پروژه</span><select value={projectScale} onChange={(e) => { setParameterManualMode(true); setProjectScale(e.target.value); }}><option value="auto">خودکار</option><option value="small">خانگی / کوچک</option><option value="commercial">تجاری / صنعتی سبک</option><option value="industrial">صنعتی بزرگ</option><option value="utility">نیروگاهی</option><option value="mega_utility">نیروگاهی بزرگ</option></select></label>
                <label><span>توان هدف نیروگاه MW</span><input type="number" step="0.1" min="0" max="30" value={targetPlantPowerMW} onChange={(e) => { setParameterManualMode(true); setTargetPlantPowerMW(e.target.value); }} placeholder="مثلاً 5 یا 10 یا 25" /></label>
                <label><span>توان هر بلوک kW</span><input type="number" step="50" min="0" max="5000" value={powerBlockSizeKW} onChange={(e) => { setParameterManualMode(true); setPowerBlockSizeKW(e.target.value); }} placeholder="خودکار: 250/500/1000/2500" /></label>
                <label><span>ولتاژ MV kV</span><input type="number" step="1" min="0" max="33" value={mvVoltageKV} onChange={(e) => { setParameterManualMode(true); setMvVoltageKV(e.target.value); }} placeholder="خودکار: 11/20/33" /></label>
                <label><span>بلوک ترانس MW</span><input type="number" step="0.5" min="0" max="5" value={blockStationMW} onChange={(e) => { setParameterManualMode(true); setBlockStationMW(e.target.value); }} placeholder="خودکار: 0.5 تا 5" /></label>
                <label><span>محدودیت تزریق MW</span><input type="number" step="0.1" min="0" max="30" value={exportLimitMW} onChange={(e) => { setParameterManualMode(true); setExportLimitMW(e.target.value); }} placeholder="اختیاری" /></label>
                <label><span>GCR زمین</span><input type="number" step="0.01" min="0.28" max="0.62" value={groundCoverageRatio} onChange={(e) => { setParameterManualMode(true); setGroundCoverageRatio(e.target.value); }} placeholder="خودکار: 0.42" /></label>
                <label><span>نوع چیدمان / Tracker</span><select value={trackerMode} onChange={(e) => { setParameterManualMode(true); setTrackerMode(e.target.value); }}><option value="auto">خودکار</option><option value="fixed_tilt">ثابت</option><option value="single_axis">ترکر تک‌محوره</option></select></label>
                <label><span>شیب زمین درجه</span><input type="number" step="0.5" min="0" max="18" value={terrainSlopeDeg} onChange={(e) => { setParameterManualMode(true); setTerrainSlopeDeg(e.target.value); }} placeholder="خودکار: 2" /></label>
                <label><span>زمین قابل استفاده ٪</span><input type="number" step="1" min="55" max="92" value={usableLandPercent} onChange={(e) => { setParameterManualMode(true); setUsableLandPercent(e.target.value); }} placeholder="خودکار: 82" /></label>
                <label><span>قدرت اتصال کوتاه شبکه MVA</span><input type="number" step="10" min="0" value={gridShortCircuitMVA} onChange={(e) => { setParameterManualMode(true); setGridShortCircuitMVA(e.target.value); }} placeholder="خودکار بر اساس مقیاس" /></label>
                <label><span>سطح اتصال کوتاه MV kA</span><input type="number" step="1" min="0" max="40" value={estimatedMvFaultKA} onChange={(e) => { setParameterManualMode(true); setEstimatedMvFaultKA(e.target.value); }} placeholder="خودکار: 16/20/25" /></label>
                <label><span>Availability نیروگاه ٪</span><input type="number" step="0.1" min="92" max="99.8" value={plantAvailabilityPercent} onChange={(e) => { setParameterManualMode(true); setPlantAvailabilityPercent(e.target.value); }} placeholder="خودکار: 98" /></label>
                <label><span>افت سالانه پنل ٪</span><input type="number" step="0.05" min="0.2" max="1.2" value={annualDegradationPercent} onChange={(e) => { setParameterManualMode(true); setAnnualDegradationPercent(e.target.value); }} placeholder="خودکار: 0.55" /></label>
              </div>
              <div className="shil-summary-grid shil-solar-sizing-preview">
                <div><span>حالت تحلیل</span><strong>{solarDesign.systemScale?.designModeLabel}</strong></div>
                <div><span>توان هدف</span><strong>{solarDesign.systemScale?.targetPowerMW >= 1 ? `${solarDesign.systemScale.targetPowerMW} MW` : `${solarDesign.systemScale?.targetPowerKW} kW`}</strong></div>
                <div><span>بلوک‌ها</span><strong>{faNumber(solarDesign.systemScale?.blockCount)} بلوک</strong></div>
                <div><span>اینورتر کل</span><strong>{faNumber(solarDesign.systemScale?.totalInverterCount)} عدد</strong></div>
                <div><span>MV / فیدر</span><strong>{solarDesign.utilityElectrical?.active ? `${solarDesign.utilityElectrical.mv.voltageKV}kV / ${faNumber(solarDesign.utilityElectrical.mv.feederCount)}` : "نیاز ندارد"}</strong></div>
                <div><span>ترانس</span><strong>{solarDesign.utilityElectrical?.active ? `${faNumber(solarDesign.utilityElectrical.transformer.count)} × ${solarDesign.utilityElectrical.transformer.unitMVA}MVA` : "نیاز ندارد"}</strong></div>
                <div><span>زمین تقریبی</span><strong>{solarDesign.utilityElectrical?.active ? `${solarDesign.utilityElectrical.land.landAreaHa} ha` : "-"}</strong></div>
                <div><span>تولید سالانه</span><strong>{solarDesign.utilityElectrical?.active ? `${faNumber(solarDesign.utilityElectrical.yield.annualKWh)} kWh` : "-"}</strong></div>
                <div><span>Enterprise Score</span><strong>{solarDesign.enterpriseUtility?.active ? `${solarDesign.enterpriseUtility.score}/100` : "-"}</strong></div>
                <div><span>حفاظت MV</span><strong>{solarDesign.enterpriseUtility?.active ? `${solarDesign.enterpriseUtility.protection.requiredBreakerKA}kA / ${solarDesign.enterpriseUtility.protection.feederBreakerA}A` : "-"}</strong></div>
                <div><span>Grid Study</span><strong>{solarDesign.enterpriseUtility?.active ? solarDesign.enterpriseUtility.gridStudy.studyLevel : "-"}</strong></div>
                <div><span>Tracker/GIS</span><strong>{solarDesign.enterpriseUtility?.active ? `${solarDesign.enterpriseUtility.tracker.trackerMode} / ${solarDesign.enterpriseUtility.terrain.requiredGrossLandHa} ha` : "-"}</strong></div>
                <div><span>SCADA</span><strong>{solarDesign.enterpriseUtility?.active ? solarDesign.enterpriseUtility.scada.communicationTopology : "-"}</strong></div>
                <div><span>P90 سال اول</span><strong>{solarDesign.enterpriseUtility?.active ? `${faNumber(solarDesign.enterpriseUtility.advancedYield.p90KWh)} kWh` : "-"}</strong></div>
              </div>
              <p className="shil-muted-line">اگر توان از ۳۰kW بالاتر برود، اپ خطا نمی‌دهد و محاسبه را به چند اینورتر موازی یا بلوک‌بندی نیروگاهی تبدیل می‌کند. این بخش فقط تحلیل مهندسی است و هیچ قیمت یا خریدی وارد خروجی نمی‌شود.</p>
            </>
          )}
        </div>
) : null}

        <EfficiencyCalculationBlock design={solarDesign} environment={environment} solarPanelPowerInput={solarPanelPowerInput} method={activeCalculationMethod} />

        {isSolarPanelPowerRoute ? (
          <>
            <InverterMpptTopologyCard
              design={solarDesign}
              mpptCount={mpptCountPerInverter}
              onMpptCount={(value) => { setParameterManualMode(true); setMpptCountPerInverter(value); }}
              enabled={Number(solarDesign.inverter?.count || 1) >= 1}
            />

            <div className="shil-section-card shil-config-block">
              <div className="shil-section-head"><h2>اتصال نتایج به بانک‌های پیشنهادی</h2><span>اینورتر، باتری و پنل</span></div>
            </div>
          </>
        ) : (
          <div className="shil-section-card shil-config-block">
            <div className="shil-section-head"><h2>اتصال نتایج به بانک‌های پیشنهادی</h2><span>اینورتر، باتری و پنل</span></div>
            <p className="shil-muted-line">نتایج مسیر قبلی با ضریب اطمینان و روزهای خودکفایی به بانک‌های SHIL وصل می‌شود تا اینورتر، باتری و پنل پیشنهادی مشخص شود.</p>
          </div>
        )}

        <div className="shil-section-card shil-auto-result-card shil-result-card-final">
          <div className="shil-section-head"><h2>نتایج کلی و بانک‌های پیشنهادی</h2><span>متصل به بانک تجهیزات</span></div>
          <BankRecommendationSummary design={solarDesign} />
        </div>

        <div className="shil-system-banks-grid shil-system-banks-grid-final">
          <BankSelect
            title="بانک اینورتر خورشیدی"
            subtitle="1.6kW تا 30kW"
            value={inverterId}
            onValue={(v) => { setEquipmentManualMode(true); setInverterId(v); }}
            smartTitle={optionTitle(solarDesign.inverter)}
            items={SHIL_SOLAR_INVERTERS}
            smartValue={`${kw(solarDesign.inverter.ratedPowerW)} × ${faNumber(solarDesign.inverter.count)} عدد / ${solarDesign.inverter.dcVoltage}V`}
            renderMeta={(item) => <>{item?.ratedPowerW}W / ورودی باتری {item?.dcVoltage}V / MPPT {item?.mpptMinV}-{item?.mpptMaxV}V / سقف PV {item?.maxPvPowerW}W</>}
            renderReason={() => <>اینورتر هوشمند از موتور یکپارچه PV انتخاب می‌شود؛ توان، MPPT، جریان، بانک تجهیزات و خطاهای ادامه مسیر از یک Pipeline واحد خوانده می‌شوند.</>}
          />
          <BankSelect
            title="بانک باتری"
            subtitle="12V / 24V / 48V"
            value={batteryId}
            onValue={(v) => { setEquipmentManualMode(true); setBatteryId(v); }}
            smartTitle={solarDesign.battery.battery.title}
            items={SHIL_LITHIUM_BATTERIES}
            smartValue={isSolarPanelPowerRoute ? (toNumber(autonomyDays, 0) > 0 ? `${solarDesign.battery.unitVoltageV || solarDesign.battery.battery.nominalVoltage}V / ${faNumber(solarDesign.battery.totalCount)} عدد / ${solarDesign.battery.unitEnergyKWh || "-"}kWh / ${batteryScope === "all" ? "همه اینورترها" : `اینورتر ${batteryScope}`}` : "باتری انتخاب نشده") : (batteryRequired ? `${solarDesign.battery.unitVoltageV || solarDesign.battery.battery.nominalVoltage}V / ${faNumber(solarDesign.battery.totalCount)} عدد / ${solarDesign.battery.unitEnergyKWh || "-"}kWh` : "باتری انتخاب نشده")}
            renderMeta={(item) => <>{item?.nominalVoltage}V / {item?.capacityAh}Ah / بازه شناور {item?.minVoltage}-{item?.maxVoltage}V / انرژی خام {item?.energyWh}Wh</>}
            renderReason={() => <>ولتاژ باتری به صورت شناور کنترل می‌شود و با ورودی DC اینورتر و روزهای خودکفایی هماهنگ می‌شود.</>}
          />
          <BankSelect
            title="بانک پنل خورشیدی"
            subtitle="پیش‌فرض 620W / دستی تا 700W"
            value={panelId}
            onValue={(v) => { setEquipmentManualMode(true); setPanelId(v); }}
            smartTitle={solarDesign.panel.title}
            items={SHIL_SOLAR_PANELS}
            smartValue={isSolarPanelPowerRoute ? `${solarDesign.panel.powerW}W / ${faNumber(solarDesign.pvArray.panelCount)} عدد / تقسیم: ${(solarDesign.inverterTopology?.panelDistribution || []).join(" / ") || "خودکار"}` : `${solarDesign.panel.powerW}W / ${faNumber(solarDesign.pvArray.panelCount)} عدد`}
            renderMeta={(item) => <>{item?.powerW}W / Vmp {item?.vmp}V / Voc {item?.voc}V / مساحت تقریبی {item?.areaM2}m²</>}
            renderReason={() => <>این بانک از خروجی موتور یکپارچه خوانده می‌شود؛ هر تغییر پنل، تعداد، اینورتر یا باتری بلافاصله در محاسبات MPPT، حفاظت و راندمان اعمال می‌شود.</>}
          />
        </div>

        <ProductTraceabilityBlock design={solarDesign} inverterId={inverterId} batteryId={batteryId} panelId={panelId} />
        <MpptQuestionBlock hasMppt={hasMppt} onHasMppt={setHasMppt} count={mpptCountPerInverter} onCount={(value) => { setParameterManualMode(true); setMpptCountPerInverter(value); }} />
        <ProtectionBranchesBlock design={solarDesign} settings={settings} />

        <div className="shil-section-card shil-auto-result-card shil-result-card-final">
          <div className="shil-section-head"><h2>نتیجه نهایی پیکربندی سیستم</h2><span>{solarDesign.valid ? "قابل تأیید" : "نیازمند اصلاح"}</span></div>
          {unifiedPvResult ? <SolarPanelPowerResultTable design={solarDesign} solarPanelPowerInput={solarPanelPowerInput} batteryScope={batteryScope} unifiedPvResult={unifiedPvResult} /> : <GeneralLoadResultTable load={load} design={solarDesign} />}
          {solarDesign.warnings.map((item) => <div key={item} className="shil-inline-warning">{item}</div>)}
        </div>

        <button type="button" className="shil-primary-wide shil-confirm-config-button" onClick={confirmSolar}>تأیید پیکربندی و رفتن به چکیده</button>
      </section>
    </EngineeringPageShell>
  );
}
