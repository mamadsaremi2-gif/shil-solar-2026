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

function fmt(value, fallback = "ثبت نشده") {
  if (value === null || value === undefined || value === "") return fallback;
  return value;
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
  if (typeof first === "string") return { src: first, title: "تصویر محل نصب" };
  return { src: first.dataUrl || first.previewUrl || first.url || first.src || first.base64 || "", title: first.name || first.fileName || "تصویر محل نصب" };
}

function AiReasonTable({ title, rows }) {
  return (
    <div className="shil-ai-install-table-card">
      <h3>{title}</h3>
      <div className="shil-ai-install-table">
        <div className="head"><span>پارامتر</span><span>مقدار</span><span>علت انتخاب</span></div>
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
  const method = location.state?.method || readDraft("shil:selectedCalculationMethod", { title: emergency ? "برق اضطراری" : "لیست تجهیزات" })?.title || (emergency ? "برق اضطراری" : "لیست تجهیزات");

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
  const batteryVoltage = activeDesign?.battery?.unitVoltageV || activeDesign?.battery?.battery?.voltageV || activeDesign?.battery?.battery?.nominalVoltage || activeDesign?.battery?.bankVoltageV || systemSettings?.batteryVoltageV || "-";
  const batteryCapacity = activeDesign?.battery?.unitCapacityAh || activeDesign?.battery?.battery?.capacityAh || activeDesign?.battery?.capacityAh || systemSettings?.batteryCapacityAh || "-";
  const batterySeries = activeDesign?.battery?.seriesCount || systemSettings?.batterySeriesCount || "-";
  const batteryParallel = activeDesign?.battery?.parallelCount || systemSettings?.batteryParallelCount || "-";
  const batteryUnitKWh = activeDesign?.battery?.unitEnergyKWh || "-";
  const batteryTotalKWh = activeDesign?.battery?.grossEnergyKWh || (activeDesign?.battery?.grossEnergyWh ? Math.round(activeDesign.battery.grossEnergyWh / 10) / 100 : "-");
  const batteryBankAh = activeDesign?.battery?.bankCurrentAh || activeDesign?.battery?.installedAh || "-";
  const requiredPower = activeDesign?.load?.designPeakW || activeDesign?.load?.totalPowerW || activeDesign?.requiredPowerW || loadResult?.designPowerW || loadResult?.peakPowerW || "در انتظار محاسبه";

  const transferSiteImage = () => {
    if (!hasSitePhoto) {
      setImageTransferred(false); setAiApplied(false);
      setAiMessage("برای استفاده از این بلوک اختیاری، ابتدا در صفحه شرایط محیطی تصویر محل نصب و اجرا را ثبت کنید.");
      return;
    }
    localStorage.setItem("shil:aiInstallationSourceImage", JSON.stringify({ transferredAt: new Date().toISOString(), source: "environment.siteAttachments", image: environmentImage, installMode }));
    setImageTransferred(true);
    setAiMessage("تصویر محل نصب از شرایط محیطی به بلوک هوش مصنوعی منتقل شد. اکنون می‌توانید شبیه‌سازی تصویری را اعمال کنید.");
  };

  const applyAiPreview = async () => {
    if (!hasSitePhoto || !imageTransferred) {
      setAiApplied(false);
      setAiMessage("ابتدا دکمه «افزودن تصویر محل نصب و اجرا» را بزنید تا تصویر این پروژه وارد بلوک هوش مصنوعی شود.");
      return;
    }

    const basePayload = createAIInstallationPreview({
      installMode,
      image: environmentImage,
      panel: { count: panelCount, powerW: panelPower, series: panelSeries, parallel: panelParallel },
      inverter: { count: inverterCount, powerW: inverterPower, title: solarDesign?.inverter?.title || systemSettings?.inverterId },
      battery: { count: batteryCount, voltageV: batteryVoltage, capacityAh: batteryCapacity, unitKWh: batteryUnitKWh, totalKWh: batteryTotalKWh, bankAh: batteryBankAh, series: batterySeries, parallel: batteryParallel },
      project,
      environment
    });

    setAiGenerating(true);
    setAiMessage("در حال اتصال به سرویس واقعی تولید تصویر و ساخت شبیه‌سازی محل نصب...");

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
      ? "تصویر واقعی شبیه‌سازی نصب با سرویس هوش مصنوعی تولید شد و جدول مهندسی تجهیزات آماده تایید است."
      : `جدول مهندسی و پرامپت آماده شد، اما تولید تصویر واقعی کامل نشد: ${imageGeneration.error}`
    );
  };

  const confirmAiPreview = () => {
    if (!aiApplied) { setAiMessage("برای تایید این بلوک اختیاری، ابتدا تصویر محل نصب را اضافه و دکمه اعمال را بزنید."); return; }
    localStorage.setItem("shil:aiInstallationPreviewConfirmed", JSON.stringify({ confirmedAt: new Date().toISOString(), installMode }));
    setAiMessage("بلوک هوش مصنوعی نصب پروژه تایید شد و همراه چکیده اطلاعات ذخیره می‌شود.");
  };

  const confirmSummary = () => {
    approveProjectStep("summary");
    localStorage.setItem("shil:summaryDraft", JSON.stringify({ domain, method, project, environment, loadResult, systemSettings, solarDesign, solarSizing: solarDesign?.solarSizing, emergencyDesign, aiPreviewRequested: !emergency && aiApplied, confirmedAt: new Date().toISOString() }));
    navigate(`/new-project/run/${domain}`, { state: { method, aiPreviewRequested: !emergency && aiApplied } });
  };

  const generatedVisualSrc = aiResult?.generatedImage || aiResult?.imageGeneration?.imageDataUrl || aiResult?.imageGeneration?.imageUrl || "";
  const visualSrc = generatedVisualSrc || (imageTransferred && environmentImage?.src ? environmentImage.src : "");
  const hasGeneratedVisual = Boolean(generatedVisualSrc);

  const installationModes = [
    { key: "roof", title: "نصب روی سقف" }, { key: "ground", title: "نصب زمینی" },
    { key: "hybrid", title: "نصب ترکیبی" }, { key: "equipmentRoom", title: "اتاق باتری و اینورتر" }
  ];
  const panelRows = aiResult?.tables?.panel || [
    { label: "تعداد پنل", value: `${panelCount} عدد`, reason: "بر اساس انرژی روزانه و توان طراحی موتور محاسبات تعیین شده است." },
    { label: "توان هر پنل", value: `${panelPower} وات`, reason: "پنل پیش‌فرض مهندسی SHIL برای طراحی فعلی است، مگر اینکه کاربر مقدار دستی وارد کند." },
    { label: "آرایش سری", value: `${panelSeries} سری`, reason: "برای رساندن ولتاژ رشته پنل به محدوده مجاز MPPT انتخاب شده است." },
    { label: "آرایش موازی", value: `${panelParallel} موازی`, reason: "برای افزایش جریان و رسیدن به ظرفیت کل آرایه استفاده شده است." }
  ];
  const inverterRows = aiResult?.tables?.inverter || [
    { label: "تعداد اینورتر", value: `${inverterCount} عدد`, reason: "بر اساس توان پیک، ضریب اطمینان و سناریوی اجرای پروژه انتخاب شده است." },
    { label: "توان اینورتر", value: inverterPower === "-" ? "ثبت نشده" : `${inverterPower} وات`, reason: "باید توان همزمان و جریان راه‌اندازی بارهای اصلی را پوشش دهد." },
    { label: "نوع انتخاب", value: solarDesign?.inverter?.title || systemSettings?.inverterId || "انتخاب هوشمند", reason: "از بانک اینورتر خورشیدی مطابق نوع آفگرید، آنگرید یا هیبرید انتخاب می‌شود." }
  ];
  const batteryRows = aiResult?.tables?.battery || [
    { label: "تعداد باتری", value: `${batteryCount} عدد`, reason: `مشخصات کامل بانک: ${batterySpecText(activeDesign?.battery)}` },
    { label: "ولتاژ / جریان / انرژی", value: `${batteryVoltage}V / ${batteryCapacity}Ah / ${batteryUnitKWh}kWh`, reason: `ظرفیت کل بانک ${batteryTotalKWh}kWh و ظرفیت جریان بانک ${batteryBankAh}Ah است.` },
    { label: "ولتاژ / ظرفیت", value: `${batteryVoltage}V / ${batteryCapacity}Ah`, reason: "برای سازگاری با ولتاژ باس DC و ظرفیت ذخیره مورد نیاز انتخاب شده است." },
    { label: "آرایش سری", value: `${batterySeries} سری`, reason: "برای رسیدن به ولتاژ کاری بانک باتری محاسبه شده است." },
    { label: "آرایش موازی", value: `${batteryParallel} موازی`, reason: "برای افزایش ظرفیت Ah و پایداری ذخیره انرژی استفاده شده است." }
  ];

  return (
    <EngineeringPageShell title="چکیده اطلاعات">
      <section className="shil-card-stack shil-final-summary-page">
        <SummaryBlock title="اطلاعات پروژه" badge="Project">
          <SummaryItem label="نام پروژه" value={project.projectName || project.name} />
          <SummaryItem label="نوع مسیر" value={emergency ? "برق اضطراری" : "خورشیدی"} />
          <SummaryItem label="روش محاسبات" value={method} />
          <SummaryItem label="تعداد تجهیزات انتخابی" value={Array.isArray(selectedEquipment) ? `${selectedEquipment.length} مورد` : "ثبت نشده"} />
        </SummaryBlock>

        <SummaryBlock title={emergency ? "شرایط اجرای برق اضطراری" : "شرایط محیطی"} badge="Environment">
          <SummaryItem label="شهر / استان" value={`${fmt(environment.city)} / ${fmt(environment.province)}`} />
          <SummaryItem label="نوع محل اجرا" value={environment.installTypeLabel} />
          {!emergency ? <SummaryItem label="ساعت آفتابی" value={environment.peakSunHours ? `${environment.peakSunHours} ساعت` : null} /> : null}
          {!emergency ? <SummaryItem label="جهت و زاویه پیشنهادی" value={`${environment.recommendedAzimuthDeg || 180}° / ${environment.recommendedTiltDeg || 32}°`} /> : null}
          {!emergency ? <SummaryItem label="تصاویر محل نصب" value={`${sitePhotoCount} عکس`} /> : null}
          <SummaryItem label="جهت‌نما" value={environment.compassAttachment ? "ثبت شده" : "ثبت نشده"} />
        </SummaryBlock>

        <SummaryBlock title="مصرف و ورودی محاسبات" badge="Load">
          <SummaryItem label="توان طراحی" value={typeof requiredPower === "number" ? `${Math.round(requiredPower)} W` : requiredPower} />
          {emergency ? <SummaryItem label="زمان برق اضطراری مورد نیاز" value={`${emergencyDesign?.settings?.requiredEmergencyHours || 2} ساعت`} /> : <SummaryItem label="انرژی روزانه" value={loadResult?.dailyEnergyWh ? `${Math.round(loadResult.dailyEnergyWh / 1000)} kWh` : loadResult?.dailyEnergyKWh ? `${loadResult.dailyEnergyKWh} kWh` : null} />}
          <SummaryItem label="بار موتوری" value={loadResult?.motorLoadsCount ? `${loadResult.motorLoadsCount} مورد` : "مطابق لیست تجهیزات"} />
          <SummaryItem label="کنترل راه‌اندازی" value="در موتور محاسبات لحاظ می‌شود" />
        </SummaryBlock>

        {emergency ? (
          <>
            <SummaryBlock title="پیکربندی برق اضطراری" badge={emergencyDesign?.valid ? "تأیید شده" : "کنترل‌شده"}>
              <SummaryItem label="اینورتر برق اضطراری" value={emergencyDesign?.inverter?.title} note={`${emergencyDesign?.inverter?.count || 1} عدد / ${emergencyDesign?.inverter?.ratedPowerW || "-"} وات`} />
              <SummaryItem label="باتری منتخب" value={emergencyDesign?.battery?.battery?.title} note={batterySpecText(emergencyDesign?.battery)} />
              <SummaryItem label="ولتاژ / جریان / انرژی باتری" value={`${batteryVoltage}V / ${batteryCapacity}Ah / ${batteryUnitKWh}kWh هر باتری`} note={`ظرفیت کل ${batteryTotalKWh}kWh / بانک ${batteryBankAh}Ah`} />
              <SummaryItem label="آرایش بانک باتری" value={batteryNoteText(emergencyDesign?.battery)} />
              <SummaryItem label="انرژی مورد نیاز" value={emergencyDesign?.requiredEnergyWh ? `${Math.round(emergencyDesign.requiredEnergyWh / 1000)} kWh` : null} />
              <SummaryItem label="حفاظت باتری" value={`کلید DC ${emergencyDesign?.protection?.dcBreakerA || "-"}A`} />
              <SummaryItem label="حفاظت خروجی" value={`کلید AC ${emergencyDesign?.protection?.acBreakerA || "-"}A`} />
            </SummaryBlock>
            <div className="shil-section-card shil-summary-block-card">
              <div className="shil-section-head"><h2>دلایل انتخاب و استاندارد اجرا</h2><span>Emergency Power</span></div>
              <ul className="shil-engineering-list">{emergencyDesign?.explanations?.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          </>
        ) : (
          <SummaryBlock title="پیکربندی سیستم" badge={solarDesign?.valid ? "تأیید شده" : "کنترل‌شده"}>
            <SummaryItem label="اینورتر" value={solarDesign?.inverter?.title || systemSettings?.inverterId} note={solarDesign?.inverter?.count ? `${solarDesign.inverter.count} عدد` : null} />
            <SummaryItem label="باتری" value={solarDesign?.battery?.battery?.title || systemSettings?.batteryId} note={solarDesign?.battery?.totalCount ? batterySpecText(solarDesign.battery) : null} />
            <SummaryItem label="آرایش و جریان بانک باتری" value={solarDesign?.battery?.totalCount ? batteryNoteText(solarDesign.battery) : null} />
            <SummaryItem label="توان پنل خورشیدی" value={solarDesign?.panel?.title || systemSettings?.panelId} note={solarDesign?.pvArray?.panelCount ? `${solarDesign.pvArray.panelCount} عدد / ${solarDesign.pvArray.seriesCount} سری × ${solarDesign.pvArray.parallelCount} موازی / امتیاز ${solarDesign?.panelPowerAnalysis?.score || "-"} از ۱۰۰` : null} />
            <SummaryItem label="اعتبارسنجی پنل و MPPT" value={solarDesign?.panelPowerAnalysis?.levelLabel || "در انتظار محاسبه"} note={solarDesign?.panelPowerAnalysis?.status === "ok" ? "توان، انرژی، رشته‌بندی، جریان و محدوده MPPT تأیید شد" : solarDesign?.panelPowerAnalysis?.recommendations?.[0]} />
            <SummaryItem label="توان آرایه PV" value={solarDesign?.panelPowerAnalysis?.array?.powerKW ? `${solarDesign.panelPowerAnalysis.array.powerKW} kW` : solarDesign?.solarSizing?.pArrayKW ? `${solarDesign.solarSizing.pArrayKW} kW` : null} note="P_array = N_panel × P_panel" />
            <SummaryItem label="تولید روزانه قابل تأمین" value={solarDesign?.panelPowerAnalysis?.array?.dailyEnergyKWh ? `${solarDesign.panelPowerAnalysis.array.dailyEnergyKWh} kWh/day` : solarDesign?.solarSizing?.ePvDailyKWh ? `${solarDesign.solarSizing.ePvDailyKWh} kWh/day` : null} note="E_pv_daily = P_array × PSH × (1 - Loss_sys)" />
            <SummaryItem label="درصد پوشش مصرف" value={solarDesign?.panelPowerAnalysis?.array?.coveragePercent ? `${solarDesign.panelPowerAnalysis.array.coveragePercent}%` : solarDesign?.solarSizing?.coveragePercent ? `${solarDesign.solarSizing.coveragePercent}%` : "در انتظار مصرف"} note={solarDesign?.solarSizing?.enoughDailyEnergy === false ? "مصرف بیشتر از تولید روزانه است" : "مقایسه با مصرف روزانه"} />
            <SummaryItem label="ظرفیت باتری خودکفایی" value={solarDesign?.solarSizing?.eBatteryNeededKWh ? `${solarDesign.solarSizing.eBatteryNeededKWh} kWh` : null} note={solarDesign?.solarSizing?.batterySummary || (solarDesign?.solarSizing?.batteryCount ? `${solarDesign.solarSizing.batteryCount} عدد / ${solarDesign.solarSizing.batteryVoltageV || "-"}V / ${solarDesign.solarSizing.batteryCapacityAh || "-"}Ah / ${solarDesign.solarSizing.batteryUnitKWh || "-"}kWh هر باتری / ${solarDesign.solarSizing.batteryBankKWh || "-"}kWh کل` : "بر اساس DoD و راندمان")} />
            <SummaryItem label="فضای نصب" value={solarDesign?.space?.maintenanceAreaM2 ? `${solarDesign.space.maintenanceAreaM2} m²` : null} />
            <SummaryItem label="حفاظت" value={solarDesign?.protection ? `DC ${solarDesign.protection.dcBreakerA}A / AC ${solarDesign.protection.acBreakerA}A` : null} />
            <SummaryItem label="کابل" value={solarDesign?.protection ? `DC ${solarDesign.protection.dcCable} / BAT ${solarDesign.protection.batteryCable}` : null} />
          </SummaryBlock>
        )}

        {!emergency ? (
          <div className={aiOpen ? "shil-section-card shil-ai-preview-card shil-ai-preview-card-open" : "shil-section-card shil-ai-preview-card"}>
            <button type="button" className="shil-ai-preview-toggle" onClick={() => setAiOpen((value) => !value)}>
              <span><strong>اجرای هوش مصنوعی نصب پروژه</strong><small>اختیاری؛ شبیه‌سازی تصویری محل نصب و نمایش جدول مهندسی تجهیزات نهایی</small></span>
              <b>{aiOpen ? "بستن" : "نمایش"}</b>
            </button>
            {aiOpen ? (
              <div className="shil-ai-preview-body">
                <p className="shil-muted-line">این بلوک فقط برای شبیه‌سازی تصویری اختیاری است و روی محاسبات اصلی اثر اجباری ندارد.</p>
                <div className="shil-ai-transfer-row">
                  <div className={hasSitePhoto ? "shil-ai-source-status ready" : "shil-ai-source-status"}><span>{hasSitePhoto ? "تصویر محل اجرای پروژه شناسایی شد" : "تصویر محل نصب هنوز ثبت نشده است"}</span><strong>{hasSitePhoto ? environmentImage?.title || "تصویر محیط" : "ابتدا در شرایط محیطی عکس اضافه کنید"}</strong></div>
                  <button type="button" className="shil-soft-button" onClick={transferSiteImage}>افزودن تصویر محل نصب و اجرا</button>
                </div>
                <div className="shil-ai-mode-row">{installationModes.map((item) => <button key={item.key} type="button" className={installMode === item.key ? "active" : ""} onClick={() => setInstallMode(item.key)}>{item.title}</button>)}</div>
                {aiResult ? <div className="shil-ai-layer-status-grid"><div><span>نسخه AI Layer</span><strong>{aiResult.version}</strong></div><div><span>Confidence</span><strong>{aiResult.confidence}%</strong></div><div><span>سناریو</span><strong>{aiResult.installModeTitle}</strong></div><div><span>وضعیت</span><strong>{aiResult.serviceConnected ? "تصویر تولید شد" : "آماده خروجی"}</strong></div></div> : null}
                <div className="shil-ai-preview-layout shil-ai-install-preview-layout">
                  <div className={(aiApplied ? "shil-ai-preview-visual ready shil-ai-install-visual" : "shil-ai-preview-visual shil-ai-install-visual") + (hasGeneratedVisual ? " generated" : "")}>{visualSrc ? <img src={visualSrc} alt="تصویر شبیه‌سازی محل نصب پروژه" /> : null}{!hasGeneratedVisual ? <><div className="shil-ai-sky" /><div className="shil-ai-roof">{Array.from({ length: Math.min(Number(panelCount) || 6, 12) }).map((_, index) => <span key={index} />)}</div></> : null}<strong>{hasGeneratedVisual ? "تصویر تولید شده توسط هوش مصنوعی" : aiApplied ? "خروجی آماده شد" : imageTransferred ? "تصویر منتقل شد؛ آماده اعمال" : "در انتظار افزودن تصویر محل نصب"}</strong></div>
                  <div className="shil-ai-preview-facts shil-ai-install-facts"><div><span>سناریوی شبیه‌سازی</span><strong>{installationModes.find((item) => item.key === installMode)?.title}</strong></div><div><span>پنل خورشیدی</span><strong>{panelCount} عدد / {panelPower} وات</strong></div><div><span>آرایش پنل</span><strong>{panelSeries} سری × {panelParallel} موازی</strong></div><div><span>اینورتر</span><strong>{inverterCount} عدد / {inverterPower === "-" ? "ثبت نشده" : `${inverterPower} وات`}</strong></div><div><span>باتری</span><strong>{batteryCount} عدد / {batteryVoltage}V / {batteryCapacity}Ah</strong></div><div><span>انرژی باتری</span><strong>{batteryUnitKWh}kWh هر باتری / {batteryTotalKWh}kWh کل</strong></div><div><span>آرایش باتری</span><strong>{batterySeries} سری × {batteryParallel} موازی / {batteryBankAh}Ah</strong></div></div>
                </div>
                <div className="shil-action-row shil-ai-apply-row"><button type="button" className="shil-primary-small" onClick={applyAiPreview} disabled={aiGenerating}>{aiGenerating ? "در حال تولید تصویر..." : "اعمال شبیه‌سازی هوش مصنوعی"}</button><span className="shil-muted-line">این مرحله اختیاری است و مانع ادامه پروژه نمی‌شود.</span></div>
                {aiMessage ? <div className={aiApplied ? "shil-inline-success" : "shil-inline-warning"}>{aiMessage}</div> : null}
                {aiApplied ? <div className="shil-ai-engineering-output"><AiReasonTable title="جدول مهندسی پنل خورشیدی" rows={panelRows} /><AiReasonTable title="جدول مهندسی اینورتر" rows={inverterRows} /><AiReasonTable title="جدول مهندسی باتری" rows={batteryRows} />{aiResult?.qualityChecks?.length ? <div className="shil-ai-quality-grid">{aiResult.qualityChecks.map((item) => <div key={item.title}><span>{item.title}</span><strong>{item.status}</strong><small>{item.note}</small></div>)}</div> : null}<details className="shil-ai-prompt-box"><summary>جزئیات سرویس و پرامپت تولید تصویر</summary><pre>{aiResult?.prompt}</pre>{aiResult?.imageGeneration ? <small>{aiResult.imageGeneration.ok ? `سرویس متصل: ${aiResult.imageGeneration.provider || "OpenAI"} / ${aiResult.imageGeneration.model || "gpt-image-1"}` : `خطای سرویس: ${aiResult.imageGeneration.error}`}</small> : null}</details><div className="shil-ai-final-note"><strong>نتیجه شبیه‌سازی</strong><p>{aiResult?.engineeringNote || "تصویر مجازی بر اساس تصویر محل نصب، نوع چیدمان انتخابی و دیتای واقعی موتور محاسبات آماده شده است."}</p><button type="button" className="shil-soft-button" onClick={confirmAiPreview}>تایید خروجی هوش مصنوعی</button></div></div> : null}
              </div>
            ) : null}
          </div>
        ) : null}

        <button type="button" className="shil-primary-wide" onClick={confirmSummary}>تأیید چکیده و اجرای محاسبات</button>
      </section>
    </EngineeringPageShell>
  );
}
