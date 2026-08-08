import ShilPrimaryButton from "../../components/project/ShilPrimaryButton";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import EngineeringPageShell from "../../components/EngineeringPageShell.jsx";
import shilMainLogo from "../../assets/logos/shil-main-logo.png";
import { approveProjectStep } from "../../workflow/projectWorkflow.js";
import { markCurrentProjectFinal, showUxToast } from "../../workflow/uxFlowController.js";
import { runEngineeringDesign } from "../../runEngineeringDesign.js";
import { buildScenarioCalculationInput } from "../../core/scenario/scenarioToEngineeringForm.js";
import { buildMethodSummary, getActiveMethodKey } from "../../core/summary/methodSummaryEngine.js";
import { safeText, safeList, safeKey } from "../../utils/safeRender.js";
import { getProjectDesignState } from "../../engineering/core/projectDesignState.js";
import {
  buildFinalEngineeringDelivery,
  exportElementAsPdf,
  exportElementAsPng,
  shareDelivery,
  shareElementAsPdf,
} from "../../export/shilExportSystem.js";

function readDraft(key, fallback = {}) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") || fallback;
  } catch {
    return fallback;
  }
}

function makeFallbackForm(domain) {
  return {
    project: { scenario: domain === "emergency" ? "emergency" : "offgrid", dailyEnergyWh: 5000, peakLoadW: 2500, autonomyDays: 1 },
    environment: { peakSunHours: domain === "emergency" ? 0 : 5, irradianceLossPercent: 0, soilingLossPercent: 3, shadingLossPercent: 0 },
    pv: { panelPowerW: domain === "emergency" ? 0 : 620, panelVoc: 50.9, panelVmp: 42.6, panelIsc: 15, panelImp: 14.56, seriesCount: 2, parallelCount: 1, dcBusVoltage: 48, tempCoeffVocPercentPerC: -0.28, temperatureMinC: -5, temperatureMaxC: 45 },
    battery: { nominalVoltage: 48, capacityAh: 100, depthOfDischarge: 0.85, roundTripEfficiency: 0.94 },
    inverter: { ratedPowerW: 3000, surgePowerW: 6000, maxDcVoltage: 500, mpptMinVoltage: 120, mpptMaxVoltage: 450, efficiency: 0.95 },
    cable: { lengthM: 20, currentA: 30, crossSectionMm2: 0, material: "copper", allowedVoltageDropPercent: 3 },
    designDomain: domain,
  };
}

function readCalculationInput() {
  try {
    const saved = JSON.parse(localStorage.getItem("shil:calculationInput") || "null");
    if (saved?.form) return saved;
    return buildScenarioCalculationInput();
  } catch {
    return null;
  }
}

function runCore(domain) {
  if (domain === "emergency") {
    const settingsDraft = readDraft("shil:systemSettingsDraft", {});
    const emergencyDesign = readDraft("shil:emergencySystemDesign", null)
      || settingsDraft?.design
      || readDraft("shil:emergencySystemDesign:live", null);
    if (emergencyDesign?.domain === "emergency" || emergencyDesign?.calculationModel === "ups_like_battery_inverter") {
      return {
        result: {
          status: emergencyDesign.valid ? "success" : "needs-review",
          valid: emergencyDesign.valid !== false,
          mode: "UPS_LIKE_EMERGENCY_DESIGN",
          emergencyDesign,
          values: { emergencyDesign },
          warnings: emergencyDesign.warnings || [],
          explanations: ["خروجی نهایی از طراحی اختصاصی برق اضطراری، بانک باتری و اینورتر خوانده شد."],
        },
      };
    }
    const form = { ...makeFallbackForm("emergency"), load: readDraft("shil:loadEngineResult", {}), settings: readDraft("shil:emergencyPowerSettings", {}), designDomain: "emergency" };
    return { result: runEngineeringDesign(form, { domain: "emergency", mode: "final-core", stopOnValidationError: false }) };
  }
  try {
    const centralState = readDraft("shil:projectDesignState", null);
    const solarDesign = centralState?.design || readDraft("shil:solarSystemDesign", null);
    if (solarDesign?.version) {
      const calculationInput = readCalculationInput();
      const form = calculationInput?.form || makeFallbackForm(domain);
      const centralResult = runEngineeringDesign(form, { domain: "solar", mode: "final-core", stopOnValidationError: false });
      return {
        input: calculationInput,
        result: {
          ...centralResult,
          status: solarDesign.valid && centralResult?.valid !== false ? "success" : "needs-review",
          valid: solarDesign.valid !== false && centralResult?.valid !== false,
          mode: "UNIFIED_SOLAR_FINAL_CORE",
          solarDesign,
          values: { ...(centralResult?.values || {}), solarDesign },
          warnings: [...new Set([...(centralResult?.warnings || []), ...(solarDesign.warnings || [])])],
          explanations: [
            ...(centralResult?.explanations || []),
            "تجهیزات، حفاظت و کابل‌های خروجی نهایی مستقیماً از موتور مرکزی محاسبات خوانده شدند.",
          ],
        },
      };
    }
    const calculationInput = readCalculationInput();
    const form = calculationInput?.form || makeFallbackForm(domain);
    const activeDomain = calculationInput?.scenario?.domain || form.designDomain || domain;
    return {
      input: calculationInput,
      result: runEngineeringDesign(form, { domain: activeDomain, mode: activeDomain === "emergency" ? "emergency-core" : "solar-core", stopOnValidationError: false }),
    };
  } catch (error) {
    return { input: null, result: { status: "ready", note: "هسته اصلی متصل است؛ اجرای واقعی با دیتای پروژه در Runtime انجام می‌شود.", error: String(error?.message || error) } };
  }
}


function MixedValue({ children }) {
  return <strong dir="auto">{toEnglishDigits(safeText(children))}</strong>;
}

function FinalResultFields({ result = {}, solarDesign = {} }) {
  const summary = result.summary || {};
  const values = result.values || {};
  const bom = summary.billOfMaterials || values.billOfMaterials || {};
  const fields = summary.resultFields || {};
  const protection = result.values?.protection || summary.protection || {};
  const cables = values.cables || fields.cables || {};
  return (
    <div className="shil-final-sheet-block shil-final-result-fields">
      <h3>ÙÛŒÙ„Ø¯ Ù†ØªÛŒØ¬Ù‡ ØªÙÚ©ÛŒÚ©ÛŒ</h3>
      <div className="shil-result-field-grid">
        <div><span>ØªØ¹Ø¯Ø§Ø¯ Ø§ÛŒÙ†ÙˆØ±ØªØ±</span><MixedValue fa>{fields.inverterCount || values.inverterCount || 1} Ø¹Ø¯Ø¯</MixedValue></div>
        <div><span>ØªØ¹Ø¯Ø§Ø¯ Ù¾Ù†Ù„</span><MixedValue fa>{fields.panelCount || values.panelCount || 0} Ø¹Ø¯Ø¯</MixedValue></div>
        <div><span>ØªØ¹Ø¯Ø§Ø¯ Ø¨Ø§ØªØ±ÛŒ</span><MixedValue fa>{fields.batteryCount || values.batteryCount || 0} Ø¹Ø¯Ø¯</MixedValue></div>
        <div><span>ØªØ¹Ø¯Ø§Ø¯ MPPT</span><MixedValue fa>{fields.mpptCount || values.mpptCount || values.inverterMpptCount || 1} Ú©Ø§Ù†Ø§Ù„</MixedValue></div>
        <div><span>ØªÙˆØ§Ù† Ù†ØµØ¨â€ŒØ´Ø¯Ù‡ PV</span><MixedValue>{values.installedPvPowerKW || summary.pv?.installedPowerKW || 0} KW</MixedValue></div>
        <div><span>ÙØ¶Ø§ÛŒ Ù†ØµØ¨ Ú©Ù„</span><MixedValue fa>{fields.installationAreaM2 || values.installationAreaM2 || bom.space?.requiredInstallationAreaM2 || 0} Ù…ØªØ± Ù…Ø±Ø¨Ø¹</MixedValue></div>
      </div>
      <div className="shil-result-partitions">
        <section><h4>ØªØ¬Ù‡ÛŒØ²Ø§Øª Ø­ÙØ§Ø¸ØªÛŒ PV</h4><p>{safeText(protection.pvDc?.breaker)} / {safeText(protection.pvDc?.spd)} / {safeText(protection.pvDc?.poles)}</p><small>ÙˆÙ„ØªØ§Ú˜: {safeText(protection.pvDc?.designVoltageV)} V | Ø¬Ø±ÛŒØ§Ù†: {safeText(protection.pvDc?.currentA)} A</small></section>
        <section><h4>Ø­Ùاظت باتری</h4><p>{safeText(protection.batteryDc?.fuse)}</p><small>ولتاژ: {safeText(protection.batteryDc?.designVoltageV)} V | جریان: {safeText(protection.batteryDc?.currentA)} A</small></section>
        <section><h4>حفاظت AC</h4><p>{safeText(protection.ac?.breaker)} / {safeText(protection.ac?.poles)}</p><small>ولتاژ: {safeText(protection.ac?.designVoltageV)} V | جریان: {safeText(protection.ac?.currentA)} A</small></section>
        <section><h4>کابل‌ها</h4><p>PV: {safeText(cables.pv)}</p><p>Battery: {safeText(cables.battery)}</p><p>AC: {safeText(cables.ac)}</p></section>
      </div>
    </div>
  );
}

function Row({ label, value, note }) {
  return (
    <div className="shil-final-compact-row">
      <span>{label}</span>
      <strong>{safeText(value, "ثبت نشده")}</strong>
      {note ? <small>{safeText(note)}</small> : null}
    </div>
  );
}

function CompactEquipmentTable({ title, rows }) {
  const visibleRows = rows.slice(0, 14);
  return (
    <div className="shil-final-sheet-block">
      <h3>{title}</h3>
      <div className="shil-final-equipment-table">
        <div className="head"><span>تجهیز</span><span>تعداد / مشخصات</span><span>دلیل انتخاب</span></div>
        {visibleRows.map((row, index) => (
          <div key={safeKey(row.label || row.item || row, index)}>
            <span>{safeText(row.label || row.item || row.title || row.name)}</span>
            <strong>{safeText(row.value || [row.qty, row.spec].filter(Boolean).join(" / "))}</strong>
            <small>{safeText(row.note || row.reason || row.message)}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function DistributedInverterTable({ systems = [] }) {
  if (!Array.isArray(systems) || !systems.length) return null;
  return (
    <div className="shil-final-sheet-block">
      <h3>تقسیم زیرسیستم‌ها برای هر اینورتر</h3>
      <div className="shil-final-equipment-table">
        <div className="head"><span>اینورتر</span><span>پنل / باتری / فضا</span><span>حفاظت و کابل مستقل</span></div>
        {systems.slice(0, 12).map((system, index) => (
          <div key={safeKey(system.id || system.title || system, index)}>
            <span>{safeText(system.title || system.id, `اینورتر ${index + 1}`)}</span>
            <strong>{safeText(system?.pv?.panelCount, "0")} پنل / {safeText(system?.battery?.count, "0")} باتری / {safeText(system?.space?.maintenanceAreaM2)}m²</strong>
            <small>DC {safeText(system?.protection?.dcBreakerA)} A / AC {safeText(system?.protection?.acBreakerA)} A / کابل {safeText(system?.protection?.dcCable)} و {safeText(system?.protection?.acCable)}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function DecisionPath({ methodSummary, result, calculationInput, solarDesign, emergency }) {
  const scenarioTitle = calculationInput?.scenario?.title || methodSummary.title || (emergency ? "برق اضطراری" : "خورشیدی");
  const designStatus = result?.valid === false ? "نیازمند بازبینی" : "قابل ارائه";
  const keyInputs = [
    solarDesign?.load?.dailyEnergyWh ? `مصرف روزانه ${safeText(solarDesign.load.dailyEnergyWh)} WH` : null,
    solarDesign?.load?.peakLoadW ? `توان پیک ${safeText(solarDesign.load.peakLoadW)} W` : null,
    solarDesign?.environment?.peakSunHours ? `ساعت آفتابی ${safeText(solarDesign.environment.peakSunHours)}` : null,
  ].filter(Boolean).join(" / ") || "ورودی‌های کلیدی از مراحل قبلی پروژه خوانده شده‌اند";

  return (
    <div className="shil-final-sheet-block shil-final-path-block">
      <h3>مسیر رسیدن به نتیجه</h3>
      <ol>
        <li><b>انتخاب سناریو:</b> {safeText(scenarioTitle)}</li>
        <li><b>ورودی‌های کلیدی:</b> {safeText(keyInputs)}</li>
        <li><b>منطق محاسبه:</b> بار، شرایط محیطی، تجهیزات و قیود حفاظتی توسط موتور محاسبات SHIL ترکیب شدند.</li>
        <li><b>نتیجه نهایی:</b> {designStatus}</li>
      </ol>
    </div>
  );
}


function toEnglishDigits(value, fallback = "-") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value)
    .replace(/[\u06F0-\u06F9]/g, (digit) => String(digit.charCodeAt(0) - 0x06F0))
    .replace(/[\u0660-\u0669]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/٫/g, ".")
    .replace(/٬/g, ",");
}

function cleanValue(value, fallback = "ثبت نشده") {
  return toEnglishDigits(safeText(value, fallback), fallback);
}

function formatNumber(value, maximumFractionDigits = 2, fallback = "-") {
  const normalized = toEnglishDigits(value, fallback).replace(/,/g, "");
  const number = Number(normalized);
  if (!Number.isFinite(number)) return cleanValue(value, fallback);
  return number.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: Math.min(2, Math.max(0, maximumFractionDigits)),
  });
}

function formatMetric(value, unit, digits = 2, fallback = "-") {
  const number = formatNumber(value, digits, fallback);
  if (number === fallback) return fallback;
  return `${number} ${String(unit || "").toUpperCase()}`.trim();
}

function formatPercent(value, digits = 1) {
  const raw = String(value ?? "").replace("%", "");
  return formatMetric(raw, "%", digits);
}

function NativeSection({ index, title, children, className = "" }) {
  return (
    <section className={`shil-run-native-section ${className}`.trim()}>
      <header className="shil-run-native-section-title">
        <span className="shil-run-section-index">{index}</span>
        <h2>{title}</h2>
      </header>
      <div className="shil-run-native-section-body">{children}</div>
    </section>
  );
}

function NativeMetricGrid({ rows = [] }) {
  return (
    <div className="shil-run-native-metric-grid">
      {rows.filter(Boolean).map((row, index) => (
        <article className="shil-run-native-metric-card" key={`${row.label}-${index}`}>
          <span>{row.label}</span>
          <strong dir={row.ltr === false ? "rtl" : "ltr"} data-engineering-value={row.ltr === false ? undefined : "true"}>{cleanValue(row.value)}</strong>
          {row.note ? <small>{cleanValue(row.note)}</small> : null}
        </article>
      ))}
    </div>
  );
}

function NativeDataTable({ rows = [] }) {
  return (
    <div className="shil-run-native-table">
      {rows.filter(Boolean).map((row, index) => (
        <article className="shil-run-native-table-row" key={`${row.label}-${index}`}>
          <span>{row.label}</span>
          <strong dir="ltr" data-engineering-value="true">{cleanValue(row.value)}</strong>
          {row.note ? <small>{cleanValue(row.note)}</small> : null}
        </article>
      ))}
    </div>
  );
}

function pick(...values) {
  for (const value of values) {
    if (value !== null && value !== undefined && value !== "" && value !== 0 && value !== "0") return value;
  }
  return values.find((value) => value === 0 || value === "0") ?? "-";
}

function ReadOnlyBlock({ title, badge, rows = [], children, defaultOpen = false }) {
  const visibleRows = rows.filter((row) => row && row.label);
  return (
    <details className="shil-final-sheet-block shil-final-readonly-block shil-final-collapsible" open={defaultOpen}>
      <summary className="shil-section-head"><h3>{title}</h3>{badge ? <span>{badge}</span> : null}<b>نمایش جزئیات</b></summary>
      {visibleRows.length ? (
        <div className="shil-final-sheet-grid shil-final-two-column-grid">
          {visibleRows.map((row, index) => <Row key={`${title}-${index}-${row.label}`} label={row.label} value={row.value} note={row.note} />)}
        </div>
      ) : null}
      {children}
    </details>
  );
}

function buildExecutionContext({ domain, project, summary, result, solarDesign, systemSettings, methodSummary, methodKey, calculationInput, emergency }) {
  if (emergency) {
    const design = result?.emergencyDesign || result?.values?.emergencyDesign || systemSettings?.design
      || readDraft("shil:emergencySystemDesign", {}) || readDraft("shil:emergencySystemDesign:live", {});
    const load = design?.load || readDraft("shil:loadEngineResult", {});
    const settings = design?.settings || {};
    const inverter = design?.inverter || {};
    const battery = design?.battery || {};
    const protection = design?.protection || { protections: [], cables: [] };
    const selectedPath = readDraft("shil:selectedProjectPath", {});
    return {
      emergency: true,
      projectPathTitle: localStorage.getItem("shil:projectPathTitle") || selectedPath?.title || "برق اضطراری",
      methodTitle: methodSummary?.title || design?.sourceMethod || methodKey || "لیست تجهیزات",
      coreTitle: "موتور محاسبات برق اضطراری",
      designType: "باتری + اینورتر برق اضطراری",
      calculationModel: design?.calculationModel || "ups_like_battery_inverter",
      city: project?.city || readDraft("shil:environmentDraft", {})?.city || "-",
      valid: design?.valid !== false,
      loadPowerW: pick(load?.totalPowerW, load?.loadPowerW, 0),
      surgePowerW: pick(load?.surgePowerW, load?.peakLoadW, 0),
      voltageAC: pick(load?.voltageAC, 220),
      phaseAC: load?.phaseAC || (Number(load?.voltageAC) >= 380 ? "three" : "single"),
      backupHours: pick(
        settings?.backupHours,
        readDraft(`shil:systemSetupHandoff:emergency:${design?.sourceMethod || methodKey || localStorage.getItem("shil:calculationMethod") || "equipment"}`, {})?.autonomy?.inputHours,
        readDraft(`shil:systemSetupHandoff:emergency:${design?.sourceMethod || methodKey || localStorage.getItem("shil:calculationMethod") || "equipment"}`, {})?.autonomy?.hours,
        readDraft("shil:systemSetupHandoff", {})?.autonomy?.inputHours,
        readDraft("shil:systemSetupHandoff", {})?.autonomy?.hours,
        readDraft("shil:calculationInputsDraft", readDraft("shil:calculationInputDraft", {}))?.autonomyHours,
        0
      ),
      reserveFactor: pick(settings?.reserveFactor, 1.25),
      dodPercent: pick(settings?.dodPercent, 80),
      inverter, battery, batteryBank: battery, protection,
      inverterCount: pick(inverter?.count, 1),
      inverterDesignPowerW: pick(inverter?.designPowerW, 0),
      inverterRatedPowerW: pick(inverter?.ratedPowerW, inverter?.powerW, 0),
      dcVoltage: pick(inverter?.dcVoltage, inverter?.batteryVoltage, battery?.packVoltage, 48),
      batteryVoltage: pick(battery?.nominalVoltage, 0),
      batteryCurrent: pick(battery?.capacityAh, 0),
      batteryEnergyKWh: pick(battery?.unitEnergyKWh, 0),
      batteryCount: pick(battery?.count, 0),
      batterySeriesCount: pick(battery?.seriesCount, 0),
      batteryParallelCount: pick(battery?.parallelCount, 0),
      batteryTotalKWh: pick(battery?.usableEnergyKWh, 0),
      requiredStorageKWh: pick(battery?.requiredRawKWh, 0),
      runtimeHours: pick(battery?.runtimeHours, settings?.backupHours, 0),
    };
  }
  const environment = readDraft("shil:environmentDraft", {});
  const environmentAssessment = readDraft("shil:environmentAssessment", {});
  const selectedPath = readDraft("shil:selectedProjectPath", {});
  const projectPathTitle = localStorage.getItem("shil:projectPathTitle") || selectedPath?.title || (domain === "emergency" ? "برق اضطراری" : "برق خورشیدی با پنل");
  const selectedMethod = readDraft("shil:selectedCalculationMethod", {});
  const registered = readDraft("shil:registeredCalculationParameters", readDraft("shil:registeredMethodParameters", {}));
  const finalParams = systemSettings?.finalParameters || systemSettings?.appliedParameters || systemSettings?.registeredParameters || registered || {};
  const design = solarDesign?.design || systemSettings?.design || solarDesign || {};
  const values = result?.values || {};
  const resultSummary = result?.summary || {};
  const fields = resultSummary?.resultFields || {};
  const engineEquipment = result?.equipment || resultSummary?.equipment || {};
  const panel = engineEquipment?.panel || values?.panel || design?.panel || solarDesign?.panel || systemSettings?.panel || {};
  const pvArray = values?.pvArray || design?.pvArray || solarDesign?.pvArray || systemSettings?.pvArray || {};
  const inverter = engineEquipment?.inverter || values?.inverter || design?.inverter || solarDesign?.inverter || systemSettings?.inverter || {};
  const battery = engineEquipment?.battery || values?.battery || design?.battery || solarDesign?.battery || systemSettings?.battery || {};
  const protection = values?.protection || resultSummary?.protection || {};
  const cables = values?.cables || fields?.cables || {};
  const cableDetails = values?.cableDetails || resultSummary?.cableDetails || {};
  const billOfMaterials = resultSummary?.billOfMaterials || {};
  const batteryBank = battery?.item || battery?.battery || battery;

  const safetyFactor = pick(solarDesign?.load?.reserveFactor, systemSettings?.systemConfig?.reserveFactor, systemSettings?.safetyFactor, systemSettings?.standardSafetyFactor, finalParams?.safetyFactor, 1.2);
  const autonomyDays = pick(solarDesign?.system?.autonomy?.days, systemSettings?.systemConfig?.autonomyDays, systemSettings?.autonomyDays, finalParams?.autonomyDays, battery?.autonomyDays, 0);
  const basePowerW = pick(solarDesign?.load?.basePowerW, finalParams?.basePowerW, finalParams?.totalPowerW, systemSettings?.basePowerW, systemSettings?.loadPowerW, values?.loadPowerW, 0);
  const powerAfterFactorW = pick(solarDesign?.load?.finalPowerW, finalParams?.powerAfterFactorW, finalParams?.finalPowerW, systemSettings?.powerAfterFactorW, systemSettings?.finalPowerW, Number(basePowerW || 0) * Number(safetyFactor || 1), values?.finalPowerW);
  const dailyEnergyWh = pick(solarDesign?.load?.finalEnergyKWh ? solarDesign.load.finalEnergyKWh * 1000 : null, finalParams?.dailyEnergyAfterFactorWh, finalParams?.dailyEnergyWh, systemSettings?.dailyEnergyAfterFactorWh, systemSettings?.dailyEnergyWh, values?.dailyEnergyWh, 0);
  const panelPowerW = pick(panel?.powerW, panel?.ratedPowerW, systemSettings?.panelPowerW, pvArray?.panelPowerW, 620);
  const panelVoltage = pick(panel?.vmp, panel?.vmpV, panel?.voltageV, systemSettings?.panelVoltageV, pvArray?.panelVoltageV, "-");
  const panelCurrent = pick(panel?.imp, panel?.impA, panel?.currentA, systemSettings?.panelCurrentA, pvArray?.panelCurrentA, "-");
  const panelCount = pick(pvArray?.panelCount, systemSettings?.panelCount, values?.panelCount, fields?.panelCount, 0);
  const arrayPowerW = pick(pvArray?.arrayPowerW, pvArray?.installedPowerW, Number(panelCount || 0) * Number(panelPowerW || 0), values?.installedPvPowerW, 0);
  const inverterCount = pick(inverter?.count, systemSettings?.inverterCount, values?.inverterCount, fields?.inverterCount, 1);
  const mpptEach = pick(inverter?.mpptCount, inverter?.mpptChannels, systemSettings?.mpptCount, values?.mpptCount, values?.inverterMpptCount, fields?.mpptCount, 1);
  const dcVoltage = pick(inverter?.dcVoltage, inverter?.batteryVoltage, inverter?.dcVoltageV, inverter?.batteryVoltageV, inverter?.nominalDcVoltageV, systemSettings?.inverterDcVoltageV, 48);
  const batteryVoltage = pick(batteryBank?.voltageV, battery?.voltageV, battery?.nominalVoltage, systemSettings?.batteryVoltageV, "-");
  const batteryCurrent = pick(batteryBank?.capacityAh, battery?.capacityAh, battery?.bankCurrentAh, systemSettings?.batteryCurrentAh, "-");
  const batteryEnergyKWh = pick(batteryBank?.energyKWh, battery?.unitEnergyKWh, battery?.batteryEnergyKWh, "-");
  const batteryCount = pick(battery?.count, battery?.batteryCount, systemSettings?.batteryCount, values?.batteryCount, fields?.batteryCount, 0);
  const batteryTotalKWh = pick(battery?.grossEnergyKWh, battery?.totalEnergyKWh, systemSettings?.batteryTotalKWh, values?.batteryTotalKWh, Number(batteryCount || 0) * Number(batteryEnergyKWh || 0), 0);
  const requiredStorageKWh = pick(battery?.requiredEnergyKWh, battery?.requiredStorageKWh, systemSettings?.requiredStorageKWh, finalParams?.requiredStorageKWh, Number(dailyEnergyWh || 0) / 1000 * Number(autonomyDays || 0), 0);
  const city = pick(environment?.city, environmentAssessment?.city, project?.city, "-");
  const psh = pick(solarDesign?.system?.psh, environment?.peakSunHours, environment?.psh, environmentAssessment?.peakSunHours, environmentAssessment?.psh, "-");
  const direction = pick(environment?.direction, environment?.azimuthLabel, environmentAssessment?.direction, environmentAssessment?.recommendedDirection, "جنوب");
  const tilt = pick(environment?.tilt, environment?.tiltDeg, environmentAssessment?.tilt, environmentAssessment?.recommendedTiltDeg, "-");
  const envEfficiency = pick(solarDesign?.system?.efficiency ? `${Math.round(solarDesign.system.efficiency * 100)}%` : null, environment?.finalEfficiency, environment?.efficiency, environmentAssessment?.finalEfficiency, systemSettings?.environmentEfficiency, "-");
  const designType = pick(systemSettings?.designModeTitle, systemSettings?.designType, systemSettings?.modeTitle, systemSettings?.mode, emergency ? "برق اضطراری" : "خورشیدی");
  const coreTitle = domain === "emergency" ? "برق اضطراری" : "خورشیدی";
  const methodTitle = selectedMethod?.title || methodSummary?.title || methodKey || "لیست تجهیزات";

  return {
    environment, environmentAssessment, selectedPath, projectPathTitle, methodTitle, coreTitle, designType,
    safetyFactor, autonomyDays, powerAfterFactorW, dailyEnergyWh,
    city, psh, direction, tilt, envEfficiency,
    panel, pvArray, inverter, battery, batteryBank, protection, cables, cableDetails, billOfMaterials,
    panelPowerW, panelVoltage, panelCurrent, panelCount, arrayPowerW,
    inverterCount, mpptEach, dcVoltage,
    batteryVoltage, batteryCurrent, batteryEnergyKWh, batteryCount, batteryTotalKWh, requiredStorageKWh,
  };
}

function buildProtectionRows(ctx) {
  const protection = ctx?.protection || {};
  const cableDetails = ctx?.cableDetails || {};
  const cables = ctx?.cables || {};
  const pv = protection?.pvDc || {};
  const battery = protection?.batteryDc || {};
  const ac = protection?.ac || {};
  const hasBattery = Number(ctx?.batteryCount || 0) > 0;

  const joinSpecs = (...items) => items.filter((item) => item && item !== "-").map((item) => cleanValue(item)).join(" / ") || "ثبت نشده";
  const cableValue = (detail, fallback) => cleanValue(detail?.label || fallback || "ثبت نشده");
  const cableNote = (detail) => {
    if (!detail || !Object.keys(detail).length) return "خروجی مستقیم موتور مرکزی";
    return [
      detail.currentA !== undefined ? `I ${formatMetric(detail.currentA, "A", 2)}` : null,
      detail.lengthM !== undefined ? `L ${formatMetric(detail.lengthM, "M", 2)}` : null,
      detail.voltageDropPercent !== undefined ? `ΔV ${formatMetric(detail.voltageDropPercent, "%", 2)}` : null,
    ].filter(Boolean).join(" / ");
  };

  return [
    {
      label: "حفاظت PV / DC",
      value: joinSpecs(pv.breaker, pv.fuse, pv.spd, pv.isolator),
      note: `${formatMetric(pv.designVoltageV, "VDC", 2)} / ${formatMetric(pv.currentA, "A", 2)}`,
    },
    hasBattery ? {
      label: "حفاظت باتری",
      value: joinSpecs(battery.fuse, battery.isolator),
      note: `${formatMetric(battery.designVoltageV, "VDC", 2)} / ${formatMetric(battery.currentA, "A", 2)}`,
    } : {
      label: "حفاظت باتری",
      value: "در این طراحی باتری الزامی نیست",
      note: "بر اساس نتیجه موتور مرکزی",
    },
    {
      label: "حفاظت AC",
      value: joinSpecs(ac.breaker, ac.spd, ac.poles),
      note: `${formatMetric(ac.designVoltageV, "VAC", 2)} / ${formatMetric(ac.currentA, "A", 2)}`,
    },
    { label: "کابل PV / DC", value: cableValue(cableDetails.pv, cables.pv), note: cableNote(cableDetails.pv) },
    { label: "کابل باتری", value: hasBattery ? cableValue(cableDetails.battery, cables.battery) : "در این طراحی باتری الزامی نیست", note: hasBattery ? cableNote(cableDetails.battery) : "-" },
    { label: "کابل AC", value: cableValue(cableDetails.ac, cables.ac), note: cableNote(cableDetails.ac) },
  ];
}

function SubsystemProtectionTable({ ctx }) {
  const inverterCount = Math.max(1, Number(ctx.inverterCount) || 1);
  const mpptEach = Math.max(1, Number(ctx.mpptEach) || 1);
  const panelCount = Number(ctx.panelCount) || 0;
  const perInverterPanels = inverterCount ? Math.ceil(panelCount / inverterCount) : panelCount;
  const perMpptPanels = Math.max(1, Math.ceil((perInverterPanels || 1) / mpptEach));
  const dcBreaker = safeText(ctx?.protection?.pvDc?.breakerA || ctx?.protection?.pvDc?.currentA, "-");
  const acBreaker = safeText(ctx?.protection?.ac?.breakerA || ctx?.protection?.ac?.currentA, "-");
  const dcCable = safeText(ctx?.protection?.pvDc?.cable || ctx?.protection?.dcCable, "PV Cable");
  const acCable = safeText(ctx?.protection?.ac?.cable || ctx?.protection?.acCable, "AC Cable");
  const batteryCable = safeText(ctx?.protection?.batteryDc?.cable || ctx?.protection?.batteryCable, "Battery Cable");

  return (
    <div className="shil-inverter-accordion-list">
      {Array.from({ length: inverterCount }).map((_, inverterIndex) => (
        <details className="shil-inverter-accordion" key={`inv-${inverterIndex}`}>
          <summary>
            <span className="shil-inverter-accordion-title">{`اینورتر ${inverterIndex + 1}`}</span>
            <span className="shil-inverter-accordion-meta">{`${perInverterPanels} پنل · ${mpptEach} MPPT`}</span>
            <span className="shil-inverter-accordion-arrow" aria-hidden="true">⌄</span>
          </summary>

          <div className="shil-inverter-accordion-body">
            <div className="shil-inverter-mini-grid">
              <div><span>پنل تخصیص‌یافته</span><strong>{perInverterPanels} عدد</strong></div>
              <div><span>تعداد MPPT</span><strong>{mpptEach} کانال</strong></div>
              <div><span>حفاظت AC</span><strong>{acBreaker} A</strong></div>
              <div><span>کابل خروجی</span><strong>{acCable}</strong></div>
              <div><span>کابل باتری</span><strong>{batteryCable}</strong></div>
              <div><span>فضای نگهداری</span><strong>مستقل</strong></div>
            </div>

            <div className="shil-mppt-compact-list">
              {Array.from({ length: mpptEach }).map((__, mpptIndex) => (
                <div className="shil-mppt-compact-row" key={`inv-${inverterIndex}-mppt-${mpptIndex}`}>
                  <strong>{`MPPT ${mpptIndex + 1}`}</strong>
                  <span>{`${perMpptPanels} پنل سری`}</span>
                  <span>{`MCB DC ${dcBreaker} A`}</span>
                  <span>{dcCable}</span>
                </div>
              ))}
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}

function panelLayoutNote(ctx) {
  const panelCount = Number(ctx.panelCount) || 0;
  const inverterCount = Math.max(1, Number(ctx.inverterCount) || 1);
  const mpptEach = Math.max(1, Number(ctx.mpptEach) || 1);
  const branchCount = inverterCount * mpptEach;
  const panelsPerBranch = branchCount ? Math.ceil(panelCount / branchCount) : panelCount;
  return `آرایش پایه پنل‌ها به صورت سری در هر MPPT در نظر گرفته شده است. ${panelCount} پنل بین ${inverterCount} اینورتر و ${branchCount} شاخه MPPT تقسیم می‌شود؛ حدود ${panelsPerBranch} پنل برای هر شاخه. موازی فقط در صورت نیاز به افزایش توان پس از رسیدن به بازه ولتاژ MPPT استفاده می‌شود.`;
}

export default function RunCalculation() {
  const [resultsOpen, setResultsOpen] = React.useState(false);
  const [finalOutputOpen, setFinalOutputOpen] = React.useState(false);

  const { domain = "solar" } = useParams();
  const emergency = domain === "emergency";
  const [exporting, setExporting] = useState("");
  const exportSheetRef = useRef(null);
  const coreRun = useMemo(() => runCore(domain), [domain]);
  const result = coreRun.result;
  const project = {
    ...readDraft("shil:projectDraft", {}),
    ...readDraft("shil:projectInfo", {}),
    ...readDraft("shil:projectInfoDraft", {}),
  };
  const summary = readDraft("shil:summaryDraft", {});
  const centralState = getProjectDesignState();
  const solarDesign = centralState?.design || readDraft("shil:solarSystemDesign", summary?.solarDesign || {});
  const solarPanelPowerInput = readDraft("shil:solarPanelPowerInput", {});
  const loadResult = readDraft("shil:loadEngineResult", {});
  const systemSettings = readDraft("shil:systemSettingsDraft", {});
  const selectedEquipment = readDraft("shil:selectedEquipments", []);
  const calculationInput = readCalculationInput();
  const methodKey = getActiveMethodKey({ domain });
  const aiPreview = readDraft("shil:aiInstallationPreview", null);
  const projectTitle = project.projectName || project.name || (emergency ? "پروژه برق اضطراری" : "پروژه خورشیدی");
  const delivery = useMemo(
    () => buildFinalEngineeringDelivery({ domain, project, summary, result, solarDesign, aiPreview }),
    [domain, project, summary, result, solarDesign, aiPreview]
  );

  const methodSummary = buildMethodSummary({
    domain,
    methodKey,
    result,
    loadResult,
    systemSettings,
    solarDesign,
    solarPanelPowerInput,
    selectedEquipment,
    calculationInput,
  });

  const diagnostics = solarDesign?.diagnostics || result?.diagnostics || null;
  const importantNotes = safeList(result?.explanations || solarDesign?.explanations || delivery.notes || ["محاسبات بر اساس داده‌های ثبت‌شده پروژه انجام شد."]).slice(0, 3);
  const warnings = safeList(result?.warnings || delivery.warnings || []).slice(0, 4);

  const runContext = buildExecutionContext({
    domain,
    project,
    summary,
    result,
    solarDesign,
    systemSettings,
    methodSummary,
    methodKey,
    calculationInput,
    emergency,
  });

  const projectInfoRows = emergency ? [
    { label: "مسیر انتخاب شده", value: runContext.projectPathTitle },
    { label: "نام پروژه", value: project.projectName || project.name || projectTitle },
    { label: "نام کارفرما", value: project.clientName || project.customerName || project.employerName || "SHIL CO" },
    { label: "تاریخ ثبت", value: project.registrationDate || project.date || project.createdAt || "-" },
    { label: "روش ورود اطلاعات", value: runContext.methodTitle },
    { label: "هسته محاسبات", value: runContext.coreTitle },
    { label: "مدل طراحی", value: runContext.designType },
    { label: "توان بار ضروری", value: `${runContext.loadPowerW} W` },
    { label: "توان پیک / راه‌اندازی", value: `${runContext.surgePowerW} W` },
    { label: "خروجی AC", value: runContext.phaseAC === "three" ? `${formatMetric(runContext.voltageAC, "V", 2)} سه‌فاز` : `${formatMetric(runContext.voltageAC, "V", 2)} تک‌فاز` },
    { label: "مدت پشتیبانی هدف", value: `${runContext.backupHours} ساعت` },
    { label: "ضریب اطمینان اینورتر", value: runContext.reserveFactor },
    { label: "عمق دشارژ مجاز", value: `${runContext.dodPercent}%` },
    { label: "وضعیت طراحی", value: runContext.valid ? "قابل اجرا" : "نیازمند بازبینی" },
  ] : [
    { label: "مسیر انتخاب شده", value: runContext.projectPathTitle },
    { label: "نام پروژه", value: project.projectName || project.name || projectTitle },
    { label: "نام کارفرما", value: project.clientName || project.customerName || project.employerName || "SHIL CO" },
    { label: "تاریخ ثبت", value: project.registrationDate || project.date || project.createdAt || "-" },
    { label: "شهر مبنا", value: runContext.city },
    { label: "PSH", value: runContext.psh },
    { label: "جهت پیشنهادی", value: runContext.direction },
    { label: "زاویه پیشنهادی پنل", value: runContext.tilt },
    { label: "راندمان نهایی محیطی", value: runContext.envEfficiency },
    { label: "روش طراحی", value: runContext.methodTitle },
    { label: "هسته طراحی", value: runContext.coreTitle },
    { label: "ضریب اطمینان استاندارد", value: runContext.safetyFactor },
    { label: "توان کل پس از ضریب", value: `${runContext.powerAfterFactorW} W` },
    { label: "انرژی روزانه پس از ضریب", value: `${runContext.dailyEnergyWh} WH` },
    { label: "نوع طراحی", value: runContext.designType },
  ];

  const projectEquipmentRows = emergency ? [
    { label: "اینورتر برق اضطراری", value: runContext.inverter?.title || runContext.inverter?.model || runContext.inverter?.name || "ثبت نشده" },
    { label: "تعداد اینورتر", value: `${runContext.inverterCount} عدد` },
    { label: "توان طراحی اینورتر", value: `${runContext.inverterDesignPowerW} W` },
    { label: "توان نامی اینورتر", value: `${runContext.inverterRatedPowerW} W` },
    { label: "باس DC باتری", value: `${runContext.dcVoltage} V` },
    { label: "باتری انتخابی", value: runContext.battery?.title || runContext.battery?.model || runContext.battery?.name || "ثبت نشده" },
    { label: "مشخصات هر باتری", value: `${runContext.batteryVoltage} V / ${runContext.batteryCurrent} AH / ${runContext.batteryEnergyKWh} KWH` },
    { label: "آرایش بانک باتری", value: `${runContext.batterySeriesCount} سری × ${runContext.batteryParallelCount} موازی` },
    { label: "تعداد کل باتری", value: `${runContext.batteryCount} عدد` },
    { label: "انرژی خام مورد نیاز", value: `${runContext.requiredStorageKWh} KWH` },
    { label: "انرژی قابل استفاده بانک", value: `${runContext.batteryTotalKWh} KWH` },
    { label: "زمان پشتیبانی واقعی", value: `${runContext.runtimeHours} ساعت` },
  ] : [
    { label: "اینورتر خورشیدی", value: runContext.inverter?.title || runContext.inverter?.name || "ثبت نشده" },
    { label: "تعداد اینورتر خورشیدی", value: `${runContext.inverterCount} عدد` },
    { label: "تعداد MPPT هر یک از اینورترها", value: `${runContext.mpptEach} عدد` },
    { label: "ولتاژ DC اینورتر", value: `${runContext.dcVoltage} V` },
    { label: "پنل انتخابی", value: runContext.panel?.title || runContext.panel?.name || `${runContext.panelPowerW} W` },
    { label: "ولتاژ و جریان پنل", value: `${runContext.panelVoltage} V / ${runContext.panelCurrent} A` },
    { label: "تعداد پنل", value: `${runContext.panelCount} عدد` },
    { label: "توان آرایه پنل", value: `${runContext.arrayPowerW} W` },
    { label: "باتری انتخابی", value: runContext.batteryBank?.title || runContext.batteryBank?.name || "ثبت نشده" },
    { label: "ولتاژ / جریان / انرژی هر باتری", value: `${runContext.batteryVoltage} V / ${runContext.batteryCurrent} AH / ${runContext.batteryEnergyKWh} KWH` },
    { label: "تعداد باتری", value: `${runContext.batteryCount} عدد` },
    { label: "مجموع انرژی بانک باتری", value: `${runContext.batteryTotalKWh} KWH` },
    { label: "ظرفیت ذخیره‌سازی مورد نیاز برای روزهای خودکفایی", value: `${runContext.requiredStorageKWh} KWH` },
  ];

  const protectionRows = emergency ? (() => {
    const p = runContext.protection || {};
    const dcBreaker = pick(p.dcBreaker, p.dcBreakerA, p.batteryDc?.breakerA, p.batteryDc?.currentA, "-");
    const dcVoltage = pick(p.dcVoltage, p.batteryDc?.designVoltageV, runContext.dcVoltage, "-");
    const acBreaker = pick(p.acBreaker, p.acBreakerA, p.ac?.breakerA, p.ac?.currentA, "-");
    const acVoltage = pick(p.acVoltage, p.ac?.designVoltageV, runContext.voltageAC, "-");
    const dcCable = pick(p.dcCable, p.dcCableMm2, p.batteryDc?.cableMm2, "-");
    const acCable = pick(p.acCable, p.acCableMm2, p.ac?.cableMm2, "-");
    const effectiveLength = pick(p.effectiveLength, p.effectiveLengthM, runContext?.protection?.effectiveLengthM, "-");
    const dcCurrent = pick(p.dcCurrent, p.dcCurrentA, p.batteryDc?.designCurrentA, "-");
    const acCurrent = pick(p.acCurrent, p.acCurrentA, p.ac?.designCurrentA, "-");
    return [
      { label: "حفاظت DC باتری", value: `${formatMetric(dcBreaker, "A", 2)} / ${formatMetric(dcVoltage, "VDC", 2)}`, note: `جریان طراحی ${formatMetric(dcCurrent, "A", 2)}` },
      { label: "حفاظت خروجی AC", value: `${formatMetric(acBreaker, "A", 2)} / ${formatMetric(acVoltage, "VAC", 2)}`, note: `جریان طراحی ${formatMetric(acCurrent, "A", 2)}` },
      { label: "کابل باتری", value: formatMetric(dcCable, "MM²", 2), note: "کابل مسی مسیر بانک باتری تا اینورتر" },
      { label: "کابل خروجی AC", value: formatMetric(acCable, "MM²", 2), note: "کابل مسی خروجی اینورتر تا بارهای ضروری" },
      { label: "طول مؤثر کابل", value: formatMetric(effectiveLength, "M", 2), note: "شامل ضریب افزایش متراژ ثبت‌شده" },
      { label: "الزامات ایمنی", value: "ارت، هم‌بندی و بای‌پس تعمیراتی", note: "قدرت قطع تجهیزات مطابق جریان اتصال کوتاه محل نصب" },
    ];
  })() : buildProtectionRows(runContext);
  const nativeProjectRows = emergency ? [
    { label: "نام پروژه", value: project.projectName || project.name || projectTitle, ltr: false },
    { label: "کارفرما", value: project.clientName || project.customerName || project.employerName || "ثبت نشده", ltr: false },
    { label: "مسیر طراحی", value: runContext.projectPathTitle, ltr: false },
    { label: "روش طراحی", value: runContext.methodTitle, ltr: false },
  ] : [
    { label: "نام پروژه", value: project.projectName || project.name || projectTitle, ltr: false },
    { label: "کارفرما", value: project.clientName || project.customerName || project.employerName || "ثبت نشده", ltr: false },
    { label: "شهر مبنا", value: runContext.city, ltr: false },
    { label: "روش طراحی", value: runContext.methodTitle, ltr: false },
  ];

  const nativeSummaryRows = emergency ? [
    { label: "توان بار ضروری", value: formatMetric(runContext.loadPowerW, "W", 2) },
    { label: "پیک راه‌اندازی", value: formatMetric(runContext.surgePowerW, "W", 2) },
    { label: "پشتیبانی هدف", value: formatMetric(runContext.backupHours, "H", 2) },
    { label: "پشتیبانی واقعی", value: formatMetric(runContext.runtimeHours, "H", 2) },
    { label: "ضریب اطمینان اینورتر", value: formatNumber(runContext.reserveFactor, 2) },
    { label: "عمق دشارژ مجاز", value: formatPercent(runContext.dodPercent, 1) },
    { label: "خروجی AC", value: `${formatMetric(runContext.voltageAC, "V", 2)} ${runContext.phaseAC === "three" ? "سه‌فاز" : "تک‌فاز"}`, ltr: false },
    { label: "انرژی خام موردنیاز", value: formatMetric(runContext.requiredStorageKWh, "KWH", 2) },
  ] : [
    { label: "توان طراحی نهایی", value: formatMetric(runContext.powerAfterFactorW, "W", 2) },
    { label: "انرژی روزانه", value: formatMetric(Number(runContext.dailyEnergyWh || 0) / 1000, "KWH", 2) },
    { label: "PSH", value: formatMetric(runContext.psh, "H", 2) },
    { label: "راندمان محیطی", value: String(runContext.envEfficiency).includes("%") ? formatPercent(runContext.envEfficiency, 1) : cleanValue(runContext.envEfficiency) },
    { label: "جهت پیشنهادی", value: runContext.direction, ltr: false },
    { label: "زاویه پنل", value: formatMetric(runContext.tilt, "DEG", 1) },
    { label: "ضریب اطمینان", value: formatNumber(runContext.safetyFactor, 2) },
    { label: "نوع طراحی", value: runContext.designType, ltr: false },
  ];

  const nativeEquipmentRows = emergency ? [
    { label: "اینورتر برق اضطراری", value: cleanValue(runContext.inverter?.title || runContext.inverter?.model || runContext.inverter?.name || "ثبت نشده"), note: `${formatNumber(runContext.inverterCount, 0)} عدد / ${formatMetric(runContext.inverterRatedPowerW, "W", 2)} / ${formatMetric(runContext.dcVoltage, "VDC", 2)}` },
    { label: "بانک باتری", value: cleanValue(runContext.battery?.title || runContext.battery?.model || runContext.battery?.name || "ثبت نشده"), note: `${formatNumber(runContext.batteryCount, 0)} عدد / ${formatNumber(runContext.batterySeriesCount, 0)} سری × ${formatNumber(runContext.batteryParallelCount, 0)} موازی / ${formatMetric(runContext.batteryTotalKWh, "KWH", 2)}` },
  ] : [
    { label: "اینورتر خورشیدی", value: cleanValue(runContext.inverter?.title || runContext.inverter?.model || runContext.inverter?.name || "ثبت نشده"), note: `${formatNumber(runContext.inverterCount, 0)} عدد / ${formatNumber(runContext.mpptEach, 0)} MPPT` },
    { label: "پنل خورشیدی", value: cleanValue(runContext.panel?.title || runContext.panel?.model || runContext.panel?.name || formatMetric(runContext.panelPowerW, "W", 0)), note: `${formatNumber(runContext.panelCount, 0)} عدد / آرایه ${formatMetric(runContext.arrayPowerW, "W", 2)}` },
    { label: "بانک باتری", value: cleanValue(runContext.batteryBank?.title || runContext.batteryBank?.model || runContext.batteryBank?.name || (Number(runContext.batteryCount) ? "باتری انتخاب‌شده" : "بدون باتری")), note: Number(runContext.batteryCount) ? `${formatNumber(runContext.batteryCount, 0)} عدد / ${formatMetric(runContext.batteryTotalKWh, "KWH", 2)}` : "در این طراحی ذخیره‌ساز الزامی نیست" },
  ];

  const finalizationRef = useRef(false);

  useEffect(() => {
    if (finalizationRef.current) return;
    finalizationRef.current = true;

    approveProjectStep("run");
    const savedAt = new Date().toISOString();
    const payload = { domain, project, summary, result, aiPreview, savedAt };
    localStorage.setItem("shil:finalEngineeringOutput", JSON.stringify(payload));
    markCurrentProjectFinal({ result, aiPreview, savedAt });
    window.dispatchEvent(new CustomEvent("shil-workflow-updated"));
  }, [domain, project, summary, result, aiPreview]);

  async function exportPdf() {
    try {
      setExporting("pdf");
      await exportElementAsPdf(exportSheetRef.current, delivery, `${projectTitle || "shil"}-one-page-summary.pdf`);
      showUxToast("PDF خلاصه یک‌صفحه‌ای ذخیره شد", "success");
    } catch {
      showUxToast("خروجی PDF با خطا روبه‌رو شد", "warning");
    } finally {
      setExporting("");
    }
  }

  async function shareProject() {
    try {
      setExporting("share");
      await shareElementAsPdf(exportSheetRef.current, delivery, `${projectTitle || "shil"}-one-page-summary.pdf`);
      showUxToast("فایل PDF نهایی برای اشتراک آماده شد", "success");
    } catch {
      showUxToast("اشتراک‌گذاری PDF انجام نشد", "warning");
    } finally {
      setExporting("");
    }
  }

  async function saveProjectImage() {
    try {
      setExporting("png");
      await exportElementAsPng(exportSheetRef.current, `${projectTitle || "shil"}-one-page-summary.png`);
      showUxToast("تصویر خلاصه یک‌صفحه‌ای ذخیره شد", "success");
    } catch {
      showUxToast("ذخیره تصویر انجام نشد", "warning");
    } finally {
      setExporting("");
    }
  }

  return (
    <EngineeringPageShell title="اجرا و خروجی نهایی">
      <section id="shil-execution-output-root" className={`shil-final-delivery-page shil-final-delivery-compact shil-execution-output-page ${emergency ? "shil-emergency-run-output" : ""}`}>
        <NativeSection index="01" title="مشخصات پروژه">
          <NativeMetricGrid rows={nativeProjectRows} />
        </NativeSection>

        <NativeSection index="02" title="چکیده محاسبات">
          <NativeMetricGrid rows={nativeSummaryRows} />
        </NativeSection>

        <NativeSection index="03" title="تجهیزات نهایی پروژه">
          <NativeDataTable rows={nativeEquipmentRows} />
        </NativeSection>

        <NativeSection index="04" title="حفاظت و الزامات اجرا">
          <NativeDataTable rows={protectionRows} />
        </NativeSection>

        <div className="shil-a4-preview-frame shil-a4-export-source" aria-hidden="true">
          <div className="shil-final-one-page-sheet shil-a4-final-form" ref={exportSheetRef} dir="rtl">
            <header className="shil-a4-header">
              <img className="shil-a4-main-logo" src={shilMainLogo} alt="SHIL Iran" />
              <h1>چکیده طراحی نهایی پروژه</h1>
            </header>

            <section className="shil-a4-section">
              <div className="shil-a4-section-title"><span>01</span><h3>مشخصات پروژه</h3></div>
              <div className="shil-a4-fields shil-a4-fields-project">
                <div><span>نام پروژه</span><b>{project.projectName || project.name || projectTitle}</b></div>
                <div><span>کارفرما</span><b>{project.clientName || project.customerName || project.employerName || "ثبت نشده"}</b></div>
                <div><span>تاریخ ثبت</span><b>{cleanValue(project.registrationDate || project.date || project.createdAt || "-")}</b></div>
                <div><span>مسیر طراحی</span><b>{runContext.projectPathTitle}</b></div>
                {!emergency ? <div><span>شهر مبنا</span><b>{runContext.city}</b></div> : <div><span>روش ورود اطلاعات</span><b>{runContext.methodTitle}</b></div>}
                <div><span>روش طراحی</span><b>{runContext.methodTitle}</b></div>
              </div>
            </section>

            <section className="shil-a4-section">
              <div className="shil-a4-section-title"><span>02</span><h3>چکیده محاسبات</h3></div>
              <div className="shil-a4-fields shil-a4-fields-design">
                {emergency ? (<>
                  <div><span>توان بار ضروری</span><b>{formatMetric(runContext.loadPowerW, "W", 2)}</b></div>
                  <div><span>پیک راه‌اندازی</span><b>{formatMetric(runContext.surgePowerW, "W", 2)}</b></div>
                  <div><span>پشتیبانی هدف</span><b>{formatMetric(runContext.backupHours, "H", 2)}</b></div>
                  <div><span>پشتیبانی واقعی</span><b>{formatMetric(runContext.runtimeHours, "H", 2)}</b></div>
                  <div><span>ضریب اطمینان اینورتر</span><b>{formatNumber(runContext.reserveFactor, 2)}</b></div>
                  <div><span>عمق دشارژ مجاز</span><b>{formatPercent(runContext.dodPercent, 1)}</b></div>
                  <div><span>خروجی AC</span><b>{runContext.phaseAC === "three" ? `${formatMetric(runContext.voltageAC, "V", 2)} سه‌فاز` : `${formatMetric(runContext.voltageAC, "V", 2)} تک‌فاز`}</b></div>
                  <div><span>انرژی خام موردنیاز</span><b>{formatMetric(runContext.requiredStorageKWh, "KWH", 2)}</b></div>
                </>) : (<>
                  <div><span>توان طراحی نهایی</span><b>{formatMetric(runContext.powerAfterFactorW, "W", 2)}</b></div>
                  <div><span>انرژی روزانه</span><b>{formatMetric(Number(runContext.dailyEnergyWh || 0) / 1000, "KWH", 2)}</b></div>
                  <div><span>PSH</span><b>{formatMetric(runContext.psh, "H", 2)}</b></div>
                  <div><span>راندمان محیطی</span><b>{String(runContext.envEfficiency).includes("%") ? formatPercent(runContext.envEfficiency, 1) : cleanValue(runContext.envEfficiency)}</b></div>
                  <div><span>جهت پیشنهادی</span><b>{runContext.direction}</b></div>
                  <div><span>زاویه پنل</span><b>{formatMetric(runContext.tilt, "DEG", 1)}</b></div>
                  <div><span>ضریب اطمینان</span><b>{formatNumber(runContext.safetyFactor, 2)}</b></div>
                  <div><span>نوع طراحی</span><b>{runContext.designType}</b></div>
                </>)}
              </div>
            </section>

            <section className="shil-a4-section">
              <div className="shil-a4-section-title"><span>03</span><h3>تجهیزات نهایی پروژه</h3></div>
              <div className="shil-a4-table">
                <div className="shil-a4-table-head"><span>تجهیز</span><span>مدل / مشخصات نهایی</span><span>تعداد / آرایش</span></div>
                {emergency ? (<>
                  <div><span>اینورتر برق اضطراری</span><b>{cleanValue(runContext.inverter?.title || runContext.inverter?.model || runContext.inverter?.name || "ثبت نشده")}</b><small>{cleanValue(`${runContext.inverterCount} عدد / ${runContext.inverterRatedPowerW} W / ${runContext.dcVoltage} VDC`)}</small></div>
                  <div><span>بانک باتری</span><b>{cleanValue(runContext.battery?.title || runContext.battery?.model || runContext.battery?.name || "ثبت نشده")}</b><small>{cleanValue(`${runContext.batteryCount} عدد / ${runContext.batterySeriesCount} سری × ${runContext.batteryParallelCount} موازی / ${runContext.batteryTotalKWh} KWH`)}</small></div>
                </>) : (<>
                  <div><span>اینورتر خورشیدی</span><b>{cleanValue(runContext.inverter?.title || runContext.inverter?.model || runContext.inverter?.name || "ثبت نشده")}</b><small>{cleanValue(`${runContext.inverterCount} عدد / ${runContext.mpptEach} MPPT`)}</small></div>
                  <div><span>پنل خورشیدی</span><b>{cleanValue(runContext.panel?.title || runContext.panel?.model || runContext.panel?.name || `${runContext.panelPowerW} W`)}</b><small>{cleanValue(`${runContext.panelCount} عدد / آرایه ${runContext.arrayPowerW} W`)}</small></div>
                  <div><span>بانک باتری</span><b>{cleanValue(runContext.batteryBank?.title || runContext.batteryBank?.model || runContext.batteryBank?.name || (Number(runContext.batteryCount) ? "باتری انتخاب‌شده" : "بدون باتری"))}</b><small>{Number(runContext.batteryCount) ? cleanValue(`${runContext.batteryCount} عدد / ${runContext.batteryTotalKWh} KWH`) : "در این طراحی ذخیره‌ساز الزامی نیست"}</small></div>
                </>)}
              </div>
            </section>

            <section className="shil-a4-section">
              <div className="shil-a4-section-title"><span>04</span><h3>حفاظت و الزامات اجرا</h3></div>
              <div className="shil-a4-execution-grid">
                {protectionRows.slice(0, 6).map((row, index) => (
                  <div key={`a4-protection-${index}`}><span>{row.label}</span><b>{safeText(row.value)}</b>{row.note ? <small>{safeText(row.note)}</small> : null}</div>
                ))}
              </div>
            </section>


          </div>
        </div>

        <div className="shil-run-data-accordion shil-run-native-accordion">
          <button type="button" className="shil-run-data-accordion-header" onClick={() => setResultsOpen(!resultsOpen)} aria-expanded={resultsOpen}>
            <span>نتایج و هشدارها</span><span aria-hidden="true">{resultsOpen ? "▲" : "▼"}</span>
          </button>
          {resultsOpen ? (
            <div className="shil-run-data-accordion-body">
              {importantNotes.map((item, index) => <div className="shil-run-data-card" key={`run-note-${index}`}>{cleanValue(item)}</div>)}
              {warnings.map((item, index) => <div className="shil-run-data-card shil-run-warning-card" key={`run-warning-${index}`}>{cleanValue(`هشدار: ${item}`)}</div>)}
              {!importantNotes.length && !warnings.length ? <div className="shil-run-data-card">محاسبات نهایی آماده اجرا است.</div> : null}
            </div>
          ) : null}
        </div>

        <div className="shil-run-data-accordion shil-final-output-accordion shil-run-native-accordion">
          <button type="button" className="shil-run-data-accordion-header" onClick={() => setFinalOutputOpen(!finalOutputOpen)} aria-expanded={finalOutputOpen}>
            <span>خروجی نهایی</span><span aria-hidden="true">{finalOutputOpen ? "▲" : "▼"}</span>
          </button>
          {finalOutputOpen ? (
            <div className="shil-run-data-accordion-body shil-output-actions shil-output-actions-three">
              <button className="shil-run-data-card shil-run-action-card" type="button" onClick={saveProjectImage} disabled={Boolean(exporting)}>{exporting === "png" ? "در حال ساخت تصویر..." : "دریافت تصویر"}</button>
              <button className="shil-run-data-card shil-run-action-card" type="button" onClick={exportPdf} disabled={Boolean(exporting)}>{exporting === "pdf" ? "در حال ساخت PDF..." : "دریافت فایل PDF"}</button>
              <button className="shil-run-data-card shil-run-action-card" type="button" onClick={shareProject} disabled={Boolean(exporting)}>{exporting === "share" ? "در حال آماده‌سازی PDF..." : "اشتراک‌گذاری فایل PDF"}</button>
            </div>
          ) : null}
        </div>

        <Link className="shil-soft-link-button" to="/projects/final">مشاهده پروژه‌های نهایی</Link>
      </section>
    </EngineeringPageShell>
  );
}
