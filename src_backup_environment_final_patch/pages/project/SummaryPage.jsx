import React, { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import EngineeringPageShell from "../../components/EngineeringPageShell.jsx";
import { approveProjectStep } from "../../workflow/projectWorkflow.js";
import { getProjectPath, getSystemSettingsDraft, getSystemSetupHandoff, normalizeProjectDomain } from "../../engines/projectFlowData.js";
import { getProjectDesignState } from "../../engineering/core/projectDesignState.js";

const faNumber = (value, digits = 0) => Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: digits });
const titleOf = (item) => item?.label || item?.title || item?.name || item?.model || "-";

const DOMAIN_TITLE = {
  solar: "چکیده طراحی سیستم خورشیدی",
  emergency: "چکیده طراحی برق اضطراری",
  utility: "چکیده طراحی نیروگاه خورشیدی",
};

function SummaryGrid({ rows = [] }) {
  return <div className="shil-summary-grid">{rows.filter(Boolean).map(([label, value]) => (
    <div key={label} className="shil-summary-item"><span>{label}</span><strong>{value || "-"}</strong></div>
  ))}</div>;
}

function SolarSummary({ handoff, draft }) {
  const design = draft?.designResult || draft?.design || draft;
  return <>
    <section className="shil-section-card">
      <div className="shil-section-head"><h2>چکیده ورودی محاسبات</h2><span>{handoff?.methodSummary?.title || handoff?.source?.method || "solar"}</span></div>
      <SummaryGrid rows={[
        ["روش ورود", handoff?.methodSummary?.title || handoff?.source?.method],
        ["توان مبنا", `${faNumber(handoff?.normalizedLoad?.totalPowerW || design?.load?.basePowerW)} W`],
        ["انرژی روزانه", `${faNumber(handoff?.normalizedLoad?.dailyEnergyKWh || design?.load?.baseEnergyKWh, 2)} kWh`],
        ["مبنای طراحی", handoff?.methodSummary?.basis || "load_consumption"],
      ]} />
    </section>
    <section className="shil-section-card">
      <div className="shil-section-head"><h2>چکیده تنظیمات سیستم</h2><span>تجهیزات انتخابی</span></div>
      <SummaryGrid rows={[
        ["پنل", `${titleOf(design?.panel)} / ${faNumber(design?.pvArray?.panelCount)} عدد`],
        ["توان آرایه", `${faNumber(design?.pvArray?.arrayPowerKW, 2)} kW`],
        ["اینورتر", `${titleOf(design?.inverter)} / ${faNumber(design?.inverter?.count || 1)} عدد`],
        ["باتری", design?.system?.needsBattery ? `${titleOf(design?.battery?.item)} / ${faNumber(design?.battery?.grossEnergyKWh, 2)} kWh` : "غیرفعال"],
        ["تولید روزانه تخمینی", `${faNumber(design?.pvArray?.estimatedDailyKWh, 2)} kWh`],
        ["اعتبارسنجی", design?.valid ? "قابل اجرا" : "نیازمند بازبینی"],
      ]} />
      {(design?.warnings || []).map((item) => <div key={item} className="shil-inline-warning">{item}</div>)}
    </section>
  </>;
}

function EmergencySummary({ draft }) {
  return <section className="shil-section-card">
    <div className="shil-section-head"><h2>چکیده برق اضطراری</h2><span>مسیر مستقل باتری و اینورتر</span></div>
    <SummaryGrid rows={[
      ["توان بار ضروری", `${faNumber(draft?.designResult?.loadPowerW || draft?.loadPowerW)} W`],
      ["زمان پشتیبانی", `${faNumber(draft?.designResult?.backupHours || draft?.backupHours)} ساعت`],
      ["باتری", titleOf(draft?.designResult?.battery || draft?.battery)],
      ["اینورتر", titleOf(draft?.designResult?.inverter || draft?.inverter)],
    ]} />
  </section>;
}

function UtilitySummary({ draft }) {
  return <section className="shil-section-card">
    <div className="shil-section-head"><h2>چکیده نیروگاه خورشیدی</h2><span>مسیر Utility مستقل</span></div>
    <SummaryGrid rows={[
      ["ظرفیت هدف", `${faNumber(draft?.designResult?.targetPowerMW || draft?.targetPowerMW, 2)} MW`],
      ["پنل نیروگاهی", titleOf(draft?.designResult?.panel || draft?.panel)],
      ["اینورتر صنعتی", titleOf(draft?.designResult?.inverter || draft?.inverter)],
      ["تولید سالانه", `${faNumber(draft?.designResult?.annualEnergyKWh || draft?.annualEnergyKWh)} kWh`],
    ]} />
  </section>;
}

export default function SummaryPage() {
  const navigate = useNavigate();
  const params = useParams();
  const projectPath = useMemo(() => getProjectPath(), []);
  const handoff = useMemo(() => getSystemSetupHandoff(), []);
  const centralState = useMemo(() => getProjectDesignState(), []);
  const draft = useMemo(() => getSystemSettingsDraft(), []);
  const domain = normalizeProjectDomain({ ...handoff, domain: params.domain || centralState?.domain || draft?.domain || projectPath.domain });

  const run = () => {
    approveProjectStep("summary");
    navigate(`/new-project/run/${domain}`);
  };

  return <EngineeringPageShell title={DOMAIN_TITLE[domain] || DOMAIN_TITLE.solar} activeStep="summary" backTo={`/new-project/system/${domain}`}>
    <div className="shil-page-scroll shil-summary-page">
      {domain === "solar" ? <SolarSummary handoff={handoff} draft={centralState?.design ? { designResult: centralState.design } : draft} /> : null}
      {domain === "emergency" ? <EmergencySummary draft={draft || {}} /> : null}
      {domain === "utility" ? <UtilitySummary draft={draft || {}} /> : null}
      <section className="shil-section-card">
        <div className="shil-section-head"><h2>آماده اجرای محاسبات</h2><span>{domain}</span></div>
        <p className="shil-muted-line">در مرحله بعد خروجی مهندسی نهایی، تجهیزات، هشدارها و داده قابل گزارش ساخته می‌شود.</p>
        <button type="button" className="shil-primary-wide" onClick={run}>اجرای محاسبات نهایی</button>
      </section>
    </div>
  </EngineeringPageShell>;
}
