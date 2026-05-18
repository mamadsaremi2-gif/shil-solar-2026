import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import EngineeringPageShell from "../../components/EngineeringPageShell.jsx";
import { approveProjectStep } from "../../workflow/projectWorkflow.js";
import { runSolarAutoDesign } from "../../core/calculation/solarAutoDesignEngine.js";
import { SHIL_LITHIUM_BATTERIES, SHIL_SOLAR_INVERTERS, SHIL_SOLAR_PANELS } from "../../data/shilSolarBanks.js";

function readDraft(key, fallback = null) {
  try { return JSON.parse(localStorage.getItem(key) || "null") || fallback; }
  catch { return fallback; }
}
function Toast({ message }) { return message ? <div className="shil-floating-warning">{message}</div> : null; }
const optionTitle = (item) => item?.title || "-";

function BankSelect({ title, subtitle, value, count, onValue, onCount, items, renderMeta }) {
  return (
    <div className="shil-bank-card">
      <div className="shil-section-head"><h2>{title}</h2><span>{subtitle}</span></div>
      <label className="shil-bank-field"><span>انتخاب از بانک SHIL</span><select value={value} onChange={(e) => onValue(e.target.value)}>{items.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
      <label className="shil-bank-field"><span>تعداد برای اجرا / توسعه آینده</span><input type="number" min="1" value={count} onChange={(e) => onCount(e.target.value)} /></label>
      <div className="shil-bank-meta">{renderMeta(items.find((item) => item.id === value))}</div>
    </div>
  );
}

export default function SystemSettings() {
  const { domain = "solar" } = useParams();
  const navigate = useNavigate();
  const emergency = domain === "emergency";
  const load = useMemo(() => readDraft("shil:loadEngineResult", {}), []);
  const environment = useMemo(() => readDraft("shil:environmentDraft", {}), []);

  const [systemType, setSystemType] = useState("offgrid");
  const [autonomyDays, setAutonomyDays] = useState(1);
  const [reserveFactor, setReserveFactor] = useState(1.2);
  const [manualMode, setManualMode] = useState(false);
  const [panelId, setPanelId] = useState(SHIL_SOLAR_PANELS.at(-1)?.id || "");
  const [inverterId, setInverterId] = useState(SHIL_SOLAR_INVERTERS.find((i) => i.ratedPowerW >= 5000)?.id || SHIL_SOLAR_INVERTERS[0]?.id || "");
  const [batteryId, setBatteryId] = useState(SHIL_LITHIUM_BATTERIES.find((b) => b.nominalVoltage === 48 && b.capacityAh === 200)?.id || SHIL_LITHIUM_BATTERIES[0]?.id || "");
  const [panelCount, setPanelCount] = useState(0);
  const [inverterCount, setInverterCount] = useState(0);
  const [batteryCount, setBatteryCount] = useState(0);
  const [expertOpen, setExpertOpen] = useState(false);
  const [warning, setWarning] = useState("");

  const settings = useMemo(() => ({
    systemType,
    autonomyDays: Number(autonomyDays) || 1,
    reserveFactor: Number(reserveFactor) || 1.2,
    panelId: manualMode ? panelId : undefined,
    inverterId: manualMode ? inverterId : undefined,
    batteryId: manualMode ? batteryId : undefined,
    panelCount: manualMode ? Number(panelCount) || undefined : undefined,
    inverterCount: manualMode ? Number(inverterCount) || undefined : undefined,
    batteryCount: manualMode ? Number(batteryCount) || undefined : undefined,
    manualMode
  }), [systemType, autonomyDays, reserveFactor, manualMode, panelId, inverterId, batteryId, panelCount, inverterCount, batteryCount]);

  const solarDesign = useMemo(() => runSolarAutoDesign({ load, environment, settings }), [load, environment, settings]);

  useEffect(() => {
    if (manualMode) return;
    setPanelId(solarDesign.panel.id);
    setInverterId(solarDesign.inverter.id);
    setBatteryId(solarDesign.battery.battery.id);
    setPanelCount(solarDesign.pvArray.panelCount);
    setInverterCount(solarDesign.inverter.count);
    setBatteryCount(solarDesign.battery.totalCount);
  }, [manualMode, solarDesign.panel.id, solarDesign.inverter.id, solarDesign.battery.battery.id, solarDesign.pvArray.panelCount, solarDesign.inverter.count, solarDesign.battery.totalCount]);

  useEffect(() => {
    if (!warning) return undefined;
    const timer = setTimeout(() => setWarning(""), 4600);
    return () => clearTimeout(timer);
  }, [warning]);

  const applySmart = () => {
    setManualMode(false);
    setExpertOpen(true);
    setPanelId(solarDesign.panel.id);
    setInverterId(solarDesign.inverter.id);
    setBatteryId(solarDesign.battery.battery.id);
    setPanelCount(solarDesign.pvArray.panelCount);
    setInverterCount(solarDesign.inverter.count);
    setBatteryCount(solarDesign.battery.totalCount);
  };

  const confirmSolar = () => {
    if (!solarDesign.valid) {
      setWarning(solarDesign.nextBlockedReason || "پیکربندی با توان مصرفی همخوانی ندارد؛ علت خطا را اصلاح کنید.");
      return;
    }
    approveProjectStep("system");
    localStorage.setItem("shil:solarSystemDesign", JSON.stringify(solarDesign));
    localStorage.setItem("shil:systemSettingsDraft", JSON.stringify({ domain: "solar", ...settings, design: solarDesign }));
    navigate("/new-project/summary/solar");
  };

  const confirmEmergency = () => {
    approveProjectStep("system");
    localStorage.setItem("shil:systemSettingsDraft", JSON.stringify({ domain: "emergency", displayName: "برق اضطراری با اینورتر و باتری", calculationModel: "ups_like_battery_inverter" }));
    navigate("/new-project/summary/emergency");
  };

  if (emergency) {
    return (
      <EngineeringPageShell title="تنظیمات برق اضطراری">
        <section className="shil-card-stack"><div className="shil-section-card"><div className="shil-section-head"><h2>پیکربندی برق اضطراری</h2><span>Battery + Inverter Core</span></div><p className="shil-muted-line">مسیر برق اضطراری از همان بانک باتری و اینورتر استفاده می‌کند و در چکیده نهایی ثبت می‌شود.</p></div><button type="button" className="shil-primary-wide" onClick={confirmEmergency}>تأیید و مشاهده چکیده</button></section>
      </EngineeringPageShell>
    );
  }

  return (
    <EngineeringPageShell title="پیکربندی تنظیمات سیستم">
      <section className="shil-card-stack shil-solar-config-page">
        <Toast message={warning} />

        <div className="shil-section-card">
          <div className="shil-section-head"><h2>کنترل طراحی</h2><span>SHIL Unified Logic</span></div>
          <div className="shil-mini-choice-row">{[{ key: "offgrid", label: "آفگرید" }, { key: "hybrid", label: "هیبرید" }, { key: "ongrid", label: "آنگرید" }].map((item) => <button key={item.key} type="button" className={systemType === item.key ? "active" : ""} onClick={() => setSystemType(item.key)}>{item.label}</button>)}</div>
          <div className="shil-form-grid">
            <label><span>روزهای خودکفایی</span><input type="number" min="1" max="7" value={autonomyDays} onChange={(e) => setAutonomyDays(e.target.value)} /></label>
            <label><span>ضریب افزایش استاندارد</span><input type="number" step="0.05" min="1" value={reserveFactor} onChange={(e) => setReserveFactor(e.target.value)} /></label>
          </div>
          <div className="shil-action-row"><button type="button" className="shil-soft-button" onClick={applySmart}>اعمال هوشمند</button><button type="button" className={manualMode ? "shil-soft-button active" : "shil-soft-button"} onClick={() => setManualMode(!manualMode)}>{manualMode ? "حالت دستی فعال" : "ورود دستی تجهیزات"}</button></div>
        </div>

        <div className="shil-system-banks-grid">
          <BankSelect title="بانک اینورتر خورشیدی" subtitle="1.6kW تا 30kW" value={inverterId} count={inverterCount || solarDesign.inverter.count} onValue={(v) => { setManualMode(true); setInverterId(v); }} onCount={(v) => { setManualMode(true); setInverterCount(v); }} items={SHIL_SOLAR_INVERTERS} renderMeta={(item) => <>{item?.ratedPowerW}W / ورودی باتری {item?.dcVoltage}V / MPPT {item?.mpptMinV}-{item?.mpptMaxV}V</>} />
          <BankSelect title="بانک باتری" subtitle="12V / 24V / 48V" value={batteryId} count={batteryCount || solarDesign.battery.totalCount} onValue={(v) => { setManualMode(true); setBatteryId(v); }} onCount={(v) => { setManualMode(true); setBatteryCount(v); }} items={SHIL_LITHIUM_BATTERIES} renderMeta={(item) => <>{item?.nominalVoltage}V / {item?.capacityAh}Ah / بازه شناور {item?.minVoltage}-{item?.maxVoltage}V</>} />
          <BankSelect title="بانک پنل خورشیدی" subtitle="400W تا 700W" value={panelId} count={panelCount || solarDesign.pvArray.panelCount} onValue={(v) => { setManualMode(true); setPanelId(v); }} onCount={(v) => { setManualMode(true); setPanelCount(v); }} items={SHIL_SOLAR_PANELS} renderMeta={(item) => <>{item?.powerW}W / Vmp {item?.vmp}V / مساحت تقریبی {item?.areaM2}m²</>} />
        </div>

        <div className="shil-section-card shil-auto-result-card">
          <div className="shil-section-head"><h2>نتیجه پیکربندی</h2><span>{solarDesign.valid ? "قابل تأیید" : "نیازمند اصلاح"}</span></div>
          <div className="shil-result-grid">
            <div><span>اینورتر</span><strong>{optionTitle(solarDesign.inverter)}</strong><small>{solarDesign.inverter.count} عدد {solarDesign.inverter.parallelRequired ? " / پارالل" : ""}</small></div>
            <div><span>باتری</span><strong>{solarDesign.battery.battery.title}</strong><small>{solarDesign.battery.totalCount} عدد / {solarDesign.battery.seriesCount} سری × {solarDesign.battery.parallelCount} موازی</small></div>
            <div><span>پنل</span><strong>{solarDesign.panel.title}</strong><small>{solarDesign.pvArray.panelCount} عدد / {solarDesign.pvArray.seriesCount} سری × {solarDesign.pvArray.parallelCount} موازی</small></div>
            <div><span>فضای نصب</span><strong>{solarDesign.space.maintenanceAreaM2} m²</strong><small>{solarDesign.space.note}</small></div>
            <div><span>حفاظت</span><strong>DC {solarDesign.protection.dcBreakerA}A / AC {solarDesign.protection.acBreakerA}A</strong><small>SPD و فیوز رشته لحاظ شود</small></div>
            <div><span>کابل</span><strong>DC {solarDesign.protection.dcCable}</strong><small>PV {solarDesign.protection.pvCable} / BAT {solarDesign.protection.batteryCable}</small></div>
          </div>
          {solarDesign.warnings.map((item) => <div key={item} className="shil-inline-warning">{item}</div>)}
        </div>

        <div className="shil-section-card">
          <div className="shil-section-head"><h2>گزارش دلیل انتخاب کابل و حفاظت</h2><button type="button" className="shil-soft-button" onClick={() => setExpertOpen(!expertOpen)}>{expertOpen ? "بستن جزئیات" : "نمایش جزئیات"}</button></div>
          <ul className="shil-reason-list">{solarDesign.protection.report.map((item) => <li key={item}>{item}</li>)}</ul>
          {expertOpen ? <div className="shil-expert-box">{solarDesign.explanations.map((item) => <div key={item}><span>SHIL</span><strong>{item}</strong></div>)}</div> : null}
        </div>

        <button type="button" className="shil-primary-wide" onClick={confirmSolar}>تأیید پیکربندی و رفتن به چکیده</button>
      </section>
    </EngineeringPageShell>
  );
}
