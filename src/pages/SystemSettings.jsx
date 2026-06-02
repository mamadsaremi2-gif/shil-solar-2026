import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import EngineeringPageShell from "../components/EngineeringPageShell.jsx";
import { approveProjectStep } from "../workflow/projectWorkflow.js";
import { getEnabledEquipment } from "../data/registry/index.js";
import { buildSolarSystemDesign } from "../engines/solarDesignEngine.js";
import { optionLabel } from "../engines/solarBankRules.js";
import { getProjectPath, getSystemSetupHandoff, normalizeProjectDomain, writeJson } from "../engines/projectFlowData.js";

const faNumber = (value, digits = 0) => Number(value || 0).toLocaleString("fa-IR", { maximumFractionDigits: digits });
const kw = (w) => `${faNumber(Math.round(Number(w || 0) / 10) / 100, 2)} کیلووات`;

const METHOD_TITLES = {
  equipment: "لیست تجهیزات",
  power: "توان کل",
  current: "جریان کل",
  energy: "انرژی روزانه",
  profile: "پروفایل مصرف",
  solar_panel_power: "توان پنل خورشیدی",
};

function Toast({ message }) {
  return message ? <div className="shil-floating-warning">{message}</div> : null;
}

function SummaryGrid({ rows = [] }) {
  return <div className="shil-summary-grid">{rows.filter(Boolean).map(([label, value]) => (
    <div key={label} className="shil-summary-item"><span>{label}</span><strong>{value || "-"}</strong></div>
  ))}</div>;
}

function MethodSummaryCard({ handoff }) {
  const method = handoff?.source?.method || "equipment";
  const summary = handoff?.methodSummary || {};
  const load = handoff?.normalizedLoad || {};
  const payload = handoff?.routePayload || {};
  const basis = summary.basis || (method === "solar_panel_power" ? "pv_generation" : "load_consumption");

  const rowsByMethod = {
    equipment: [
      ["روش ورود", "لیست تجهیزات"],
      ["توان مصرفی", `${faNumber(load.totalPowerW)} W`],
      ["انرژی روزانه", `${faNumber(load.dailyEnergyKWh || load.totalEnergyKWh, 2)} kWh`],
      ["پیک راه‌اندازی", load.surgePowerW ? `${faNumber(load.surgePowerW)} W` : "بر اساس تجهیزات"],
    ],
    power: [
      ["روش ورود", "توان کل"],
      ["توان مبنا", `${faNumber(load.totalPowerW)} W`],
      ["ولتاژ AC", `${faNumber(load.voltageAC || 220)} V`],
      ["انرژی روزانه", load.dailyEnergyKWh ? `${faNumber(load.dailyEnergyKWh, 2)} kWh` : "نیازمند تخمین/تکمیل"],
    ],
    current: [
      ["روش ورود", "جریان کل"],
      ["جریان", `${faNumber(payload.currentA || load.currentA)} A`],
      ["ولتاژ", `${faNumber(load.voltageAC || payload.voltage || 220)} V`],
      ["توان محاسبه‌شده", `${faNumber(load.totalPowerW)} W`],
    ],
    energy: [
      ["روش ورود", "انرژی روزانه"],
      ["مصرف روزانه", `${faNumber(load.dailyEnergyKWh || load.totalEnergyKWh, 2)} kWh`],
      ["توان مبنا", load.totalPowerW ? `${faNumber(load.totalPowerW)} W` : "بر اساس تنظیمات سیستم"],
      ["مبنای طراحی", "ظرفیت تولید و ذخیره انرژی"],
    ],
    profile: [
      ["روش ورود", "پروفایل مصرف"],
      ["مصرف روزانه", `${faNumber(load.dailyEnergyKWh || load.totalEnergyKWh, 2)} kWh`],
      ["پیک مصرف", `${faNumber(load.totalPowerW || load.peakPowerW)} W`],
      ["تحلیل", "الگوی مصرف زمانی"],
    ],
    solar_panel_power: [
      ["روش ورود", "توان پنل خورشیدی"],
      ["توان هر پنل", `${faNumber(payload.panelPowerW)} W`],
      ["تعداد پنل", `${faNumber(payload.panelCount)} عدد`],
      ["تولید روزانه", `${faNumber(payload.generatedDailyKWh || payload.usableDailyEnergyKWh, 2)} kWh`],
    ],
  };

  return <section className="shil-section-card shil-config-block">
    <div className="shil-section-head"><h2>چکیده مسیر {METHOD_TITLES[method] || method}</h2><span>{basis === "pv_generation" ? "مبنای تولید" : "مبنای مصرف"}</span></div>
    <SummaryGrid rows={rowsByMethod[method] || rowsByMethod.equipment} />
    {Array.isArray(summary.warnings) && summary.warnings.length > 0 ? summary.warnings.map((item) => <div key={item} className="shil-inline-warning">{item}</div>) : null}
  </section>;
}

function BankSelectCard({ title, subtitle, items, value, onChange, smartTitle, smartValue, disabled = false }) {
  return <section className={`shil-section-card shil-config-block ${disabled ? "is-locked" : ""}`}>
    <div className="shil-section-head"><h2>{title}</h2><span>{subtitle}</span></div>
    <select value={value || ""} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
      {items.map((item) => <option key={item.id} value={item.id}>{optionLabel(item)}</option>)}
    </select>
    <div className="shil-bank-smart-note"><span>پیشنهاد هوشمند</span><strong>{smartTitle}</strong><small>{smartValue}</small></div>
  </section>;
}

export default function SystemSettings() {
  const navigate = useNavigate();
  const params = useParams();
  const [warning, setWarning] = useState("");
  const projectPath = useMemo(() => getProjectPath(), []);
  const handoff = useMemo(() => getSystemSetupHandoff(), []);
  const domain = normalizeProjectDomain({ ...handoff, domain: params.domain || projectPath.domain });

  const panels = useMemo(() => getEnabledEquipment("panels"), []);
  const inverters = useMemo(() => getEnabledEquipment("inverters"), []);
  const batteries = useMemo(() => getEnabledEquipment("batteries"), []);

  const initialNeedsBattery = Boolean(handoff?.systemHints?.needsBattery || handoff?.autonomy?.hours || handoff?.autonomy?.days);
  const [systemType, setSystemType] = useState(() => handoff?.source?.scenario || (initialNeedsBattery ? "offgrid" : "ongrid"));
  const [reserveFactor, setReserveFactor] = useState("1.2");
  const [autonomyDays, setAutonomyDays] = useState(() => String(handoff?.autonomy?.days || (handoff?.autonomy?.hours ? Number(handoff.autonomy.hours) / 24 : 0)));
  const [autonomyHours, setAutonomyHours] = useState(() => String(handoff?.autonomy?.hours || ""));
  const [panelId, setPanelId] = useState(() => handoff?.routePayload?.panelId || handoff?.routePayload?.selectedPanelId || panels[0]?.id || "");
  const [inverterId, setInverterId] = useState(() => inverters[0]?.id || "");
  const [batteryId, setBatteryId] = useState(() => batteries[0]?.id || "");

  const settings = useMemo(() => ({ systemType, reserveFactor, autonomyDays, autonomyHours, panelId, inverterId, batteryId }), [systemType, reserveFactor, autonomyDays, autonomyHours, panelId, inverterId, batteryId]);
  const design = useMemo(() => buildSolarSystemDesign({ handoff, settings, banks: { panels, inverters, batteries } }), [handoff, settings, panels, inverters, batteries]);
  const showBatteryBank = design.system.needsBattery;

  useEffect(() => {
    if (domain === "emergency") navigate("/new-project/system/emergency", { replace: true });
    if (domain === "utility") navigate("/new-project/system/utility", { replace: true });
  }, [domain, navigate]);

  useEffect(() => {
    if (!panelId && design.selectedBanks.panelId) setPanelId(design.selectedBanks.panelId);
    if (!inverterId && design.selectedBanks.inverterId) setInverterId(design.selectedBanks.inverterId);
    if (!batteryId && design.selectedBanks.batteryId) setBatteryId(design.selectedBanks.batteryId);
  }, [panelId, inverterId, batteryId, design.selectedBanks]);

  const confirm = () => {
    if (!design.valid) {
      setWarning(design.warnings[0] || "پیکربندی نیازمند اصلاح است.");
      return;
    }
    const draft = {
      version: 3,
      domain: "solar",
      source: design.source,
      handoff,
      selectedBanks: design.selectedBanks,
      systemConfig: settings,
      designResult: design,
      validation: { valid: design.valid, warnings: design.warnings },
      confirmedAt: new Date().toISOString(),
    };
    writeJson("shil:systemSettingsDraft", draft);
    writeJson("shil:solarSystemDesign", design);
    approveProjectStep("system");
    navigate("/new-project/summary/solar");
  };

  return <EngineeringPageShell title="تنظیمات سیستم خورشیدی" activeStep="system" backTo="/new-project/inputs/solar">
    <Toast message={warning} />
    <div className="shil-page-scroll shil-system-settings-page">
      <MethodSummaryCard handoff={handoff} />

      <section className="shil-section-card shil-config-block">
        <div className="shil-section-head"><h2>نوع سیستم خورشیدی</h2><span>اختصاصی مسیر پنل خورشیدی</span></div>
        <div className="shil-choice-grid three">
          {[{ key: "offgrid", title: "آفگرید", hint: "باتری الزامی" }, { key: "hybrid", title: "هیبرید", hint: "پنل، باتری و شبکه" }, { key: "ongrid", title: "آنگرید", hint: "بدون باتری پیش‌فرض" }].map((item) => (
            <button key={item.key} type="button" className={systemType === item.key ? "shil-choice-card is-selected" : "shil-choice-card"} onClick={() => setSystemType(item.key)}>
              <strong>{item.title}</strong><span>{item.hint}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="shil-section-card shil-config-block">
        <div className="shil-section-head"><h2>ضرایب طراحی</h2><span>استاندارد و خودکفایی</span></div>
        <div className="shil-form-grid compact">
          <label><span>ضریب اطمینان</span><input value={reserveFactor} onChange={(e) => setReserveFactor(e.target.value)} inputMode="decimal" /></label>
          <label><span>روزهای خودکفایی</span><input value={autonomyDays} onChange={(e) => setAutonomyDays(e.target.value)} inputMode="decimal" /></label>
          <label><span>ساعت‌های خودکفایی</span><input value={autonomyHours} onChange={(e) => setAutonomyHours(e.target.value)} inputMode="decimal" placeholder="اختیاری" /></label>
        </div>
      </section>

      <div className="shil-bank-grid">
        <BankSelectCard title="بانک پنل خورشیدی" subtitle="از Registry تجهیزات" items={panels} value={panelId} onChange={setPanelId} smartTitle={optionLabel(design.panel)} smartValue={`${design.panel?.powerW || "-"}W / ${faNumber(design.pvArray.panelCount)} عدد`} />
        <BankSelectCard title="بانک اینورتر خورشیدی" subtitle="سازگار با توان طراحی" items={inverters} value={inverterId} onChange={setInverterId} smartTitle={optionLabel(design.inverter)} smartValue={`${kw(design.inverter?.ratedPowerW)} × ${faNumber(design.inverter?.count || 1)} عدد`} />
        {showBatteryBank ? <BankSelectCard title="بانک ذخیره‌ساز انرژی" subtitle="فعال به دلیل خودکفایی/آفگرید/هیبرید" items={batteries} value={batteryId} onChange={setBatteryId} smartTitle={optionLabel(design.battery?.item)} smartValue={`${faNumber(design.battery?.grossEnergyKWh, 2)} kWh / ${faNumber(design.battery?.count)} عدد`} /> : null}
      </div>

      <section className="shil-section-card shil-config-block">
        <div className="shil-section-head"><h2>چکیده تنظیمات سیستم</h2><span>{design.valid ? "قابل تأیید" : "نیازمند اصلاح"}</span></div>
        <SummaryGrid rows={[
          ["توان طراحی", kw(design.load.finalPowerW)],
          ["انرژی طراحی", `${faNumber(design.load.finalEnergyKWh, 2)} kWh/day`],
          ["آرایه پنل", `${faNumber(design.pvArray.arrayPowerKW, 2)} kW / ${faNumber(design.pvArray.panelCount)} پنل`],
          ["استرینگ پیشنهادی", `${faNumber(design.pvArray.seriesCount)} سری × ${faNumber(design.pvArray.parallelCount)} موازی`],
          ["تولید روزانه تخمینی", `${faNumber(design.pvArray.estimatedDailyKWh, 2)} kWh`],
          ["باتری", showBatteryBank ? `${faNumber(design.battery?.grossEnergyKWh, 2)} kWh` : "غیرفعال در این سناریو"],
        ]} />
        {design.warnings.map((item) => <div key={item} className="shil-inline-warning">{item}</div>)}
      </section>

      <button type="button" className="shil-primary-wide shil-confirm-config-button" disabled={!design.valid} onClick={confirm}>تأیید تنظیمات و رفتن به چکیده</button>
    </div>
  </EngineeringPageShell>;
}
