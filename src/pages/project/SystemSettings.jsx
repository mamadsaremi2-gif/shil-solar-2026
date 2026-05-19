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
const mw = (w) => `${faNumber(Math.round(Number(w || 0) / 10000) / 100)} مگاوات`;


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

function ResultTable({ design }) {
  const rows = [
    ["نوع اجرا", design.settings.systemType === "offgrid" ? "آفگرید" : design.settings.systemType === "hybrid" ? "هیبرید" : "آنگرید", "نوع اینورتر و ساختار نهایی طراحی"],
    ["توان طراحی", `${faNumber(design.design.designPowerW)}W`, `${kw(design.design.designPowerW)} مبنای انتخاب اینورتر`],
    ["مقیاس پروژه", `${design.systemScale?.scaleLabel || "-"} / ${design.systemScale?.designModeLabel || "-"}`, design.systemScale?.targetPowerMW >= 1 ? `${design.systemScale.targetPowerMW}MW AC / ${design.systemScale.targetDcPowerMW}MW DC` : `${design.systemScale?.targetPowerKW || "-"}kW`],
    ["بلوک‌بندی نیروگاهی", design.systemScale?.designMode === "block_based_power_plant" ? `${faNumber(design.systemScale.blockCount)} بلوک × ${design.systemScale.actualBlockPowerMW}MW` : "نیاز ندارد", design.systemScale?.designMode === "block_based_power_plant" ? `${faNumber(design.systemScale.inverterPerBlock)} اینورتر در هر بلوک / ${faNumber(design.systemScale.totalInverterCount)} کل` : "حالت اینورتر تکی یا موازی"],
    ["اینورتر", `${optionTitle(design.inverter)} / ${faNumber(design.inverter.count)} عدد`, design.inverter.parallelRequired ? "نیازمند کارکرد موازی" : "پوشش مستقیم توان"],
    ["باتری", `${design.battery.battery.title} / ${batterySpecText(design.battery)}`, `${batteryNoteText(design.battery)} / بازه ${design.battery.voltageRange}`],
    ["توان پنل خورشیدی", `${design.panel.title} / ${faNumber(design.pvArray.panelCount)} عدد`, `${faNumber(design.pvArray.seriesCount)} سری × ${faNumber(design.pvArray.parallelCount)} موازی / ${faNumber(design.pvArray.arrayPowerW)}W`],
    ["تولید روزانه پنل", `${design.panelPowerAnalysis?.array?.dailyEnergyKWh || design.solarSizing?.ePvDailyKWh || "-"} kWh/day`, design.panelPowerAnalysis?.array?.coveragePercent ? `پوشش مهندسی مصرف: ${design.panelPowerAnalysis.array.coveragePercent}%` : "پس از ثبت مصرف روزانه محاسبه می‌شود"],
    ["اعتبارسنجی توان پنل", `${design.panelPowerAnalysis?.levelLabel || "-"} / ${design.panelPowerAnalysis?.score || "-"} از ۱۰۰`, "کنترل توان، انرژی روزانه، رشته‌بندی، MPPT، جریان و فضای نصب"],
    ["باتری خودکفایی", `${design.solarSizing?.eBatteryNeededKWh || "-"} kWh`, design.solarSizing?.batterySummary || (design.solarSizing?.batteryCount ? `${faNumber(design.solarSizing.batteryCount)} عدد / ${design.solarSizing.batteryVoltageV || "-"}V / ${design.solarSizing.batteryCapacityAh || "-"}Ah / ${design.solarSizing.batteryUnitKWh || "-"}kWh هر باتری / ${design.solarSizing.batteryBankKWh || "-"}kWh کل` : "بر اساس DoD و راندمان محاسبه می‌شود")],
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
  const [panelId, setPanelId] = useState(SHIL_SOLAR_PANELS.find((p) => p.powerW === 620)?.id || SHIL_SOLAR_PANELS[0]?.id || "");
  const [inverterId, setInverterId] = useState(SHIL_SOLAR_INVERTERS.find((i) => i.ratedPowerW >= 5000)?.id || SHIL_SOLAR_INVERTERS[0]?.id || "");
  const [batteryId, setBatteryId] = useState(SHIL_LITHIUM_BATTERIES.find((b) => b.nominalVoltage === 48 && b.capacityAh === 200)?.id || SHIL_LITHIUM_BATTERIES[0]?.id || "");
  const [panelExtraFactor, setPanelExtraFactor] = useState(1);
  const [liveSaved, setLiveSaved] = useState(false);
  const [inverterExtraFactor, setInverterExtraFactor] = useState(1);
  const [batteryExtraFactor, setBatteryExtraFactor] = useState(1);
  const [projectScale, setProjectScale] = useState("auto");
  const [targetPlantPowerMW, setTargetPlantPowerMW] = useState("");
  const [powerBlockSizeKW, setPowerBlockSizeKW] = useState("");
  const [mvVoltageKV, setMvVoltageKV] = useState("");
  const [blockStationMW, setBlockStationMW] = useState("");
  const [exportLimitMW, setExportLimitMW] = useState("");
  const [groundCoverageRatio, setGroundCoverageRatio] = useState("");
  const [trackerMode, setTrackerMode] = useState("auto");
  const [terrainSlopeDeg, setTerrainSlopeDeg] = useState("");
  const [usableLandPercent, setUsableLandPercent] = useState("");
  const [gridShortCircuitMVA, setGridShortCircuitMVA] = useState("");
  const [estimatedMvFaultKA, setEstimatedMvFaultKA] = useState("");
  const [plantAvailabilityPercent, setPlantAvailabilityPercent] = useState("");
  const [annualDegradationPercent, setAnnualDegradationPercent] = useState("");
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
    projectScale,
    targetPlantPowerMW: Number(targetPlantPowerMW) || 0,
    powerBlockSizeKW: Number(powerBlockSizeKW) || 0,
    mvVoltageKV: Number(mvVoltageKV) || 0,
    blockStationMW: Number(blockStationMW) || 0,
    exportLimitMW: Number(exportLimitMW) || 0,
    groundCoverageRatio: Number(groundCoverageRatio) || 0,
    trackerMode,
    terrainSlopeDeg: Number(terrainSlopeDeg) || 0,
    usableLandPercent: Number(usableLandPercent) || 0,
    gridShortCircuitMVA: Number(gridShortCircuitMVA) || 0,
    estimatedMvFaultKA: Number(estimatedMvFaultKA) || 0,
    plantAvailabilityPercent: Number(plantAvailabilityPercent) || 0,
    annualDegradationPercent: Number(annualDegradationPercent) || 0,
    manualMode: equipmentManualMode || parameterManualMode,
    equipmentManualMode,
    parameterManualMode
  }), [systemType, autonomyDays, reserveFactor, equipmentManualMode, parameterManualMode, panelId, inverterId, batteryId, panelExtraFactor, inverterExtraFactor, batteryExtraFactor, projectScale, targetPlantPowerMW, powerBlockSizeKW, mvVoltageKV, blockStationMW, exportLimitMW, groundCoverageRatio, trackerMode, terrainSlopeDeg, usableLandPercent, gridShortCircuitMVA, estimatedMvFaultKA, plantAvailabilityPercent, annualDegradationPercent]);

  const solarDesign = useMemo(() => runSolarAutoDesign({ load, environment, settings }), [load, environment, settings]);

  useEffect(() => {
    if (equipmentManualMode) return;
    setPanelId(SHIL_SOLAR_PANELS.find((p) => p.powerW === 620)?.id || solarDesign.panel.id);
    setInverterId(solarDesign.inverter.id);
    setBatteryId(solarDesign.battery.battery.id);
  }, [equipmentManualMode, solarDesign.panel.id, solarDesign.inverter.id, solarDesign.battery.battery.id]);

  useEffect(() => {
    if (!warning) return undefined;
    const timer = setTimeout(() => setWarning(""), 5200);
    return () => clearTimeout(timer);
  }, [warning]);

  useEffect(() => {
    try {
      localStorage.setItem("shil:solarSystemDesign:live", JSON.stringify(solarDesign));
      localStorage.setItem("shil:systemSettingsDraft:live", JSON.stringify({ domain: "solar", ...settings, design: solarDesign }));
      setLiveSaved(true);
      const timer = setTimeout(() => setLiveSaved(false), 900);
      return () => clearTimeout(timer);
    } catch {
      return undefined;
    }
  }, [solarDesign, settings]);

  const applySmart = () => {
    setEquipmentManualMode(false);
    setParameterManualMode(false);
    setPanelExtraFactor(1);
    setInverterExtraFactor(1);
    setBatteryExtraFactor(1);
    setProjectScale("auto");
    setTargetPlantPowerMW("");
    setPowerBlockSizeKW("");
    setPanelId(SHIL_SOLAR_PANELS.find((p) => p.powerW === 620)?.id || solarDesign.panel.id);
    setInverterId(solarDesign.inverter.id);
    setBatteryId(solarDesign.battery.battery.id);
  };

  const confirmSolar = () => {
    const finalDesign = { ...solarDesign, confirmedAt: new Date().toISOString(), confirmedWithWarnings: !solarDesign.valid };
    approveProjectStep("system");
    localStorage.setItem("shil:solarSystemDesign", JSON.stringify(finalDesign));
    localStorage.setItem("shil:systemSettingsDraft", JSON.stringify({ domain: "solar", ...settings, design: finalDesign }));
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
          <div className="shil-section-head"><h2>کنترل طراحی</h2><span>نوع اجرای اینورتر خورشیدی</span></div>
          <DesignModeCards value={systemType} onChange={(nextType) => { setSystemType(nextType); setEquipmentManualMode(false); setWarning(`مدل طراحی ${nextType === "offgrid" ? "آفگرید" : nextType === "ongrid" ? "آنگرید" : "هیبرید"} در موتور محاسبات اعمال شد.`); }} />
        </div>

        <div className="shil-section-card shil-config-block shil-scale-config-block">
          <div className="shil-section-head"><h2>مقیاس پروژه نیروگاهی</h2><span>تا سقف ۳۰ مگاوات</span></div>
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
        </div>

        <div className="shil-section-card shil-config-block">
          <div className="shil-section-head"><h2>پارامترهای اثرگذار</h2><span>{parameterManualMode ? "حالت دستی فعال" : "اعمال هوشمند فعال"}</span></div>
          <div className="shil-form-grid shil-param-grid">
            <label><span>روزهای خودکفایی</span><input type="number" min="1" max="7" value={autonomyDays} onChange={(e) => { setParameterManualMode(true); setAutonomyDays(e.target.value); }} /></label>
            <label><span>ضریب اطمینان استاندارد</span><input type="number" step="0.05" min="1" value={reserveFactor} onChange={(e) => { setParameterManualMode(true); setReserveFactor(e.target.value); }} /></label>
          </div>
          <div className="shil-summary-grid shil-solar-sizing-preview">
            <div><span>توان آرایه پنل</span><strong>{solarDesign.solarSizing?.pArrayKW || "-"} kW</strong></div>
            <div><span>تولید روزانه</span><strong>{solarDesign.solarSizing?.ePvDailyKWh || "-"} kWh</strong></div>
            <div><span>پوشش مصرف</span><strong>{solarDesign.solarSizing?.coveragePercent ? `${solarDesign.solarSizing.coveragePercent}%` : "نامشخص"}</strong></div>
            <div><span>باتری خودکفایی</span><strong>{solarDesign.solarSizing?.eBatteryNeededKWh || "-"} kWh</strong><small>{solarDesign.solarSizing?.batterySummary || batterySpecText(solarDesign.battery)}</small></div>
          </div>
          <div className="shil-action-row shil-smart-mode-row">
            <button type="button" className={!equipmentManualMode && !parameterManualMode ? "shil-soft-button active" : "shil-soft-button"} onClick={applySmart}>اعمال هوشمند SHIL</button>
            <button type="button" className={equipmentManualMode ? "shil-soft-button active" : "shil-soft-button"} onClick={() => setEquipmentManualMode(!equipmentManualMode)}>{equipmentManualMode ? "ورود دستی تجهیزات فعال" : "ورود دستی تجهیزات"}</button>
          </div>
          <p className="shil-muted-line">در حالت پیش‌فرض، روزهای خودکفایی و ضریب اطمینان استاندارد مستقیم روی موتور محاسبات وارپ می‌شوند؛ با ورود عدد جدید، همان لحظه حالت دستی پارامتر فعال و محاسبات دوباره انجام می‌شود.</p>
          <p className="shil-muted-line">{liveSaved ? "ذخیره و اتصال زنده به موتور انجام شد." : `پنل پیش‌فرض موتور: ${solarDesign.panel.powerW} وات`}</p>
        </div>

        <PanelPowerProCard design={solarDesign} />

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
            smartValue={`${solarDesign.battery.unitVoltageV || solarDesign.battery.battery.nominalVoltage}V / ${faNumber(solarDesign.battery.totalCount)} عدد / ${solarDesign.battery.unitEnergyKWh || "-"}kWh`}
            renderMeta={(item) => <>{item?.nominalVoltage}V / {item?.capacityAh}Ah / بازه شناور {item?.minVoltage}-{item?.maxVoltage}V / انرژی خام {item?.energyWh}Wh</>}
            renderReason={() => <>ولتاژ باتری به صورت شناور کنترل می‌شود؛ برای اینورتر 12، 24 و 48 ولت، بازه باتری معادل همان ولتاژ باید داخل محدوده مجاز اینورتر باشد.</>}
          />
          <BankSelect
            title="بانک پنل خورشیدی"
            subtitle="پیش‌فرض 620W / دستی تا 700W"
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
