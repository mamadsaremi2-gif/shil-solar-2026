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
          explanations: ["خروجی نهایی بر اساس طراحی برق اضطراری، بانک باتری و اینورتر محاسبه شد."],
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
            "تجهیزات، حفاظت و کابل‌های خروجی نهایی بر اساس داده‌های ثبت‌شده پروژه محاسبه شدند.",
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

function firstNonEmptyObject(...items) {
  return items.find((item) => item && typeof item === "object" && !Array.isArray(item) && Object.keys(item).length) || {};
}

function formatNumber(value, maximumFractionDigits = 2, fallback = "-") {
  const normalized = toEnglishDigits(value, fallback).replace(/,/g, "").trim();
  const direct = Number(normalized);
  const extracted = normalized.match(/[-+]?\d*\.?\d+/)?.[0];
  const number = Number.isFinite(direct) ? direct : Number(extracted);
  if (!Number.isFinite(number)) return cleanValue(value, fallback);
  return number.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: Math.min(2, Math.max(0, maximumFractionDigits)),
  });
}

function formatMetric(value, unit, digits = 2, fallback = "-") {
  const number = formatNumber(value, digits, fallback);
  if (number === fallback) return fallback;
  return `\u2066${number} ${String(unit || "").toUpperCase()}\u2069`.trim();
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
          {!row.items?.length && row.note ? <small>{cleanValue(row.note)}</small> : null}
        </article>
      ))}
    </div>
  );
}

function formatProtectionVoltage(selection = {}, item = {}) {
  const raw = selection?.ratedVoltageV ?? selection?.ucV ?? selection?.systemVoltageV ?? selection?.requiredVoltageV;
  if (raw === undefined || raw === null || raw === "") return "-";
  const values = Array.isArray(raw) ? raw : [raw];
  const sideText = `${selection?.deviceType || ""} ${selection?.side || ""} ${item?.label || ""}`.toUpperCase();
  const unit = sideText.includes("AC") && !sideText.includes("DC") ? "VAC" : "VDC";
  const prefix = selection?.bankMatched === false && selection?.ratedVoltageV == null && selection?.ucV == null ? "≥ " : "";
  return `${prefix}${values.map((value) => formatNumber(value, 0)).join("/")} ${unit}`;
}

function formatProtectionBreaking(selection = {}) {
  const raw = selection?.breakingCapacityKA;
  if (raw === undefined || raw === null || raw === "") return "-";
  if (typeof raw === "number") return `${formatNumber(raw, 2)} kA`;
  const values = Object.entries(raw || {}).map(([key, value]) => {
    const voltage = String(key).replace(/\D/g, "");
    return Number.isFinite(Number(value)) ? `${formatNumber(value, 2)} kA @ ${voltage || "DC"} V` : null;
  }).filter(Boolean);
  return values.join(" / ") || "-";
}

function extractProtectionSummary(item = {}) {
  const selection = item?.selection || {};
  const value = cleanValue(item.value, "");
  const meta = cleanValue(item.meta, "");
  const selectedAmp = Number(selection?.ratedCurrentA);
  const ampValue = Number.isFinite(selectedAmp) && selectedAmp > 0
    ? formatNumber(selectedAmp, 2)
    : value.match(/(?:^|\s)(\d+(?:\.\d+)?)\s*A\b/i)?.[1]
      || meta.match(/(?:^|\s)(\d+(?:\.\d+)?)\s*A\b/i)?.[1];
  const residualMA = selection?.sensitivityMA
    || value.match(/(\d+(?:\.\d+)?)\s*mA\b/i)?.[1]
    || meta.match(/(\d+(?:\.\d+)?)\s*mA\b/i)?.[1];
  const spdType = selection?.spdType
    || value.match(/Type\s*(I\+II|I{1,2})/i)?.[1]
    || meta.match(/Type\s*(I\+II|I{1,2})/i)?.[1];
  const amp = ampValue && residualMA
    ? `${ampValue} A / ${formatNumber(residualMA, 0)} mA`
    : ampValue ? `${ampValue} A`
      : residualMA ? `${formatNumber(residualMA, 0)} mA`
        : spdType ? `Type ${spdType}` : "-";
  const poles = cleanValue(selection?.polesRequired || "", "")
    || meta.match(/(?:^|[·/\s])(1P\+N|3P\+N|[1-4]P)(?:$|[·/\s])/i)?.[1]
    || value.match(/(?:^|[·/\s])(1P\+N|3P\+N|[1-4]P)(?:$|[·/\s])/i)?.[1]
    || "-";
  const qty = selection?.quantity
    || meta.match(/(\d+)\s*عدد/)?.[1]
    || item.quantity
    || "1";
  const voltage = formatProtectionVoltage(selection, item);
  const deviceType = cleanValue(selection?.deviceType || item?.deviceType || "", "") || cleanValue(item?.label, "تجهیز حفاظتی");
  return { amp, poles, qty: `×${qty}`, voltage, deviceType };
}

function EngineeringItems({ items = [], compact = false }) {
  const visible = items.filter((item) => item && (item.value || item.label));
  if (!visible.length) return null;
  return (
    <div className={compact ? "shil-engineering-items shil-engineering-items-compact" : "shil-engineering-items"}>
      {visible.map((item, index) => {
        const selection = item?.selection || {};
        const summary = extractProtectionSummary(item);
        const designCurrent = Number(selection?.designCurrentA);
        const operatingCurrent = Number(selection?.operatingCurrentA);
        const ratedCurrent = Number(selection?.ratedCurrentA);
        const bankMatched = selection?.bankMatched;
        const exactReason = cleanValue(selection?.selectionReason || item?.reason || "", "");
        const exactTitle = cleanValue(item.value || selection?.label, item.label || "تجهیز حفاظتی");
        const catalogFamily = cleanValue(selection?.catalogFamilyTitle || "", "");
        const standard = cleanValue(selection?.standard || item?.standard || "", "");
        const breaking = formatProtectionBreaking(selection);
        const deviceVoltage = formatProtectionVoltage(selection, item);
        const currentRange = Array.isArray(selection?.ratedCurrentRangeA) && selection.ratedCurrentRangeA.length >= 2
          ? `${formatNumber(selection.ratedCurrentRangeA[0], 0)}–${formatNumber(selection.ratedCurrentRangeA[1], 0)} A`
          : "";
        if (compact) {
          return (
            <div className="shil-engineering-item shil-engineering-item-print" key={`${item.label || "item"}-${index}`}>
              <span>{cleanValue(item.label, "تجهیز")}</span>
              <b dir="ltr">{summary.amp}</b>
              <b dir="ltr">{summary.voltage}</b>
              <b dir="auto">{summary.poles}</b>
              <b dir="ltr">{summary.qty}</b>
            </div>
          );
        }
        return (
          <details className="shil-protection-device" key={`${item.label || "item"}-${index}`}>
            <summary className="shil-protection-device-summary">
              <strong>{cleanValue(item.label, "تجهیز حفاظتی")}</strong>
              <span className="shil-protection-quick" dir="ltr">
                <b>{summary.amp}</b><b>{summary.voltage}</b><b>{summary.qty}</b>
              </span>
              <i aria-hidden="true">⌄</i>
            </summary>
            <div className="shil-protection-detail-wrap">
              <table className="shil-protection-detail-table">
                <tbody>
                  <tr><th>انتخاب اجرایی</th><td dir="auto"><strong>{exactTitle}</strong></td></tr>
                  <tr><th>نوع تجهیز</th><td dir="ltr">{summary.deviceType}</td></tr>
                  <tr><th>جریان نامی انتخابی</th><td dir="ltr">{summary.amp}</td></tr>
                  <tr><th>ولتاژ نامی تجهیز</th><td dir="ltr">{deviceVoltage}</td></tr>
                  {selection?.requiredVoltageV ? <tr><th>حداقل ولتاژ موردنیاز مدار</th><td dir="ltr">≥ {formatMetric(selection.requiredVoltageV, String(item?.label || "").includes("AC") ? "VAC" : "VDC", 2)}</td></tr> : null}
                  <tr><th>تعداد پل / آرایش</th><td dir="auto">{summary.poles}</td></tr>
                  <tr><th>تعداد</th><td dir="ltr">{summary.qty}</td></tr>
                  {Number.isFinite(operatingCurrent) && operatingCurrent > 0 ? <tr><th>جریان کار محاسبه‌شده</th><td dir="ltr">{formatMetric(operatingCurrent, "A", 2)}</td></tr> : null}
                  {Number.isFinite(designCurrent) && designCurrent > 0 ? <tr><th>جریان طراحی پس از ضریب</th><td dir="ltr">{formatMetric(designCurrent, "A", 2)}</td></tr> : null}
                  {Number.isFinite(ratedCurrent) && ratedCurrent > 0 && Number.isFinite(designCurrent) ? <tr><th>حاشیه انتخاب کلید</th><td dir="ltr">{formatMetric(Math.max(0, ratedCurrent - designCurrent), "A", 2)}</td></tr> : null}
                  {selection?.designFactor ? <tr><th>ضریب طراحی</th><td dir="ltr">×{formatNumber(selection.designFactor, 2)}</td></tr> : null}
                  {selection?.characteristicCurve ? <tr><th>تیپ/منحنی کلید</th><td dir="ltr">Type {selection.characteristicCurve}</td></tr> : null}
                  {selection?.spdType ? <tr><th>کلاس SPD</th><td dir="ltr">Type {selection.spdType}</td></tr> : null}
                  {selection?.ucV ? <tr><th>Uc</th><td dir="ltr">{Array.isArray(selection.ucV) ? selection.ucV.map((v) => `${formatNumber(v, 0)} V`).join(" / ") : `${formatNumber(selection.ucV, 0)} V`}</td></tr> : null}
                  {selection?.inKA ? <tr><th>In</th><td dir="ltr">{formatMetric(selection.inKA, "kA", 2)}</td></tr> : null}
                  {selection?.imaxKA ? <tr><th>Imax</th><td dir="ltr">{formatMetric(selection.imaxKA, "kA", 2)}</td></tr> : null}
                  {selection?.iimpKA ? <tr><th>Iimp</th><td dir="ltr">{formatMetric(selection.iimpKA, "kA", 2)}</td></tr> : null}
                  {selection?.upKV ? <tr><th>Up</th><td dir="ltr">{formatMetric(selection.upKV, "kV", 2)}</td></tr> : null}
                  {breaking !== "-" ? <tr><th>قدرت قطع کاتالوگی</th><td dir="ltr">{breaking}</td></tr> : null}
                  {selection?.requiredBreakingCapacityKA ? <tr><th>قدرت قطع موردنیاز سایت</th><td dir="ltr">{formatMetric(selection.requiredBreakingCapacityKA, "kA", 2)}</td></tr> : null}
                  {selection?.sensitivityMA ? <tr><th>حساسیت نشتی</th><td dir="ltr">{formatMetric(selection.sensitivityMA, "mA", 0)}</td></tr> : null}
                  {selection?.rcdType ? <tr><th>نوع حفاظت نشتی</th><td dir="ltr">Type {selection.rcdType}</td></tr> : null}
                  {standard ? <tr><th>استاندارد مبنا</th><td dir="ltr">{standard}</td></tr> : null}
                  {catalogFamily ? <tr><th>خانواده تجهیز بانک SHIL</th><td dir="auto">{catalogFamily}</td></tr> : null}
                  {currentRange ? <tr><th>بازه خانواده کاتالوگی</th><td dir="ltr">{currentRange}</td></tr> : null}
                  <tr><th>وضعیت تطبیق بانک</th><td>{bankMatched === false ? "ریتینگ محاسبه شده؛ تطبیق مدل کاتالوگی نهایی لازم است" : "تطبیق با بانک SHIL انجام شده"}</td></tr>
                  {exactReason ? <tr><th>چرا این ریتینگ انتخاب شد؟</th><td dir="auto">{exactReason}</td></tr> : null}
                  {selection?.reason ? <tr><th>دلیل انتخاب حفاظتی</th><td dir="auto">{cleanValue(selection.reason)}</td></tr> : null}
                  {item.meta ? <tr><th>مشخصات تکمیلی</th><td dir="auto">{cleanValue(item.meta)}</td></tr> : null}
                </tbody>
              </table>
            </div>
          </details>
        );
      })}
    </div>
  );
}

function NativeDataTable({ rows = [] }) {
  return (
    <div className="shil-run-native-table">
      {rows.filter(Boolean).map((row, index) => (
        <article className={`shil-run-native-table-row ${row.items?.length ? "shil-run-native-table-row-structured" : ""}`.trim()} key={`${row.label}-${index}`}>
          <span>{row.label}</span>
          {row.items?.length ? <EngineeringItems items={row.items} /> : <strong dir="auto" data-engineering-value="true">{cleanValue(row.value)}</strong>}
          {!row.items?.length && row.note ? <small>{cleanValue(row.note)}</small> : null}
        </article>
      ))}
    </div>
  );
}

function UserFacingMessageCard({ text, warning = false }) {
  const message = cleanValue(text);
  const splitAt = message.indexOf(":");
  const title = splitAt > 0 && splitAt < 70 ? message.slice(0, splitAt).trim() : (warning ? "هشدار مهندسی" : "نتیجه محاسبه");
  const body = splitAt > 0 && splitAt < 70 ? message.slice(splitAt + 1).trim() : message;
  return (
    <div className={`shil-run-data-card shil-run-message-card ${warning ? "shil-run-warning-card" : ""}`.trim()}>
      <strong>{warning && !title.startsWith("هشدار") ? `هشدار · ${title}` : title}</strong>
      <span>{body}</span>
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

function protectionCompletenessScore(value = {}) {
  if (!value || typeof value !== "object") return -1;
  const battery = value?.batteryDc || {};
  const ac = value?.ac || {};
  const selections = [battery?.fuseSelection, battery?.breakerSelection, battery?.isolatorSelection, ac?.breakerSelection, ac?.spdSelection, ac?.residualProtection, ac?.changeoverSelection];
  let score = 0;
  if (Number(battery?.currentA || battery?.breakerA || battery?.fuseA) > 0) score += 12;
  if (Number(battery?.designVoltageV) > 0) score += 8;
  if (Number(ac?.currentA || ac?.breakerA) > 0) score += 12;
  if (Number(ac?.designVoltageV) > 0) score += 8;
  if (Number(ac?.changeoverA) > 0) score += 6;
  if (ac?.residualProtection?.sensitivityMA) score += 5;
  if (ac?.spd || ac?.spdSelection) score += 4;
  score += selections.filter((x) => x && typeof x === "object" && (Number(x.ratedCurrentA) > 0 || Number(x.requiredVoltageV) > 0 || x.deviceType)).length * 3;
  if (String(value?.source || "").includes("CANONICAL")) score += 50;
  if (String(value?.source || "").includes("PROTECTION_ENGINE_V4")) score += 30;
  return score;
}

function selectCanonicalProtection(...values) {
  const candidates = values.filter((value) => value && typeof value === "object" && Object.keys(value).length);
  if (!candidates.length) return {};
  return candidates.sort((a, b) => protectionCompletenessScore(b) - protectionCompletenessScore(a))[0];
}

function buildExecutionContext({ domain, project, summary, result, solarDesign, systemSettings, methodSummary, methodKey, calculationInput, emergency }) {
  if (emergency) {
    const design = result?.emergencyDesign || result?.values?.emergencyDesign || systemSettings?.design
      || readDraft("shil:emergencySystemDesign", {}) || readDraft("shil:emergencySystemDesign:live", {});
    const load = design?.load || readDraft("shil:loadEngineResult", {});
    const settings = design?.settings || {};
    const inverter = design?.inverter || {};
    const battery = design?.battery || {};
    // Select the richest/canonical protection object. A stale non-empty result must not hide
    // the newly confirmed emergency design protection stored in local project state.
    const protection = selectCanonicalProtection(design?.protection, result?.protection, result?.values?.protection) || { protections: [], cables: [] };
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
      cables: firstNonEmptyObject(result?.values?.cables, design?.cables, protection?.cables),
      cableDetails: firstNonEmptyObject(result?.values?.cableDetails, design?.cableDetails, protection?.cableDetails),
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
  const unifiedProtection = firstNonEmptyObject(design?.unifiedPvEngine?.protection, solarDesign?.unifiedPvEngine?.protection, result?.unifiedPvEngine?.protection);
  const protection = firstNonEmptyObject(result?.protection, values?.protection, solarDesign?.protection, resultSummary?.protection, design?.protection, unifiedProtection);
  const cables = firstNonEmptyObject(values?.cables, fields?.cables, design?.cables, solarDesign?.cables);
  const cableDetails = firstNonEmptyObject(values?.cableDetails, resultSummary?.cableDetails, design?.cableDetails, solarDesign?.cableDetails);
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
    emergency: false, environment, environmentAssessment, selectedPath, projectPathTitle, methodTitle, coreTitle, designType,
    safetyFactor, autonomyDays, powerAfterFactorW, dailyEnergyWh,
    city, psh, direction, tilt, envEfficiency,
    panel, pvArray, inverter, battery, batteryBank, protection, unifiedProtection, cables, cableDetails, billOfMaterials,
    panelPowerW, panelVoltage, panelCurrent, panelCount, arrayPowerW,
    inverterCount, mpptEach, dcVoltage,
    batteryVoltage, batteryCurrent, batteryEnergyKWh, batteryCount, batteryTotalKWh, requiredStorageKWh,
  };
}

function buildProtectionRows(ctx) {
  const protection = ctx?.protection || {};
  const unified = ctx?.unifiedProtection || {};
  const cableDetails = ctx?.cableDetails || {};
  const cables = ctx?.cables || {};
  const unifiedPvList = Array.isArray(unified?.per_MPPT_protection) ? unified.per_MPPT_protection : [];
  const unifiedPv = unifiedPvList[0] || {};
  const unifiedPvFuseQty = unifiedPvList.reduce((sum, row) => sum + Math.max(0, Number(row?.string_fuses?.count || 0)), 0);
  const unifiedPvDeviceQty = unifiedPvList.length || Math.max(1, Number(ctx?.inverterCount || 1) * Number(ctx?.mpptEach || 1));
  const unifiedBattery = unified?.battery_block || unified?.Battery_DC_block || {};
  const unifiedAc = unified?.AC_output_panel || {};
  const pvNested = protection?.pvDc || {};
  const pv = {
    ...pvNested,
    breaker: pick(
      pvNested?.breakerSelection?.label,
      pvNested?.breaker,
      pvNested?.breakerA ? `${formatMetric(pvNested.breakerA, "A", 2)} ${cleanValue(pvNested?.breakerType, "کلید DC")}` : null,
      protection?.dcBreakerA ? `${formatMetric(protection.dcBreakerA, "A", 2)} MCB DC` : null,
      unifiedPv?.DC_breaker?.current_rating_A ? `${formatMetric(unifiedPv.DC_breaker.current_rating_A, "A", 2)} ${cleanValue(unifiedPv.DC_breaker.type, "MCB DC")}` : null,
      ""
    ),
    fuse: pick(pvNested?.fuseSelection?.label, pvNested?.fuse, unifiedPv?.string_fuses?.current_rating_A ? `${formatMetric(unifiedPv.string_fuses.current_rating_A, "A", 2)} ${cleanValue(unifiedPv.string_fuses.type, "gPV")}` : null, ""),
    spd: pick(pvNested?.spdSelection?.label, pvNested?.spd, unifiedPv?.SPD_DC?.type, ""),
    isolator: pick(pvNested?.isolatorSelection?.label, pvNested?.isolator, unifiedPv?.DC_isolator?.current_rating_A ? `${formatMetric(unifiedPv.DC_isolator.current_rating_A, "A", 2)} ${cleanValue(unifiedPv.DC_isolator.type, "DC Isolator")}` : null, ""),
    designVoltageV: pick(pvNested?.designVoltageV, protection?.dcVoltage, unifiedPv?.DC_breaker?.voltage_rating?.rating, unifiedPv?.DC_breaker?.voltage_rating, unifiedPv?.voltage_level?.rating, ctx?.dcVoltage, "-"),
    currentA: pick(pvNested?.currentA, pvNested?.breakerA, protection?.dcBreakerA, unifiedPv?.PV_cable?.design_current_A, unifiedPv?.DC_breaker?.current_rating_A, "-"),
  };

  const batteryNested = protection?.batteryDc || {};
  const battery = {
    ...batteryNested,
    fuse: pick(batteryNested?.fuseSelection?.label, batteryNested?.fuse, batteryNested?.fuseA ? `${formatMetric(batteryNested.fuseA, "A", 2)} FUSE DC` : null, protection?.batteryFuseA ? `${formatMetric(protection.batteryFuseA, "A", 2)} FUSE DC` : null, unifiedBattery?.fuse_A ? `${formatMetric(unifiedBattery.fuse_A, "A", 2)} ${cleanValue(unifiedBattery.fuse_type, "FUSE DC")}` : null, ""),
    isolator: pick(batteryNested?.breakerSelection?.label, batteryNested?.isolatorSelection?.label, batteryNested?.isolator, batteryNested?.breakerA ? `${formatMetric(batteryNested.breakerA, "A", 2)} ${cleanValue(batteryNested?.breakerType, "کلید DC")}` : null, protection?.batteryBreakerA ? `${formatMetric(protection.batteryBreakerA, "A", 2)} DC Breaker` : null, unifiedBattery?.DC_breaker_A ? `${formatMetric(unifiedBattery.DC_breaker_A, "A", 2)} ${cleanValue(unifiedBattery.DC_breaker_type, "DC Breaker")}` : null, ""),
    designVoltageV: pick(batteryNested?.designVoltageV, protection?.batteryVoltage, ctx?.batteryVoltage, ctx?.dcVoltage, "-"),
    currentA: pick(batteryNested?.currentA, batteryNested?.breakerA, protection?.batteryCurrentA, unifiedBattery?.I_bat_A, unifiedBattery?.battery_cable?.design_current_A, "-"),
  };

  const acNested = protection?.ac || {};
  const ac = {
    ...acNested,
    breaker: pick(acNested?.breakerSelection?.label, acNested?.breaker, acNested?.breakerA ? `${formatMetric(acNested.breakerA, "A", 2)} ${cleanValue(acNested?.breakerType, "کلید AC")}` : null, protection?.acBreakerA ? `${formatMetric(protection.acBreakerA, "A", 2)} MCB AC` : null, unifiedAc?.breaker_A ? `${formatMetric(unifiedAc.breaker_A, "A", 2)} ${cleanValue(unifiedAc.breaker_type, "MCB AC")}` : null, ""),
    spd: pick(acNested?.spdSelection?.label, acNested?.spd, unifiedAc?.SPD_AC?.type, ""),
    residual: pick(acNested?.residualProtection?.label, ""),
    changeover: pick(acNested?.changeoverSelection?.label, acNested?.changeover, acNested?.changeoverA ? `${formatMetric(acNested.changeoverA, "A", 2)} Changeover` : null, ""),
    poles: pick(acNested?.poles ? `${formatNumber(acNested.poles, 0)}P` : null, unifiedAc?.poles ? `${formatNumber(unifiedAc.poles, 0)}P` : null, ""),
    designVoltageV: pick(acNested?.designVoltageV, protection?.acVoltage, unifiedAc?.SPD_AC?.voltage_rating, ctx?.voltageAC, "-"),
    currentA: pick(acNested?.currentA, acNested?.breakerA, protection?.acBreakerA, unifiedAc?.I_AC_A, unifiedAc?.AC_cable?.design_current_A, "-"),
  };
  const hasBattery = Number(ctx?.batteryCount || 0) > 0;
  const breakingText = (selection) => {
    const raw = selection?.breakingCapacityKA;
    if (raw === undefined || raw === null || raw === "") return "";
    if (typeof raw === "number") return `Icu ${formatMetric(raw, "kA", 2)}`;
    const values = Object.values(raw || {}).map(Number).filter(Number.isFinite);
    return values.length ? `Icu / ${formatMetric(Math.max(...values), "kA", 2)}` : "";
  };
  const standardText = (selection) => selection?.standard ? cleanValue(selection.standard) : "";

  const joinSpecs = (...items) => items.filter((item) => item && item !== "-").map((item) => cleanValue(item)).join(" / ") || "ثبت نشده";
  const cableValue = (detail, fallback, unifiedCable) => {
    if (detail?.label) return cleanValue(detail.label);
    if (fallback) return cleanValue(fallback);
    if (unifiedCable?.area_mm2 !== undefined) return formatMetric(unifiedCable.area_mm2, "MM²", 2);
    return "نیازمند تعیین مشخصات مسیر اجرا";
  };
  const cableNote = (detail) => {
    if (!detail || !Object.keys(detail).length) return "طول مسیر و شرایط نصب برای انتخاب نهایی کابل ثبت شود";
    const currentA = pick(detail.currentA, detail.design_current_A);
    const lengthM = pick(detail.lengthM, detail.length_m);
    const voltageDropPercent = pick(detail.voltageDropPercent, detail.voltage_drop_percent, detail.drop_percent);
    const parts = [
      currentA !== undefined && currentA !== null ? `I ${formatMetric(currentA, "A", 2)}` : null,
      lengthM !== undefined && lengthM !== null ? `L ${formatMetric(lengthM, "M", 2)}` : null,
      voltageDropPercent !== undefined && voltageDropPercent !== null ? `ΔV ${formatMetric(voltageDropPercent, "%", 2)}` : null,
    ].filter(Boolean);
    return parts.join(" / ") || "طول مسیر و شرایط نصب برای انتخاب نهایی کابل ثبت شود";
  };

  const selectionMeta = (selection, fallbackStandard = "") => {
    const qty = Number(selection?.quantity || 0);
    const parts = [
      qty > 0 ? `${formatNumber(qty, 0)} عدد` : null,
      selection?.poles ? cleanValue(selection.poles) : null,
      breakingText(selection),
      standardText(selection) || fallbackStandard,
    ].filter(Boolean);
    return parts.join(" / ");
  };
  const pvItems = [
    { label: "کلید DC کامباینر", value: pv.breaker, selection: pvNested?.breakerSelection, meta: selectionMeta(pvNested?.breakerSelection, `${formatNumber(unifiedPvDeviceQty, 0)} عدد · ${cleanValue(unifiedPv?.DC_breaker?.poles || "-")} · IEC 60947-2`) },
    { label: "فیوز gPV رشته", value: pv.fuse, selection: pvNested?.fuseSelection, meta: selectionMeta(pvNested?.fuseSelection, `${formatNumber(unifiedPvFuseQty || pvNested?.totalStrings || 1, 0)} عدد · IEC 60269-6`) },
    { label: "SPD DC کامباینر", value: pv.spd, selection: pvNested?.spdSelection, meta: selectionMeta(pvNested?.spdSelection, `${formatNumber(unifiedPvDeviceQty, 0)} عدد · ${cleanValue(unifiedPv?.SPD_DC?.poles || "-")} · IEC 61643-31`) },
    { label: "ایزولاتور DC", value: pv.isolator, selection: pvNested?.isolatorSelection, meta: selectionMeta(pvNested?.isolatorSelection, `${formatNumber(unifiedPvDeviceQty, 0)} عدد · ${cleanValue(unifiedPv?.DC_isolator?.poles || "-")} · IEC 60947-3`) },
  ].filter((item) => item.value && item.value !== "-");
  const batteryItems = hasBattery ? [
    { label: "فیوز باتری", value: battery.fuse, selection: batteryNested?.fuseSelection, meta: selectionMeta(batteryNested?.fuseSelection, "IEC 60269") },
    { label: "کلید DC", value: battery.isolator, selection: batteryNested?.breakerSelection, meta: selectionMeta(batteryNested?.breakerSelection, "IEC 60947-2") },
    batteryNested?.isolatorSelection?.label ? { label: "ایزولاتور", value: batteryNested.isolatorSelection.label, selection: batteryNested?.isolatorSelection, meta: selectionMeta(batteryNested?.isolatorSelection, "IEC 60947-3") } : null,
  ].filter(Boolean) : [];
  const acItems = [
    { label: "کلید AC", value: ac.breaker, selection: acNested?.breakerSelection, meta: selectionMeta(acNested?.breakerSelection, "IEC 60947-2") },
    { label: "SPD", value: ac.spd, selection: acNested?.spdSelection, meta: selectionMeta(acNested?.spdSelection, "IEC 61643-11") },
    { label: "RCD / RCBO", value: ac.residual, selection: acNested?.residualProtection, meta: [ac.poles, acNested?.residualProtection?.sensitivityMA ? `${formatNumber(acNested.residualProtection.sensitivityMA, 0)} mA` : null].filter(Boolean).join(" / ") },
    ctx?.emergency && ac.changeover ? { label: "کلید چنج‌اور", value: ac.changeover, selection: acNested?.changeoverSelection, meta: selectionMeta(acNested?.changeoverSelection, "IEC 60947-6-1") } : null,
  ].filter((item) => item && item.value && item.value !== "-");

  const rows = [];
  if (!ctx?.emergency) {
    rows.push({
      label: "حفاظت PV / DC",
      value: joinSpecs(pv.breaker, pv.fuse, pv.spd, pv.isolator),
      items: pvItems,
      note: joinSpecs(`${formatMetric(pv.designVoltageV, "VDC", 2)} · ${formatMetric(pv.currentA, "A", 2)}`, `String ${formatNumber(pvNested?.totalStrings || 0, 0)} · MPPT ${formatNumber(pvNested?.mpptCount || ctx?.mpptEach || 0, 0)}`),
    });
  }
  if (hasBattery) {
    rows.push({
      label: "حفاظت باتری",
      value: joinSpecs(battery.fuse, battery.isolator),
      items: batteryItems,
      note: joinSpecs(`${formatMetric(battery.designVoltageV, "VDC", 2)} · ${formatMetric(battery.currentA, "A", 2)}`, breakingText(batteryNested?.breakerSelection), standardText(batteryNested?.breakerSelection)),
    });
  }
  rows.push({
    label: "حفاظت AC",
    value: joinSpecs(ac.breaker, ac.spd, ac.residual, ctx?.emergency ? ac.changeover : null, ac.poles),
    items: acItems,
    note: joinSpecs(`${formatMetric(ac.designVoltageV, "VAC", 2)} · ${formatMetric(ac.currentA, "A", 2)}`, breakingText(acNested?.breakerSelection), standardText(acNested?.breakerSelection)),
  });
  if (!ctx?.emergency) rows.push({ label: "کابل PV / DC", value: cableValue(cableDetails.pv, pick(cables.pv, protection?.pvCable, protection?.dcCable), unifiedPv?.PV_cable), note: cableDetails.pv && Object.keys(cableDetails.pv).length ? cableNote(cableDetails.pv) : cableNote(unifiedPv?.PV_cable) });
  if (hasBattery) rows.push({ label: "کابل باتری", value: cableValue(cableDetails.battery, pick(cables.battery, protection?.batteryCable, protection?.dcCable), unifiedBattery?.battery_cable), note: cableDetails.battery && Object.keys(cableDetails.battery).length ? cableNote(cableDetails.battery) : cableNote(unifiedBattery?.battery_cable) });
  rows.push({ label: "کابل AC", value: cableValue(cableDetails.ac, pick(cables.ac, protection?.acCable), unifiedAc?.AC_cable), note: cableDetails.ac && Object.keys(cableDetails.ac).length ? cableNote(cableDetails.ac) : cableNote(unifiedAc?.AC_cable) });
  return rows;
}

function SubsystemProtectionTable({ ctx }) {
  const inverterCount = Math.max(1, Number(ctx.inverterCount) || 1);
  const mpptEach = Math.max(1, Number(ctx.mpptEach) || 1);
  const panelCount = Number(ctx.panelCount) || 0;
  const perInverterPanels = inverterCount ? Math.ceil(panelCount / inverterCount) : panelCount;
  const perMpptPanels = Math.max(1, Math.ceil((perInverterPanels || 1) / mpptEach));
  const dcBreaker = safeText(ctx?.protection?.pvDc?.breaker || ctx?.protection?.pvDc?.breakerType || ctx?.protection?.pvDc?.breakerA || ctx?.protection?.pvDc?.currentA, "-");
  const acBreaker = safeText(ctx?.protection?.ac?.breaker || ctx?.protection?.ac?.breakerType || ctx?.protection?.ac?.breakerA || ctx?.protection?.ac?.currentA, "-");
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
              <div><span>حفاظت AC</span><strong>{acBreaker}</strong></div>
              <div><span>کابل خروجی</span><strong>{acCable}</strong></div>
              <div><span>کابل باتری</span><strong>{batteryCable}</strong></div>
              <div><span>فضای نگهداری</span><strong>مستقل</strong></div>
            </div>

            <div className="shil-mppt-compact-list">
              {Array.from({ length: mpptEach }).map((__, mpptIndex) => (
                <div className="shil-mppt-compact-row" key={`inv-${inverterIndex}-mppt-${mpptIndex}`}>
                  <strong>{`MPPT ${mpptIndex + 1}`}</strong>
                  <span>{`${perMpptPanels} پنل سری`}</span>
                  <span>{dcBreaker}</span>
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

const A4_HARD_STYLE = Object.freeze({
  sheet: { overflow: "hidden", boxSizing: "border-box" },
  header: { position: "relative", overflow: "hidden", boxSizing: "border-box", padding: "12px 82px", border: "1px solid #b8cce0", borderRadius: "14px", background: "#edf5fb" },
  logo: { position: "absolute", insetInlineStart: "16px", insetInlineEnd: "auto", top: "12px", transform: "none", width: "50px", height: "50px", maxWidth: "50px", maxHeight: "50px", objectFit: "contain", margin: 0, padding: 0, border: 0, background: "transparent", boxShadow: "none" },
  heroTitle: { margin: 0, width: "100%", textAlign: "center", fontSize: "22px", lineHeight: 1.25, fontWeight: 900, color: "#10253a" },
  sectionTitle: { position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "32px", boxSizing: "border-box", padding: "4px 40px", border: "1px solid #c8d7e5", borderRadius: "10px", background: "#f1f7fb" },
  sectionIndex: { position: "absolute", insetInlineEnd: "10px", top: "5px", transform: "none", display: "grid", placeItems: "center", width: "26px", height: "20px", margin: 0, borderRadius: "7px", background: "#dfeaf3", color: "#10253a", fontSize: "9px", lineHeight: 1, fontWeight: 950, direction: "ltr", zIndex: 2 },
  sectionHeading: { width: "100%", margin: 0, textAlign: "center", fontSize: "14px", lineHeight: 1.2, fontWeight: 900, color: "#10253a" },
  label: { fontSize: "8.5px", lineHeight: 1.25, fontWeight: 900, color: "#10253a" },
  answer: { maxWidth: "100%", fontSize: "10.5px", lineHeight: 1.3, fontWeight: 760, color: "#172b3e", overflowWrap: "anywhere" },
  note: { fontSize: "7px", lineHeight: 1.28, fontWeight: 780, color: "#344b60" },
});

const A4Metric = ({ children }) => <b style={A4_HARD_STYLE.answer} dir="ltr">{children}</b>;
const A4Label = ({ children }) => <span style={A4_HARD_STYLE.label}>{children}</span>;

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
  const projectTitle = project.projectName || project.name || "کاربر";
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
  const isUserFacingNote = (item) => {
    const text = cleanValue(item, "");
    if (!text) return false;
    return !/src\/|legacy|هسته اصلی متصل|موتور یکپارچه.*تولید|مسیرهای.*کنار گذاشته/i.test(text);
  };
  const importantNotes = safeList(result?.explanations || solarDesign?.explanations || delivery.notes || ["محاسبات بر اساس داده‌های ثبت‌شده پروژه انجام شد."]).filter(isUserFacingNote).slice(0, 3);
  const warnings = safeList(result?.warnings || delivery.warnings || []).filter(isUserFacingNote).slice(0, 4);

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
    { label: "خروجی AC", value: runContext.phaseAC === "three" ? `${formatMetric(runContext.voltageAC, "V", 2)} / سه‌فاز` : `${formatMetric(runContext.voltageAC, "V", 2)} / تک‌فاز` },
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
    { label: "پنل انتخابی", value: runContext.panel?.title || runContext.panel?.name || formatMetric(runContext.panelPowerW, "W", 0) },
    { label: "ولتاژ و جریان پنل", value: `${runContext.panelVoltage} V / ${runContext.panelCurrent} A` },
    { label: "تعداد پنل", value: `${runContext.panelCount} عدد` },
    { label: "توان آرایه پنل", value: `${runContext.arrayPowerW} W` },
    { label: "باتری انتخابی", value: runContext.batteryBank?.title || runContext.batteryBank?.name || "ثبت نشده" },
    { label: "ولتاژ / جریان / انرژی هر باتری", value: `${runContext.batteryVoltage} V / ${runContext.batteryCurrent} AH / ${runContext.batteryEnergyKWh} KWH` },
    { label: "تعداد باتری", value: `${runContext.batteryCount} عدد` },
    { label: "مجموع انرژی بانک باتری", value: `${runContext.batteryTotalKWh} KWH` },
    { label: "ظرفیت ذخیره‌سازی مورد نیاز برای روزهای خودکفایی", value: `${runContext.requiredStorageKWh} KWH` },
  ];

  const protectionRows = buildProtectionRows(runContext);
  const nativeProjectRows = emergency ? [
    { label: "نام پروژه", value: project.projectName || project.name || projectTitle, ltr: false },
    { label: "کارفرما", value: project.clientName || project.customerName || project.employerName || "SHIL CO", ltr: false },
    { label: "مسیر طراحی", value: runContext.projectPathTitle, ltr: false },
    { label: "روش طراحی", value: runContext.methodTitle, ltr: false },
  ] : [
    { label: "نام پروژه", value: project.projectName || project.name || projectTitle, ltr: false },
    { label: "کارفرما", value: project.clientName || project.customerName || project.employerName || "SHIL CO", ltr: false },
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
    { label: "خروجی AC", value: `${formatMetric(runContext.voltageAC, "V", 2)} / ${runContext.phaseAC === "three" ? "سه‌فاز" : "تک‌فاز"}`, ltr: false },
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
      <section data-shil-run-output-version="15" id="shil-execution-output-root" className={`shil-final-delivery-page shil-final-delivery-compact shil-execution-output-page ${emergency ? "shil-emergency-run-output" : ""}`}>
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
          <div className="shil-final-one-page-sheet shil-a4-final-form" ref={exportSheetRef} dir="rtl" style={A4_HARD_STYLE.sheet}>
            <header className="shil-a4-header" style={A4_HARD_STYLE.header}>
              <img className="shil-a4-main-logo" src={shilMainLogo} alt="SHIL Iran" style={A4_HARD_STYLE.logo} />
              <h1 style={A4_HARD_STYLE.heroTitle}>چکیده طراحی نهایی پروژه</h1>
            </header>

            <section className="shil-a4-section">
              <div className="shil-a4-section-title" style={A4_HARD_STYLE.sectionTitle}><span style={A4_HARD_STYLE.sectionIndex}>01</span><h3 style={A4_HARD_STYLE.sectionHeading}>مشخصات پروژه</h3></div>
              <div className="shil-a4-fields shil-a4-fields-project">
                <div><A4Label>نام پروژه</A4Label><b style={A4_HARD_STYLE.answer}>{project.projectName || project.name || projectTitle}</b></div>
                <div><A4Label>کارفرما</A4Label><b style={A4_HARD_STYLE.answer}>{project.clientName || project.customerName || project.employerName || "SHIL CO"}</b></div>
                <div><A4Label>تاریخ ثبت</A4Label><b style={A4_HARD_STYLE.answer}>{cleanValue(project.registrationDate || project.date || project.createdAt || "-")}</b></div>
                <div><A4Label>مسیر طراحی</A4Label><b style={A4_HARD_STYLE.answer}>{runContext.projectPathTitle}</b></div>
                {!emergency ? <div><A4Label>شهر مبنا</A4Label><b style={A4_HARD_STYLE.answer}>{runContext.city}</b></div> : <div><A4Label>روش ورود اطلاعات</A4Label><b style={A4_HARD_STYLE.answer}>{runContext.methodTitle}</b></div>}
                <div><A4Label>روش طراحی</A4Label><b style={A4_HARD_STYLE.answer}>{runContext.methodTitle}</b></div>
              </div>
            </section>

            <section className="shil-a4-section">
              <div className="shil-a4-section-title" style={A4_HARD_STYLE.sectionTitle}><span style={A4_HARD_STYLE.sectionIndex}>02</span><h3 style={A4_HARD_STYLE.sectionHeading}>چکیده محاسبات</h3></div>
              <div className="shil-a4-fields shil-a4-fields-design">
                {emergency ? (<>
                  <div><A4Label>توان بار ضروری</A4Label><A4Metric>{formatMetric(runContext.loadPowerW, "W", 2)}</A4Metric></div>
                  <div><A4Label>پیک راه‌اندازی</A4Label><A4Metric>{formatMetric(runContext.surgePowerW, "W", 2)}</A4Metric></div>
                  <div><A4Label>پشتیبانی هدف</A4Label><A4Metric>{formatMetric(runContext.backupHours, "H", 2)}</A4Metric></div>
                  <div><A4Label>پشتیبانی واقعی</A4Label><A4Metric>{formatMetric(runContext.runtimeHours, "H", 2)}</A4Metric></div>
                  <div><A4Label>ضریب اطمینان اینورتر</A4Label><b style={A4_HARD_STYLE.answer}>{formatNumber(runContext.reserveFactor, 2)}</b></div>
                  <div><A4Label>عمق دشارژ مجاز</A4Label><A4Metric>{formatPercent(runContext.dodPercent, 1)}</A4Metric></div>
                  <div><A4Label>خروجی AC</A4Label><b style={A4_HARD_STYLE.answer}>{runContext.phaseAC === "three" ? `${formatMetric(runContext.voltageAC, "V", 2)} / سه‌فاز` : `${formatMetric(runContext.voltageAC, "V", 2)} / تک‌فاز`}</b></div>
                  <div><A4Label>انرژی خام موردنیاز</A4Label><A4Metric>{formatMetric(runContext.requiredStorageKWh, "KWH", 2)}</A4Metric></div>
                </>) : (<>
                  <div><A4Label>توان طراحی نهایی</A4Label><A4Metric>{formatMetric(runContext.powerAfterFactorW, "W", 2)}</A4Metric></div>
                  <div><A4Label>انرژی روزانه</A4Label><A4Metric>{formatMetric(Number(runContext.dailyEnergyWh || 0) / 1000, "KWH", 2)}</A4Metric></div>
                  <div><A4Label>PSH</A4Label><A4Metric>{formatMetric(runContext.psh, "H", 2)}</A4Metric></div>
                  <div><A4Label>راندمان محیطی</A4Label><A4Metric>{String(runContext.envEfficiency).includes("%") ? formatPercent(runContext.envEfficiency, 1) : cleanValue(runContext.envEfficiency)}</A4Metric></div>
                  <div><A4Label>جهت پیشنهادی</A4Label><b style={A4_HARD_STYLE.answer}>{runContext.direction}</b></div>
                  <div><A4Label>زاویه پنل</A4Label><A4Metric>{formatMetric(runContext.tilt, "DEG", 1)}</A4Metric></div>
                  <div><A4Label>ضریب اطمینان</A4Label><b style={A4_HARD_STYLE.answer}>{formatNumber(runContext.safetyFactor, 2)}</b></div>
                  <div><A4Label>نوع طراحی</A4Label><b style={A4_HARD_STYLE.answer}>{runContext.designType}</b></div>
                </>)}
              </div>
            </section>

            <section className="shil-a4-section">
              <div className="shil-a4-section-title" style={A4_HARD_STYLE.sectionTitle}><span style={A4_HARD_STYLE.sectionIndex}>03</span><h3 style={A4_HARD_STYLE.sectionHeading}>تجهیزات نهایی پروژه</h3></div>
              <div className="shil-a4-table">
                <div className="shil-a4-table-head"><span style={A4_HARD_STYLE.label}>تجهیز</span><span style={A4_HARD_STYLE.label}>مدل / مشخصات نهایی</span><span style={A4_HARD_STYLE.label}>تعداد / آرایش</span></div>
                {emergency ? (<>
                  <div><A4Label>اینورتر برق اضطراری</A4Label><b style={A4_HARD_STYLE.answer}>{cleanValue(runContext.inverter?.title || runContext.inverter?.model || runContext.inverter?.name || "ثبت نشده")}</b><small style={A4_HARD_STYLE.note}>{cleanValue(`${formatNumber(runContext.inverterCount, 0)} عدد / ${formatMetric(runContext.inverterRatedPowerW, "W", 2)} / ${formatMetric(runContext.dcVoltage, "VDC", 2)}`)}</small></div>
                  <div><A4Label>بانک باتری</A4Label><b style={A4_HARD_STYLE.answer}>{cleanValue(runContext.battery?.title || runContext.battery?.model || runContext.battery?.name || "ثبت نشده")}</b><small style={A4_HARD_STYLE.note}>{cleanValue(`${formatNumber(runContext.batteryCount, 0)} عدد / ${formatNumber(runContext.batterySeriesCount, 0)} سری × ${formatNumber(runContext.batteryParallelCount, 0)} موازی / ${formatMetric(runContext.batteryTotalKWh, "KWH", 2)}`)}</small></div>
                </>) : (<>
                  <div><A4Label>اینورتر خورشیدی</A4Label><b style={A4_HARD_STYLE.answer}>{cleanValue(runContext.inverter?.title || runContext.inverter?.model || runContext.inverter?.name || "ثبت نشده")}</b><small style={A4_HARD_STYLE.note}>{cleanValue(`${formatNumber(runContext.inverterCount, 0)} عدد / ${formatNumber(runContext.mpptEach, 0)} MPPT`)}</small></div>
                  <div><A4Label>پنل خورشیدی</A4Label><b style={A4_HARD_STYLE.answer}>{cleanValue(runContext.panel?.title || runContext.panel?.model || runContext.panel?.name || formatMetric(runContext.panelPowerW, "W", 0))}</b><small style={A4_HARD_STYLE.note}>{cleanValue(`${formatNumber(runContext.panelCount, 0)} عدد / آرایه ${formatMetric(runContext.arrayPowerW, "W", 2)}`)}</small></div>
                  <div><A4Label>بانک باتری</A4Label><b style={A4_HARD_STYLE.answer}>{cleanValue(runContext.batteryBank?.title || runContext.batteryBank?.model || runContext.batteryBank?.name || (Number(runContext.batteryCount) ? "باتری انتخاب‌شده" : "بدون باتری"))}</b><small style={A4_HARD_STYLE.note}>{Number(runContext.batteryCount) ? cleanValue(`${formatNumber(runContext.batteryCount, 0)} عدد / ${formatMetric(runContext.batteryTotalKWh, "KWH", 2)}`) : "در این طراحی ذخیره‌ساز الزامی نیست"}</small></div>
                </>)}
              </div>
            </section>

            <section className="shil-a4-section">
              <div className="shil-a4-section-title" style={A4_HARD_STYLE.sectionTitle}><span style={A4_HARD_STYLE.sectionIndex}>04</span><h3 style={A4_HARD_STYLE.sectionHeading}>حفاظت و الزامات اجرا</h3></div>
              <div className="shil-a4-execution-grid">
                {protectionRows.slice(0, 6).map((row, index) => (
                  <div key={`a4-protection-${index}`} className={row.items?.length ? "shil-a4-execution-card-structured" : ""}>
                    <A4Label>{row.label}</A4Label>
                    {row.items?.length ? <EngineeringItems items={row.items} compact /> : <b style={A4_HARD_STYLE.answer}>{safeText(row.value)}</b>}
                    {row.note ? <small style={A4_HARD_STYLE.note}>{safeText(row.note)}</small> : null}
                  </div>
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
              {importantNotes.map((item, index) => <UserFacingMessageCard text={item} key={`run-note-${index}`} />)}
              {warnings.map((item, index) => <UserFacingMessageCard text={item} warning key={`run-warning-${index}`} />)}
              {!importantNotes.length && !warnings.length ? <UserFacingMessageCard text="محاسبات نهایی آماده اجرا است." /> : null}
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
