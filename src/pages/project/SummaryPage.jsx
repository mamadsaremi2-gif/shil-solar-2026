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

function getFirstSiteImage(environment = {}) {
  const attachments = Array.isArray(environment.siteAttachments) ? environment.siteAttachments : [];
  const first = attachments[0] || environment.siteAttachment || environment.sitePhoto || environment.installationImage || null;
  if (!first) return null;
  if (typeof first === "string") return { src: first, title: "تصویر محل نصب" };
  return {
    src: first.dataUrl || first.previewUrl || first.url || first.src || first.base64 || "",
    title: first.name || first.fileName || "تصویر محل نصب"
  };
}

function AiReasonTable({ title, rows }) {
  return (
    <div className="shil-ai-install-table-card">
      <h3>{title}</h3>
      <div className="shil-ai-install-table">
        <div className="head"><span>پارامتر</span><span>مقدار</span><span>علت انتخاب</span></div>
        {rows.map((row) => (
          <div key={`${title}-${row.label}`}>
            <span>{row.label}</span>
            <strong>{row.value}</strong>
            <small>{row.reason}</small>
          </div>
        ))}
      </div>
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
  const environmentImage = useMemo(() => getFirstSiteImage(environment), [environment]);

  const [aiOpen, setAiOpen] = useState(false);
  const [imageTransferred, setImageTransferred] = useState(false);
  const [aiApplied, setAiApplied] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [installMode, setInstallMode] = useState("roof");

  const sitePhotoCount = Number(environment.siteAttachments?.length || (environment.siteAttachment ? 1 : 0) || (environmentImage ? 1 : 0));
  const hasSitePhoto = sitePhotoCount > 0 && Boolean(environmentImage?.src || environmentImage?.title);
  const panelCount = solarDesign?.pvArray?.panelCount || systemSettings?.panelCount || "-";
  const panelPower = solarDesign?.panel?.powerW || systemSettings?.panelPowerW || 620;
  const panelSeries = solarDesign?.pvArray?.seriesCount || systemSettings?.panelSeriesCount || "-";
  const panelParallel = solarDesign?.pvArray?.parallelCount || systemSettings?.panelParallelCount || "-";
  const inverterCount = solarDesign?.inverter?.count || systemSettings?.inverterCount || "-";
  const inverterPower = solarDesign?.inverter?.powerW || solarDesign?.inverter?.ratedPowerW || systemSettings?.inverterPowerW || "-";
  const batteryCount = solarDesign?.battery?.totalCount || systemSettings?.batteryCount || "-";
  const batteryVoltage = solarDesign?.battery?.battery?.voltageV || solarDesign?.battery?.voltageV || systemSettings?.batteryVoltageV || "-";
  const batteryCapacity = solarDesign?.battery?.battery?.capacityAh || solarDesign?.battery?.capacityAh || systemSettings?.batteryCapacityAh || "-";
  const batterySeries = solarDesign?.battery?.seriesCount || systemSettings?.batterySeriesCount || "-";
  const batteryParallel = solarDesign?.battery?.parallelCount || systemSettings?.batteryParallelCount || "-";
  const requiredPower = solarDesign?.load?.designPeakW || solarDesign?.requiredPowerW || loadResult?.designPowerW || loadResult?.peakPowerW || "در انتظار محاسبه";

  const transferSiteImage = () => {
    if (!hasSitePhoto) {
      setImageTransferred(false);
      setAiApplied(false);
      setAiMessage("برای استفاده از این بلوک اختیاری، ابتدا در صفحه شرایط محیطی تصویر محل نصب و اجرا را ثبت کنید.");
      return;
    }
    const payload = {
      transferredAt: new Date().toISOString(),
      source: "environment.siteAttachments",
      image: environmentImage,
      installMode
    };
    localStorage.setItem("shil:aiInstallationSourceImage", JSON.stringify(payload));
    setImageTransferred(true);
    setAiMessage("تصویر محل نصب از شرایط محیطی به بلوک هوش مصنوعی منتقل شد. اکنون می‌توانید شبیه‌سازی تصویری را اعمال کنید.");
  };

  const applyAiPreview = () => {
    if (!hasSitePhoto || !imageTransferred) {
      setAiApplied(false);
      setAiMessage("ابتدا دکمه «افزودن تصویر محل نصب و اجرا» را بزنید تا تصویر این پروژه وارد بلوک هوش مصنوعی شود.");
      return;
    }
    const previewPayload = {
      createdAt: new Date().toISOString(),
      mode: "optional-ai-installation-visualization",
      installMode,
      source: "environment.siteAttachments",
      image: environmentImage,
      panel: { count: panelCount, powerW: panelPower, series: panelSeries, parallel: panelParallel },
      inverter: { count: inverterCount, powerW: inverterPower, title: solarDesign?.inverter?.title || systemSettings?.inverterId },
      battery: { count: batteryCount, voltageV: batteryVoltage, capacityAh: batteryCapacity, series: batterySeries, parallel: batteryParallel },
      note: "این خروجی اختیاری برای اتصال به سرویس تولید تصویر SHIL AI آماده شده است و روی مسیر محاسبات اجباری پروژه اثر ندارد."
    };
    localStorage.setItem("shil:aiInstallationPreview", JSON.stringify(previewPayload));
    setAiApplied(true);
    setAiMessage("شبیه‌سازی تصویری نصب پروژه ثبت شد. تصویر مجازی و جدول مهندسی تجهیزات برای تایید نهایی آماده است.");
  };

  const confirmAiPreview = () => {
    if (!aiApplied) {
      setAiMessage("برای تایید این بلوک اختیاری، ابتدا تصویر محل نصب را اضافه و دکمه اعمال را بزنید.");
      return;
    }
    localStorage.setItem("shil:aiInstallationPreviewConfirmed", JSON.stringify({ confirmedAt: new Date().toISOString(), installMode }));
    setAiMessage("بلوک هوش مصنوعی نصب پروژه تایید شد و همراه چکیده اطلاعات ذخیره می‌شود.");
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

  const installationModes = [
    { key: "roof", title: "نصب روی سقف" },
    { key: "ground", title: "نصب زمینی" },
    { key: "hybrid", title: "نصب ترکیبی" },
    { key: "equipmentRoom", title: "اتاق باتری و اینورتر" }
  ];

  const panelRows = [
    { label: "تعداد پنل", value: `${panelCount} عدد`, reason: "بر اساس انرژی روزانه و توان طراحی موتور محاسبات تعیین شده است." },
    { label: "توان هر پنل", value: `${panelPower} وات`, reason: "پنل پیش‌فرض مهندسی SHIL برای طراحی فعلی است، مگر اینکه کاربر مقدار دستی وارد کند." },
    { label: "آرایش سری", value: `${panelSeries} سری`, reason: "برای رساندن ولتاژ رشته پنل به محدوده مجاز MPPT انتخاب شده است." },
    { label: "آرایش موازی", value: `${panelParallel} موازی`, reason: "برای افزایش جریان و رسیدن به ظرفیت کل آرایه بدون خروج از محدودیت اینورتر استفاده شده است." }
  ];
  const inverterRows = [
    { label: "تعداد اینورتر", value: `${inverterCount} عدد`, reason: "بر اساس توان پیک، ضریب اطمینان و سناریوی اجرای پروژه انتخاب شده است." },
    { label: "توان اینورتر", value: inverterPower === "-" ? "ثبت نشده" : `${inverterPower} وات`, reason: "باید توان همزمان و جریان راه‌اندازی بارهای اصلی را پوشش دهد." },
    { label: "نوع انتخاب", value: solarDesign?.inverter?.title || systemSettings?.inverterId || "انتخاب هوشمند", reason: "از بانک اینورتر خورشیدی مطابق نوع آفگرید، آنگرید یا هیبرید انتخاب می‌شود." }
  ];
  const batteryRows = [
    { label: "تعداد باتری", value: `${batteryCount} عدد`, reason: "برای تامین روزهای خودکفایی و ظرفیت ذخیره انرژی پروژه تعیین شده است." },
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

        <div className={aiOpen ? "shil-section-card shil-ai-preview-card shil-ai-preview-card-open" : "shil-section-card shil-ai-preview-card"}>
          <button type="button" className="shil-ai-preview-toggle" onClick={() => setAiOpen((value) => !value)}>
            <span>
              <strong>اجرای هوش مصنوعی نصب پروژه</strong>
              <small>اختیاری؛ شبیه‌سازی تصویری محل نصب و نمایش جدول مهندسی تجهیزات نهایی</small>
            </span>
            <b>{aiOpen ? "بستن" : "نمایش"}</b>
          </button>

          {aiOpen ? (
            <div className="shil-ai-preview-body">
              <p className="shil-muted-line">این بلوک فقط برای شبیه‌سازی تصویری اختیاری است. اگر تصویر محل اجرا در صفحه شرایط محیطی ثبت شده باشد، می‌توانید آن را به این بخش منتقل کنید و سپس تصویر مجازی نصب پنل‌ها و تجهیزات آینده پروژه را بسازید.</p>

              <div className="shil-ai-transfer-row">
                <div className={hasSitePhoto ? "shil-ai-source-status ready" : "shil-ai-source-status"}>
                  <span>{hasSitePhoto ? "تصویر محل اجرای پروژه شناسایی شد" : "تصویر محل نصب هنوز ثبت نشده است"}</span>
                  <strong>{hasSitePhoto ? environmentImage?.title || "تصویر محیط" : "ابتدا در شرایط محیطی عکس اضافه کنید"}</strong>
                </div>
                <button type="button" className="shil-soft-button" onClick={transferSiteImage}>افزودن تصویر محل نصب و اجرا</button>
              </div>

              <div className="shil-ai-mode-row">
                {installationModes.map((item) => (
                  <button key={item.key} type="button" className={installMode === item.key ? "active" : ""} onClick={() => setInstallMode(item.key)}>{item.title}</button>
                ))}
              </div>

              <div className="shil-ai-preview-layout shil-ai-install-preview-layout">
                <div className={aiApplied ? "shil-ai-preview-visual ready shil-ai-install-visual" : "shil-ai-preview-visual shil-ai-install-visual"}>
                  {imageTransferred && environmentImage?.src ? <img src={environmentImage.src} alt="تصویر محل نصب پروژه" /> : null}
                  <div className="shil-ai-sky" />
                  <div className="shil-ai-roof">
                    {Array.from({ length: Math.min(Number(panelCount) || 6, 12) }).map((_, index) => <span key={index} />)}
                  </div>
                  <strong>{aiApplied ? "تصویر مجازی نصب آماده شد" : imageTransferred ? "تصویر منتقل شد؛ آماده اعمال" : "در انتظار افزودن تصویر محل نصب"}</strong>
                </div>

                <div className="shil-ai-preview-facts shil-ai-install-facts">
                  <div><span>سناریوی شبیه‌سازی</span><strong>{installationModes.find((item) => item.key === installMode)?.title}</strong></div>
                  <div><span>پنل خورشیدی</span><strong>{panelCount} عدد / {panelPower} وات</strong></div>
                  <div><span>آرایش پنل</span><strong>{panelSeries} سری × {panelParallel} موازی</strong></div>
                  <div><span>اینورتر</span><strong>{inverterCount} عدد / {inverterPower === "-" ? "ثبت نشده" : `${inverterPower} وات`}</strong></div>
                  <div><span>باتری</span><strong>{batteryCount} عدد</strong></div>
                  <div><span>آرایش باتری</span><strong>{batterySeries} سری × {batteryParallel} موازی</strong></div>
                </div>
              </div>

              <div className="shil-action-row shil-ai-apply-row">
                <button type="button" className="shil-primary-small" onClick={applyAiPreview}>اعمال شبیه‌سازی هوش مصنوعی</button>
                <span className="shil-muted-line">این مرحله اختیاری است و مانع ادامه پروژه نمی‌شود.</span>
              </div>

              {aiMessage ? <div className={aiApplied ? "shil-inline-success" : "shil-inline-warning"}>{aiMessage}</div> : null}

              {aiApplied ? (
                <div className="shil-ai-engineering-output">
                  <AiReasonTable title="جدول مهندسی پنل خورشیدی" rows={panelRows} />
                  <AiReasonTable title="جدول مهندسی اینورتر" rows={inverterRows} />
                  <AiReasonTable title="جدول مهندسی باتری" rows={batteryRows} />
                  <div className="shil-ai-final-note">
                    <strong>نتیجه شبیه‌سازی</strong>
                    <p>تصویر مجازی بر اساس تصویر محل نصب، نوع چیدمان انتخابی و دیتای واقعی موتور محاسبات آماده شده است. تعداد تجهیزات، توان، سری و موازی‌ها بر اساس خروجی پیکربندی سیستم در همین صفحه نمایش داده شده‌اند.</p>
                    <button type="button" className="shil-soft-button" onClick={confirmAiPreview}>تایید خروجی هوش مصنوعی</button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <button type="button" className="shil-primary-wide" onClick={confirmSummary}>تأیید چکیده و اجرای محاسبات</button>
      </section>
    </EngineeringPageShell>
  );
}
