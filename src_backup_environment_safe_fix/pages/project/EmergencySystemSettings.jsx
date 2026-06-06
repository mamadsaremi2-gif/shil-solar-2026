import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import EngineeringPageShell from "../../components/EngineeringPageShell.jsx";
import { approveProjectStep } from "../../workflow/projectWorkflow.js";
import { getEnabledEquipment } from "../../data/registry/index.js";
import {
  filterEmergencyBatteries,
  filterEmergencyInverters,
  pickEmergencyBattery,
  pickEmergencyInverter,
  selectEmergencyProtection,
} from "../../engines/emergencyBankRules.js";
import { batterySeriesCountForInverter } from "../../engines/solarBankRules.js";

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

const toNumber = (value, fallback = 0) => {
  const n = Number(normalizePersianInput(value));
  return Number.isFinite(n) ? n : fallback;
};

const faNumber = (value, digits = 0) => Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: digits });
const enNumber = (value, digits = 0) => Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: digits });

function optionTitle(item) {
  return item?.title || item?.model || item?.name || item?.id || "-";
}

function getBatteryEnergyWh(item) {
  return toNumber(item?.energyWh || toNumber(item?.nominalVoltage, 0) * toNumber(item?.capacityAh, 0), 0);
}

function buildEmergencyDesign({ handoff, backupHours, reserveFactor, dodPercent, inverterId, batteryId, manualMode, banks }) {
  const load = handoff?.normalizedLoad || readDraft("shil:loadEngineResult", {});
  const totalPowerW = toNumber(load.totalPowerW, 0);
  const surgePowerW = Math.max(totalPowerW, toNumber(load.surgePowerW, 0));
  const voltageAC = toNumber(load.voltageAC, 220);
  const designPowerW = Math.max(totalPowerW, surgePowerW) * toNumber(reserveFactor, 1.25);
  const requiredEnergyKWh = (totalPowerW * toNumber(backupHours, 2)) / 1000;
  const usableFactor = Math.max(0.2, Math.min(0.98, toNumber(dodPercent, 80) / 100));
  const rawBatteryKWh = requiredEnergyKWh / usableFactor;

  const emergencyInverters = filterEmergencyInverters(banks.inverters, designPowerW);
  const smartInverter = pickEmergencyInverter(emergencyInverters, designPowerW);
  const selectedInverter = manualMode ? (emergencyInverters.find((item) => item.id === inverterId) || smartInverter) : smartInverter;

  const emergencyBatteries = filterEmergencyBatteries(banks.batteries, selectedInverter, rawBatteryKWh);
  const smartBattery = pickEmergencyBattery(emergencyBatteries, selectedInverter, rawBatteryKWh);
  const selectedBattery = manualMode ? (emergencyBatteries.find((item) => item.id === batteryId) || smartBattery) : smartBattery;

  const unitBatteryKWh = Math.max(0.1, getBatteryEnergyWh(selectedBattery) / 1000);
  const batterySeriesCount = selectedBattery ? batterySeriesCountForInverter(selectedBattery, selectedInverter || {}) : 0;
  const seriesStringEnergyKWh = unitBatteryKWh * Math.max(1, batterySeriesCount);
  const batteryParallelCount = seriesStringEnergyKWh > 0 ? Math.max(1, Math.ceil(rawBatteryKWh / seriesStringEnergyKWh)) : 0;
  const batteryCount = selectedBattery ? Math.max(1, batterySeriesCount) * Math.max(1, batteryParallelCount) : 0;
  const actualEnergyKWh = batteryCount * unitBatteryKWh * usableFactor;
  const runtimeHours = totalPowerW > 0 ? (actualEnergyKWh * 1000) / totalPowerW : 0;
  const protection = selectEmergencyProtection(banks.protections, banks.cables);
  const valid = totalPowerW > 0 && batteryCount > 0 && Boolean(selectedInverter?.id) && Boolean(selectedBattery?.id);

  return {
    domain: "emergency",
    calculationModel: "ups_like_battery_inverter",
    sourceMethod: handoff?.source?.method || localStorage.getItem("shil:calculationMethod") || "equipment",
    load: { totalPowerW, surgePowerW, voltageAC, phaseAC: voltageAC >= 380 ? "three" : "single" },
    settings: { backupHours: toNumber(backupHours, 2), reserveFactor: toNumber(reserveFactor, 1.25), dodPercent: toNumber(dodPercent, 80), manualMode },
    inverter: { ...selectedInverter, designPowerW: Math.round(designPowerW), count: 1 },
    battery: { ...selectedBattery, unitEnergyKWh: unitBatteryKWh, count: batteryCount, seriesCount: batterySeriesCount, parallelCount: batteryParallelCount, packVoltage: Math.round(toNumber(selectedBattery?.nominalVoltage, 0) * Math.max(1, batterySeriesCount) * 10) / 10, requiredRawKWh: rawBatteryKWh, usableEnergyKWh: actualEnergyKWh, runtimeHours },
    emergencyBanks: { inverterCount: emergencyInverters.length, batteryCount: emergencyBatteries.length, protectionCount: protection.protections.length, cableCount: protection.cables.length },
    protection,
    valid,
    warnings: valid ? [] : ["برای پیکربندی برق اضطراری باید حداقل توان مصرفی معتبر ثبت شده باشد."],
    confirmedAt: null,
  };
}

function BankSelect({ title, value, onChange, items, selectedItem, smartMeta, detailRows = [], renderMeta }) {
  const [open, setOpen] = useState(false);
  const activeItem = selectedItem || items.find((item) => item.id === value) || null;
  return (
    <label className="shil-bank-select shil-bank-smart-card">
      <span>{title}</span>
      <strong>{optionTitle(activeItem)}</strong>
      <select value={value || activeItem?.id || ""} onChange={(e) => onChange(e.target.value)}>
        {items.map((item) => <option key={item.id} value={item.id}>{optionTitle(item)}</option>)}
      </select>
      <small>{smartMeta || renderMeta?.(activeItem)}</small>
      <button type="button" className="shil-soft-button shil-bank-detail-toggle" onClick={(event) => { event.preventDefault(); setOpen((v) => !v); }}>{open ? "بستن دیتاشیت" : "نمایش جزییات دیتاشیت"}</button>
      {open ? <div className="shil-summary-grid shil-bank-datasheet-grid">
        {detailRows.filter(Boolean).map(([label, val]) => <div key={label}><span>{label}</span><strong>{val || "-"}</strong></div>)}
      </div> : null}
    </label>
  );
}

export default function EmergencySystemSettings() {
  const navigate = useNavigate();
  const handoff = useMemo(() => readDraft("shil:systemSetupHandoff", null), []);
  const defaults = readDraft("shil:emergencyPowerSettings", {});
  const banks = useMemo(() => ({
    inverters: getEnabledEquipment("inverters"),
    batteries: getEnabledEquipment("batteries"),
    protections: getEnabledEquipment("protections"),
    cables: getEnabledEquipment("cables"),
  }), []);

  const defaultHours = handoff?.autonomy?.hours || defaults.requiredEmergencyHours || 2;
  const [backupHours, setBackupHours] = useState(defaultHours);
  const [reserveFactor, setReserveFactor] = useState(defaults.safetyFactor || 1.25);
  const [dodPercent, setDodPercent] = useState(80);
  const [manualMode, setManualMode] = useState(false);
  const [inverterId, setInverterId] = useState("");
  const [batteryId, setBatteryId] = useState("");
  const [liveSaved, setLiveSaved] = useState(false);

  const design = useMemo(() => buildEmergencyDesign({ handoff, backupHours, reserveFactor, dodPercent, inverterId, batteryId, manualMode, banks }), [handoff, backupHours, reserveFactor, dodPercent, inverterId, batteryId, manualMode, banks]);
  const inverterOptions = useMemo(() => filterEmergencyInverters(banks.inverters, design.inverter.designPowerW || design.load.surgePowerW), [banks.inverters, design.inverter.designPowerW, design.load.surgePowerW]);
  const batteryOptions = useMemo(() => filterEmergencyBatteries(banks.batteries, design.inverter, design.battery.requiredRawKWh), [banks.batteries, design.inverter, design.battery.requiredRawKWh]);
  const emergencyInverterDetailRows = [
    ["توان طراحی", `${faNumber(design.inverter.designPowerW)} W`],
    ["توان نامی", `${faNumber(design.inverter.ratedPowerW)} W`],
    ["باس باتری DC", `${faNumber(design.inverter.dcVoltage || design.inverter.batteryVoltage)} V`],
    ["MPPT", `${faNumber(design.inverter.mpptCount || 1)} ورودی`],
    ["حداکثر توان PV", design.inverter.maxPvPowerW ? `${faNumber(design.inverter.maxPvPowerW)} W` : "وابسته به مسیر PV"],
    ["قابلیت پارالل", design.inverter.parallelCapable ? "دارد" : "ندارد"],
  ];

  const emergencyBatteryDetailRows = [
    ["ولتاژ باتری", `${faNumber(design.battery.nominalVoltage, 1)} V`],
    ["ظرفیت", `${faNumber(design.battery.capacityAh)} Ah`],
    ["انرژی هر باتری", `${enNumber(design.battery.unitEnergyKWh, 2)} kWh`],
    ["آرایش سری/موازی", `${faNumber(design.battery.seriesCount || 0)} سری × ${faNumber(design.battery.parallelCount || 0)} موازی`],
    ["ولتاژ پک", `${faNumber(design.battery.packVoltage, 1)} V`],
    ["تعداد کل", `${faNumber(design.battery.count)} عدد`],
    ["زمان پشتیبانی", `${enNumber(design.battery.runtimeHours, 2)} ساعت`],
  ];

  useEffect(() => {
    if (manualMode) return;
    setInverterId(design.inverter.id || "");
    setBatteryId(design.battery.id || "");
  }, [manualMode, design.inverter.id, design.battery.id]);

  useEffect(() => {
    localStorage.setItem("shil:emergencySystemDesign:live", JSON.stringify(design));
    localStorage.setItem("shil:systemSettingsDraft:live", JSON.stringify({ domain: "emergency", design, sourceHandoff: handoff }));
    setLiveSaved(true);
    const timer = setTimeout(() => setLiveSaved(false), 900);
    return () => clearTimeout(timer);
  }, [design, handoff]);

  const confirm = () => {
    if (!design.valid) return;
    const finalDesign = { ...design, confirmedAt: new Date().toISOString() };
    approveProjectStep("system");
    localStorage.setItem("shil:emergencySystemDesign", JSON.stringify(finalDesign));
    localStorage.removeItem("shil:solarSystemDesign");
    localStorage.removeItem("shil:solarPanelPowerInput");
    localStorage.removeItem("shil:solarPanelPowerPreview");
    localStorage.setItem("shil:systemSettingsDraft", JSON.stringify({ domain: "emergency", displayName: "برق اضطراری با اینورتر و باتری", calculationModel: "ups_like_battery_inverter", design: finalDesign, sourceHandoff: handoff }));
    navigate("/new-project/summary/emergency");
  };

  return (
    <EngineeringPageShell title="تنظیمات برق اضطراری">
      <section className="shil-card-stack shil-system-final-page">
        <div className="shil-section-card shil-config-block">
          <div className="shil-section-head"><h2>موتور اختصاصی برق اضطراری</h2><span>Battery + Inverter</span></div>
          <p className="shil-muted-line">این مسیر کاملاً مستقل از مسیر PV است. بانک خام اینورتر، باتری، حفاظت و کابل از Registry مشترک خوانده می‌شود، اما فیلتر و منطق انتخاب آن اختصاصی برق اضطراری است.</p>
          <div className="shil-summary-grid shil-solar-sizing-preview">
            <div><span>روش ورودی</span><strong>{handoff?.source?.methodTitle || design.sourceMethod}</strong></div>
            <div><span>توان بار اضطراری</span><strong>{faNumber(design.load.totalPowerW)} W</strong></div>
            <div><span>پیک/استارت</span><strong>{faNumber(design.load.surgePowerW)} W</strong></div>
            <div><span>ولتاژ خروجی</span><strong>{design.load.phaseAC === "three" ? "380 ولت سه‌فاز" : "220 ولت تک‌فاز"}</strong></div>
          </div>
        </div>

        <div className="shil-section-card shil-config-block">
          <div className="shil-section-head"><h2>زمان پشتیبانی و ضرایب</h2><span>{manualMode ? "ورود دستی تجهیزات فعال" : "انتخاب هوشمند فعال"}</span></div>
          <div className="shil-form-grid shil-param-grid">
            <label><span>مدت پشتیبانی ساعت</span><input value={backupHours} inputMode="decimal" onChange={(e) => setBackupHours(e.target.value)} /></label>
            <label><span>ضریب اطمینان اینورتر</span><input value={reserveFactor} inputMode="decimal" onChange={(e) => setReserveFactor(e.target.value)} /></label>
            <label><span>عمق دشارژ مجاز باتری %</span><input value={dodPercent} inputMode="decimal" onChange={(e) => setDodPercent(e.target.value)} /></label>
          </div>
          <div className="shil-summary-grid shil-solar-sizing-preview">
            <div><span>توان طراحی اینورتر</span><strong>{faNumber(design.inverter.designPowerW)} W</strong></div>
            <div><span>انرژی خام باتری لازم</span><strong>{enNumber(design.battery.requiredRawKWh, 2)} kWh</strong></div>
            <div><span>ظرفیت قابل استفاده</span><strong>{enNumber(design.battery.usableEnergyKWh, 2)} kWh</strong></div>
            <div><span>زمان پشتیبانی واقعی</span><strong>{enNumber(design.battery.runtimeHours, 2)} ساعت</strong></div>
          </div>
          <button type="button" className={manualMode ? "shil-soft-button active" : "shil-soft-button"} onClick={() => setManualMode((v) => !v)}>{manualMode ? "حالت دستی فعال" : "ورود دستی تجهیزات"}</button>
          <p className="shil-muted-line">{liveSaved ? "ذخیره زنده انجام شد." : "انتخاب‌ها براساس توان، پیک و مدت پشتیبانی به‌روزرسانی می‌شوند."}</p>
        </div>

        <div className="shil-system-banks-grid shil-system-banks-grid-final">
          <BankSelect title="بانک اینورتر خورشیدی / برق اضطراری" value={inverterId} onChange={(v) => { setManualMode(true); setInverterId(v); }} items={inverterOptions} selectedItem={design.inverter} smartMeta={`${faNumber(design.inverter.ratedPowerW)}W × ${faNumber(design.inverter.count || 1)} عدد / DC ${faNumber(design.inverter.dcVoltage || design.inverter.batteryVoltage)}V`} detailRows={emergencyInverterDetailRows} renderMeta={(item) => item ? `${item.ratedPowerW}W / DC ${item.dcVoltage || item.batteryVoltage || "-"}V` : ""} />
          <BankSelect title="بانک ذخیره‌ساز انرژی" value={batteryId} onChange={(v) => { setManualMode(true); setBatteryId(v); }} items={batteryOptions} selectedItem={design.battery} smartMeta={`${faNumber(design.battery.count)} عدد / ${faNumber(design.battery.seriesCount || 0)} سری × ${faNumber(design.battery.parallelCount || 0)} موازی`} detailRows={emergencyBatteryDetailRows} renderMeta={(item) => item ? `${item.nominalVoltage}V / ${item.capacityAh}Ah / ${Math.round(getBatteryEnergyWh(item) / 100) / 10}kWh` : ""} />
        </div>

        <div className="shil-section-card shil-config-block">
          <div className="shil-section-head"><h2>حفاظت و کابل پیشنهادی</h2><span>از بانک موجود سیستم حفاظتی</span></div>
          <div className="shil-summary-grid">
            <div><span>آیتم‌های حفاظتی قابل استفاده</span><strong>{faNumber(design.emergencyBanks.protectionCount)} مورد</strong></div>
            <div><span>کابل‌های مرتبط</span><strong>{faNumber(design.emergencyBanks.cableCount)} مورد</strong></div>
            <div><span>گروه حفاظت</span><strong>باتری DC / خروجی AC / فیوز و ایزولاتور</strong></div>
            <div><span>منبع</span><strong>Registry مشترک SHIL</strong></div>
          </div>
        </div>

        {design.warnings.map((item) => <div key={item} className="shil-inline-warning">{item}</div>)}
        <button type="button" className="shil-primary-wide shil-confirm-config-button" disabled={!design.valid} onClick={confirm}>تأیید تنظیمات برق اضطراری و رفتن به چکیده</button>
      </section>
    </EngineeringPageShell>
  );
}
