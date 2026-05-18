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
  return message ? <div className="shil-floating-warning">{message}</div> : null;
}

const optionTitle = (item) => item?.title || "-";
const faNumber = (value) => Number(value || 0).toLocaleString("fa-IR");

function DetailsToggle({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="shil-details-box">
      <button type="button" className="shil-details-toggle" onClick={() => setOpen(!open)}>
        <span>{title}</span>
        <b>{open ? "بستن" : "نمایش جزئیات"}</b>
      </button>
      {open ? <div className="shil-details-content">{children}</div> : null}
    </div>
  );
}

function BankSelect({ title, subtitle, value, count, onValue, onCount, items, renderMeta, renderReason }) {
  return (
    <div className="shil-bank-card">
      <div className="shil-section-head">
        <h2>{title}</h2>
        <span>{subtitle}</span>
      </div>

      <label className="shil-bank-field">
        <span>انتخاب از بانک SHIL</span>
        <select value={value} onChange={(e) => onValue(e.target.value)}>
          {items.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
        </select>
      </label>

      <label className="shil-bank-field">
        <span>تعداد / ضریب توسعه آینده</span>
        <input type="number" min="1" value={count} onChange={(e) => onCount(e.target.value)} />
      </label>

      <DetailsToggle title="توضیحات بانک و دلیل انتخاب">
        <div className="shil-bank-meta">{renderMeta(items.find((item) => item.id === value))}</div>
        {renderReason ? <div className="shil-bank-reason">{renderReason(items.find((item) => item.id === value))}</div> : null}
      </DetailsToggle>
    </div>
  );
}

function ResultTable({ design }) {
  const rows = [
    ["نوع اجرا", design.settings.systemType === "offgrid" ? "آفگرید" : design.settings.systemType === "hybrid" ? "هیبرید" : "آنگرید", "نوع اینورتر و ساختار نهایی طراحی"],
    ["توان طراحی", `${faNumber(design.load.totalPowerW)}W × ضریب ${design.settings.reserveFactor}`, `${faNumber(design.load.totalPowerW * design.settings.reserveFactor)}W مبنای انتخاب اینورتر`],
    ["اینورتر", `${optionTitle(design.inverter)} / ${faNumber(design.inverter.count)} عدد`, design.inverter.parallelRequired ? "نیازمند کارکرد موازی" : "پوشش مستقیم توان"],
    ["باتری", `${design.battery.battery.title} / ${faNumber(design.battery.totalCount)} عدد`, `${faNumber(design.battery.seriesCount)} سری × ${faNumber(design.battery.parallelCount)} موازی / بازه ${design.battery.voltageRange}`],
    ["پنل", `${design.panel.title} / ${faNumber(design.pvArray.panelCount)} عدد`, `${faNumber(design.pvArray.seriesCount)} سری × ${faNumber(design.pvArray.parallelCount)} موازی / ${faNumber(design.pvArray.arrayPowerW)}W`],
    ["فضای نصب", `${design.space.maintenanceAreaM2} m²`, design.space.note],
    ["حفاظت", `DC ${design.protection.dcBreakerA}A / AC ${design.protection.acBreakerA}A`, "بر اساس جریان کاری، ضریب اطمینان و حفاظت اضافه‌بار"],
    ["کابل", `DC ${design.protection.dcCable}`, `PV ${design.protection.pvCable} / باتری ${design.protection.batteryCable}`]
  ];

  return (
    <div className="shil-result-table" role="table" aria-label="نتیجه پیکربندی سیستم">
      {rows.map(([name, value, reason]) => (
        <div className="shil-result-row" role="row" key={name}>
          <span>{name}</span>
          <strong>{value}</strong>
          <small>{reason}</small>
        </div>
      ))}
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
    const timer = setTimeout(() => setWarning(""), 5200);
    return () => clearTimeout(timer);
  }, [warning]);

  const applySmart = () => {
    setManualMode(false);
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
        <section className="shil-card-stack">
          <div className="shil-section-card">
            <div className="shil-section-head"><h2>پیکربندی برق اضطراری</h2><span>Battery + Inverter Core</span></div>
            <p className="shil-muted-line">مسیر برق اضطراری از همان بانک باتری و اینورتر استفاده می‌کند و در چکیده نهایی ثبت می‌شود.</p>
          </div>
          <button type="button" className="shil-primary-wide" onClick={confirmEmergency}>تأیید و مشاهده چکیده</button>
        </section>
      </EngineeringPageShell>
    );
  }

  return (
    <EngineeringPageShell title="پیکربندی تجهیزات سیستم">
      <section className="shil-card-stack shil-solar-config-page">
        <Toast message={warning} />

        <div className="shil-section-card">
          <div className="shil-section-head"><h2>کنترل طراحی</h2><span>نوع اجرای اینورتر خورشیدی</span></div>
          <div className="shil-system-type-cards">
            {[
              { key: "offgrid", label: "آفگرید", hint: "باتری محور" },
              { key: "ongrid", label: "آنگرید", hint: "شبکه محور" },
              { key: "hybrid", label: "هیبرید", hint: "ترکیبی" }
            ].map((item) => (
              <button key={item.key} type="button" className={systemType === item.key ? "active" : ""} onClick={() => setSystemType(item.key)}>
                <strong>{item.label}</strong>
                <small>{item.hint}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="shil-section-card">
          <div className="shil-section-head"><h2>پارامترهای اثرگذار</h2><span>مستقیم در انتخاب تجهیزات</span></div>
          <div className="shil-form-grid">
            <label><span>روزهای خودکفایی</span><input type="number" min="1" max="7" value={autonomyDays} onChange={(e) => setAutonomyDays(e.target.value)} /></label>
            <label><span>ضریب افزایش استاندارد</span><input type="number" step="0.05" min="1" value={reserveFactor} onChange={(e) => setReserveFactor(e.target.value)} /></label>
          </div>
          <div className="shil-action-row">
            <button type="button" className="shil-soft-button" onClick={applySmart}>اعمال هوشمند SHIL</button>
            <button type="button" className={manualMode ? "shil-soft-button active" : "shil-soft-button"} onClick={() => setManualMode(!manualMode)}>{manualMode ? "ورود دستی فعال" : "ورود دستی تجهیزات"}</button>
          </div>
          <p className="shil-muted-line">با تغییر هر عدد، انتخاب اینورتر، باتری، پنل، سری/موازی، کابل، حفاظت و فضای نصب دوباره محاسبه می‌شود.</p>
        </div>

        <div className="shil-system-banks-grid">
          <BankSelect
            title="بانک اینورتر خورشیدی"
            subtitle="1.6kW تا 30kW"
            value={inverterId}
            count={inverterCount || solarDesign.inverter.count}
            onValue={(v) => { setManualMode(true); setInverterId(v); }}
            onCount={(v) => { setManualMode(true); setInverterCount(v); }}
            items={SHIL_SOLAR_INVERTERS}
            renderMeta={(item) => <>{item?.ratedPowerW}W / ورودی باتری {item?.dcVoltage}V / MPPT {item?.mpptMinV}-{item?.mpptMaxV}V / سقف PV {item?.maxPvPowerW}W</>}
            renderReason={(item) => <>{item?.title} زمانی مجاز است که توان دائم، توان لحظه‌ای و بازه ولتاژ شناور باتری با نیاز مصرف‌کننده همخوانی داشته باشد.</>}
          />
          <BankSelect
            title="بانک باتری"
            subtitle="12V / 24V / 48V"
            value={batteryId}
            count={batteryCount || solarDesign.battery.totalCount}
            onValue={(v) => { setManualMode(true); setBatteryId(v); }}
            onCount={(v) => { setManualMode(true); setBatteryCount(v); }}
            items={SHIL_LITHIUM_BATTERIES}
            renderMeta={(item) => <>{item?.nominalVoltage}V / {item?.capacityAh}Ah / بازه شناور {item?.minVoltage}-{item?.maxVoltage}V / انرژی خام {item?.energyWh}Wh</>}
            renderReason={() => <>ولتاژ باتری به صورت شناور کنترل می‌شود؛ برای اینورتر 12، 24 و 48 ولت، بازه باتری معادل همان ولتاژ باید داخل محدوده مجاز اینورتر باشد.</>}
          />
          <BankSelect
            title="بانک پنل خورشیدی"
            subtitle="400W تا 700W"
            value={panelId}
            count={panelCount || solarDesign.pvArray.panelCount}
            onValue={(v) => { setManualMode(true); setPanelId(v); }}
            onCount={(v) => { setManualMode(true); setPanelCount(v); }}
            items={SHIL_SOLAR_PANELS}
            renderMeta={(item) => <>{item?.powerW}W / Vmp {item?.vmp}V / Voc {item?.voc}V / مساحت تقریبی {item?.areaM2}m²</>}
            renderReason={() => <>تعداد سری پنل‌ها طوری تعیین می‌شود که ولتاژ رشته داخل محدوده MPPT اینورتر بماند و تعداد موازی توان مورد نیاز و توسعه آینده را پوشش دهد.</>}
          />
        </div>

        <div className="shil-section-card shil-auto-result-card">
          <div className="shil-section-head"><h2>نتیجه پیکربندی</h2><span>{solarDesign.valid ? "قابل تأیید" : "نیازمند اصلاح"}</span></div>
          <ResultTable design={solarDesign} />
          {solarDesign.warnings.map((item) => <div key={item} className="shil-inline-warning">{item}</div>)}
        </div>

        <div className="shil-section-card">
          <div className="shil-section-head"><h2>کابل و سیستم حفاظتی</h2><span>گزارش تفکیکی SHIL</span></div>
          <DetailsToggle title="نمایش دلیل انتخاب کابل و تجهیزات حفاظتی">
            <ul className="shil-reason-list">{solarDesign.protection.report.map((item) => <li key={item}>{item}</li>)}</ul>
            <div className="shil-expert-box">{solarDesign.explanations.map((item) => <div key={item}><span>SHIL</span><strong>{item}</strong></div>)}</div>
          </DetailsToggle>
        </div>

        <button type="button" className="shil-primary-wide" onClick={confirmSolar}>تأیید پیکربندی و رفتن به چکیده</button>
      </section>
    </EngineeringPageShell>
  );
}
