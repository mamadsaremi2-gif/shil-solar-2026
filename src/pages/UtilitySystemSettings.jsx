import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import EngineeringPageShell from "../components/EngineeringPageShell.jsx";
import { approveProjectStep } from "../workflow/projectWorkflow.js";
import { SHIL_SOLAR_INVERTERS, SHIL_SOLAR_PANELS } from "../data/shilSolarBanks.js";

function readDraft(key, fallback = null) {
  try { return JSON.parse(localStorage.getItem(key) || "null") || fallback; }
  catch { return fallback; }
}

const normalizePersianInput = (value) => String(value ?? "")
  .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0))
  .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
  .replace(/٫/g, ".")
  .replace(/٬|,/g, "")
  .trim();
const toNumber = (value, fallback = 0) => { const n = Number(normalizePersianInput(value)); return Number.isFinite(n) ? n : fallback; };
const faNumber = (value, digits = 0) => Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: digits });
const enNumber = (value, digits = 0) => Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: digits });

function closestPanel(id) {
  return SHIL_SOLAR_PANELS.find((item) => item.id === id) || SHIL_SOLAR_PANELS.find((item) => Number(item.powerW) >= 620) || SHIL_SOLAR_PANELS[0] || {};
}

function closestInverter(blockKW) {
  const targetW = blockKW * 1000;
  const safe = SHIL_SOLAR_INVERTERS.slice().sort((a, b) => Number(a.ratedPowerW || 0) - Number(b.ratedPowerW || 0));
  return safe.find((item) => Number(item.ratedPowerW || 0) >= targetW) || safe[safe.length - 1] || {};
}

function buildUtilityDesign({ plantMW, dcAcRatio, panelId, blockKW, mvVoltageKV, landHaPerMW, exportLimitMW, trackerMode, availabilityPercent }) {
  const panel = closestPanel(panelId);
  const targetAcKW = Math.max(30, toNumber(plantMW, 1) * 1000);
  const dcKW = targetAcKW * Math.max(1, toNumber(dcAcRatio, 1.2));
  const panelPowerW = Math.max(1, toNumber(panel.powerW, 620));
  const panelCount = Math.ceil((dcKW * 1000) / panelPowerW);
  const blockSizeKW = Math.max(30, toNumber(blockKW, 250));
  const blockCount = Math.max(1, Math.ceil(targetAcKW / blockSizeKW));
  const inverter = closestInverter(blockSizeKW);
  const transformerUnitMVA = targetAcKW >= 5000 ? 2.5 : targetAcKW >= 1000 ? 1.25 : 0.63;
  const transformerCount = Math.max(1, Math.ceil((targetAcKW / 1000) / transformerUnitMVA));
  const mvKV = toNumber(mvVoltageKV, targetAcKW >= 5000 ? 33 : 20);
  const psh = toNumber(readDraft("shil:environmentDraft", {})?.peakSunHours, 5.2);
  const performanceRatio = trackerMode === "single_axis" ? 0.84 : 0.8;
  const availability = Math.max(0.5, toNumber(availabilityPercent, 98) / 100);
  const annualKWh = dcKW * psh * 365 * performanceRatio * availability;
  const landHa = targetAcKW / 1000 * Math.max(0.8, toNumber(landHaPerMW, trackerMode === "single_axis" ? 1.8 : 1.35));
  const valid = targetAcKW >= 30 && panelCount > 0;
  return {
    domain: "utility",
    calculationModel: "utility_scale_pv_engine",
    plant: { targetAcKW, targetMW: targetAcKW / 1000, dcKW, dcAcRatio: toNumber(dcAcRatio, 1.2), blockSizeKW, blockCount, exportLimitMW: toNumber(exportLimitMW, 0) },
    pv: { panel, panelPowerW, panelCount, stringsEstimate: Math.ceil(panelCount / 24), trackerMode },
    inverter: { ...inverter, count: blockCount, blockSizeKW },
    grid: { mvVoltageKV: mvKV, feederCount: Math.max(1, Math.ceil(targetAcKW / 5000)), transformerUnitMVA, transformerCount },
    land: { landHa, landHaPerMW: toNumber(landHaPerMW, 1.35) },
    yield: { psh, performanceRatio, availabilityPercent: toNumber(availabilityPercent, 98), annualKWh },
    valid,
    warnings: valid ? [] : ["توان هدف نیروگاهی باید حداقل 30 کیلووات باشد."],
    confirmedAt: null,
  };
}

export default function UtilitySystemSettings() {
  const navigate = useNavigate();
  const handoff = useMemo(() => readDraft("shil:systemSetupHandoff", null), []);
  const solarPanelInput = readDraft("shil:solarPanelPowerInput", {});
  const initialMW = Math.max(0.03, toNumber(solarPanelInput.totalPanelPowerW, 0) / 1000000 || toNumber(localStorage.getItem("shil:targetPlantPowerMW"), 1));
  const [plantMW, setPlantMW] = useState(initialMW || 1);
  const [dcAcRatio, setDcAcRatio] = useState(1.2);
  const [panelId, setPanelId] = useState(solarPanelInput.selectedPanelId || SHIL_SOLAR_PANELS.find((item) => Number(item.powerW) >= 620)?.id || SHIL_SOLAR_PANELS[0]?.id || "");
  const [blockKW, setBlockKW] = useState(250);
  const [mvVoltageKV, setMvVoltageKV] = useState(20);
  const [landHaPerMW, setLandHaPerMW] = useState(1.35);
  const [exportLimitMW, setExportLimitMW] = useState(0);
  const [trackerMode, setTrackerMode] = useState("fixed");
  const [availabilityPercent, setAvailabilityPercent] = useState(98);
  const [liveSaved, setLiveSaved] = useState(false);

  const design = useMemo(() => buildUtilityDesign({ plantMW, dcAcRatio, panelId, blockKW, mvVoltageKV, landHaPerMW, exportLimitMW, trackerMode, availabilityPercent }), [plantMW, dcAcRatio, panelId, blockKW, mvVoltageKV, landHaPerMW, exportLimitMW, trackerMode, availabilityPercent]);

  useEffect(() => {
    localStorage.setItem("shil:utilitySystemDesign:live", JSON.stringify(design));
    localStorage.setItem("shil:systemSettingsDraft:live", JSON.stringify({ domain: "utility", design, sourceHandoff: handoff }));
    setLiveSaved(true);
    const timer = setTimeout(() => setLiveSaved(false), 900);
    return () => clearTimeout(timer);
  }, [design, handoff]);

  const confirm = () => {
    if (!design.valid) return;
    const finalDesign = { ...design, confirmedAt: new Date().toISOString() };
    approveProjectStep("system");
    localStorage.setItem("shil:utilitySystemDesign", JSON.stringify(finalDesign));
    localStorage.setItem("shil:solarSystemDesign", JSON.stringify(finalDesign));
    localStorage.setItem("shil:systemSettingsDraft", JSON.stringify({ domain: "utility", displayName: "نیروگاه خورشیدی", calculationModel: "utility_scale_pv_engine", design: finalDesign, sourceHandoff: handoff }));
    navigate("/new-project/summary/utility");
  };

  return (
    <EngineeringPageShell title="تنظیمات نیروگاه خورشیدی">
      <section className="shil-card-stack shil-system-final-page">
        <div className="shil-section-card shil-config-block">
          <div className="shil-section-head"><h2>موتور اختصاصی نیروگاهی</h2><span>Utility Scale PV</span></div>
          <p className="shil-muted-line">این صفحه برای پروژه‌های بالای 30kW جدا شده و منطق آن مصرف خانگی یا UPS نیست؛ مبنا ظرفیت نیروگاه، بلوک‌های اینورتر، اتصال MV، ترانس، زمین و تولید سالانه است.</p>
          <div className="shil-summary-grid shil-solar-sizing-preview">
            <div><span>توان AC هدف</span><strong>{enNumber(design.plant.targetMW, 2)} MW</strong></div>
            <div><span>توان DC آرایه</span><strong>{enNumber(design.plant.dcKW / 1000, 2)} MWp</strong></div>
            <div><span>تعداد پنل</span><strong>{faNumber(design.pv.panelCount)} عدد</strong></div>
            <div><span>تولید سالانه</span><strong>{faNumber(Math.round(design.yield.annualKWh))} kWh</strong></div>
          </div>
        </div>

        <div className="shil-section-card shil-config-block">
          <div className="shil-section-head"><h2>پارامترهای اصلی نیروگاه</h2><span>{liveSaved ? "ذخیره زنده" : "قابل تنظیم"}</span></div>
          <div className="shil-form-grid shil-param-grid">
            <label><span>توان هدف نیروگاه MW</span><input value={plantMW} inputMode="decimal" onChange={(e) => setPlantMW(e.target.value)} /></label>
            <label><span>نسبت DC/AC</span><input value={dcAcRatio} inputMode="decimal" onChange={(e) => setDcAcRatio(e.target.value)} /></label>
            <label><span>توان هر بلوک اینورتر kW</span><input value={blockKW} inputMode="decimal" onChange={(e) => setBlockKW(e.target.value)} /></label>
            <label><span>ولتاژ MV kV</span><select value={mvVoltageKV} onChange={(e) => setMvVoltageKV(e.target.value)}><option value="20">20 کیلوولت</option><option value="33">33 کیلوولت</option><option value="63">63 کیلوولت</option></select></label>
            <label><span>زمین تقریبی ha/MW</span><input value={landHaPerMW} inputMode="decimal" onChange={(e) => setLandHaPerMW(e.target.value)} /></label>
            <label><span>محدودیت تزریق MW</span><input value={exportLimitMW} inputMode="decimal" onChange={(e) => setExportLimitMW(e.target.value)} /></label>
            <label><span>نوع سازه</span><select value={trackerMode} onChange={(e) => setTrackerMode(e.target.value)}><option value="fixed">ثابت</option><option value="single_axis">ترکر تک‌محوره</option></select></label>
            <label><span>Availability %</span><input value={availabilityPercent} inputMode="decimal" onChange={(e) => setAvailabilityPercent(e.target.value)} /></label>
            <label><span>پنل نیروگاهی</span><select value={panelId} onChange={(e) => setPanelId(e.target.value)}>{SHIL_SOLAR_PANELS.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
          </div>
        </div>

        <div className="shil-section-card shil-config-block">
          <div className="shil-section-head"><h2>خروجی مهندسی نیروگاهی</h2><span>PV + MV + Land</span></div>
          <div className="shil-summary-grid shil-solar-sizing-preview">
            <div><span>بلوک‌های اینورتر</span><strong>{faNumber(design.plant.blockCount)} × {faNumber(design.plant.blockSizeKW)} kW</strong></div>
            <div><span>فیدر MV</span><strong>{faNumber(design.grid.feederCount)} فیدر / {faNumber(design.grid.mvVoltageKV)}kV</strong></div>
            <div><span>ترانس</span><strong>{faNumber(design.grid.transformerCount)} × {enNumber(design.grid.transformerUnitMVA, 2)} MVA</strong></div>
            <div><span>زمین تقریبی</span><strong>{enNumber(design.land.landHa, 2)} ha</strong></div>
            <div><span>استرینگ تقریبی</span><strong>{faNumber(design.pv.stringsEstimate)}</strong></div>
            <div><span>نسبت عملکرد</span><strong>{enNumber(design.yield.performanceRatio * 100, 1)}%</strong></div>
          </div>
        </div>

        {design.warnings.map((item) => <div key={item} className="shil-inline-warning">{item}</div>)}
        <button type="button" className="shil-primary-wide shil-confirm-config-button" disabled={!design.valid} onClick={confirm}>تأیید تنظیمات نیروگاهی و رفتن به چکیده</button>
      </section>
    </EngineeringPageShell>
  );
}
