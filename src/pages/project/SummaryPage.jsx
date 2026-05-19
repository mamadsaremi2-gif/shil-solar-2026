import React, { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import EngineeringPageShell from "../../components/EngineeringPageShell.jsx";
import { approveProjectStep } from "../../workflow/projectWorkflow.js";
import { runEmergencyPowerDesign } from "../../core/calculation/emergencyPowerEngine.js";
import { createAIInstallationPreview } from "../../ai/installation/aiInstallationPreviewEngine.js";
import { generateAIInstallationImage } from "../../ai/installation/aiInstallationImageService.js";

function readDraft(key, fallback = {}) {
  try { return JSON.parse(localStorage.getItem(key) || "null") || fallback; } catch { return fallback; }
}

function fmt(value, fallback = "Ø«Ø¨Øª Ù†Ø´Ø¯Ù‡") {
  if (value === null || value === undefined || value === "") return fallback;
  return value;
}

function SummaryBlock({ title, badge, children }) {
  return (
    <div className="shil-section-card shil-summary-block-card">
      <div className="shil-section-head"><h2>{title}</h2><span>{badge}</span></div>
      <div className="shil-summary-grid">{children}</div>
    </div>
  );
}

function SummaryItem({ label, value, note }) {
  return <div><span>{label}</span><strong>{fmt(value)}</strong>{note ? <small>{note}</small> : null}</div>;
}

function getFirstSiteImage(environment = {}) {
  const attachments = Array.isArray(environment.siteAttachments) ? environment.siteAttachments : [];
  const first = attachments[0] || environment.siteAttachment || environment.sitePhoto || environment.installationImage || null;
  if (!first) return null;
  if (typeof first === "string") return { src: first, title: "ØªØµÙˆÛŒØ± Ù…Ø­Ù„ Ù†ØµØ¨" };
  return { src: first.dataUrl || first.previewUrl || first.url || first.src || first.base64 || "", title: first.name || first.fileName || "ØªØµÙˆÛŒØ± Ù…Ø­Ù„ Ù†ØµØ¨" };
}

function AiReasonTable({ title, rows }) {
  return (
    <div className="shil-ai-install-table-card">
      <h3>{title}</h3>
      <div className="shil-ai-install-table">
        <div className="head"><span>Ù¾Ø§Ø±Ø§Ù…ØªØ±</span><span>Ù…Ù‚Ø¯Ø§Ø±</span><span>Ø¹Ù„Øª Ø§Ù†ØªØ®Ø§Ø¨</span></div>
        {rows.map((row) => <div key={`${title}-${row.label}`}><span>{row.label}</span><strong>{row.value}</strong><small>{row.reason}</small></div>)}
      </div>
    </div>
  );
}

export default function SummaryPage() {
  const { domain = "solar" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const emergency = domain === "emergency";
  const method = location.state?.method || readDraft("shil:selectedCalculationMethod", { title: emergency ? "Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ" : "Ù„ÛŒØ³Øª ØªØ¬Ù‡ÛŒØ²Ø§Øª" })?.title || (emergency ? "Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ" : "Ù„ÛŒØ³Øª ØªØ¬Ù‡ÛŒØ²Ø§Øª");

  const project = useMemo(() => readDraft("shil:projectInfoDraft", {}), []);
  const environment = useMemo(() => readDraft("shil:environmentDraft", {}), []);
  const loadResult = useMemo(() => readDraft("shil:loadEngineResult", {}), []);
  const systemSettings = useMemo(() => readDraft("shil:systemSettingsDraft", {}), []);
  const solarDesign = useMemo(() => readDraft("shil:solarSystemDesign", systemSettings?.design || {}), [systemSettings]);
  const selectedEquipment = useMemo(() => readDraft("shil:selectedEquipments", []), []);
  const environmentImage = useMemo(() => getFirstSiteImage(environment), [environment]);
  const emergencyDesign = useMemo(() => emergency ? runEmergencyPowerDesign({ load: loadResult, settings: readDraft("shil:emergencyPowerSettings", {}) }) : null, [emergency, loadResult]);

  const [aiOpen, setAiOpen] = useState(false);
  const [imageTransferred, setImageTransferred] = useState(false);
  const [aiApplied, setAiApplied] = useState(Boolean(readDraft("shil:aiInstallationPreview", null)));
  const [aiResult, setAiResult] = useState(() => readDraft("shil:aiInstallationPreview", null));
  const [aiMessage, setAiMessage] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [installMode, setInstallMode] = useState("roof");

  const sitePhotoCount = Number(environment.siteAttachments?.length || (environment.siteAttachment ? 1 : 0) || (environmentImage ? 1 : 0));
  const hasSitePhoto = sitePhotoCount > 0 && Boolean(environmentImage?.src || environmentImage?.title);
  const activeDesign = emergency ? emergencyDesign : solarDesign;
  const panelCount = solarDesign?.pvArray?.panelCount || systemSettings?.panelCount || "-";
  const panelPower = solarDesign?.panel?.powerW || systemSettings?.panelPowerW || 620;
  const panelSeries = solarDesign?.pvArray?.seriesCount || systemSettings?.panelSeriesCount || "-";
  const panelParallel = solarDesign?.pvArray?.parallelCount || systemSettings?.panelParallelCount || "-";
  const inverterCount = activeDesign?.inverter?.count || systemSettings?.inverterCount || "-";
  const inverterPower = activeDesign?.inverter?.powerW || activeDesign?.inverter?.ratedPowerW || systemSettings?.inverterPowerW || "-";
  const batteryCount = activeDesign?.battery?.totalCount || systemSettings?.batteryCount || "-";
  const batteryVoltage = activeDesign?.battery?.battery?.voltageV || activeDesign?.battery?.battery?.nominalVoltage || activeDesign?.battery?.bankVoltageV || systemSettings?.batteryVoltageV || "-";
  const batteryCapacity = activeDesign?.battery?.battery?.capacityAh || activeDesign?.battery?.capacityAh || systemSettings?.batteryCapacityAh || "-";
  const batterySeries = activeDesign?.battery?.seriesCount || systemSettings?.batterySeriesCount || "-";
  const batteryParallel = activeDesign?.battery?.parallelCount || systemSettings?.batteryParallelCount || "-";
  const requiredPower = activeDesign?.load?.designPeakW || activeDesign?.load?.totalPowerW || activeDesign?.requiredPowerW || loadResult?.designPowerW || loadResult?.peakPowerW || "Ø¯Ø± Ø§Ù†ØªØ¸Ø§Ø± Ù…Ø­Ø§Ø³Ø¨Ù‡";

  const transferSiteImage = () => {
    if (!hasSitePhoto) {
      setImageTransferred(false); setAiApplied(false);
      setAiMessage("Ø¨Ø±Ø§ÛŒ Ø§Ø³ØªÙØ§Ø¯Ù‡ Ø§Ø² Ø§ÛŒÙ† Ø¨Ù„ÙˆÚ© Ø§Ø®ØªÛŒØ§Ø±ÛŒØŒ Ø§Ø¨ØªØ¯Ø§ Ø¯Ø± ØµÙØ­Ù‡ Ø´Ø±Ø§ÛŒØ· Ù…Ø­ÛŒØ·ÛŒ ØªØµÙˆÛŒØ± Ù…Ø­Ù„ Ù†ØµØ¨ Ùˆ Ø§Ø¬Ø±Ø§ Ø±Ø§ Ø«Ø¨Øª Ú©Ù†ÛŒØ¯.");
      return;
    }
    localStorage.setItem("shil:aiInstallationSourceImage", JSON.stringify({ transferredAt: new Date().toISOString(), source: "environment.siteAttachments", image: environmentImage, installMode }));
    setImageTransferred(true);
    setAiMessage("ØªØµÙˆÛŒØ± Ù…Ø­Ù„ Ù†ØµØ¨ Ø§Ø² Ø´Ø±Ø§ÛŒØ· Ù…Ø­ÛŒØ·ÛŒ Ø¨Ù‡ Ø¨Ù„ÙˆÚ© Ù‡ÙˆØ´ Ù…ØµÙ†ÙˆØ¹ÛŒ Ù…Ù†ØªÙ‚Ù„ Ø´Ø¯. Ø§Ú©Ù†ÙˆÙ† Ù…ÛŒâ€ŒØªÙˆØ§Ù†ÛŒØ¯ Ø´Ø¨ÛŒÙ‡â€ŒØ³Ø§Ø²ÛŒ ØªØµÙˆÛŒØ±ÛŒ Ø±Ø§ Ø§Ø¹Ù…Ø§Ù„ Ú©Ù†ÛŒØ¯.");
  };

  const applyAiPreview = async () => {
    if (!hasSitePhoto || !imageTransferred) {
      setAiApplied(false);
      setAiMessage("Ø§Ø¨ØªØ¯Ø§ Ø¯Ú©Ù…Ù‡ Â«Ø§ÙØ²ÙˆØ¯Ù† ØªØµÙˆÛŒØ± Ù…Ø­Ù„ Ù†ØµØ¨ Ùˆ Ø§Ø¬Ø±Ø§Â» Ø±Ø§ Ø¨Ø²Ù†ÛŒØ¯ ØªØ§ ØªØµÙˆÛŒØ± Ø§ÛŒÙ† Ù¾Ø±ÙˆÚ˜Ù‡ ÙˆØ§Ø±Ø¯ Ø¨Ù„ÙˆÚ© Ù‡ÙˆØ´ Ù…ØµÙ†ÙˆØ¹ÛŒ Ø´ÙˆØ¯.");
      return;
    }

    const basePayload = createAIInstallationPreview({
      installMode,
      image: environmentImage,
      panel: { count: panelCount, powerW: panelPower, series: panelSeries, parallel: panelParallel },
      inverter: { count: inverterCount, powerW: inverterPower, title: solarDesign?.inverter?.title || systemSettings?.inverterId },
      battery: { count: batteryCount, voltageV: batteryVoltage, capacityAh: batteryCapacity, series: batterySeries, parallel: batteryParallel },
      project,
      environment
    });

    setAiGenerating(true);
    setAiMessage("Ø¯Ø± Ø­Ø§Ù„ Ø§ØªØµØ§Ù„ Ø¨Ù‡ Ø³Ø±ÙˆÛŒØ³ ÙˆØ§Ù‚Ø¹ÛŒ ØªÙˆÙ„ÛŒØ¯ ØªØµÙˆÛŒØ± Ùˆ Ø³Ø§Ø®Øª Ø´Ø¨ÛŒÙ‡â€ŒØ³Ø§Ø²ÛŒ Ù…Ø­Ù„ Ù†ØµØ¨...");

    const imageGeneration = await generateAIInstallationImage(basePayload);
    const previewPayload = {
      ...basePayload,
      status: imageGeneration.ok ? "generated" : "ready-without-image-service",
      imageGeneration,
      generatedImage: imageGeneration.ok ? (imageGeneration.imageDataUrl || imageGeneration.imageUrl) : null,
      serviceConnected: Boolean(imageGeneration.ok),
    };

    localStorage.setItem("shil:aiInstallationPreview", JSON.stringify(previewPayload));
    setAiResult(previewPayload);
    setAiApplied(true);
    setAiGenerating(false);
    setAiMessage(imageGeneration.ok
      ? "ØªØµÙˆÛŒØ± ÙˆØ§Ù‚Ø¹ÛŒ Ø´Ø¨ÛŒÙ‡â€ŒØ³Ø§Ø²ÛŒ Ù†ØµØ¨ Ø¨Ø§ Ø³Ø±ÙˆÛŒØ³ Ù‡ÙˆØ´ Ù…ØµÙ†ÙˆØ¹ÛŒ ØªÙˆÙ„ÛŒØ¯ Ø´Ø¯ Ùˆ Ø¬Ø¯ÙˆÙ„ Ù…Ù‡Ù†Ø¯Ø³ÛŒ ØªØ¬Ù‡ÛŒØ²Ø§Øª Ø¢Ù…Ø§Ø¯Ù‡ ØªØ§ÛŒÛŒØ¯ Ø§Ø³Øª."
      : `Ø¬Ø¯ÙˆÙ„ Ù…Ù‡Ù†Ø¯Ø³ÛŒ Ùˆ Ù¾Ø±Ø§Ù…Ù¾Øª Ø¢Ù…Ø§Ø¯Ù‡ Ø´Ø¯ØŒ Ø§Ù…Ø§ ØªÙˆÙ„ÛŒØ¯ ØªØµÙˆÛŒØ± ÙˆØ§Ù‚Ø¹ÛŒ Ú©Ø§Ù…Ù„ Ù†Ø´Ø¯: ${imageGeneration.error}`
    );
  };

  const confirmAiPreview = () => {
    if (!aiApplied) { setAiMessage("Ø¨Ø±Ø§ÛŒ ØªØ§ÛŒÛŒØ¯ Ø§ÛŒÙ† Ø¨Ù„ÙˆÚ© Ø§Ø®ØªÛŒØ§Ø±ÛŒØŒ Ø§Ø¨ØªØ¯Ø§ ØªØµÙˆÛŒØ± Ù…Ø­Ù„ Ù†ØµØ¨ Ø±Ø§ Ø§Ø¶Ø§ÙÙ‡ Ùˆ Ø¯Ú©Ù…Ù‡ Ø§Ø¹Ù…Ø§Ù„ Ø±Ø§ Ø¨Ø²Ù†ÛŒØ¯."); return; }
    localStorage.setItem("shil:aiInstallationPreviewConfirmed", JSON.stringify({ confirmedAt: new Date().toISOString(), installMode }));
    setAiMessage("Ø¨Ù„ÙˆÚ© Ù‡ÙˆØ´ Ù…ØµÙ†ÙˆØ¹ÛŒ Ù†ØµØ¨ Ù¾Ø±ÙˆÚ˜Ù‡ ØªØ§ÛŒÛŒØ¯ Ø´Ø¯ Ùˆ Ù‡Ù…Ø±Ø§Ù‡ Ú†Ú©ÛŒØ¯Ù‡ Ø§Ø·Ù„Ø§Ø¹Ø§Øª Ø°Ø®ÛŒØ±Ù‡ Ù…ÛŒâ€ŒØ´ÙˆØ¯.");
  };

  const confirmSummary = () => {
    approveProjectStep("summary");
    localStorage.setItem("shil:summaryDraft", JSON.stringify({ domain, method, project, environment, loadResult, systemSettings, solarDesign, emergencyDesign, aiPreviewRequested: !emergency && aiApplied, confirmedAt: new Date().toISOString() }));
    navigate(`/new-project/run/${domain}`, { state: { method, aiPreviewRequested: !emergency && aiApplied } });
  };

  const generatedVisualSrc = aiResult?.generatedImage || aiResult?.imageGeneration?.imageDataUrl || aiResult?.imageGeneration?.imageUrl || "";
  const visualSrc = generatedVisualSrc || (imageTransferred && environmentImage?.src ? environmentImage.src : "");
  const hasGeneratedVisual = Boolean(generatedVisualSrc);

  const installationModes = [
    { key: "roof", title: "Ù†ØµØ¨ Ø±ÙˆÛŒ Ø³Ù‚Ù" }, { key: "ground", title: "Ù†ØµØ¨ Ø²Ù…ÛŒÙ†ÛŒ" },
    { key: "hybrid", title: "Ù†ØµØ¨ ØªØ±Ú©ÛŒØ¨ÛŒ" }, { key: "equipmentRoom", title: "Ø§ØªØ§Ù‚ Ø¨Ø§ØªØ±ÛŒ Ùˆ Ø§ÛŒÙ†ÙˆØ±ØªØ±" }
  ];
  const panelRows = aiResult?.tables?.panel || [
    { label: "ØªØ¹Ø¯Ø§Ø¯ Ù¾Ù†Ù„", value: `${panelCount} Ø¹Ø¯Ø¯`, reason: "Ø¨Ø± Ø§Ø³Ø§Ø³ Ø§Ù†Ø±Ú˜ÛŒ Ø±ÙˆØ²Ø§Ù†Ù‡ Ùˆ ØªÙˆØ§Ù† Ø·Ø±Ø§Ø­ÛŒ Ù…ÙˆØªÙˆØ± Ù…Ø­Ø§Ø³Ø¨Ø§Øª ØªØ¹ÛŒÛŒÙ† Ø´Ø¯Ù‡ Ø§Ø³Øª." },
    { label: "ØªÙˆØ§Ù† Ù‡Ø± Ù¾Ù†Ù„", value: `${panelPower} ÙˆØ§Øª`, reason: "Ù¾Ù†Ù„ Ù¾ÛŒØ´â€ŒÙØ±Ø¶ Ù…Ù‡Ù†Ø¯Ø³ÛŒ SHIL Ø¨Ø±Ø§ÛŒ Ø·Ø±Ø§Ø­ÛŒ ÙØ¹Ù„ÛŒ Ø§Ø³ØªØŒ Ù…Ú¯Ø± Ø§ÛŒÙ†Ú©Ù‡ Ú©Ø§Ø±Ø¨Ø± Ù…Ù‚Ø¯Ø§Ø± Ø¯Ø³ØªÛŒ ÙˆØ§Ø±Ø¯ Ú©Ù†Ø¯." },
    { label: "Ø¢Ø±Ø§ÛŒØ´ Ø³Ø±ÛŒ", value: `${panelSeries} Ø³Ø±ÛŒ`, reason: "Ø¨Ø±Ø§ÛŒ Ø±Ø³Ø§Ù†Ø¯Ù† ÙˆÙ„ØªØ§Ú˜ Ø±Ø´ØªÙ‡ Ù¾Ù†Ù„ Ø¨Ù‡ Ù…Ø­Ø¯ÙˆØ¯Ù‡ Ù…Ø¬Ø§Ø² MPPT Ø§Ù†ØªØ®Ø§Ø¨ Ø´Ø¯Ù‡ Ø§Ø³Øª." },
    { label: "Ø¢Ø±Ø§ÛŒØ´ Ù…ÙˆØ§Ø²ÛŒ", value: `${panelParallel} Ù…ÙˆØ§Ø²ÛŒ`, reason: "Ø¨Ø±Ø§ÛŒ Ø§ÙØ²Ø§ÛŒØ´ Ø¬Ø±ÛŒØ§Ù† Ùˆ Ø±Ø³ÛŒØ¯Ù† Ø¨Ù‡ Ø¸Ø±ÙÛŒØª Ú©Ù„ Ø¢Ø±Ø§ÛŒÙ‡ Ø§Ø³ØªÙØ§Ø¯Ù‡ Ø´Ø¯Ù‡ Ø§Ø³Øª." }
  ];
  const inverterRows = aiResult?.tables?.inverter || [
    { label: "ØªØ¹Ø¯Ø§Ø¯ Ø§ÛŒÙ†ÙˆØ±ØªØ±", value: `${inverterCount} Ø¹Ø¯Ø¯`, reason: "Ø¨Ø± Ø§Ø³Ø§Ø³ ØªÙˆØ§Ù† Ù¾ÛŒÚ©ØŒ Ø¶Ø±ÛŒØ¨ Ø§Ø·Ù…ÛŒÙ†Ø§Ù† Ùˆ Ø³Ù†Ø§Ø±ÛŒÙˆÛŒ Ø§Ø¬Ø±Ø§ÛŒ Ù¾Ø±ÙˆÚ˜Ù‡ Ø§Ù†ØªØ®Ø§Ø¨ Ø´Ø¯Ù‡ Ø§Ø³Øª." },
    { label: "ØªÙˆØ§Ù† Ø§ÛŒÙ†ÙˆØ±ØªØ±", value: inverterPower === "-" ? "Ø«Ø¨Øª Ù†Ø´Ø¯Ù‡" : `${inverterPower} ÙˆØ§Øª`, reason: "Ø¨Ø§ÛŒØ¯ ØªÙˆØ§Ù† Ù‡Ù…Ø²Ù…Ø§Ù† Ùˆ Ø¬Ø±ÛŒØ§Ù† Ø±Ø§Ù‡â€ŒØ§Ù†Ø¯Ø§Ø²ÛŒ Ø¨Ø§Ø±Ù‡Ø§ÛŒ Ø§ØµÙ„ÛŒ Ø±Ø§ Ù¾ÙˆØ´Ø´ Ø¯Ù‡Ø¯." },
    { label: "Ù†ÙˆØ¹ Ø§Ù†ØªØ®Ø§Ø¨", value: solarDesign?.inverter?.title || systemSettings?.inverterId || "Ø§Ù†ØªØ®Ø§Ø¨ Ù‡ÙˆØ´Ù…Ù†Ø¯", reason: "Ø§Ø² Ø¨Ø§Ù†Ú© Ø§ÛŒÙ†ÙˆØ±ØªØ± Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ Ù…Ø·Ø§Ø¨Ù‚ Ù†ÙˆØ¹ Ø¢ÙÚ¯Ø±ÛŒØ¯ØŒ Ø¢Ù†Ú¯Ø±ÛŒØ¯ ÛŒØ§ Ù‡ÛŒØ¨Ø±ÛŒØ¯ Ø§Ù†ØªØ®Ø§Ø¨ Ù…ÛŒâ€ŒØ´ÙˆØ¯." }
  ];
  const batteryRows = aiResult?.tables?.battery || [
    { label: "ØªØ¹Ø¯Ø§Ø¯ Ø¨Ø§ØªØ±ÛŒ", value: `${batteryCount} Ø¹Ø¯Ø¯`, reason: "Ø¨Ø±Ø§ÛŒ ØªØ§Ù…ÛŒÙ† Ø±ÙˆØ²Ù‡Ø§ÛŒ Ø®ÙˆØ¯Ú©ÙØ§ÛŒÛŒ Ùˆ Ø¸Ø±ÙÛŒØª Ø°Ø®ÛŒØ±Ù‡ Ø§Ù†Ø±Ú˜ÛŒ Ù¾Ø±ÙˆÚ˜Ù‡ ØªØ¹ÛŒÛŒÙ† Ø´Ø¯Ù‡ Ø§Ø³Øª." },
    { label: "ÙˆÙ„ØªØ§Ú˜ / Ø¸Ø±ÙÛŒØª", value: `${batteryVoltage}V / ${batteryCapacity}Ah`, reason: "Ø¨Ø±Ø§ÛŒ Ø³Ø§Ø²Ú¯Ø§Ø±ÛŒ Ø¨Ø§ ÙˆÙ„ØªØ§Ú˜ Ø¨Ø§Ø³ DC Ùˆ Ø¸Ø±ÙÛŒØª Ø°Ø®ÛŒØ±Ù‡ Ù…ÙˆØ±Ø¯ Ù†ÛŒØ§Ø² Ø§Ù†ØªØ®Ø§Ø¨ Ø´Ø¯Ù‡ Ø§Ø³Øª." },
    { label: "Ø¢Ø±Ø§ÛŒØ´ Ø³Ø±ÛŒ", value: `${batterySeries} Ø³Ø±ÛŒ`, reason: "Ø¨Ø±Ø§ÛŒ Ø±Ø³ÛŒØ¯Ù† Ø¨Ù‡ ÙˆÙ„ØªØ§Ú˜ Ú©Ø§Ø±ÛŒ Ø¨Ø§Ù†Ú© Ø¨Ø§ØªØ±ÛŒ Ù…Ø­Ø§Ø³Ø¨Ù‡ Ø´Ø¯Ù‡ Ø§Ø³Øª." },
    { label: "Ø¢Ø±Ø§ÛŒØ´ Ù…ÙˆØ§Ø²ÛŒ", value: `${batteryParallel} Ù…ÙˆØ§Ø²ÛŒ`, reason: "Ø¨Ø±Ø§ÛŒ Ø§ÙØ²Ø§ÛŒØ´ Ø¸Ø±ÙÛŒØª Ah Ùˆ Ù¾Ø§ÛŒØ¯Ø§Ø±ÛŒ Ø°Ø®ÛŒØ±Ù‡ Ø§Ù†Ø±Ú˜ÛŒ Ø§Ø³ØªÙØ§Ø¯Ù‡ Ø´Ø¯Ù‡ Ø§Ø³Øª." }
  ];

  return (
    <EngineeringPageShell title="Ú†Ú©ÛŒØ¯Ù‡ Ø§Ø·Ù„Ø§Ø¹Ø§Øª">
      <section className="shil-card-stack shil-final-summary-page">
        <SummaryBlock title="Ø§Ø·Ù„Ø§Ø¹Ø§Øª Ù¾Ø±ÙˆÚ˜Ù‡" badge="Project">
          <SummaryItem label="Ù†Ø§Ù… Ù¾Ø±ÙˆÚ˜Ù‡" value={project.projectName || project.name} />
          <SummaryItem label="Ù†ÙˆØ¹ Ù…Ø³ÛŒØ±" value={emergency ? "Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ" : "Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ"} />
          <SummaryItem label="Ø±ÙˆØ´ Ù…Ø­Ø§Ø³Ø¨Ø§Øª" value={method} />
          <SummaryItem label="ØªØ¹Ø¯Ø§Ø¯ ØªØ¬Ù‡ÛŒØ²Ø§Øª Ø§Ù†ØªØ®Ø§Ø¨ÛŒ" value={Array.isArray(selectedEquipment) ? `${selectedEquipment.length} Ù…ÙˆØ±Ø¯` : "Ø«Ø¨Øª Ù†Ø´Ø¯Ù‡"} />
        </SummaryBlock>

        <SummaryBlock title={emergency ? "Ø´Ø±Ø§ÛŒØ· Ø§Ø¬Ø±Ø§ÛŒ Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ" : "Ø´Ø±Ø§ÛŒØ· Ù…Ø­ÛŒØ·ÛŒ"} badge="Environment">
          <SummaryItem label="Ø´Ù‡Ø± / Ø§Ø³ØªØ§Ù†" value={`${fmt(environment.city)} / ${fmt(environment.province)}`} />
          <SummaryItem label="Ù†ÙˆØ¹ Ù…Ø­Ù„ Ø§Ø¬Ø±Ø§" value={environment.installTypeLabel} />
          {!emergency ? <SummaryItem label="Ø³Ø§Ø¹Øª Ø¢ÙØªØ§Ø¨ÛŒ" value={environment.peakSunHours ? `${environment.peakSunHours} Ø³Ø§Ø¹Øª` : null} /> : null}
          {!emergency ? <SummaryItem label="Ø¬Ù‡Øª Ùˆ Ø²Ø§ÙˆÛŒÙ‡ Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯ÛŒ" value={`${environment.recommendedAzimuthDeg || 180}Â° / ${environment.recommendedTiltDeg || 32}Â°`} /> : null}
          {!emergency ? <SummaryItem label="ØªØµØ§ÙˆÛŒØ± Ù…Ø­Ù„ Ù†ØµØ¨" value={`${sitePhotoCount} Ø¹Ú©Ø³`} /> : null}
          <SummaryItem label="Ø¬Ù‡Øªâ€ŒÙ†Ù…Ø§" value={environment.compassAttachment ? "Ø«Ø¨Øª Ø´Ø¯Ù‡" : "Ø«Ø¨Øª Ù†Ø´Ø¯Ù‡"} />
        </SummaryBlock>

        <SummaryBlock title="Ù…ØµØ±Ù Ùˆ ÙˆØ±ÙˆØ¯ÛŒ Ù…Ø­Ø§Ø³Ø¨Ø§Øª" badge="Load">
          <SummaryItem label="ØªÙˆØ§Ù† Ø·Ø±Ø§Ø­ÛŒ" value={typeof requiredPower === "number" ? `${Math.round(requiredPower)} W` : requiredPower} />
          {emergency ? <SummaryItem label="Ø²Ù…Ø§Ù† Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ Ù…ÙˆØ±Ø¯ Ù†ÛŒØ§Ø²" value={`${emergencyDesign?.settings?.requiredEmergencyHours || 2} Ø³Ø§Ø¹Øª`} /> : <SummaryItem label="Ø§Ù†Ø±Ú˜ÛŒ Ø±ÙˆØ²Ø§Ù†Ù‡" value={loadResult?.dailyEnergyWh ? `${Math.round(loadResult.dailyEnergyWh / 1000)} kWh` : loadResult?.dailyEnergyKWh ? `${loadResult.dailyEnergyKWh} kWh` : null} />}
          <SummaryItem label="Ø¨Ø§Ø± Ù…ÙˆØªÙˆØ±ÛŒ" value={loadResult?.motorLoadsCount ? `${loadResult.motorLoadsCount} Ù…ÙˆØ±Ø¯` : "Ù…Ø·Ø§Ø¨Ù‚ Ù„ÛŒØ³Øª ØªØ¬Ù‡ÛŒØ²Ø§Øª"} />
          <SummaryItem label="Ú©Ù†ØªØ±Ù„ Ø±Ø§Ù‡â€ŒØ§Ù†Ø¯Ø§Ø²ÛŒ" value="Ø¯Ø± Ù…ÙˆØªÙˆØ± Ù…Ø­Ø§Ø³Ø¨Ø§Øª Ù„Ø­Ø§Ø¸ Ù…ÛŒâ€ŒØ´ÙˆØ¯" />
        </SummaryBlock>

        {emergency ? (
          <>
            <SummaryBlock title="Ù¾ÛŒÚ©Ø±Ø¨Ù†Ø¯ÛŒ Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ" badge={emergencyDesign?.valid ? "ØªØ£ÛŒÛŒØ¯ Ø´Ø¯Ù‡" : "Ú©Ù†ØªØ±Ù„â€ŒØ´Ø¯Ù‡"}>
              <SummaryItem label="Ø§ÛŒÙ†ÙˆØ±ØªØ± Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ" value={emergencyDesign?.inverter?.title} note={`${emergencyDesign?.inverter?.count || 1} Ø¹Ø¯Ø¯ / ${emergencyDesign?.inverter?.ratedPowerW || "-"} ÙˆØ§Øª`} />
              <SummaryItem label="Ø¨Ø§ØªØ±ÛŒ Ù…Ù†ØªØ®Ø¨" value={emergencyDesign?.battery?.battery?.title} note={`${batteryCount} Ø¹Ø¯Ø¯ / ${batterySeries} Ø³Ø±ÛŒ Ã— ${batteryParallel} Ù…ÙˆØ§Ø²ÛŒ`} />
              <SummaryItem label="ÙˆÙ„ØªØ§Ú˜ Ø¨Ø§Ù†Ú© Ø¨Ø§ØªØ±ÛŒ" value={`${batteryVoltage} ÙˆÙ„Øª`} />
              <SummaryItem label="Ø§Ù†Ø±Ú˜ÛŒ Ù…ÙˆØ±Ø¯ Ù†ÛŒØ§Ø²" value={emergencyDesign?.requiredEnergyWh ? `${Math.round(emergencyDesign.requiredEnergyWh / 1000)} kWh` : null} />
              <SummaryItem label="Ø­ÙØ§Ø¸Øª Ø¨Ø§ØªØ±ÛŒ" value={`Ú©Ù„ÛŒØ¯ DC ${emergencyDesign?.protection?.dcBreakerA || "-"}A`} />
              <SummaryItem label="Ø­ÙØ§Ø¸Øª Ø®Ø±ÙˆØ¬ÛŒ" value={`Ú©Ù„ÛŒØ¯ AC ${emergencyDesign?.protection?.acBreakerA || "-"}A`} />
            </SummaryBlock>
            <div className="shil-section-card shil-summary-block-card">
              <div className="shil-section-head"><h2>Ø¯Ù„Ø§ÛŒÙ„ Ø§Ù†ØªØ®Ø§Ø¨ Ùˆ Ø§Ø³ØªØ§Ù†Ø¯Ø§Ø±Ø¯ Ø§Ø¬Ø±Ø§</h2><span>Emergency Power</span></div>
              <ul className="shil-engineering-list">{emergencyDesign?.explanations?.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          </>
        ) : (
          <SummaryBlock title="Ù¾ÛŒÚ©Ø±Ø¨Ù†Ø¯ÛŒ Ø³ÛŒØ³ØªÙ…" badge={solarDesign?.valid ? "ØªØ£ÛŒÛŒØ¯ Ø´Ø¯Ù‡" : "Ú©Ù†ØªØ±Ù„â€ŒØ´Ø¯Ù‡"}>
            <SummaryItem label="Ø§ÛŒÙ†ÙˆØ±ØªØ±" value={solarDesign?.inverter?.title || systemSettings?.inverterId} note={solarDesign?.inverter?.count ? `${solarDesign.inverter.count} Ø¹Ø¯Ø¯` : null} />
            <SummaryItem label="Ø¨Ø§ØªØ±ÛŒ" value={solarDesign?.battery?.battery?.title || systemSettings?.batteryId} note={solarDesign?.battery?.totalCount ? `${solarDesign.battery.totalCount} Ø¹Ø¯Ø¯ / ${solarDesign.battery.seriesCount} Ø³Ø±ÛŒ Ã— ${solarDesign.battery.parallelCount} Ù…ÙˆØ§Ø²ÛŒ` : null} />
            <SummaryItem label="Ù¾Ù†Ù„ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ" value={solarDesign?.panel?.title || systemSettings?.panelId} note={solarDesign?.pvArray?.panelCount ? `${solarDesign.pvArray.panelCount} Ø¹Ø¯Ø¯ / ${solarDesign.pvArray.seriesCount} Ø³Ø±ÛŒ Ã— ${solarDesign.pvArray.parallelCount} Ù…ÙˆØ§Ø²ÛŒ` : null} />
            <SummaryItem label="ÙØ¶Ø§ÛŒ Ù†ØµØ¨" value={solarDesign?.space?.maintenanceAreaM2 ? `${solarDesign.space.maintenanceAreaM2} mÂ²` : null} />
            <SummaryItem label="Ø­ÙØ§Ø¸Øª" value={solarDesign?.protection ? `DC ${solarDesign.protection.dcBreakerA}A / AC ${solarDesign.protection.acBreakerA}A` : null} />
            <SummaryItem label="Ú©Ø§Ø¨Ù„" value={solarDesign?.protection ? `DC ${solarDesign.protection.dcCable} / BAT ${solarDesign.protection.batteryCable}` : null} />
          </SummaryBlock>
        )}

        {!emergency ? (
          <div className={aiOpen ? "shil-section-card shil-ai-preview-card shil-ai-preview-card-open" : "shil-section-card shil-ai-preview-card"}>
            <button type="button" className="shil-ai-preview-toggle" onClick={() => setAiOpen((value) => !value)}>
              <span><strong>Ø§Ø¬Ø±Ø§ÛŒ Ù‡ÙˆØ´ Ù…ØµÙ†ÙˆØ¹ÛŒ Ù†ØµØ¨ Ù¾Ø±ÙˆÚ˜Ù‡</strong><small>Ø§Ø®ØªÛŒØ§Ø±ÛŒØ› Ø´Ø¨ÛŒÙ‡â€ŒØ³Ø§Ø²ÛŒ ØªØµÙˆÛŒØ±ÛŒ Ù…Ø­Ù„ Ù†ØµØ¨ Ùˆ Ù†Ù…Ø§ÛŒØ´ Ø¬Ø¯ÙˆÙ„ Ù…Ù‡Ù†Ø¯Ø³ÛŒ ØªØ¬Ù‡ÛŒØ²Ø§Øª Ù†Ù‡Ø§ÛŒÛŒ</small></span>
              <b>{aiOpen ? "Ø¨Ø³ØªÙ†" : "Ù†Ù…Ø§ÛŒØ´"}</b>
            </button>
            {aiOpen ? (
              <div className="shil-ai-preview-body">
                <p className="shil-muted-line">Ø§ÛŒÙ† Ø¨Ù„ÙˆÚ© ÙÙ‚Ø· Ø¨Ø±Ø§ÛŒ Ø´Ø¨ÛŒÙ‡â€ŒØ³Ø§Ø²ÛŒ ØªØµÙˆÛŒØ±ÛŒ Ø§Ø®ØªÛŒØ§Ø±ÛŒ Ø§Ø³Øª Ùˆ Ø±ÙˆÛŒ Ù…Ø­Ø§Ø³Ø¨Ø§Øª Ø§ØµÙ„ÛŒ Ø§Ø«Ø± Ø§Ø¬Ø¨Ø§Ø±ÛŒ Ù†Ø¯Ø§Ø±Ø¯.</p>
                <div className="shil-ai-transfer-row">
                  <div className={hasSitePhoto ? "shil-ai-source-status ready" : "shil-ai-source-status"}><span>{hasSitePhoto ? "ØªØµÙˆÛŒØ± Ù…Ø­Ù„ Ø§Ø¬Ø±Ø§ÛŒ Ù¾Ø±ÙˆÚ˜Ù‡ Ø´Ù†Ø§Ø³Ø§ÛŒÛŒ Ø´Ø¯" : "ØªØµÙˆÛŒØ± Ù…Ø­Ù„ Ù†ØµØ¨ Ù‡Ù†ÙˆØ² Ø«Ø¨Øª Ù†Ø´Ø¯Ù‡ Ø§Ø³Øª"}</span><strong>{hasSitePhoto ? environmentImage?.title || "ØªØµÙˆÛŒØ± Ù…Ø­ÛŒØ·" : "Ø§Ø¨ØªØ¯Ø§ Ø¯Ø± Ø´Ø±Ø§ÛŒØ· Ù…Ø­ÛŒØ·ÛŒ Ø¹Ú©Ø³ Ø§Ø¶Ø§ÙÙ‡ Ú©Ù†ÛŒØ¯"}</strong></div>
                  <button type="button" className="shil-soft-button" onClick={transferSiteImage}>Ø§ÙØ²ÙˆØ¯Ù† ØªØµÙˆÛŒØ± Ù…Ø­Ù„ Ù†ØµØ¨ Ùˆ Ø§Ø¬Ø±Ø§</button>
                </div>
                <div className="shil-ai-mode-row">{installationModes.map((item) => <button key={item.key} type="button" className={installMode === item.key ? "active" : ""} onClick={() => setInstallMode(item.key)}>{item.title}</button>)}</div>
                {aiResult ? <div className="shil-ai-layer-status-grid"><div><span>Ù†Ø³Ø®Ù‡ AI Layer</span><strong>{aiResult.version}</strong></div><div><span>Confidence</span><strong>{aiResult.confidence}%</strong></div><div><span>Ø³Ù†Ø§Ø±ÛŒÙˆ</span><strong>{aiResult.installModeTitle}</strong></div><div><span>ÙˆØ¶Ø¹ÛŒØª</span><strong>{aiResult.serviceConnected ? "ØªØµÙˆÛŒØ± ØªÙˆÙ„ÛŒØ¯ Ø´Ø¯" : "Ø¢Ù…Ø§Ø¯Ù‡ Ø®Ø±ÙˆØ¬ÛŒ"}</strong></div></div> : null}
                <div className="shil-ai-preview-layout shil-ai-install-preview-layout">
                  <div className={(aiApplied ? "shil-ai-preview-visual ready shil-ai-install-visual" : "shil-ai-preview-visual shil-ai-install-visual") + (hasGeneratedVisual ? " generated" : "")}>{visualSrc ? <img src={visualSrc} alt="ØªØµÙˆÛŒØ± Ø´Ø¨ÛŒÙ‡â€ŒØ³Ø§Ø²ÛŒ Ù…Ø­Ù„ Ù†ØµØ¨ Ù¾Ø±ÙˆÚ˜Ù‡" /> : null}{!hasGeneratedVisual ? <><div className="shil-ai-sky" /><div className="shil-ai-roof">{Array.from({ length: Math.min(Number(panelCount) || 6, 12) }).map((_, index) => <span key={index} />)}</div></> : null}<strong>{hasGeneratedVisual ? "ØªØµÙˆÛŒØ± ØªÙˆÙ„ÛŒØ¯ Ø´Ø¯Ù‡ ØªÙˆØ³Ø· Ù‡ÙˆØ´ Ù…ØµÙ†ÙˆØ¹ÛŒ" : aiApplied ? "Ø®Ø±ÙˆØ¬ÛŒ Ø¢Ù…Ø§Ø¯Ù‡ Ø´Ø¯" : imageTransferred ? "ØªØµÙˆÛŒØ± Ù…Ù†ØªÙ‚Ù„ Ø´Ø¯Ø› Ø¢Ù…Ø§Ø¯Ù‡ Ø§Ø¹Ù…Ø§Ù„" : "Ø¯Ø± Ø§Ù†ØªØ¸Ø§Ø± Ø§ÙØ²ÙˆØ¯Ù† ØªØµÙˆÛŒØ± Ù…Ø­Ù„ Ù†ØµØ¨"}</strong></div>
                  <div className="shil-ai-preview-facts shil-ai-install-facts"><div><span>Ø³Ù†Ø§Ø±ÛŒÙˆÛŒ Ø´Ø¨ÛŒÙ‡â€ŒØ³Ø§Ø²ÛŒ</span><strong>{installationModes.find((item) => item.key === installMode)?.title}</strong></div><div><span>Ù¾Ù†Ù„ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ</span><strong>{panelCount} Ø¹Ø¯Ø¯ / {panelPower} ÙˆØ§Øª</strong></div><div><span>Ø¢Ø±Ø§ÛŒØ´ Ù¾Ù†Ù„</span><strong>{panelSeries} Ø³Ø±ÛŒ Ã— {panelParallel} Ù…ÙˆØ§Ø²ÛŒ</strong></div><div><span>Ø§ÛŒÙ†ÙˆØ±ØªØ±</span><strong>{inverterCount} Ø¹Ø¯Ø¯ / {inverterPower === "-" ? "Ø«Ø¨Øª Ù†Ø´Ø¯Ù‡" : `${inverterPower} ÙˆØ§Øª`}</strong></div><div><span>Ø¨Ø§ØªØ±ÛŒ</span><strong>{batteryCount} Ø¹Ø¯Ø¯</strong></div><div><span>Ø¢Ø±Ø§ÛŒØ´ Ø¨Ø§ØªØ±ÛŒ</span><strong>{batterySeries} Ø³Ø±ÛŒ Ã— {batteryParallel} Ù…ÙˆØ§Ø²ÛŒ</strong></div></div>
                </div>
                <div className="shil-action-row shil-ai-apply-row"><button type="button" className="shil-primary-small" onClick={applyAiPreview} disabled={aiGenerating}>{aiGenerating ? "Ø¯Ø± Ø­Ø§Ù„ ØªÙˆÙ„ÛŒØ¯ ØªØµÙˆÛŒØ±..." : "Ø§Ø¹Ù…Ø§Ù„ Ø´Ø¨ÛŒÙ‡â€ŒØ³Ø§Ø²ÛŒ Ù‡ÙˆØ´ Ù…ØµÙ†ÙˆØ¹ÛŒ"}</button><span className="shil-muted-line">Ø§ÛŒÙ† Ù…Ø±Ø­Ù„Ù‡ Ø§Ø®ØªÛŒØ§Ø±ÛŒ Ø§Ø³Øª Ùˆ Ù…Ø§Ù†Ø¹ Ø§Ø¯Ø§Ù…Ù‡ Ù¾Ø±ÙˆÚ˜Ù‡ Ù†Ù…ÛŒâ€ŒØ´ÙˆØ¯.</span></div>
                {aiMessage ? <div className={aiApplied ? "shil-inline-success" : "shil-inline-warning"}>{aiMessage}</div> : null}
                {aiApplied ? <div className="shil-ai-engineering-output"><AiReasonTable title="Ø¬Ø¯ÙˆÙ„ Ù…Ù‡Ù†Ø¯Ø³ÛŒ Ù¾Ù†Ù„ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ" rows={panelRows} /><AiReasonTable title="Ø¬Ø¯ÙˆÙ„ Ù…Ù‡Ù†Ø¯Ø³ÛŒ Ø§ÛŒÙ†ÙˆØ±ØªØ±" rows={inverterRows} /><AiReasonTable title="Ø¬Ø¯ÙˆÙ„ Ù…Ù‡Ù†Ø¯Ø³ÛŒ Ø¨Ø§ØªØ±ÛŒ" rows={batteryRows} />{aiResult?.qualityChecks?.length ? <div className="shil-ai-quality-grid">{aiResult.qualityChecks.map((item) => <div key={item.title}><span>{item.title}</span><strong>{item.status}</strong><small>{item.note}</small></div>)}</div> : null}<details className="shil-ai-prompt-box"><summary>Ø¬Ø²Ø¦ÛŒØ§Øª Ø³Ø±ÙˆÛŒØ³ Ùˆ Ù¾Ø±Ø§Ù…Ù¾Øª ØªÙˆÙ„ÛŒØ¯ ØªØµÙˆÛŒØ±</summary><pre>{aiResult?.prompt}</pre>{aiResult?.imageGeneration ? <small>{aiResult.imageGeneration.ok ? `Ø³Ø±ÙˆÛŒØ³ Ù…ØªØµÙ„: ${aiResult.imageGeneration.provider || "OpenAI"} / ${aiResult.imageGeneration.model || "gpt-image-1"}` : `Ø®Ø·Ø§ÛŒ Ø³Ø±ÙˆÛŒØ³: ${aiResult.imageGeneration.error}`}</small> : null}</details><div className="shil-ai-final-note"><strong>Ù†ØªÛŒØ¬Ù‡ Ø´Ø¨ÛŒÙ‡â€ŒØ³Ø§Ø²ÛŒ</strong><p>{aiResult?.engineeringNote || "ØªØµÙˆÛŒØ± Ù…Ø¬Ø§Ø²ÛŒ Ø¨Ø± Ø§Ø³Ø§Ø³ ØªØµÙˆÛŒØ± Ù…Ø­Ù„ Ù†ØµØ¨ØŒ Ù†ÙˆØ¹ Ú†ÛŒØ¯Ù…Ø§Ù† Ø§Ù†ØªØ®Ø§Ø¨ÛŒ Ùˆ Ø¯ÛŒØªØ§ÛŒ ÙˆØ§Ù‚Ø¹ÛŒ Ù…ÙˆØªÙˆØ± Ù…Ø­Ø§Ø³Ø¨Ø§Øª Ø¢Ù…Ø§Ø¯Ù‡ Ø´Ø¯Ù‡ Ø§Ø³Øª."}</p><button type="button" className="shil-soft-button" onClick={confirmAiPreview}>ØªØ§ÛŒÛŒØ¯ Ø®Ø±ÙˆØ¬ÛŒ Ù‡ÙˆØ´ Ù…ØµÙ†ÙˆØ¹ÛŒ</button></div></div> : null}
              </div>
            ) : null}
          </div>
        ) : null}

        <button type="button" className="shil-primary-wide" onClick={confirmSummary}>ØªØ£ÛŒÛŒØ¯ Ú†Ú©ÛŒØ¯Ù‡ Ùˆ Ø§Ø¬Ø±Ø§ÛŒ Ù…Ø­Ø§Ø³Ø¨Ø§Øª</button>
      </section>
    </EngineeringPageShell>
  );
}
