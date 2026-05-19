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
  } catch (error) { return { input: null, result: { status: "ready", note: "Ù‡Ø³ØªÙ‡ Ø§ØµÙ„ÛŒ Ù…ØªØµÙ„ Ø§Ø³ØªØ› Ø§Ø¬Ø±Ø§ÛŒ ÙˆØ§Ù‚Ø¹ÛŒ Ø¨Ø§ Ø¯ÛŒØªØ§ÛŒ Ù¾Ø±ÙˆÚ˜Ù‡ Ø¯Ø± Runtime Ø§Ù†Ø¬Ø§Ù… Ù…ÛŒâ€ŒØ´ÙˆØ¯.", error: String(error?.message || error) } }; }
}

function Row({ label, value, note }) { return <div><span>{label}</span><strong>{value || "Ø«Ø¨Øª Ù†Ø´Ø¯Ù‡"}</strong>{note ? <small>{note}</small> : null}</div>; }
function Table({ title, rows }) { return <div className="shil-ai-install-table-card"><h3>{title}</h3><div className="shil-ai-install-table"><div className="head"><span>ØªØ¬Ù‡ÛŒØ²</span><span>ØªØ¹Ø¯Ø§Ø¯ / Ù…Ø´Ø®ØµØ§Øª</span><span>ØªÙˆØ¶ÛŒØ­ Ù…Ù‡Ù†Ø¯Ø³ÛŒ</span></div>{rows.map((row) => <div key={row.label}><span>{row.label}</span><strong>{row.value}</strong><small>{row.note}</small></div>)}</div></div>; }

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
  const projectTitle = project.projectName || project.name || (emergency ? "Ù¾Ø±ÙˆÚ˜Ù‡ Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ" : "Ù¾Ø±ÙˆÚ˜Ù‡ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ");
  const projectKey = localStorage.getItem("shil:activeProjectKey") || `final-${Date.now()}`;
  const delivery = useMemo(
    () => buildFinalEngineeringDelivery({ domain, project, summary, result, solarDesign, aiPreview }),
    [domain, project, summary, result, solarDesign, aiPreview]
  );

  const panelRows = emergency ? [] : [
    { label: "Ù¾Ù†Ù„ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ", value: `${solarDesign?.pvArray?.panelCount || "-"} Ø¹Ø¯Ø¯ / ${solarDesign?.panel?.powerW || 620} ÙˆØ§Øª`, note: `${solarDesign?.pvArray?.seriesCount || "-"} Ø³Ø±ÛŒ Ã— ${solarDesign?.pvArray?.parallelCount || "-"} Ù…ÙˆØ§Ø²ÛŒ` },
    { label: "Ø§ÛŒÙ†ÙˆØ±ØªØ± Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ", value: `${solarDesign?.inverter?.count || "-"} Ø¹Ø¯Ø¯ / ${solarDesign?.inverter?.ratedPowerW || "-"} ÙˆØ§Øª`, note: "Ù…Ø·Ø§Ø¨Ù‚ Ø³Ù†Ø§Ø±ÛŒÙˆÛŒ Ø¢ÙÚ¯Ø±ÛŒØ¯ØŒ Ø¢Ù†Ú¯Ø±ÛŒØ¯ ÛŒØ§ Ù‡ÛŒØ¨Ø±ÛŒØ¯" },
    { label: "Ø¨Ø§ØªØ±ÛŒ", value: `${solarDesign?.battery?.totalCount || "-"} Ø¹Ø¯Ø¯`, note: `${solarDesign?.battery?.seriesCount || "-"} Ø³Ø±ÛŒ Ã— ${solarDesign?.battery?.parallelCount || "-"} Ù…ÙˆØ§Ø²ÛŒ` },
    { label: "Ø­ÙØ§Ø¸Øª DC/AC", value: `${solarDesign?.protection?.dcBreakerA || "-"}A / ${solarDesign?.protection?.acBreakerA || "-"}A`, note: "ÙÛŒÙˆØ²ØŒ Ø¨Ø±ÛŒÚ©Ø±ØŒ SPD Ùˆ Ø§Ø±ØªÛŒÙ†Ú¯" }
  ];

  const emergencyRows = emergency ? [
    { label: "Ø§ÛŒÙ†ÙˆØ±ØªØ± Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ", value: `${result?.inverter?.count || 1} Ø¹Ø¯Ø¯ / ${result?.inverter?.ratedPowerW || "-"} ÙˆØ§Øª`, note: "Ù¾ÙˆØ´Ø´ ØªÙˆØ§Ù† Ø¯Ø§Ø¦Ù… Ùˆ ØªÙˆØ§Ù† Ù„Ø­Ø¸Ù‡â€ŒØ§ÛŒ Ø¨Ø§Ø±Ù‡Ø§ÛŒ Ø¶Ø±ÙˆØ±ÛŒ" },
    { label: "Ø¨Ø§ØªØ±ÛŒ Ù…Ù†ØªØ®Ø¨", value: `${result?.battery?.totalCount || "-"} Ø¹Ø¯Ø¯ / ${result?.battery?.battery?.capacityAh || "-"}Ah`, note: `${result?.battery?.seriesCount || "-"} Ø³Ø±ÛŒ Ã— ${result?.battery?.parallelCount || "-"} Ù…ÙˆØ§Ø²ÛŒ` },
    { label: "Ø²Ù…Ø§Ù† Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ Ù…ÙˆØ±Ø¯ Ù†ÛŒØ§Ø²", value: `${result?.settings?.requiredEmergencyHours || 2} Ø³Ø§Ø¹Øª`, note: "Ø¯Ø± Ø¸Ø±ÙÛŒØª Ø¨Ø§ØªØ±ÛŒ Ùˆ Ø¶Ø±ÛŒØ¨ Ø§Ø·Ù…ÛŒÙ†Ø§Ù† Ù„Ø­Ø§Ø¸ Ø´Ø¯Ù‡ Ø§Ø³Øª" },
    { label: "Ø³ÛŒØ³ØªÙ… Ø­ÙØ§Ø¸ØªÛŒ", value: `DC ${result?.protection?.dcBreakerA || "-"}A / AC ${result?.protection?.acBreakerA || "-"}A`, note: "Ø­ÙØ§Ø¸Øª Ø¨Ø§ØªØ±ÛŒØŒ Ø®Ø±ÙˆØ¬ÛŒ ACØŒ Ø§Ø±ØªÛŒÙ†Ú¯ Ùˆ Ø¬Ø¯Ø§Ø³Ø§Ø²ÛŒ Ù…Ø¯Ø§Ø±Ù‡Ø§ÛŒ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ" }
  ] : [];

  function saveFinalProject() {
    approveProjectStep("run");
    const payload = { domain, project, summary, result, aiPreview, savedAt: new Date().toISOString() };
    localStorage.setItem("shil:finalEngineeringOutput", JSON.stringify(payload));
    markCurrentProjectFinal({ result, aiPreview });
    setRan(true);
    showUxToast("Ù¾Ø±ÙˆÚ˜Ù‡ Ø¯Ø± Ø¨Ø®Ø´ Ù¾Ø±ÙˆÚ˜Ù‡â€ŒÙ‡Ø§ÛŒ Ù†Ù‡Ø§ÛŒÛŒ Ø«Ø¨Øª Ø´Ø¯", "success");
  }

  function downloadJson() {
    exportDeliveryJson(delivery);
    showUxToast("ÙØ§ÛŒÙ„ JSON Ù¾Ø±ÙˆÚ˜Ù‡ Ø°Ø®ÛŒØ±Ù‡ Ø´Ø¯", "success");
  }

  function downloadCsv() {
    exportDeliveryCsv(delivery);
    showUxToast("ÙØ§ÛŒÙ„ CSV ØªØ¬Ù‡ÛŒØ²Ø§Øª Ùˆ Ø§Ø¹ØªØ¨Ø§Ø±Ø³Ù†Ø¬ÛŒ Ø°Ø®ÛŒØ±Ù‡ Ø´Ø¯", "success");
  }

  function downloadHtml() {
    exportDeliveryHtml(delivery);
    showUxToast("Ù†Ø³Ø®Ù‡ HTML Ú¯Ø²Ø§Ø±Ø´ Ù…Ù‡Ù†Ø¯Ø³ÛŒ Ø°Ø®ÛŒØ±Ù‡ Ø´Ø¯", "success");
  }

  async function exportPdf() {
    try {
      setExporting("pdf");
      await exportElementAsPdf(exportSheetRef.current, delivery, `${projectTitle || "shil"}-engineering-output.pdf`);
      showUxToast("PDF Ù…Ù‡Ù†Ø¯Ø³ÛŒ Ø°Ø®ÛŒØ±Ù‡ Ø´Ø¯", "success");
    } catch (error) {
      showUxToast("Ø®Ø±ÙˆØ¬ÛŒ PDF Ø¨Ø§ Ø®Ø·Ø§ Ø±ÙˆØ¨Ù‡â€ŒØ±Ùˆ Ø´Ø¯Ø› Ø§Ø² Ø®Ø±ÙˆØ¬ÛŒ HTML Ø§Ø³ØªÙØ§Ø¯Ù‡ Ú©Ù†ÛŒØ¯", "warning");
    } finally {
      setExporting("");
    }
  }

  async function shareProject() {
    try {
      await shareDelivery(delivery);
      showUxToast("Ù„ÛŒÙ†Ú© Ø·Ø±Ø§Ø­ÛŒ Ø¨Ø±Ø§ÛŒ Ø§Ø´ØªØ±Ø§Ú© Ø¢Ù…Ø§Ø¯Ù‡ Ø´Ø¯", "success");
    } catch {
      showUxToast("Ø§Ø´ØªØ±Ø§Ú©â€ŒÚ¯Ø°Ø§Ø±ÛŒ Ø§Ù†Ø¬Ø§Ù… Ù†Ø´Ø¯", "warning");
    }
  }

  async function saveProjectImage() {
    try {
      setExporting("png");
      await exportElementAsPng(exportSheetRef.current, `${projectTitle || "shil"}-engineering-output.png`);
      showUxToast("ØªØµÙˆÛŒØ± Ø¬Ù…Ø¹â€ŒØ¨Ù†Ø¯ÛŒ Ù…Ù‡Ù†Ø¯Ø³ÛŒ Ø°Ø®ÛŒØ±Ù‡ Ø´Ø¯", "success");
    } catch {
      showUxToast("Ø°Ø®ÛŒØ±Ù‡ ØªØµÙˆÛŒØ± Ø§Ù†Ø¬Ø§Ù… Ù†Ø´Ø¯", "warning");
    } finally {
      setExporting("");
    }
  }

  return (
    <EngineeringPageShell title="Ø§Ø¬Ø±Ø§ÛŒ Ù…Ø­Ø§Ø³Ø¨Ø§Øª Ùˆ Ø®Ø±ÙˆØ¬ÛŒ Ù†Ù‡Ø§ÛŒÛŒ">
      <section className="shil-card-stack shil-final-delivery-page" ref={exportSheetRef}>
        <div className="shil-section-card shil-delivery-hero">
          <div className="shil-section-head"><h2>Ø¬Ù…Ø¹â€ŒØ¨Ù†Ø¯ÛŒ Ù†Ù‡Ø§ÛŒÛŒ Ù¾Ø±ÙˆÚ˜Ù‡</h2><span>READY FOR DELIVERY</span></div>
          <div className="shil-summary-grid">
            <Row label="Ù†Ø§Ù… Ù¾Ø±ÙˆÚ˜Ù‡" value={projectTitle} />
            <Row label="Ú©Ø§Ø±ÙØ±Ù…Ø§" value={project.clientName || project.customerName || project.employerName} />
            <Row label="Ù…Ø­Ù„ Ø§Ø¬Ø±Ø§" value={[project.city, project.province].filter(Boolean).join(" / ") || "Ø«Ø¨Øª Ù†Ø´Ø¯Ù‡"} />
            <Row label="Ù…Ø³ÛŒØ± Ø·Ø±Ø§Ø­ÛŒ" value={emergency ? "Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ" : "Ù¾Ù†Ù„ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ"} />
            <Row label="ÙˆØ¶Ø¹ÛŒØª Ù…Ø­Ø§Ø³Ø¨Ø§Øª" value={result?.valid === false ? "Ù†ÛŒØ§Ø²Ù…Ù†Ø¯ Ø¨Ø§Ø²Ø¨ÛŒÙ†ÛŒ" : "ØªÚ©Ù…ÛŒÙ„ Ø´Ø¯Ù‡"} />
            <Row label="Ù‚Ø§Ø¨Ù„ÛŒØª Ø®Ø±ÙˆØ¬ÛŒ" value="ØªØµÙˆÛŒØ± / PDF / JSON / CSV / HTML / Ø§Ø´ØªØ±Ø§Ú©" />
            <Row label="Ù†Ø³Ø®Ù‡ Ø®Ø±ÙˆØ¬ÛŒ" value={delivery.meta.version} />
          </div>
        </div>

        {!emergency && aiPreview?.image?.src ? <div className="shil-section-card"><div className="shil-section-head"><h2>ØªØµÙˆÛŒØ± Ù†Ù‡Ø§ÛŒÛŒ Ø·Ø±Ø§Ø­ÛŒ Ù‡ÙˆØ´Ù…Ù†Ø¯</h2><span>AI Preview</span></div><img className="shil-final-preview-image" src={aiPreview.image.src} alt="ØªØµÙˆÛŒØ± Ù†Ù‡Ø§ÛŒÛŒ Ù¾Ø±ÙˆÚ˜Ù‡" /></div> : null}

        <Table title={emergency ? "ØªØ¬Ù‡ÛŒØ²Ø§Øª Ù…ÙˆØ±Ø¯ Ù†ÛŒØ§Ø² Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ" : "ØªØ¬Ù‡ÛŒØ²Ø§Øª Ù…ÙˆØ±Ø¯ Ù†ÛŒØ§Ø² Ø§Ø¬Ø±Ø§ÛŒ Ù¾Ø±ÙˆÚ˜Ù‡ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ"} rows={emergency ? emergencyRows : panelRows} />

        <div className="shil-section-card shil-export-diagram-card">
          <div className="shil-section-head"><h2>Ø¯ÛŒØ§Ú¯Ø±Ø§Ù… Ù…Ù‡Ù†Ø¯Ø³ÛŒ Ø³ÛŒØ³ØªÙ…</h2><span>System Diagram</span></div>
          <div className="shil-export-diagram" aria-label="Ø¯ÛŒØ§Ú¯Ø±Ø§Ù… Ø³ÛŒØ³ØªÙ…">
            {emergency ? (
              <><span>Ø¨Ø±Ù‚ Ø´Ù‡Ø±</span><b>â†’</b><span>Ø´Ø§Ø±Ú˜Ø± / Ø§ÛŒÙ†ÙˆØ±ØªØ± Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ</span><b>â†’</b><span>Ø¨Ø§Ø±Ù‡Ø§ÛŒ Ø¶Ø±ÙˆØ±ÛŒ</span><i>â†“</i><span>Ø¨Ø§Ù†Ú© Ø¨Ø§ØªØ±ÛŒ</span></>
            ) : (
              <><span>Ù¾Ù†Ù„ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ</span><b>â†’</b><span>MPPT / Ø§ÛŒÙ†ÙˆØ±ØªØ±</span><b>â†’</b><span>Ù…ØµØ±Ùâ€ŒÚ©Ù†Ù†Ø¯Ù‡</span><i>â†“</i><span>Ø¨Ø§Ù†Ú© Ø¨Ø§ØªØ±ÛŒ</span></>
            )}
          </div>
        </div>

        <div className="shil-section-card">
          <div className="shil-section-head"><h2>Ø§Ø¹ØªØ¨Ø§Ø±Ø³Ù†Ø¬ÛŒ Ùˆ Ø¯Ù„Ø§ÛŒÙ„ Ù…Ù‡Ù†Ø¯Ø³ÛŒ</h2><span>Validation</span></div>
          <ul className="shil-engineering-list">{(result?.explanations || solarDesign?.explanations || ["Ù…Ø­Ø§Ø³Ø¨Ø§Øª Ø¨Ø± Ø§Ø³Ø§Ø³ Ø¯Ø§Ø¯Ù‡â€ŒÙ‡Ø§ÛŒ Ø«Ø¨Øªâ€ŒØ´Ø¯Ù‡ Ù¾Ø±ÙˆÚ˜Ù‡ Ø§Ù†Ø¬Ø§Ù… Ø´Ø¯."]).map((item) => <li key={item}>{item}</li>)}</ul>
          {result?.warnings?.length ? <div className="shil-inline-warning">{result.warnings.join(" / ")}</div> : <div className="shil-inline-success">Ø·Ø±Ø§Ø­ÛŒ Ø¨Ø±Ø§ÛŒ Ù…Ø±Ø­Ù„Ù‡ Ø®Ø±ÙˆØ¬ÛŒ Ù†Ù‡Ø§ÛŒÛŒ Ø¢Ù…Ø§Ø¯Ù‡ Ø§Ø³Øª.</div>}
        </div>

        <div className="shil-section-card">
          <div className="shil-section-head"><h2>Ø®Ø±ÙˆØ¬ÛŒâ€ŒÙ‡Ø§ÛŒ Ù‚Ø§Ø¨Ù„ Ø¯Ø±ÛŒØ§ÙØª</h2><span>Export</span></div>
          <div className="shil-output-actions">
            <button type="button" onClick={saveProjectImage} disabled={Boolean(exporting)}>{exporting === "png" ? "Ø¯Ø± Ø­Ø§Ù„ Ø³Ø§Ø®Øª ØªØµÙˆÛŒØ±..." : "Ø°Ø®ÛŒØ±Ù‡ ØªØµÙˆÛŒØ± Ù¾Ø±ÙˆÚ˜Ù‡"}</button>
            <button type="button" onClick={exportPdf} disabled={Boolean(exporting)}>{exporting === "pdf" ? "Ø¯Ø± Ø­Ø§Ù„ Ø³Ø§Ø®Øª PDF..." : "Ø®Ø±ÙˆØ¬ÛŒ PDF Ù…Ù‡Ù†Ø¯Ø³ÛŒ"}</button>
            <button type="button" onClick={downloadJson}>Ø°Ø®ÛŒØ±Ù‡ Ù¾Ø±ÙˆÚ˜Ù‡ JSON</button>
            <button type="button" onClick={downloadCsv}>Ø®Ø±ÙˆØ¬ÛŒ CSV ØªØ¬Ù‡ÛŒØ²Ø§Øª</button>
            <button type="button" onClick={downloadHtml}>Ú¯Ø²Ø§Ø±Ø´ HTML Ù‚Ø§Ø¨Ù„ Ú†Ø§Ù¾</button>
            <button type="button" onClick={shareProject}>Ø§Ø´ØªØ±Ø§Ú© Ø·Ø±Ø§Ø­ÛŒ</button>
          </div>
        </div>

        <button type="button" className="shil-primary-wide" onClick={saveFinalProject}>{ran ? "Ù¾Ø±ÙˆÚ˜Ù‡ Ø¯Ø± Ù†Ù‡Ø§ÛŒÛŒâ€ŒÙ‡Ø§ Ø«Ø¨Øª Ø´Ø¯" : "ØªØ§ÛŒÛŒØ¯ Ù†Ù‡Ø§ÛŒÛŒ Ùˆ Ø«Ø¨Øª Ù¾Ø±ÙˆÚ˜Ù‡"}</button>
        <Link className="shil-soft-link-button" to="/projects/final">Ù…Ø´Ø§Ù‡Ø¯Ù‡ Ù¾Ø±ÙˆÚ˜Ù‡â€ŒÙ‡Ø§ÛŒ Ù†Ù‡Ø§ÛŒÛŒ</Link>
      </section>
    </EngineeringPageShell>
  );
}
