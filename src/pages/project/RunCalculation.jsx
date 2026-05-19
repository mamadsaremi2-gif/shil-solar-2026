import React, { useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import EngineeringPageShell from "../../components/EngineeringPageShell.jsx";
import { approveProjectStep } from "../../workflow/projectWorkflow.js";
import { markCurrentProjectFinal, showUxToast } from "../../workflow/uxFlowController.js";
import { runEngineeringDesign } from "../../runEngineeringDesign.js";
import { buildScenarioCalculationInput } from "../../core/scenario/scenarioToEngineeringForm.js";
import { runEmergencyPowerDesign } from "../../core/calculation/emergencyPowerEngine.js";
import {
  buildFinalEngineeringDelivery,
  exportDeliveryCsv,
  exportDeliveryHtml,
  exportDeliveryJson,
  exportElementAsPdf,
  exportElementAsPng,
  shareDelivery,
} from "../../export/shilExportSystem.js";

function readDraft(key, fallback = {}) { try { return JSON.parse(localStorage.getItem(key) || "null") || fallback; } catch { return fallback; } }

function makeFallbackForm(domain) {
  return { project: { scenario: domain === "emergency" ? "emergency" : "offgrid", dailyEnergyWh: 5000, peakLoadW: 2500, autonomyDays: 1 }, environment: { peakSunHours: domain === "emergency" ? 0 : 5, irradianceLossPercent: 0, soilingLossPercent: 3, shadingLossPercent: 0 }, pv: { panelPowerW: domain === "emergency" ? 0 : 620, panelVoc: 50.9, panelVmp: 42.6, panelIsc: 15, panelImp: 14.56, seriesCount: 2, parallelCount: 1, dcBusVoltage: 48, tempCoeffVocPercentPerC: -0.28, temperatureMinC: -5, temperatureMaxC: 45 }, battery: { nominalVoltage: 48, capacityAh: 100, depthOfDischarge: 0.85, roundTripEfficiency: 0.94 }, inverter: { ratedPowerW: 3000, surgePowerW: 6000, maxDcVoltage: 500, mpptMinVoltage: 120, mpptMaxVoltage: 450, efficiency: 0.95 }, cable: { lengthM: 20, currentA: 30, crossSectionMm2: 0, material: "copper", allowedVoltageDropPercent: 3 }, designDomain: domain };
}

function readCalculationInput() {
  try { const saved = JSON.parse(localStorage.getItem("shil:calculationInput") || "null"); if (saved?.form) return saved; return buildScenarioCalculationInput(); } catch { return null; }
}

function runCore(domain) {
  if (domain === "emergency") return { result: runEmergencyPowerDesign({ load: readDraft("shil:loadEngineResult", {}), settings: readDraft("shil:emergencyPowerSettings", {}) }) };
  try {
    const calculationInput = readCalculationInput();
    const form = calculationInput?.form || makeFallbackForm(domain);
    const activeDomain = calculationInput?.scenario?.domain || form.designDomain || domain;
    return { input: calculationInput, result: runEngineeringDesign(form, { domain: activeDomain, mode: activeDomain === "emergency" ? "emergency-core" : "solar-core", stopOnValidationError: false }) };
  } catch (error) { return { input: null, result: { status: "ready", note: "هسته اصلی متصل است؛ اجرای واقعی با دیتای پروژه در Runtime انجام می‌شود.", error: String(error?.message || error) } }; }
}

function Row({ label, value, note }) { return <div><span>{label}</span><strong>{value || "ثبت نشده"}</strong>{note ? <small>{note}</small> : null}</div>; }
function Table({ title, rows }) { return <div className="shil-ai-install-table-card"><h3>{title}</h3><div className="shil-ai-install-table"><div className="head"><span>تجهیز</span><span>تعداد / مشخصات</span><span>توضیح مهندسی</span></div>{rows.map((row) => <div key={row.label}><span>{row.label}</span><strong>{row.value}</strong><small>{row.note}</small></div>)}</div></div>; }

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
  const aiPreview = readDraft("shil:aiInstallationPreview", null);
  const projectTitle = project.projectName || project.name || (emergency ? "پروژه برق اضطراری" : "پروژه خورشیدی");
  const projectKey = localStorage.getItem("shil:activeProjectKey") || `final-${Date.now()}`;
  const delivery = useMemo(
    () => buildFinalEngineeringDelivery({ domain, project, summary, result, solarDesign, aiPreview }),
    [domain, project, summary, result, solarDesign, aiPreview]
  );

  const panelRows = emergency ? [] : [
    { label: "پنل خورشیدی", value: `${solarDesign?.pvArray?.panelCount || "-"} عدد / ${solarDesign?.panel?.powerW || 620} وات`, note: `${solarDesign?.pvArray?.seriesCount || "-"} سری × ${solarDesign?.pvArray?.parallelCount || "-"} موازی` },
    { label: "اینورتر خورشیدی", value: `${solarDesign?.inverter?.count || "-"} عدد / ${solarDesign?.inverter?.ratedPowerW || "-"} وات`, note: "مطابق سناریوی آفگرید، آنگرید یا هیبرید" },
    { label: "باتری", value: `${solarDesign?.battery?.totalCount || "-"} عدد`, note: `${solarDesign?.battery?.seriesCount || "-"} سری × ${solarDesign?.battery?.parallelCount || "-"} موازی` },
    { label: "حفاظت DC/AC", value: `${solarDesign?.protection?.dcBreakerA || "-"}A / ${solarDesign?.protection?.acBreakerA || "-"}A`, note: "فیوز، بریکر، SPD و ارتینگ" }
  ];

  const emergencyRows = emergency ? [
    { label: "اینورتر برق اضطراری", value: `${result?.inverter?.count || 1} عدد / ${result?.inverter?.ratedPowerW || "-"} وات`, note: "پوشش توان دائم و توان لحظه‌ای بارهای ضروری" },
    { label: "باتری منتخب", value: `${result?.battery?.totalCount || "-"} عدد / ${result?.battery?.battery?.capacityAh || "-"}Ah`, note: `${result?.battery?.seriesCount || "-"} سری × ${result?.battery?.parallelCount || "-"} موازی` },
    { label: "زمان برق اضطراری مورد نیاز", value: `${result?.settings?.requiredEmergencyHours || 2} ساعت`, note: "در ظرفیت باتری و ضریب اطمینان لحاظ شده است" },
    { label: "سیستم حفاظتی", value: `DC ${result?.protection?.dcBreakerA || "-"}A / AC ${result?.protection?.acBreakerA || "-"}A`, note: "حفاظت باتری، خروجی AC، ارتینگ و جداسازی مدارهای اضطراری" }
  ] : [];

  function saveFinalProject() {
    approveProjectStep("run");
    const payload = { domain, project, summary, result, aiPreview, savedAt: new Date().toISOString() };
    localStorage.setItem("shil:finalEngineeringOutput", JSON.stringify(payload));
    markCurrentProjectFinal({ result, aiPreview });
    setRan(true);
    showUxToast("پروژه در بخش پروژه‌های نهایی ثبت شد", "success");
  }

  function downloadJson() {
    exportDeliveryJson(delivery);
    showUxToast("فایل JSON پروژه ذخیره شد", "success");
  }

  function downloadCsv() {
    exportDeliveryCsv(delivery);
    showUxToast("فایل CSV تجهیزات و اعتبارسنجی ذخیره شد", "success");
  }

  function downloadHtml() {
    exportDeliveryHtml(delivery);
    showUxToast("نسخه HTML گزارش مهندسی ذخیره شد", "success");
  }

  async function exportPdf() {
    try {
      setExporting("pdf");
      await exportElementAsPdf(exportSheetRef.current, delivery, `${projectTitle || "shil"}-engineering-output.pdf`);
      showUxToast("PDF مهندسی ذخیره شد", "success");
    } catch (error) {
      showUxToast("خروجی PDF با خطا روبه‌رو شد؛ از خروجی HTML استفاده کنید", "warning");
    } finally {
      setExporting("");
    }
  }

  async function shareProject() {
    try {
      await shareDelivery(delivery);
      showUxToast("لینک طراحی برای اشتراک آماده شد", "success");
    } catch {
      showUxToast("اشتراک‌گذاری انجام نشد", "warning");
    }
  }

  async function saveProjectImage() {
    try {
      setExporting("png");
      await exportElementAsPng(exportSheetRef.current, `${projectTitle || "shil"}-engineering-output.png`);
      showUxToast("تصویر جمع‌بندی مهندسی ذخیره شد", "success");
    } catch {
      showUxToast("ذخیره تصویر انجام نشد", "warning");
    } finally {
      setExporting("");
    }
  }

  return (
    <EngineeringPageShell title="اجرای محاسبات و خروجی نهایی">
      <section className="shil-card-stack shil-final-delivery-page" ref={exportSheetRef}>
        <div className="shil-section-card shil-delivery-hero">
          <div className="shil-section-head"><h2>جمع‌بندی نهایی پروژه</h2><span>READY FOR DELIVERY</span></div>
          <div className="shil-summary-grid">
            <Row label="نام پروژه" value={projectTitle} />
            <Row label="کارفرما" value={project.clientName || project.customerName || project.employerName} />
            <Row label="محل اجرا" value={[project.city, project.province].filter(Boolean).join(" / ") || "ثبت نشده"} />
            <Row label="مسیر طراحی" value={emergency ? "برق اضطراری" : "پنل خورشیدی"} />
            <Row label="وضعیت محاسبات" value={result?.valid === false ? "نیازمند بازبینی" : "تکمیل شده"} />
            <Row label="قابلیت خروجی" value="تصویر / PDF / JSON / CSV / HTML / اشتراک" />
            <Row label="نسخه خروجی" value={delivery.meta.version} />
          </div>
        </div>

        {!emergency && aiPreview?.image?.src ? <div className="shil-section-card"><div className="shil-section-head"><h2>تصویر نهایی طراحی هوشمند</h2><span>AI Preview</span></div><img className="shil-final-preview-image" src={aiPreview.image.src} alt="تصویر نهایی پروژه" /></div> : null}

        <Table title={emergency ? "تجهیزات مورد نیاز برق اضطراری" : "تجهیزات مورد نیاز اجرای پروژه خورشیدی"} rows={emergency ? emergencyRows : panelRows} />

        <div className="shil-section-card shil-export-diagram-card">
          <div className="shil-section-head"><h2>دیاگرام مهندسی سیستم</h2><span>System Diagram</span></div>
          <div className="shil-export-diagram" aria-label="دیاگرام سیستم">
            {emergency ? (
              <><span>برق شهر</span><b>→</b><span>شارژر / اینورتر برق اضطراری</span><b>→</b><span>بارهای ضروری</span><i>↓</i><span>بانک باتری</span></>
            ) : (
              <><span>پنل خورشیدی</span><b>→</b><span>MPPT / اینورتر</span><b>→</b><span>مصرف‌کننده</span><i>↓</i><span>بانک باتری</span></>
            )}
          </div>
        </div>

        <div className="shil-section-card">
          <div className="shil-section-head"><h2>اعتبارسنجی و دلایل مهندسی</h2><span>Validation</span></div>
          <ul className="shil-engineering-list">{(result?.explanations || solarDesign?.explanations || ["محاسبات بر اساس داده‌های ثبت‌شده پروژه انجام شد."]).map((item) => <li key={item}>{item}</li>)}</ul>
          {result?.warnings?.length ? <div className="shil-inline-warning">{result.warnings.join(" / ")}</div> : <div className="shil-inline-success">طراحی برای مرحله خروجی نهایی آماده است.</div>}
        </div>

        <div className="shil-section-card">
          <div className="shil-section-head"><h2>خروجی‌های قابل دریافت</h2><span>Export</span></div>
          <div className="shil-output-actions">
            <button type="button" onClick={saveProjectImage} disabled={Boolean(exporting)}>{exporting === "png" ? "در حال ساخت تصویر..." : "ذخیره تصویر پروژه"}</button>
            <button type="button" onClick={exportPdf} disabled={Boolean(exporting)}>{exporting === "pdf" ? "در حال ساخت PDF..." : "خروجی PDF مهندسی"}</button>
            <button type="button" onClick={downloadJson}>ذخیره پروژه JSON</button>
            <button type="button" onClick={downloadCsv}>خروجی CSV تجهیزات</button>
            <button type="button" onClick={downloadHtml}>گزارش HTML قابل چاپ</button>
            <button type="button" onClick={shareProject}>اشتراک طراحی</button>
          </div>
        </div>

        <button type="button" className="shil-primary-wide" onClick={saveFinalProject}>{ran ? "پروژه در نهایی‌ها ثبت شد" : "تایید نهایی و ثبت پروژه"}</button>
        <Link className="shil-soft-link-button" to="/projects/final">مشاهده پروژه‌های نهایی</Link>
      </section>
    </EngineeringPageShell>
  );
}
