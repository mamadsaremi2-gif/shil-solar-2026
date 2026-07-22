import React, { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import EngineeringPageShell from "../components/EngineeringPageShell.jsx";
import { ActionBar, DataGrid, DataSection, PageStack, StatusMessage } from "../components/ShilDesignSystem.jsx";
import { approveProjectStep } from "../workflow/projectWorkflow.js";
import { getProjectPath, getSystemSettingsDraft, getSystemSetupHandoff, normalizeProjectDomain, writeJson } from "../engines/projectFlowData.js";

const faNumber = (value, digits = 0) => Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: digits });
const titleOf = (item) => item?.label || item?.title || item?.name || item?.model || "-";

function buildSolarOutput(handoff, draft) {
  const design = draft?.designResult || draft?.design || draft || {};
  return {
    domain: "solar",
    title: "خروجی نهایی پروژه خورشیدی",
    basis: handoff?.methodSummary?.title || handoff?.source?.method || "ورودی محاسبات",
    headline: [
      ["توان طراحی", `${faNumber(design?.load?.finalPowerW)} W`],
      ["انرژی طراحی", `${faNumber(design?.load?.finalEnergyKWh, 2)} kWh/day`],
      ["آرایه خورشیدی", `${faNumber(design?.pvArray?.arrayPowerKW, 2)} kW`],
      ["تولید روزانه", `${faNumber(design?.pvArray?.estimatedDailyKWh, 2)} kWh`],
    ],
    equipment: [
      ["پنل", `${titleOf(design?.panel)} × ${faNumber(design?.pvArray?.panelCount)} عدد`],
      ["اینورتر", `${titleOf(design?.inverter)} × ${faNumber(design?.inverter?.count || 1)} عدد`],
      ...(design?.system?.needsBattery ? [["ذخیره‌ساز انرژی", `${titleOf(design?.battery?.item)} × ${faNumber(design?.battery?.count)} عدد / ${faNumber(design?.battery?.grossEnergyKWh, 2)} kWh`]] : []),
      ["استرینگ", `${faNumber(design?.pvArray?.seriesCount)} سری × ${faNumber(design?.pvArray?.parallelCount)} موازی`],
    ],
    warnings: design?.warnings || [],
    raw: { handoff, draft, design },
  };
}

function buildEmergencyOutput(draft) {
  const design = draft?.designResult || draft || {};
  return {
    domain: "emergency",
    title: "خروجی نهایی برق اضطراری",
    basis: "باتری و اینورتر بدون پنل خورشیدی",
    headline: [
      ["بار ضروری", `${faNumber(design?.loadPowerW || design?.load?.totalPowerW)} W`],
      ["زمان پشتیبانی", `${faNumber(design?.backupHours || design?.autonomyHours)} ساعت`],
      ["ظرفیت ذخیره", `${faNumber(design?.batteryKWh || design?.battery?.grossEnergyKWh, 2)} kWh`],
    ],
    equipment: [
      ["باتری", titleOf(design?.battery?.item || design?.battery)],
      ["اینورتر", titleOf(design?.inverter)],
      ["حفاظت DC", "فیوز/کلید باتری مطابق جریان طراحی"],
    ],
    warnings: design?.warnings || [],
    raw: { draft, design },
  };
}

function buildUtilityOutput(draft) {
  const design = draft?.designResult || draft || {};
  return {
    domain: "utility",
    title: "خروجی نهایی نیروگاه انرژی خورشیدی",
    basis: "ظرفیت نیروگاهی و اتصال شبکه",
    headline: [
      ["ظرفیت هدف", `${faNumber(design?.targetPowerMW || design?.systemScale?.targetPowerMW, 2)} MW`],
      ["توان DC", `${faNumber(design?.dcPowerMW || design?.pvArray?.arrayPowerKW / 1000, 2)} MWp`],
      ["تولید سالانه", `${faNumber(design?.annualEnergyKWh || design?.utilityElectrical?.yield?.annualKWh)} kWh`],
    ],
    equipment: [
      ["پنل نیروگاهی", titleOf(design?.panel)],
      ["اینورتر صنعتی", titleOf(design?.inverter)],
      ["حفاظت و اتصال", "تابلو DC/AC، ترانس و الزامات اتصال شبکه"],
    ],
    warnings: design?.warnings || [],
    raw: { draft, design },
  };
}

function ResultCard({ title, rows = [] }) {
  return <DataSection title={title} meta="نتیجه"><DataGrid rows={rows} /></DataSection>;
}

export default function RunCalculation() {
  const navigate = useNavigate();
  const params = useParams();
  const projectPath = useMemo(() => getProjectPath(), []);
  const handoff = useMemo(() => getSystemSetupHandoff(), []);
  const draft = useMemo(() => getSystemSettingsDraft(), []);
  const domain = normalizeProjectDomain({ ...handoff, domain: params.domain || draft?.domain || projectPath.domain });
  const output = useMemo(() => {
    if (domain === "emergency") return buildEmergencyOutput(draft || {});
    if (domain === "utility") return buildUtilityOutput(draft || {});
    return buildSolarOutput(handoff, draft || {});
  }, [domain, handoff, draft]);

  const finish = () => {
    const finalOutput = { ...output, createdAt: new Date().toISOString(), version: 3 };
    writeJson("shil:finalEngineeringOutput", finalOutput);
    approveProjectStep("run");
    navigate(`/new-project/summary/${domain}?final=1`);
  };

  return <EngineeringPageShell title={output.title} activeStep="run" backTo={`/new-project/summary/${domain}`}>
    <PageStack className="shil-page-scroll shil-run-page">
      <DataSection title="مبنای اجرا" meta={domain}>
        <p className="shil-muted-line">{output.basis}</p>
      </DataSection>
      <ResultCard title="خلاصه عددی" rows={output.headline} />
      <ResultCard title="تجهیزات و اقلام اجرایی" rows={output.equipment} />
      {output.warnings?.length ? <DataSection title="هشدارهای مهندسی" meta="بازبینی">{output.warnings.map((item) => <StatusMessage key={item}>{item}</StatusMessage>)}</DataSection> : null}
      <DataSection title="خروجی نهایی" meta="ثبت و گزارش">
        <ActionBar><button type="button" className="shil-primary-wide" onClick={finish}>ثبت خروجی نهایی پروژه</button></ActionBar>
      </DataSection>
    </PageStack>
  </EngineeringPageShell>;
}
