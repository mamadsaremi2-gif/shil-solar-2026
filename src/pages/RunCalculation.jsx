import React, { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import EngineeringPageShell from "../components/EngineeringPageShell.jsx";
import { approveProjectStep } from "../workflow/projectWorkflow.js";
import { getProjectPath, getSystemSettingsDraft, getSystemSetupHandoff, normalizeProjectDomain, writeJson } from "../engines/projectFlowData.js";

const faNumber = (value, digits = 0) => Number(value || 0).toLocaleString("fa-IR", { maximumFractionDigits: digits });
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
  return <section className="shil-section-card">
    <div className="shil-section-head"><h2>{title}</h2><span>نتیجه</span></div>
    <div className="shil-summary-grid">{rows.filter(Boolean).map(([label, value]) => (
      <div key={label} className="shil-summary-item"><span>{label}</span><strong>{value || "-"}</strong></div>
    ))}</div>
  </section>;
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
    <div className="shil-page-scroll shil-run-page">
      <section className="shil-section-card">
        <div className="shil-section-head"><h2>مبنای اجرای محاسبات</h2><span>{domain}</span></div>
        <p className="shil-muted-line">{output.basis}</p>
      </section>
      <ResultCard title="خلاصه عددی" rows={output.headline} />
      <ResultCard title="تجهیزات و اقلام اجرایی" rows={output.equipment} />
      {output.warnings?.length ? <section className="shil-section-card"><div className="shil-section-head"><h2>هشدارهای مهندسی</h2><span>بازبینی</span></div>{output.warnings.map((item) => <div key={item} className="shil-inline-warning">{item}</div>)}</section> : null}
      <section className="shil-section-card">
        <div className="shil-section-head"><h2>خروجی نهایی</h2><span>ثبت و گزارش</span></div>
        <button type="button" className="shil-primary-wide" onClick={finish}>ثبت خروجی نهایی پروژه</button>
      </section>
    </div>
  </EngineeringPageShell>;
}
