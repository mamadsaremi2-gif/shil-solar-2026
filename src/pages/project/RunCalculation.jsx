import React, { useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import EngineeringPageShell from "../../components/EngineeringPageShell.jsx";
import { approveProjectStep } from "../../workflow/projectWorkflow.js";
import { markCurrentProjectFinal, showUxToast } from "../../workflow/uxFlowController.js";
import { runEngineeringDesign } from "../../runEngineeringDesign.js";
import { buildScenarioCalculationInput } from "../../core/scenario/scenarioToEngineeringForm.js";
import { buildMethodSummary, getActiveMethodKey } from "../../core/summary/methodSummaryEngine.js";
import {
  buildFinalEngineeringDelivery,
  exportElementAsPdf,
  exportElementAsPng,
  shareDelivery,
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
    const form = { ...makeFallbackForm("emergency"), load: readDraft("shil:loadEngineResult", {}), settings: readDraft("shil:emergencyPowerSettings", {}), designDomain: "emergency" };
    return { result: runEngineeringDesign(form, { domain: "emergency", mode: "final-core", stopOnValidationError: false }) };
  }
  try {
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

function Row({ label, value, note }) {
  return (
    <div className="shil-final-compact-row">
      <span>{label}</span>
      <strong>{value || "ثبت نشده"}</strong>
      {note ? <small>{note}</small> : null}
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
        {visibleRows.map((row) => (
          <div key={row.label || row.item}>
            <span>{row.label || row.item}</span>
            <strong>{row.value || [row.qty, row.spec].filter(Boolean).join(" / ")}</strong>
            <small>{row.note || row.reason}</small>
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
        {systems.slice(0, 12).map((system) => (
          <div key={system.id || system.title}>
            <span>{system.title || system.id}</span>
            <strong>{system?.pv?.panelCount || 0} پنل / {system?.battery?.count || 0} باتری / {system?.space?.maintenanceAreaM2 || "-"}m²</strong>
            <small>DC {system?.protection?.dcBreakerA || "-"}A / AC {system?.protection?.acBreakerA || "-"}A / کابل {system?.protection?.dcCable || "-"} و {system?.protection?.acCable || "-"}</small>
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
    solarDesign?.load?.dailyEnergyWh ? `مصرف روزانه ${solarDesign.load.dailyEnergyWh}Wh` : null,
    solarDesign?.load?.peakLoadW ? `توان پیک ${solarDesign.load.peakLoadW}W` : null,
    solarDesign?.environment?.peakSunHours ? `ساعت آفتابی ${solarDesign.environment.peakSunHours}` : null,
  ].filter(Boolean).join(" / ") || "ورودی‌های کلیدی از مراحل قبلی پروژه خوانده شده‌اند";

  return (
    <div className="shil-final-sheet-block shil-final-path-block">
      <h3>مسیر رسیدن به نتیجه</h3>
      <ol>
        <li><b>انتخاب سناریو:</b> {scenarioTitle}</li>
        <li><b>ورودی‌های کلیدی:</b> {keyInputs}</li>
        <li><b>منطق محاسبه:</b> بار، شرایط محیطی، تجهیزات و قیود حفاظتی توسط موتور محاسبات SHIL ترکیب شدند.</li>
        <li><b>نتیجه نهایی:</b> {designStatus}</li>
      </ol>
    </div>
  );
}

export default function RunCalculation() {
  const { domain = "solar" } = useParams();
  const emergency = domain === "emergency";
  const [ran, setRan] = useState(false);
  const [exporting, setExporting] = useState("");
  const exportSheetRef = useRef(null);
  const coreRun = useMemo(() => runCore(domain), [domain]);
  const result = coreRun.result;
  const project = readDraft("shil:projectInfoDraft", {});
  const summary = readDraft("shil:summaryDraft", {});
  const solarDesign = readDraft("shil:solarSystemDesign", summary?.solarDesign || {});
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
  const importantNotes = (result?.explanations || solarDesign?.explanations || delivery.notes || ["محاسبات بر اساس داده‌های ثبت‌شده پروژه انجام شد."]).slice(0, 3);
  const warnings = (result?.warnings || delivery.warnings || []).slice(0, 2);

  function saveFinalProject() {
    approveProjectStep("run");
    const payload = { domain, project, summary, result, aiPreview, savedAt: new Date().toISOString() };
    localStorage.setItem("shil:finalEngineeringOutput", JSON.stringify(payload));
    markCurrentProjectFinal({ result, aiPreview });
    setRan(true);
    showUxToast("پروژه در بخش پروژه‌های نهایی ثبت شد", "success");
  }

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
      await shareDelivery(delivery);
      showUxToast("خروجی نهایی برای اشتراک آماده شد", "success");
    } catch {
      showUxToast("اشتراک‌گذاری انجام نشد", "warning");
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
    <EngineeringPageShell title="اجرای محاسبات و خروجی نهایی">
      <section className="shil-card-stack shil-final-delivery-page shil-final-delivery-compact">
        <div className="shil-final-one-page-sheet" ref={exportSheetRef}>
          <div className="shil-final-sheet-hero">
            <div>
              <span>SHIL FINAL SUMMARY</span>
              <h2>خلاصه نهایی پروژه</h2>
              <p>خروجی فشرده شامل معرفی پروژه، مسیر تصمیم‌گیری، تجهیزات و نتایج مهم</p>
            </div>
            <strong>{delivery.meta.status}</strong>
          </div>

          <div className="shil-final-sheet-grid">
            <Row label="نام پروژه" value={projectTitle} />
            <Row label="مشتری / کارفرما" value={delivery.meta.customer} />
            <Row label="محل اجرا" value={delivery.meta.location} />
            <Row label="نوع پروژه" value={delivery.meta.domain} />
            <Row label="مسیر طراحی" value={methodSummary.title} />
            <Row label="وضعیت سلامت" value={diagnostics?.score ? `${diagnostics.score} / 100` : delivery.meta.status} />
          </div>

          <DecisionPath methodSummary={methodSummary} result={result} calculationInput={calculationInput} solarDesign={solarDesign} emergency={emergency} />
          <CompactEquipmentTable title="خلاصه محصولات و تجهیزات" rows={delivery.equipment.length ? delivery.equipment : methodSummary.rows} />
          <DistributedInverterTable systems={solarDesign?.distributedInverterSystems || result?.distributedInverterSystems || []} />

          <div className="shil-final-sheet-block shil-final-result-block">
            <h3>نتایج و نکات مهم</h3>
            <ul>
              {importantNotes.map((item) => <li key={item}>{item}</li>)}
              {warnings.map((item) => <li className="warning" key={item}>هشدار: {item}</li>)}
              {!warnings.length ? <li>طراحی برای ارائه خروجی نهایی آماده است.</li> : null}
            </ul>
          </div>
        </div>

        <div className="shil-section-card shil-final-action-card">
          <div className="shil-section-head"><h2>خروجی نهایی</h2><span>فقط سه قابلیت اصلی</span></div>
          <div className="shil-output-actions shil-output-actions-three">
            <button type="button" onClick={saveProjectImage} disabled={Boolean(exporting)}>{exporting === "png" ? "در حال ساخت تصویر..." : "خروجی تصویر"}</button>
            <button type="button" onClick={exportPdf} disabled={Boolean(exporting)}>{exporting === "pdf" ? "در حال ساخت PDF..." : "خروجی PDF"}</button>
            <button type="button" onClick={shareProject}>اشتراک‌گذاری خروجی</button>
          </div>
        </div>

        <button type="button" className="shil-primary-wide" onClick={saveFinalProject}>{ran ? "پروژه در نهایی‌ها ثبت شد" : "تایید نهایی و ثبت پروژه"}</button>
        <Link className="shil-soft-link-button" to="/projects/final">مشاهده پروژه‌های نهایی</Link>
      </section>
    </EngineeringPageShell>
  );
}
