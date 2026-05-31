import React, { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import EngineeringPageShell from "../../components/EngineeringPageShell.jsx";
import { approveProjectStep } from "../../workflow/projectWorkflow.js";
import { getActiveMethodKey } from "../../core/summary/methodSummaryEngine.js";

function readDraft(key, fallback = {}) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") || fallback;
  } catch {
    return fallback;
  }
}

function toEnglishDigits(value) {
  return String(value ?? "")
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
}

function fmt(value, fallback = "ثبت نشده") {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "number") return toEnglishDigits(Number.isFinite(value) ? Math.round(value * 100) / 100 : fallback);
  return toEnglishDigits(value);
}

function pick(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "" && value !== "ثبت نشده") ?? null;
}

function methodTitle(key, fallback = "لیست تجهیزات") {
  const map = {
    equipment: "لیست تجهیزات",
    profile: "پروفایل مصرف",
    energy: "انرژی روزانه",
    solar_panel_power: "توان پنل خورشیدی",
    power: "توان کل مصرفی",
    current: "جریان کل مصرفی",
    emergency: "برق اضطراری",
  };
  return map[key] || fallback;
}

function pathTitle(path = {}, emergency = false) {
  return path.title || path.name || path.label || (emergency ? "اجرای پروژه با برق اضطراری" : "اجرای پروژه با پنل خورشیدی");
}

function designTitle(value) {
  const map = {
    offgrid: "آفگرید",
    ongrid: "آنگرید",
    hybrid: "هیبرید",
    battery: "آفگرید",
    grid: "آنگرید",
  };
  return map[value] || value || "ثبت نشده";
}

function SummaryBlock({ title, badge, children }) {
  return (
    <div className="shil-section-card shil-summary-block-card">
      <div className="shil-section-head">
        <h2>{title}</h2>
        {badge ? <span>{badge}</span> : null}
      </div>
      <div className="shil-summary-grid">{children}</div>
    </div>
  );
}

function SummaryItem({ label, value, note }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{fmt(value)}</strong>
      {note ? <small>{fmt(note)}</small> : null}
    </div>
  );
}

function getEnvironmentImage(environment = {}) {
  const attachments = Array.isArray(environment.siteAttachments) ? environment.siteAttachments : [];
  const first = attachments[0] || environment.siteAttachment || environment.sitePhoto || environment.installationImage || null;
  if (!first) return null;
  if (typeof first === "string") return first;
  return first.dataUrl || first.previewUrl || first.url || first.src || first.base64 || null;
}

function getRegisteredParams(methodKey, loadResult, systemSettings, selectedEquipment, solarPanelPowerInput) {
  const registered = readDraft("shil:registeredCalculationParams", null) || readDraft("shil:calculationRegisteredParams", null) || readDraft("shil:methodRegisteredParams", null);
  if (registered && typeof registered === "object") return registered;

  const equipmentStats = loadResult?.equipmentStats || loadResult?.stats || systemSettings?.equipmentStats || {};
  const selectedCount = Array.isArray(selectedEquipment) ? selectedEquipment.length : Number(loadResult?.selectedEquipmentCount || 0);
  const motorCount = pick(equipmentStats.motorCount, loadResult?.motorCount, systemSettings?.motorCount, 0);
  const softStarterCount = pick(equipmentStats.softStarterCount, loadResult?.softStarterCount, systemSettings?.softStarterCount, 0);
  const surgeCurrentA = pick(loadResult?.startingCurrentA, loadResult?.surgeCurrentA, systemSettings?.startingCurrentA, systemSettings?.surgeCurrentA, null);

  return {
    methodKey,
    methodTitle: methodTitle(methodKey),
    selectedEquipmentCount: selectedCount,
    motorCount,
    softStarterCount,
    totalPowerW: pick(loadResult?.totalPowerW, loadResult?.designPowerW, systemSettings?.basePowerW, systemSettings?.totalPowerW),
    finalPowerW: pick(systemSettings?.finalPowerW, systemSettings?.designPowerW, loadResult?.designPowerW, loadResult?.totalPowerW),
    dailyEnergyKWh: pick(loadResult?.dailyEnergyKWh, systemSettings?.dailyEnergyKWh),
    acCurrentA: pick(loadResult?.acCurrentA, systemSettings?.acCurrentA),
    startingCurrentA: surgeCurrentA,
    peakStartW: pick(loadResult?.peakStartW, loadResult?.surgePowerW, systemSettings?.peakStartW),
    voltageV: pick(systemSettings?.voltageV, loadResult?.voltageV, solarPanelPowerInput?.voltageV),
    panelPowerW: pick(solarPanelPowerInput?.panelPowerW, systemSettings?.panelPowerW),
    panelCount: pick(solarPanelPowerInput?.panelCount, systemSettings?.panelCount),
  };
}

function buildRegisteredRows(params = {}, methodKey) {
  const common = [
    ["روش محاسبات", params.methodTitle || methodTitle(methodKey)],
    ["توان نهایی ثبت شده", params.finalPowerW ? `W ${params.finalPowerW}` : params.totalPowerW ? `W ${params.totalPowerW}` : null],
    ["انرژی روزانه ثبت شده", params.dailyEnergyKWh ? `kWh ${params.dailyEnergyKWh}` : null],
    ["ولتاژ مبنا", params.voltageV ? `V ${params.voltageV}` : null],
  ];

  if (methodKey === "equipment") {
    return [
      ["روش محاسبات", "لیست تجهیزات"],
      ["تعداد تجهیزات انتخابی", params.selectedEquipmentCount ? `${params.selectedEquipmentCount} تجهیز` : "0 تجهیز"],
      ["تعداد تجهیزات موتوری", params.motorCount ? `${params.motorCount} تجهیز` : "0 تجهیز"],
      ["تعداد سافت‌استارتر", params.softStarterCount ? `${params.softStarterCount} تجهیز` : "0 تجهیز"],
      ["توان کل محاسبه شده", params.totalPowerW ? `W ${params.totalPowerW}` : null],
      ["انرژی روزانه", params.dailyEnergyKWh ? `kWh ${params.dailyEnergyKWh}` : null],
      ["جریان AC", params.acCurrentA ? `A ${params.acCurrentA}` : null],
      ["جریان راه‌اندازی", params.startingCurrentA ? `A ${params.startingCurrentA}` : null],
      ["پیک استارت", params.peakStartW ? `W ${params.peakStartW}` : null],
    ];
  }

  if (methodKey === "solar_panel_power") {
    return [
      ["روش محاسبات", "توان پنل خورشیدی"],
      ["توان پنل وارد شده", params.panelPowerW ? `W ${params.panelPowerW}` : null],
      ["تعداد پنل وارد شده", params.panelCount ? `${params.panelCount} عدد` : null],
      ...common.slice(1),
    ];
  }

  return common;
}

function buildSystemRows(systemSettings = {}, solarDesign = {}, unified = {}) {
  const design = solarDesign || {};
  const inverter = design.inverter || systemSettings.inverter || unified.inverter || {};
  const battery = design.battery || systemSettings.battery || unified.battery || {};
  const panel = design.panel || systemSettings.panel || unified.panel || {};
  const pvArray = design.pvArray || systemSettings.pvArray || unified.pvArray || {};

  return [
    ["نوع طراحی", designTitle(pick(systemSettings.designMode, systemSettings.designType, design.designMode, design.designType))],
    ["توان کل پس از ضریب", pick(systemSettings.finalPowerW, systemSettings.designPowerW, design.finalPowerW, design.load?.designPeakW) ? `W ${pick(systemSettings.finalPowerW, systemSettings.designPowerW, design.finalPowerW, design.load?.designPeakW)}` : null],
    ["انرژی روزانه پس از ضریب", pick(systemSettings.finalDailyEnergyKWh, systemSettings.dailyEnergyKWh, design.finalDailyEnergyKWh, design.load?.dailyEnergyKWh) ? `kWh ${pick(systemSettings.finalDailyEnergyKWh, systemSettings.dailyEnergyKWh, design.finalDailyEnergyKWh, design.load?.dailyEnergyKWh)}` : null],
    ["پنل انتخابی", pick(panel.title, panel.name, systemSettings.panelTitle)],
    ["ولتاژ و جریان پنل", pick(panel.vmp && panel.imp ? `Vmp ${panel.vmp}V / Imp ${panel.imp}A` : null, panel.voltageV && panel.currentA ? `${panel.voltageV}V / ${panel.currentA}A` : null)],
    ["تعداد پنل", pick(pvArray.panelCount, systemSettings.panelCount) ? `${pick(pvArray.panelCount, systemSettings.panelCount)} عدد` : null],
    ["توان آرایه پنل", pick(pvArray.arrayPowerW, pvArray.totalPowerW, systemSettings.arrayPowerW) ? `W ${pick(pvArray.arrayPowerW, pvArray.totalPowerW, systemSettings.arrayPowerW)}` : null],
    ["اینورتر خورشیدی", pick(inverter.title, inverter.name, systemSettings.inverterTitle)],
    ["تعداد اینورتر خورشیدی", pick(inverter.count, systemSettings.inverterCount) ? `${pick(inverter.count, systemSettings.inverterCount)} عدد` : null],
    ["تعداد MPPT هر اینورتر", pick(inverter.mpptCount, inverter.mppt, systemSettings.mpptCount) ? `${pick(inverter.mpptCount, inverter.mppt, systemSettings.mpptCount)} عدد` : null],
    ["ولتاژ DC اینورتر", pick(inverter.dcVoltageV, inverter.batteryVoltageV, systemSettings.inverterDcVoltageV) ? `V ${pick(inverter.dcVoltageV, inverter.batteryVoltageV, systemSettings.inverterDcVoltageV)}` : null],
    ["باتری انتخابی", pick(battery.battery?.title, battery.title, battery.name, systemSettings.batteryTitle)],
    ["ولتاژ / جریان / انرژی هر باتری", pick(battery.unitVoltageV && battery.unitCapacityAh ? `${battery.unitVoltageV}V / ${battery.unitCapacityAh}Ah / ${battery.unitEnergyKWh || "-"}kWh` : null, battery.voltageV && battery.capacityAh ? `${battery.voltageV}V / ${battery.capacityAh}Ah` : null)],
    ["تعداد باتری", pick(battery.totalCount, battery.count, systemSettings.batteryCount) ? `${pick(battery.totalCount, battery.count, systemSettings.batteryCount)} عدد` : null],
    ["مجموع انرژی بانک باتری", pick(battery.grossEnergyKWh, battery.totalEnergyKWh, systemSettings.batteryTotalKWh) ? `kWh ${pick(battery.grossEnergyKWh, battery.totalEnergyKWh, systemSettings.batteryTotalKWh)}` : null],
    ["ظرفیت ذخیره‌سازی مورد نیاز", pick(systemSettings.requiredStorageKWh, battery.requiredStorageKWh, design.requiredStorageKWh) ? `kWh ${pick(systemSettings.requiredStorageKWh, battery.requiredStorageKWh, design.requiredStorageKWh)}` : null],
  ];
}

function renderRows(rows) {
  return rows.map(([label, value, note]) => <SummaryItem key={label} label={label} value={value} note={note} />);
}

export default function SummaryPage() {
  const { domain = "solar" } = useParams();
  const navigate = useNavigate();
  const emergency = domain === "emergency";
  const methodKey = getActiveMethodKey({ domain });

  const project = useMemo(() => readDraft("shil:projectInfoDraft", {}), []);
  const selectedPath = useMemo(() => readDraft("shil:selectedProjectPath", {}), []);
  const environment = useMemo(() => readDraft("shil:environmentDraft", {}), []);
  const environmentAssessment = useMemo(() => readDraft("shil:environmentAssessment", {}), []);
  const loadResult = useMemo(() => readDraft("shil:loadEngineResult", {}), []);
  const systemSettings = useMemo(() => readDraft("shil:systemSettingsDraft", {}), []);
  const solarDesign = useMemo(() => readDraft("shil:solarSystemDesign", systemSettings?.design || {}), [systemSettings]);
  const unifiedPvResult = useMemo(() => readDraft("shil:unifiedPvEngineResult", solarDesign?.unifiedPvEngineResult || systemSettings?.unifiedPvEngineResult || {}), [solarDesign, systemSettings]);
  const selectedEquipment = useMemo(() => readDraft("shil:selectedEquipments", []), []);
  const solarPanelPowerInput = useMemo(() => readDraft("shil:solarPanelPowerInput", {}), []);
  const registeredParams = useMemo(() => getRegisteredParams(methodKey, loadResult, systemSettings, selectedEquipment, solarPanelPowerInput), [methodKey, loadResult, systemSettings, selectedEquipment, solarPanelPowerInput]);
  const environmentImage = getEnvironmentImage(environment);

  const confirmSummary = () => {
    const summaryPayload = {
      domain,
      selectedPath,
      project,
      environment,
      environmentAssessment,
      methodKey,
      registeredParams,
      loadResult,
      systemSettings,
      solarDesign,
      unifiedPvResult,
      confirmedAt: new Date().toISOString(),
    };
    approveProjectStep("summary");
    localStorage.setItem("shil:summaryDraft", JSON.stringify(summaryPayload));
    navigate("/new-project/run");
  };

  return (
    <EngineeringPageShell title="چکیده اطلاعات">
      <section className="shil-card-stack shil-final-summary-page">
        <SummaryBlock title="انتخاب مسیر پروژه" badge="Project Path">
          <SummaryItem label="مسیر انتخاب شده" value={pathTitle(selectedPath, emergency)} />
          <SummaryItem label="نوع پروژه" value={emergency ? "برق اضطراری" : "خورشیدی"} />
          <SummaryItem label="نوع اتصال / سناریو" value={designTitle(pick(selectedPath.calculationDomain, selectedPath.key, localStorage.getItem("shil:calculationDomain")))} />
          <SummaryItem label="وضعیت مسیر" value="تأیید شده" />
        </SummaryBlock>

        <SummaryBlock title="اطلاعات پروژه" badge="Project Info">
          <SummaryItem label="نام پروژه" value={pick(project.projectName, project.name)} />
          <SummaryItem label="نام کارفرما" value={pick(project.clientName, project.employerName, project.customerName, "SHIL CO")} />
          <SummaryItem label="مسیر پروژه" value={pick(project.projectPathTitle, pathTitle(selectedPath, emergency))} />
          <SummaryItem label="تاریخ ثبت" value={pick(project.date, project.registerDate, project.createdAt)} />
          <SummaryItem label="توضیحات پروژه" value={pick(project.description, project.notes)} />
        </SummaryBlock>

        <SummaryBlock title="شرایط محیطی" badge="Environment">
          <SummaryItem label="شهر مبنا" value={pick(environment.city, environment.cityName, environmentAssessment.city)} />
          <SummaryItem label="استان" value={pick(environment.province, environment.state, environmentAssessment.province)} />
          <SummaryItem label="PSH" value={pick(environment.psh, environment.peakSunHours, environmentAssessment.peakSunHours)} />
          <SummaryItem label="دمای طراحی" value={pick(environment.temperatureC, environment.maxTemperatureC, environmentAssessment.temperatureC) ? `${pick(environment.temperatureC, environment.maxTemperatureC, environmentAssessment.temperatureC)} °C` : null} />
          <SummaryItem label="شرایط نصب" value={pick(environment.installationType, environment.mountingType, environment.installMode)} />
          <SummaryItem label="تصویر محل نصب" value={environmentImage ? "ثبت شده" : "ثبت نشده"} />
        </SummaryBlock>

        <SummaryBlock title="روش محاسبات" badge="Calculation Method">
          <SummaryItem label="روش انتخاب شده" value={methodTitle(methodKey, registeredParams.methodTitle)} />
          <SummaryItem label="دامنه محاسبات" value={emergency ? "برق اضطراری" : "خورشیدی"} />
          <SummaryItem label="وضعیت ثبت روش" value="تأیید شده" />
        </SummaryBlock>

        <SummaryBlock title="ورودی محاسبات" badge="Calculation Inputs">
          {renderRows(buildRegisteredRows(registeredParams, methodKey))}
        </SummaryBlock>

        <SummaryBlock title="تنظیمات سیستم" badge="System Settings">
          {renderRows(buildSystemRows(systemSettings, solarDesign, unifiedPvResult))}
        </SummaryBlock>

        <button type="button" className="shil-primary-wide" onClick={confirmSummary}>
          تأیید چکیده اطلاعات و رفتن به اجرای محاسبات
        </button>
      </section>
    </EngineeringPageShell>
  );
}
