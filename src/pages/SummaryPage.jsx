import React, { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import EngineeringPageShell from "../components/EngineeringPageShell.jsx";
import { ActionBar, DataGrid, DataSection, PageStack, StatusMessage } from "../components/ShilDesignSystem.jsx";
import { approveProjectStep } from "../workflow/projectWorkflow.js";
import { getProjectPath, getSystemSettingsDraft, getSystemSetupHandoff, normalizeProjectDomain } from "../engines/projectFlowData.js";

const faNumber = (value, digits = 0) => Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: digits });
const titleOf = (item) => item?.label || item?.title || item?.name || item?.model || "-";

const DOMAIN_TITLE = {
  solar: "چکیده طراحی",
  emergency: "چکیده طراحی برق اضطراری",
  utility: "چکیده طراحی نیروگاه خورشیدی",
};

function SummaryGrid({ rows = [] }) {
  return <DataGrid rows={rows} />;
}

function SolarSummary({ handoff, draft }) {
  const design = draft?.designResult || draft?.design || draft;
  return <>
    <DataSection title="چکیده ورودی محاسبات" meta={handoff?.methodSummary?.title || handoff?.source?.method || "solar"}>
      <SummaryGrid rows={[
        ["روش ورود", handoff?.methodSummary?.title || handoff?.source?.method],
        ["توان مبنا", `${faNumber(handoff?.normalizedLoad?.totalPowerW || design?.load?.basePowerW)} W`],
        ["انرژی روزانه", `${faNumber(handoff?.normalizedLoad?.dailyEnergyKWh || design?.load?.baseEnergyKWh, 2)} kWh`],
        ["مبنای طراحی", handoff?.methodSummary?.basis || "load_consumption"],
      ]} />
    </DataSection>
    <DataSection title="چکیده تنظیمات" meta="تجهیزات انتخابی">
      <SummaryGrid rows={[
        ["پنل", `${titleOf(design?.panel)} / ${faNumber(design?.pvArray?.panelCount)} عدد`],
        ["توان آرایه", `${faNumber(design?.pvArray?.arrayPowerKW, 2)} kW`],
        ["اینورتر", `${titleOf(design?.inverter)} / ${faNumber(design?.inverter?.count || 1)} عدد`],
        ["باتری", design?.system?.needsBattery ? `${titleOf(design?.battery?.item)} / ${faNumber(design?.battery?.grossEnergyKWh, 2)} kWh` : "غیرفعال"],
        ["تولید روزانه تخمینی", `${faNumber(design?.pvArray?.estimatedDailyKWh, 2)} kWh`],
        ["اعتبارسنجی", design?.valid ? "قابل اجرا" : "نیازمند بازبینی"],
      ]} />
      {(design?.warnings || []).map((item) => <StatusMessage key={item}>{item}</StatusMessage>)}
    </DataSection>
  </>;
}

function EmergencySummary({ draft }) {
  return <DataSection title="چکیده برق اضطراری" meta="مسیر مستقل باتری و اینورتر">
    <SummaryGrid rows={[
      ["توان بار ضروری", `${faNumber(draft?.designResult?.loadPowerW || draft?.loadPowerW)} W`],
      ["زمان پشتیبانی", `${faNumber(draft?.designResult?.backupHours || draft?.backupHours)} ساعت`],
      ["باتری", titleOf(draft?.designResult?.battery || draft?.battery)],
      ["اینورتر", titleOf(draft?.designResult?.inverter || draft?.inverter)],
    ]} />
  </DataSection>;
}

function UtilitySummary({ draft }) {
  return <DataSection title="چکیده نیروگاه خورشیدی" meta="مسیر Utility مستقل">
    <SummaryGrid rows={[
      ["ظرفیت هدف", `${faNumber(draft?.designResult?.targetPowerMW || draft?.targetPowerMW, 2)} MW`],
      ["پنل نیروگاهی", titleOf(draft?.designResult?.panel || draft?.panel)],
      ["اینورتر صنعتی", titleOf(draft?.designResult?.inverter || draft?.inverter)],
      ["تولید سالانه", `${faNumber(draft?.designResult?.annualEnergyKWh || draft?.annualEnergyKWh)} kWh`],
    ]} />
  </DataSection>;
}

export default function SummaryPage() {
  const navigate = useNavigate();
  const params = useParams();
  const projectPath = useMemo(() => getProjectPath(), []);
  const handoff = useMemo(() => getSystemSetupHandoff(), []);
  const draft = useMemo(() => getSystemSettingsDraft(), []);
  const domain = normalizeProjectDomain({ ...handoff, domain: params.domain || draft?.domain || projectPath.domain });

  const run = () => {
    approveProjectStep("summary");
    navigate(`/new-project/run/${domain}`);
  };

  return <EngineeringPageShell title={DOMAIN_TITLE[domain] || DOMAIN_TITLE.solar} activeStep="summary" backTo={`/new-project/system/${domain}`} className="shil-summary-clear-engineering">
    <PageStack className="shil-page-scroll shil-summary-page">
      {domain === "solar" ? <SolarSummary handoff={handoff} draft={draft} /> : null}
      {domain === "emergency" ? <EmergencySummary draft={draft || {}} /> : null}
      {domain === "utility" ? <UtilitySummary draft={draft || {}} /> : null}
      <DataSection title="آماده اجرا" meta={domain}>
        <p className="shil-muted-line">در مرحله بعد خروجی مهندسی نهایی، تجهیزات، هشدارها و داده قابل گزارش ساخته می‌شود.</p>
        <ActionBar><button type="button" className="shil-primary-wide" onClick={run}>اجرا نهایی</button></ActionBar>
      </DataSection>
    </PageStack>
  </EngineeringPageShell>;
}
