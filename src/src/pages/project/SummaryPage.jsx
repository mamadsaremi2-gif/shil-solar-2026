import ShilPrimaryButton from "../../components/project/ShilPrimaryButton";
import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import EngineeringPageShell from "../../components/EngineeringPageShell.jsx";
import ShilWarningOverlay from "../../components/ShilWarningOverlay.jsx";
import { approveProjectStep } from "../../workflow/projectWorkflow.js";
import {
  getProjectPath,
  getSystemSettingsDraft,
  getSystemSetupHandoff,
  normalizeProjectDomain,
} from "../../engines/projectFlowData.js";
import { getProjectDesignState } from "../../engineering/core/projectDesignState.js";

const faNumber = (value, digits = 0) =>
  Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: digits });
const titleOf = (item) => item?.label || item?.title || item?.name || item?.model || "-";

const DOMAIN_TITLE = {
  solar: "چکیده طراحی",
  emergency: "چکیده طراحی برق اضطراری",
  utility: "چکیده طراحی نیروگاه خورشیدی",
};

function SummaryGrid({ rows = [] }) {
  const [open, setOpen] = useState(false);
  const cleanRows = rows.filter(Boolean);
  const compactRows = cleanRows.slice(0, 8);
  const detailRows = cleanRows.slice(8);

  const renderRows = (items, keyPrefix) => (
    <div className="shil-summary-kv-grid">
      {items.map(([label, value], index) => (
        <article className="shil-summary-kv-card" key={`${keyPrefix}-${index}`}>
          <span className="shil-summary-kv-label">{label}</span>
          <strong className="shil-summary-kv-value" title={`${label}: ${value || "-"}`}>
            {value || "-"}
          </strong>
        </article>
      ))}
    </div>
  );

  return (
    <div className="shil-summary-data" data-keep-card="true">
      {renderRows(compactRows, "summary")}

      {detailRows.length ? (
        <>
          <button
            type="button"
            className="shil-summary-accordion-chip"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "▲ بستن جزئیات" : "▼ مشاهده جزئیات"}
          </button>

          <div className={open ? "shil-summary-accordion open" : "shil-summary-accordion"}>
            {renderRows(detailRows, "detail")}
          </div>
        </>
      ) : null}
    </div>
  );
}

function SummarySection({ title, meta, children }) {
  return (
    <section className="shil-summary-section" aria-label={title}>
      <header className="shil-summary-section-title">
        <h2>{title}</h2>
        {meta ? <span>{meta}</span> : null}
      </header>
      {children}
    </section>
  );
}

function SummaryPageStyle() {
  return <style>{`
    .shil-summary-page{
      direction:rtl;
      width:100%;
      margin:0;
      padding:8px 0 18px !important;
      display:flex;
      flex-direction:column;
      gap:18px;
      background:transparent !important;
      background-image:none !important;
      border:0 !important;
      box-shadow:none !important;
      min-height:0 !important;
    }

    .shil-summary-page::before,
    .shil-summary-page::after{
      content:none !important;
      display:none !important;
    }

    .shil-summary-section{
      width:100%;
      margin:0;
      padding:0;
      background:transparent !important;
      background-image:none !important;
      border:0 !important;
      border-radius:0 !important;
      box-shadow:none !important;
      backdrop-filter:none !important;
      -webkit-backdrop-filter:none !important;
    }

    .shil-summary-section + .shil-summary-section{
      padding-top:16px;
      border-top:1px solid rgba(15,23,42,.12) !important;
    }

    .shil-summary-section-title{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:12px;
      min-height:0;
      margin:0 0 9px;
      padding:0;
      background:transparent !important;
      background-image:none !important;
      border:0 !important;
      border-radius:0 !important;
      box-shadow:none !important;
    }

    .shil-summary-section-title h2{
      margin:0;
      color:#111827;
      font-size:14px;
      font-weight:900;
      line-height:1.5;
    }

    .shil-summary-section-title span{
      color:#64748b;
      font-size:11px;
      font-weight:700;
      line-height:1.4;
      white-space:nowrap;
    }

    .shil-summary-data{
      width:100%;
      margin:0;
      padding:0;
      background:transparent !important;
      border:0 !important;
      border-radius:0 !important;
      box-shadow:none !important;
    }

    .shil-compact-summary-table{
      width:100%;
      table-layout:fixed;
      border-collapse:collapse;
      border-spacing:0;
      background:#fff;
      border:1px solid #cbd5e1;
      color:#0f172a;
      text-align:center;
      font-size:12px;
      box-shadow:none !important;
    }

    .shil-compact-summary-table th{
      height:31px;
      padding:4px 3px;
      background:#f1f5f9 !important;
      background-image:none !important;
      border:1px solid #cbd5e1;
      color:#334155;
      font-size:11px;
      font-weight:900;
      line-height:1.35;
      vertical-align:middle;
    }

    .shil-compact-summary-table td{
      height:36px;
      padding:4px 3px;
      background:#fff !important;
      background-image:none !important;
      border:1px solid #e2e8f0;
      color:#0f172a;
      font-size:12px;
      font-weight:800;
      line-height:1.35;
      vertical-align:middle;
      word-break:break-word;
    }

    .shil-summary-accordion-chip{
      display:block;
      margin:8px auto 0;
      padding:5px 11px;
      border:1px solid #cbd5e1;
      border-radius:8px;
      background:#fff !important;
      background-image:none !important;
      color:#334155;
      font:800 11px/1.4 inherit;
      cursor:pointer;
      box-shadow:none !important;
    }

    .shil-summary-accordion{
      max-height:0;
      opacity:0;
      overflow:hidden;
      margin-top:0;
      transition:max-height 220ms ease, opacity 220ms ease, margin-top 220ms ease;
    }

    .shil-summary-accordion.open{
      max-height:900px;
      opacity:1;
      overflow:auto;
      margin-top:8px;
    }

    .shil-summary-ready-text{
      margin:0;
      padding:0;
      color:#475569;
      font-size:12px;
      font-weight:600;
      line-height:1.8;
    }

    .shil-summary-page .shil-env-content-confirm-slot{
      position:static !important;
      inset:auto !important;
      transform:none !important;
      translate:none !important;
      display:flex !important;
      justify-content:center !important;
      align-items:center !important;
      width:100% !important;
      min-height:0 !important;
      height:auto !important;
      margin:0 !important;
      padding:2px 0 0 !important;
      background:transparent !important;
      background-image:none !important;
      border:0 !important;
      border-radius:0 !important;
      box-shadow:none !important;
      backdrop-filter:none !important;
      -webkit-backdrop-filter:none !important;
      z-index:auto !important;
    }

    .shil-summary-page .shil-env-content-confirm-slot::before,
    .shil-summary-page .shil-env-content-confirm-slot::after{
      content:none !important;
      display:none !important;
    }

    .shil-summary-page .shil-env-content-confirm-button{
      position:static !important;
      inset:auto !important;
      transform:none !important;
      translate:none !important;
      width:max-content !important;
      min-width:0 !important;
      max-width:none !important;
      margin:0 !important;
      padding-inline:14px !important;
      white-space:nowrap !important;
    }

    @media (max-width:700px){
      .shil-summary-page{gap:15px;padding-top:4px !important;}
      .shil-summary-section + .shil-summary-section{padding-top:13px;}
      .shil-summary-section-title{align-items:flex-start;gap:6px;}
      .shil-summary-section-title h2{font-size:13px;}
      .shil-summary-section-title span{font-size:10px;}
      .shil-compact-summary-table th,
      .shil-compact-summary-table td{font-size:10.5px !important;padding:3px 2px;}
    }
  `}</style>;
}

function SolarSummary({ handoff, draft }) {
  const design = draft?.designResult || draft?.design || draft;
  return (
    <>
      <SummarySection
        title="چکیده ورودی محاسبات"
        meta={handoff?.methodSummary?.title || handoff?.source?.method || "solar"}
      >
        <SummaryGrid rows={[
          ["روش ورود", handoff?.methodSummary?.title || handoff?.source?.method],
          ["توان مبنا", `${faNumber(handoff?.normalizedLoad?.totalPowerW || design?.load?.basePowerW)} W`],
          ["انرژی روزانه", `${faNumber(handoff?.normalizedLoad?.dailyEnergyKWh || design?.load?.baseEnergyKWh, 2)} kWh`],
          ["مبنای طراحی", handoff?.methodSummary?.basis || "load_consumption"],
        ]} />
      </SummarySection>

      <SummarySection title="چکیده تنظیمات" meta="تجهیزات انتخابی">
        <SummaryGrid rows={[
          ["پنل", `${titleOf(design?.panel)} / ${faNumber(design?.pvArray?.panelCount)} عدد`],
          ["توان آرایه", `${faNumber(design?.pvArray?.arrayPowerKW, 2)} kW`],
          ["اینورتر", `${titleOf(design?.inverter)} / ${faNumber(design?.inverter?.count || 1)} عدد`],
          ["باتری", design?.system?.needsBattery ? `${titleOf(design?.battery?.item)} / ${faNumber(design?.battery?.grossEnergyKWh, 2)} kWh` : "غیرفعال"],
          ["تولید روزانه تخمینی", `${faNumber(design?.pvArray?.estimatedDailyKWh, 2)} kWh`],
          ["اعتبارسنجی", design?.valid ? "قابل اجرا" : "نیازمند بازبینی"],
        ]} />
        <ShilWarningOverlay messages={design?.warnings} />
      </SummarySection>
    </>
  );
}

function EmergencySummary({ draft }) {
  return (
    <SummarySection title="چکیده برق اضطراری" meta="مسیر مستقل باتری و اینورتر">
      <SummaryGrid rows={[
        ["توان بار ضروری", `${faNumber(draft?.designResult?.loadPowerW || draft?.loadPowerW)} W`],
        ["زمان پشتیبانی", `${faNumber(draft?.designResult?.backupHours || draft?.backupHours)} ساعت`],
        ["باتری", titleOf(draft?.designResult?.battery || draft?.battery)],
        ["اینورتر", titleOf(draft?.designResult?.inverter || draft?.inverter)],
      ]} />
    </SummarySection>
  );
}

function UtilitySummary({ draft }) {
  return (
    <SummarySection title="چکیده نیروگاه خورشیدی" meta="مسیر Utility مستقل">
      <SummaryGrid rows={[
        ["ظرفیت هدف", `${faNumber(draft?.designResult?.targetPowerMW || draft?.targetPowerMW, 2)} MW`],
        ["پنل نیروگاهی", titleOf(draft?.designResult?.panel || draft?.panel)],
        ["اینورتر صنعتی", titleOf(draft?.designResult?.inverter || draft?.inverter)],
        ["تولید سالانه", `${faNumber(draft?.designResult?.annualEnergyKWh || draft?.annualEnergyKWh)} kWh`],
      ]} />
    </SummarySection>
  );
}

export default function SummaryPage() {
  const navigate = useNavigate();
  const params = useParams();
  const projectPath = useMemo(() => getProjectPath(), []);
  const handoff = useMemo(() => getSystemSetupHandoff(), []);
  const centralState = useMemo(() => getProjectDesignState(), []);
  const draft = useMemo(() => getSystemSettingsDraft(), []);
  const domain = normalizeProjectDomain({
    ...handoff,
    domain: params.domain || centralState?.domain || draft?.domain || projectPath.domain,
  });

  const run = () => {
    approveProjectStep("summary");
    navigate(`/new-project/run/${domain}`);
  };

  return (
    <EngineeringPageShell
      title={DOMAIN_TITLE[domain] || DOMAIN_TITLE.solar}
      activeStep="summary"
      backTo={`/new-project/system/${domain}`}
      className="shil-summary-clear-engineering"
    >
      <SummaryPageStyle />
      <div id="shil-summary-page-root" className="shil-page-scroll shil-summary-page">
        {domain === "solar" ? (
          <SolarSummary
            handoff={handoff}
            draft={centralState?.design ? { designResult: centralState.design } : draft}
          />
        ) : null}
        {domain === "emergency" ? <EmergencySummary draft={draft || {}} /> : null}
        {domain === "utility" ? <UtilitySummary draft={draft || {}} /> : null}

        <SummarySection title="آماده اجرا" meta={domain}>
          <p className="shil-summary-ready-text">
            در مرحله بعد خروجی مهندسی نهایی، تجهیزات، هشدارها و داده قابل گزارش ساخته می‌شود.
          </p>
        </SummarySection>

        <div className="shil-env-content-confirm-slot" aria-label="تأیید چکیده طراحی">
          <ShilPrimaryButton
            className="shil-env-content-confirm-button"
            onClick={run}
            label="تأیید چکیده"
          />
        </div>
      </div>
    </EngineeringPageShell>
  );
}
