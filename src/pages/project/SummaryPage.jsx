import React, { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import EngineeringPageShell from "../../components/EngineeringPageShell.jsx";
import { approveProjectStep } from "../../workflow/projectWorkflow.js";

function readDraft(key, fallback = {}) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") || fallback;
  } catch {
    return fallback;
  }
}

function fmt(value, fallback = "ثبت نشده") {
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
  return (
    <div>
      <span>{label}</span>
      <strong>{fmt(value)}</strong>
      {note ? <small>{note}</small> : null}
    </div>
  );
}

export default function SummaryPage() {
  const { domain = "solar" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const emergency = domain === "emergency";
  const method = location.state?.method || readDraft("shil:selectedCalculationMethod", { key: "equipment", title: "لیست تجهیزات" })?.title || "لیست تجهیزات";

  const project = useMemo(() => readDraft("shil:projectInfoDraft", {}), []);
  const environment = useMemo(() => readDraft("shil:environmentDraft", {}), []);
  const loadResult = useMemo(() => readDraft("shil:loadEngineResult", {}), []);
  const systemSettings = useMemo(() => readDraft("shil:systemSettingsDraft", {}), []);
  const solarDesign = useMemo(() => readDraft("shil:solarSystemDesign", systemSettings?.design || {}), [systemSettings]);
  const selectedEquipment = useMemo(() => readDraft("shil:selectedEquipments", []), []);

  const [aiApplied, setAiApplied] = useState(false);
  const [aiMessage, setAiMessage] = useState("");

  const sitePhotoCount = Number(environment.siteAttachments?.length || (environment.siteAttachment ? 1 : 0));
  const hasSitePhoto = sitePhotoCount > 0;
  const panelCount = solarDesign?.pvArray?.panelCount || systemSettings?.panelCount || "-";
  const inverterCount = solarDesign?.inverter?.count || systemSettings?.inverterCount || "-";
  const batteryCount = solarDesign?.battery?.totalCount || systemSettings?.batteryCount || "-";
  const requiredPower = solarDesign?.load?.designPeakW || solarDesign?.requiredPowerW || loadResult?.designPowerW || loadResult?.peakPowerW || "در انتظار محاسبه";

  const applyAiPreview = () => {
    if (!hasSitePhoto) {
      setAiMessage("برای ساخت تصویر مجازی، ابتدا باید در صفحه شرایط محیطی حداقل یک عکس محل نصب آپلود شود.");
      setAiApplied(false);
      return;
    }
    const previewPayload = {
      createdAt: new Date().toISOString(),
      mode: "optional-ai-site-visualization",
      source: "environment.siteAttachments",
      panelCount,
      inverterCount,
      batteryCount,
      requiredPower,
      azimuthDeg: environment.recommendedAzimuthDeg || 180,
      tiltDeg: environment.recommendedTiltDeg || 32,
      status: "ready-for-ai-render-service",
      note: "این بلوک UI و داده لازم برای اتصال به سرویس تولید تصویر SHIL AI را آماده می‌کند."
    };
    localStorage.setItem("shil:aiInstallationPreview", JSON.stringify(previewPayload));
    setAiApplied(true);
    setAiMessage("درخواست اختیاری هوش مصنوعی ثبت شد؛ تصویر مجازی محل نصب با پنل خورشیدی از سرویس AI SHIL قابل تولید است.");
  };

  const confirmSummary = () => {
    approveProjectStep("summary");
    localStorage.setItem("shil:summaryDraft", JSON.stringify({
      domain,
      method,
      project,
      environment,
      loadResult,
      systemSettings,
      solarDesign,
      aiPreviewRequested: aiApplied,
      confirmedAt: new Date().toISOString()
    }));
    navigate(`/new-project/run/${domain}`, { state: { method, aiPreviewRequested: aiApplied } });
  };

  return (
    <EngineeringPageShell title="چکیده اطلاعات">
      <section className="shil-card-stack shil-final-summary-page">
        <SummaryBlock title="اطلاعات پروژه" badge="Project">
          <SummaryItem label="نام پروژه" value={project.projectName || project.name} />
          <SummaryItem label="نوع مسیر" value={emergency ? "برق اضطراری" : "خورشیدی"} />
          <SummaryItem label="روش محاسبات" value={method} />
          <SummaryItem label="تعداد تجهیزات انتخابی" value={Array.isArray(selectedEquipment) ? `${selectedEquipment.length} مورد` : "ثبت نشده"} />
        </SummaryBlock>

        <SummaryBlock title="شرایط محیطی" badge="Environment">
          <SummaryItem label="شهر / استان" value={`${fmt(environment.city)} / ${fmt(environment.province)}`} />
          <SummaryItem label="نوع محل نصب" value={environment.installTypeLabel} />
          <SummaryItem label="ساعت آفتابی" value={environment.peakSunHours ? `${environment.peakSunHours} ساعت` : null} />
          <SummaryItem label="جهت و زاویه پیشنهادی" value={`${environment.recommendedAzimuthDeg || 180}° / ${environment.recommendedTiltDeg || 32}°`} />
          <SummaryItem label="تصاویر محل نصب" value={`${sitePhotoCount} عکس`} />
          <SummaryItem label="جهت‌نما" value={environment.compassAttachment ? "ثبت شده" : "ثبت نشده"} />
        </SummaryBlock>

        <SummaryBlock title="مصرف و ورودی محاسبات" badge="Load">
          <SummaryItem label="توان طراحی" value={typeof requiredPower === "number" ? `${Math.round(requiredPower)} W` : requiredPower} />
          <SummaryItem label="انرژی روزانه" value={loadResult?.dailyEnergyWh ? `${Math.round(loadResult.dailyEnergyWh / 1000)} kWh` : loadResult?.dailyEnergyKWh ? `${loadResult.dailyEnergyKWh} kWh` : null} />
          <SummaryItem label="بار موتوری" value={loadResult?.motorLoadsCount ? `${loadResult.motorLoadsCount} مورد` : "مطابق لیست تجهیزات"} />
          <SummaryItem label="کنترل سافت‌استارتر" value="در موتور محاسبات لحاظ می‌شود" />
        </SummaryBlock>

        <SummaryBlock title="پیکربندی سیستم" badge={solarDesign?.valid ? "تأیید شده" : "کنترل‌شده"}>
          <SummaryItem label="اینورتر" value={solarDesign?.inverter?.title || systemSettings?.inverterId} note={solarDesign?.inverter?.count ? `${solarDesign.inverter.count} عدد` : null} />
          <SummaryItem label="باتری" value={solarDesign?.battery?.battery?.title || systemSettings?.batteryId} note={solarDesign?.battery?.totalCount ? `${solarDesign.battery.totalCount} عدد / ${solarDesign.battery.seriesCount} سری × ${solarDesign.battery.parallelCount} موازی` : null} />
          <SummaryItem label="پنل خورشیدی" value={solarDesign?.panel?.title || systemSettings?.panelId} note={solarDesign?.pvArray?.panelCount ? `${solarDesign.pvArray.panelCount} عدد / ${solarDesign.pvArray.seriesCount} سری × ${solarDesign.pvArray.parallelCount} موازی` : null} />
          <SummaryItem label="فضای نصب" value={solarDesign?.space?.maintenanceAreaM2 ? `${solarDesign.space.maintenanceAreaM2} m²` : null} />
          <SummaryItem label="حفاظت" value={solarDesign?.protection ? `DC ${solarDesign.protection.dcBreakerA}A / AC ${solarDesign.protection.acBreakerA}A` : null} />
          <SummaryItem label="کابل" value={solarDesign?.protection ? `DC ${solarDesign.protection.dcCable} / BAT ${solarDesign.protection.batteryCable}` : null} />
        </SummaryBlock>

        <div className="shil-section-card shil-ai-preview-card">
          <div className="shil-section-head"><h2>هوش مصنوعی SHIL</h2><span>اختیاری</span></div>
          <p className="shil-muted-line">اگر عکس محل نصب در شرایط محیطی ثبت شده باشد، این بلوک درخواست ساخت نمای مجازی محل نصب با پنل خورشیدی را بر اساس جهت، زاویه و تعداد تجهیزات محاسبه‌شده آماده می‌کند.</p>
          <div className="shil-ai-preview-layout">
            <div className={aiApplied ? "shil-ai-preview-visual ready" : "shil-ai-preview-visual"}>
              <div className="shil-ai-sky" />
              <div className="shil-ai-roof">
                {Array.from({ length: Math.min(Number(panelCount) || 6, 12) }).map((_, index) => <span key={index} />)}
              </div>
              <strong>{aiApplied ? "پیش‌نمایش مجازی آماده اتصال" : "پیش‌نمایش اختیاری محل نصب"}</strong>
            </div>
            <div className="shil-ai-preview-facts">
              <div><span>پنل واقعی</span><strong>{panelCount} عدد</strong></div>
              <div><span>اینورتر</span><strong>{inverterCount} عدد</strong></div>
              <div><span>باتری</span><strong>{batteryCount} عدد</strong></div>
              <div><span>توان اجرایی</span><strong>{typeof requiredPower === "number" ? `${Math.round(requiredPower)} W` : requiredPower}</strong></div>
            </div>
          </div>
          {aiMessage ? <div className={aiApplied ? "shil-inline-success" : "shil-inline-warning"}>{aiMessage}</div> : null}
          <div className="shil-action-row"><button type="button" className="shil-soft-button" onClick={applyAiPreview}>اعمال عکس محل نصب با AI</button><span className="shil-muted-line">این مرحله اختیاری است و مانع ادامه پروژه نمی‌شود.</span></div>
        </div>

        <button type="button" className="shil-primary-wide" onClick={confirmSummary}>تأیید چکیده و اجرای محاسبات</button>
      </section>
    </EngineeringPageShell>
  );
}
