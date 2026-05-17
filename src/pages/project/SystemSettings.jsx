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

function Toast({ message }) {
  if (!message) return null;
  return <div className="shil-floating-warning">{message}</div>;
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
  const [panelPowerW, setPanelPowerW] = useState(700);
  const [systemVoltage, setSystemVoltage] = useState("");
  const [batteryVoltage, setBatteryVoltage] = useState("");
  const [expertOpen, setExpertOpen] = useState(false);
  const [warning, setWarning] = useState("");

  const settings = useMemo(() => ({
    systemType,
    autonomyDays: Number(autonomyDays) || 1,
    reserveFactor: Number(reserveFactor) || 1.2,
    panelPowerW: Number(panelPowerW) || 700,
    systemVoltage: systemVoltage ? Number(systemVoltage) : undefined,
    batteryVoltage: batteryVoltage ? Number(batteryVoltage) : undefined
  }), [systemType, autonomyDays, reserveFactor, panelPowerW, systemVoltage, batteryVoltage]);

  const solarDesign = useMemo(() => runSolarAutoDesign({ load, environment, settings }), [load, environment, settings]);

  useEffect(() => {
    if (!warning) return undefined;
    const timer = setTimeout(() => setWarning(""), 4200);
    return () => clearTimeout(timer);
  }, [warning]);

  const confirmSolar = () => {
    if (!solarDesign.valid) {
      setWarning(solarDesign.nextBlockedReason || "محاسبات پیکربندی کامل نیست؛ امکان رفتن به مرحله بعد وجود ندارد.");
      return;
    }
    approveProjectStep("system");
    localStorage.setItem("shil:solarSystemDesign", JSON.stringify(solarDesign));
    localStorage.setItem("shil:systemSettingsDraft", JSON.stringify({ domain: "solar", ...settings, design: solarDesign }));
    navigate("/new-project/summary/solar");
  };

  const confirmEmergency = () => {
    approveProjectStep("system");
    localStorage.setItem("shil:systemSettingsDraft", JSON.stringify({
      domain: "emergency",
      displayName: "برق اضطراری با اینورتر و باتری",
      calculationModel: "ups_like_battery_inverter",
      backupLabel: "زمان برق اضطراری مورد نظر"
    }));
    navigate("/new-project/summary/emergency");
  };

  if (emergency) {
    return (
      <EngineeringPageShell title="تنظیمات برق اضطراری">
        <section className="shil-card-stack">
          <div className="shil-section-card">
            <div className="shil-section-head"><h2>پیکربندی برق اضطراری</h2><span>Battery + Inverter Core</span></div>
            <div className="shil-form-grid">
              <label><span>ولتاژ سیستم</span><select><option>Auto</option><option>12V</option><option>24V</option><option>48V</option></select></label>
              <label><span>نوع باتری</span><select><option>لیتیوم</option><option>AGM</option><option>ژل</option></select></label>
              <label><span>نوع اینورتر</span><select><option>سینوسی کامل</option><option>شبه سینوسی</option></select></label>
              <label><span>زمان برق اضطراری مورد نظر</span><input placeholder="مثلاً 4 ساعت" /></label>
              <label><span>اولویت طراحی</span><select><option>متعادل</option><option>اقتصادی</option><option>حرفه‌ای</option></select></label>
            </div>
          </div>
          <div className="shil-reason-card">در رابط کاربری نام UPS نمایش داده نمی‌شود؛ مسیر فعلی برق اضطراری با اینورتر و باتری است، اما هسته داخلی از قوانین محاسباتی پشتیبان باتری/اینورتر استفاده می‌کند.</div>
          <button type="button" className="shil-primary-wide" onClick={confirmEmergency}>تأیید و مشاهده چکیده</button>
        </section>
      </EngineeringPageShell>
    );
  }

  return (
    <EngineeringPageShell title="پیکربندی سیستم خورشیدی">
      <section className="shil-card-stack shil-solar-config-page">
        <Toast message={warning} />

        <div className="shil-section-card">
          <div className="shil-section-head"><h2>معماری سیستم خورشیدی</h2><span>Solar Auto Design Engine</span></div>
          <div className="shil-mini-choice-row">
            {[{ key: "offgrid", label: "آفگرید" }, { key: "hybrid", label: "هیبرید" }, { key: "ongrid", label: "آنگرید" }].map((item) => (
              <button key={item.key} type="button" className={systemType === item.key ? "active" : ""} onClick={() => setSystemType(item.key)}>{item.label}</button>
            ))}
          </div>
          <div className="shil-form-grid">
            <label><span>روزهای خودکفایی</span><input type="number" min="1" max="7" value={autonomyDays} onChange={(e) => setAutonomyDays(e.target.value)} /></label>
            <label><span>ضریب رزرو طراحی</span><input type="number" step="0.05" min="1" value={reserveFactor} onChange={(e) => setReserveFactor(e.target.value)} /></label>
            <label><span>پنل مرجع</span><select value={panelPowerW} onChange={(e) => setPanelPowerW(e.target.value)}>{SHIL_SOLAR_PANELS.map((p) => <option key={p.id} value={p.powerW}>{p.powerW}W - {p.type}</option>)}</select></label>
            <label><span>ولتاژ اینورتر</span><select value={systemVoltage} onChange={(e) => { setSystemVoltage(e.target.value); setBatteryVoltage(""); }}><option value="">انتخاب هوشمند</option><option value="12">12V</option><option value="24">24V</option><option value="48">48V</option></select></label>
            <label><span>اولویت باتری</span><select value={batteryVoltage} onChange={(e) => setBatteryVoltage(e.target.value)}><option value="">هماهنگ با اینورتر</option><option value="12">12V</option><option value="24">24V</option><option value="48">48V</option></select></label>
          </div>
        </div>

        <div className="shil-section-card shil-auto-result-card">
          <div className="shil-section-head"><h2>پیشنهاد هوشمند SHIL</h2><span>{solarDesign.valid ? "آماده ادامه" : "نیازمند اصلاح"}</span></div>
          <div className="shil-result-grid">
            <div><span>پنل پیشنهادی</span><strong>{solarDesign.panel.title}</strong><small>{solarDesign.pvArray.panelCount} عدد</small></div>
            <div><span>اینورتر پیشنهادی</span><strong>{solarDesign.inverter.title}</strong><small>{solarDesign.inverter.count} عدد {solarDesign.inverter.parallelRequired ? "- پارالل" : ""}</small></div>
            <div><span>باتری پیشنهادی</span><strong>{solarDesign.battery.battery.title}</strong><small>{solarDesign.battery.totalCount} عدد / {solarDesign.battery.strategy.label}</small></div>
            <div><span>آرایش پنل</span><strong>{solarDesign.pvArray.seriesCount} سری × {solarDesign.pvArray.parallelCount} موازی</strong><small>{solarDesign.pvArray.arrayPowerW} وات آرایه</small></div>
            <div><span>کابل DC</span><strong>{solarDesign.protection.dcCable}</strong><small>کابل PV: {solarDesign.protection.pvCable}</small></div>
            <div><span>حفاظت</span><strong>DC {solarDesign.protection.dcBreakerA}A / AC {solarDesign.protection.acBreakerA}A</strong><small>SPD DC و AC لحاظ شود</small></div>
          </div>
          {solarDesign.warnings.length ? <div className="shil-inline-warning">{solarDesign.warnings[0]}</div> : null}
        </div>

        <div className="shil-section-card">
          <div className="shil-section-head"><h2>توضیح علت پیشنهادها</h2><button type="button" className="shil-soft-button" onClick={() => setExpertOpen(!expertOpen)}>{expertOpen ? "بستن محاسبات هوشمند" : "محاسبات هوشمند"}</button></div>
          <ul className="shil-reason-list">
            {solarDesign.explanations.map((item) => <li key={item}>{item}</li>)}
          </ul>
          {expertOpen ? (
            <div className="shil-expert-box">
              <div><span>بانک پنل</span><strong>تا 700 وات</strong></div>
              <div><span>بانک اینورتر</span><strong>تا 30 کیلووات</strong></div>
              <div><span>بانک باتری</span><strong>12V / 24V / 48V لیتیوم</strong></div>
              <div><span>محدوده باتری 12V</span><strong>11 تا 13 ولت</strong></div>
              <div><span>محدوده باتری 24V</span><strong>24 تا 26 ولت</strong></div>
              <div><span>محدوده باتری 48V</span><strong>46 تا 52 ولت</strong></div>
              <div><span>راندمان مؤثر اقلیمی</span><strong>{solarDesign.losses.effectiveEfficiency}</strong></div>
              <div><span>ولتاژ رشته پنل</span><strong>{solarDesign.pvArray.stringVmp}Vmp / {solarDesign.pvArray.stringVoc}Voc</strong></div>
            </div>
          ) : null}
        </div>

        <div className="shil-section-card">
          <div className="shil-section-head"><h2>بانک‌های فعال SHIL</h2><span>Auto Pick</span></div>
          <div className="shil-horizontal-block shil-engineering-data-row">
            <div className="shil-data-tile">پنل تا 700 وات</div>
            <div className="shil-data-tile">اینورتر تا 30kW</div>
            <div className="shil-data-tile">باتری 12/24/48V</div>
            <div className="shil-data-tile">کابل DC/AC</div>
            <div className="shil-data-tile">SPD DC</div>
            <div className="shil-data-tile">SPD AC</div>
            <div className="shil-data-tile">فیوز و بریکر</div>
          </div>
        </div>

        <button type="button" className="shil-primary-wide" onClick={confirmSolar}>تأیید پیکربندی و مشاهده چکیده</button>
      </section>
    </EngineeringPageShell>
  );
}
