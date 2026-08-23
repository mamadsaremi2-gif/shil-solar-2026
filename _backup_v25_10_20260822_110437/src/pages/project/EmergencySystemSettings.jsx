import ShilPrimaryButton from "../../components/project/ShilPrimaryButton";
import React, { useEffect, useMemo, useState } from "react";
import { EMERGENCY_BASE_LOAD_HOURS, EMERGENCY_DEFAULT_BACKUP_HOURS, clampEmergencyBackupHours } from "../../core/calculation/emergencySizingRules.js";
import { useNavigate } from "react-router-dom";
import EngineeringPageShell from "../../components/EngineeringPageShell.jsx";
import ShilWarningOverlay from "../../components/ShilWarningOverlay.jsx";
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

function protectionRange(item = {}) {
  const raw = item?.currentRangeA ?? item?.ratedCurrentRangeA ?? item?.ratedCurrentA ?? item?.currentA;
  if (Array.isArray(raw)) {
    const values = raw.map(Number).filter(Number.isFinite);
    return values.length ? [Math.min(...values), Math.max(...values)] : [0, Infinity];
  }
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? [value, value] : [0, Infinity];
}

function chooseProtection(items = [], { group = "", types = [], side = "", currentA = 0 } = {}) {
  const wantedGroup = String(group || "").toLowerCase();
  const wantedSide = String(side || "").toLowerCase();
  const wantedTypes = (Array.isArray(types) ? types : [types]).map((value) => String(value || "").toLowerCase()).filter(Boolean);
  const current = Math.max(0, Number(currentA || 0));
  const candidates = (Array.isArray(items) ? items : []).filter((item) => {
    const itemGroup = String(item?.group || "").toLowerCase();
    const itemType = String(item?.deviceType || item?.type || "").toLowerCase();
    const itemSide = String(item?.side || "").toLowerCase();
    if (wantedGroup && !itemGroup.includes(wantedGroup)) return false;
    if (wantedSide && !itemSide.includes(wantedSide)) return false;
    if (wantedTypes.length && !wantedTypes.some((type) => itemType.includes(type))) return false;
    const [, maxA] = protectionRange(item);
    return !current || current <= maxA;
  });
  return candidates.sort((a, b) => {
    const [, aMax] = protectionRange(a);
    const [, bMax] = protectionRange(b);
    return Math.abs(aMax - current) - Math.abs(bMax - current);
  })[0] || null;
}

function protectionSelection(item, quantity = 1, design = {}) {
  const ratedCurrentA = toNumber(design.currentA, 0);
  const requiredVoltageV = toNumber(design.voltageV, 0);
  const deviceType = design.deviceType || item?.deviceType || item?.type || "PROTECTION";
  const standard = design.standard || item?.standard || "";
  const polesRequired = design.poles || null;

  if (!item) {
    return {
      id: `calculated-${String(deviceType).toLowerCase()}-${ratedCurrentA || "na"}`,
      label: design.label || `${ratedCurrentA || "-"} A ${deviceType}`,
      title: design.label || `${ratedCurrentA || "-"} A ${deviceType}`,
      deviceType,
      ratedCurrentA: ratedCurrentA || null,
      requiredVoltageV: requiredVoltageV || null,
      polesRequired,
      standard,
      quantity: Math.max(1, Number(quantity || 1)),
      bankMatched: false,
      selectionReason: "ریتینگ مهندسی محاسبه شده است؛ خانواده دقیق کاتالوگی در بانک منتشرشده موجود نبود.",
    };
  }

  const rawVoltage = item?.ratedVoltageV ?? item?.ucV;
  const voltageValues = (Array.isArray(rawVoltage) ? rawVoltage : [rawVoltage]).map(Number).filter(Number.isFinite);
  const ratedVoltageV = voltageValues.length
    ? (voltageValues.find((v) => v >= requiredVoltageV) ?? Math.max(...voltageValues))
    : null;
  const range = protectionRange(item);
  const labelBase = item?.label || item?.title || item?.model || item?.engineeringClass || item?.id || "تجهیز حفاظتی";

  return {
    ...item,
    label: ratedCurrentA > 0 ? `${ratedCurrentA} A · ${labelBase}` : labelBase,
    quantity: Math.max(1, Number(quantity || 1)),
    ratedCurrentA: ratedCurrentA || toNumber(item?.ratedCurrentA ?? item?.currentA, 0) || null,
    ratedVoltageV,
    requiredVoltageV: requiredVoltageV || null,
    polesRequired,
    designCurrentA: ratedCurrentA || null,
    operatingCurrentA: toNumber(design.operatingCurrentA, 0) || null,
    designFactor: toNumber(design.designFactor, 0) || null,
    catalogFamilyTitle: labelBase,
    ratedCurrentRangeA: Number.isFinite(range[1]) ? range : item?.ratedCurrentRangeA,
    standard,
    bankMatched: true,
    selectionReason: design.reason || `ریتینگ ${ratedCurrentA || "موردنیاز"} آمپر داخل محدوده خانواده کاتالوگی انتخاب شد.`,
  };
}

function buildEmergencyDesign({ handoff, backupHours, reserveFactor, dodPercent, inverterId, batteryId, manualMode, banks, cableLengthM = 10, lengthFactor = 1.15 }) {
  const load = handoff?.normalizedLoad || readDraft("shil:loadEngineResult", {});
  const totalPowerW = toNumber(load.totalPowerW, 0);
  const surgePowerW = Math.max(totalPowerW, toNumber(load.surgePowerW, 0));
  const voltageAC = toNumber(load.voltageAC, 220);
  const designPowerW = Math.max(totalPowerW, surgePowerW) * toNumber(reserveFactor, 1.25);
  const requestedBackupHours = clampEmergencyBackupHours(backupHours, EMERGENCY_DEFAULT_BACKUP_HOURS);
  const requiredEnergyKWh = (totalPowerW * requestedBackupHours) / 1000;
  const usableFactor = Math.max(0.2, Math.min(0.98, toNumber(dodPercent, 80) / 100));
  const inverterEfficiency = 0.93;
  const batteryEfficiency = 0.96;
  const systemEfficiency = inverterEfficiency * batteryEfficiency;
  const rawBatteryKWh = requiredEnergyKWh / Math.max(0.1, usableFactor * systemEfficiency);

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
  const grossBankEnergyKWh = batteryCount * unitBatteryKWh;
  const actualEnergyKWh = grossBankEnergyKWh * usableFactor * systemEfficiency;
  const runtimeHours = totalPowerW > 0 ? (actualEnergyKWh * 1000) / totalPowerW : 0;
  const dcBusVoltage = toNumber(selectedInverter?.dcVoltage || selectedInverter?.batteryVoltage, 48);
  const dcCurrentA = dcBusVoltage > 0 ? designPowerW / dcBusVoltage / inverterEfficiency : 0;
  const bankCapacityAh = toNumber(selectedBattery?.capacityAh, 0) * Math.max(1, batteryParallelCount);
  const standardSizes = [1.5,2.5,4,6,10,16,25,35,50,70,95,120,150,185,240];
  const standardAmps = [6,10,16,20,25,32,40,50,63,80,100,125,160,200,250,315,400,500,630];
  const effectiveLengthM = Math.max(1, toNumber(cableLengthM, 10) * Math.max(1, toNumber(lengthFactor, 1.15)));
  // AC protection must follow the actual simultaneous emergency load, not inverter reserve/surge sizing.
  // Example: 3000 W / 220 V = 13.64 A -> next standard MCB = C16 A.
  const phaseFactorAC = voltageAC >= 380 ? Math.sqrt(3) : 1;
  const reportedAcCurrentA = toNumber(load.totalCurrentA ?? load.currentA ?? load.acCurrentA, 0);
  const acCurrentA = reportedAcCurrentA > 0
    ? reportedAcCurrentA
    : (voltageAC > 0 ? totalPowerW / Math.max(1, voltageAC * phaseFactorAC) : 0);
  const acProtectionCurrentA = acCurrentA;
  const copperRho = 0.0175;
  const dcDropV = Math.max(0.5, dcBusVoltage * 0.02);
  const acDropV = Math.max(1, voltageAC * 0.03);
  const calcSection = (current, dropV) => (2 * copperRho * effectiveLengthM * current) / dropV;
  const nextSize = (v) => standardSizes.find((x) => x >= v) || standardSizes[standardSizes.length - 1];
  const nextAmp = (v) => standardAmps.find((x) => x >= v) || standardAmps[standardAmps.length - 1];
  const rawProtection = selectEmergencyProtection(banks.protections, banks.cables);
  const dcBreakerA = nextAmp(dcCurrentA * 1.25);
  // MCB/RCBO rating follows actual load current. Reserve is already applied to inverter sizing.
  const acBreakerA = nextAmp(acProtectionCurrentA);
  // Transfer switch carries the complete load with 25% engineering margin.
  const changeoverA = nextAmp(acProtectionCurrentA * 1.25);
  const dcCableMm2 = nextSize(calcSection(dcCurrentA, dcDropV));
  const acCableMm2 = nextSize(calcSection(acCurrentA, acDropV));
  const batteryFuseSelection = protectionSelection(
    chooseProtection(rawProtection.protections, { types: ["battery_fuse", "fuse"], currentA: dcBreakerA }),
    1,
    { currentA: dcBreakerA, operatingCurrentA: dcCurrentA, voltageV: dcBusVoltage, designFactor: 1.25, deviceType: "BATTERY_FUSE", standard: "IEC 60269", poles: "2P", label: `${dcBreakerA} A Battery DC Fuse` }
  );
  const batteryIsolatorSelection = protectionSelection(
    chooseProtection(rawProtection.protections, { types: ["battery_isolator", "isolator", "load_disconnector"], currentA: dcBreakerA }),
    1,
    { currentA: dcBreakerA, operatingCurrentA: dcCurrentA, voltageV: dcBusVoltage, designFactor: 1.25, deviceType: "DC_ISOLATOR", standard: "IEC 60947-3", poles: "2P", label: `${dcBreakerA} A Battery DC Isolator` }
  );
  const batteryBreakerSelection = protectionSelection(
    chooseProtection(rawProtection.protections, { types: ["dc_mccb", "dc_mcb"], side: "battery", currentA: dcBreakerA }),
    1,
    { currentA: dcBreakerA, operatingCurrentA: dcCurrentA, voltageV: dcBusVoltage, designFactor: 1.25, deviceType: "DC_MCCB", standard: "IEC 60947-2", poles: "2P", label: `${dcBreakerA} A Battery DC Breaker` }
  );
  const acBreakerSelection = protectionSelection(
    chooseProtection(rawProtection.protections, { types: ["ac_breaker", "ac_mccb", "mcb", "mccb"], side: "ac", currentA: acBreakerA }),
    1,
    { currentA: acBreakerA, operatingCurrentA: acCurrentA, voltageV: voltageAC, designFactor: 1, deviceType: "AC_BREAKER", standard: "IEC 60947-2", poles: voltageAC >= 380 ? "3P/4P" : "1P+N/2P", label: `${acBreakerA <= 125 ? `MCB C${acBreakerA}` : `${acBreakerA} A MCCB`}` }
  );
  const acSpdSelection = protectionSelection(
    chooseProtection(rawProtection.protections, { types: ["spd"], side: "ac" }),
    1,
    { voltageV: voltageAC, deviceType: "SPD", standard: "IEC 61643-11", poles: voltageAC >= 380 ? "3P+N" : "1P+N", label: "SPD Type II" }
  );
  const residualProtection = {
    ...protectionSelection(
      chooseProtection(rawProtection.protections, { types: ["rcbo", "rcd"], side: "ac", currentA: acBreakerA }),
      1,
      { currentA: acBreakerA, operatingCurrentA: acCurrentA, voltageV: voltageAC, deviceType: "RCBO", standard: "IEC 61009-1", poles: voltageAC >= 380 ? "4P" : "1P+N/2P", label: `${acBreakerA} A / 30mA RCBO` }
    ),
    sensitivityMA: 30,
    rcdType: "A",
  };
  const changeoverSelection = protectionSelection(
    chooseProtection(rawProtection.protections, { types: ["changeover_switch", "transfer_switch", "changeover"], side: "ac", currentA: changeoverA }),
    1,
    { currentA: changeoverA, operatingCurrentA: acCurrentA, voltageV: voltageAC, designFactor: 1.25, deviceType: "CHANGEOVER_SWITCH", standard: "IEC 60947-6-1", poles: voltageAC >= 380 ? "4P" : "2P", label: `${changeoverA} A Changeover Switch` }
  );
  const protection = {
    ...rawProtection,
    source: "SHIL_EMERGENCY_PROTECTION_V25_7_CANONICAL",
    effectiveLengthM,
    lengthFactor: toNumber(lengthFactor, 1.15),
    dcBreakerA,
    acBreakerA,
    dcCableMm2,
    acCableMm2,
    acCurrentA,
    batteryCurrentA: dcCurrentA,
    batteryVoltage: dcBusVoltage,
    acVoltage: voltageAC,
    batteryDc: {
      required: true,
      designVoltageV: dcBusVoltage,
      operatingCurrentA: dcCurrentA,
      currentA: dcBreakerA,
      fuseA: dcBreakerA,
      breakerA: dcBreakerA,
      fuseSelection: batteryFuseSelection,
      breakerSelection: batteryBreakerSelection,
      isolatorSelection: batteryIsolatorSelection,
      fuse: batteryFuseSelection?.label || `${dcBreakerA} A Battery DC Fuse`,
      breaker: batteryBreakerSelection?.label || `${dcBreakerA} A Battery DC Breaker`,
      isolator: batteryIsolatorSelection?.label || `${dcBreakerA} A Battery DC Isolator`,
      cable: `${dcCableMm2} mm² Battery/DC Cable`,
      quantity: 1,
    },
    ac: {
      required: true,
      designVoltageV: voltageAC,
      operatingCurrentA: acCurrentA,
      currentA: acBreakerA,
      breakerA: acBreakerA,
      breakerSelection: acBreakerSelection,
      spdSelection: acSpdSelection,
      residualProtection,
      breakerType: acBreakerA <= 125 ? "MCB" : "MCCB",
      breakerCurve: acBreakerA <= 125 ? "C" : null,
      breaker: acBreakerSelection?.label || (acBreakerA <= 125 ? `MCB C${acBreakerA}` : `${acBreakerA} A MCCB`),
      spd: acSpdSelection?.label || "SPD Type II",
      spdSelection: { ...acSpdSelection, spdType: acSpdSelection?.spdType || "T2" },
      residualProtection,
      changeoverA,
      changeover: changeoverSelection?.label || `${changeoverA} A Changeover Switch`,
      changeoverSelection,
      poles: voltageAC >= 380 ? "3P/4P" : "1P+N/2P",
      cable: `${acCableMm2} mm² AC Cable`,
      quantity: 1,
    },
    cables: {
      battery: `${dcCableMm2} mm² Battery/DC Cable`,
      ac: `${acCableMm2} mm² AC Cable`,
    },
    cableDetails: {
      battery: { areaMm2: dcCableMm2, currentA: dcCurrentA, lengthM: effectiveLengthM, voltageDropPercent: 2, label: `${dcCableMm2} mm² Battery/DC Cable` },
      ac: { areaMm2: acCableMm2, currentA: acCurrentA, lengthM: effectiveLengthM, voltageDropPercent: 3, label: `${acCableMm2} mm² AC Cable` },
    },
    allowedDcDropPercent: 2,
    allowedAcDropPercent: 3,
  };
  const valid = totalPowerW > 0 && batteryCount > 0 && Boolean(selectedInverter?.id) && Boolean(selectedBattery?.id);

  return {
    domain: "emergency",
    calculationModel: "ups_like_battery_inverter",
    sourceMethod: handoff?.source?.method || localStorage.getItem("shil:calculationMethod") || "equipment",
    load: { totalPowerW, surgePowerW, voltageAC, phaseAC: voltageAC >= 380 ? "three" : "single", totalCurrentA: acCurrentA, currentA: acCurrentA, electricalBasisSource: load.electricalBasisSource || "emergency_handoff" },
    settings: { backupHours: requestedBackupHours, reserveFactor: toNumber(reserveFactor, 1.25), dodPercent: toNumber(dodPercent, 80), manualMode, cableLengthM: toNumber(cableLengthM, 10), lengthFactor: toNumber(lengthFactor, 1.15) },
    inverter: { ...selectedInverter, designPowerW: Math.round(designPowerW), count: 1 },
    battery: { ...selectedBattery, unitEnergyKWh: unitBatteryKWh, count: batteryCount, seriesCount: batterySeriesCount, parallelCount: batteryParallelCount, bankCapacityAh, grossBankEnergyKWh, packVoltage: Math.round(toNumber(selectedBattery?.nominalVoltage, 0) * Math.max(1, batterySeriesCount) * 10) / 10, requiredRawKWh: rawBatteryKWh, usableEnergyKWh: actualEnergyKWh, runtimeHours, systemEfficiency },
    emergencyBanks: { inverterCount: emergencyInverters.length, batteryCount: emergencyBatteries.length, protectionCount: protection.protections.length, cableCount: protection.cables.length },
    electrical: { dcBusVoltage, dcCurrentA, inverterEfficiency, batteryEfficiency },
    protection,
    valid,
    warnings: valid ? [] : ["برای پیکربندی برق اضطراری باید حداقل توان مصرفی معتبر ثبت شده باشد."],
    confirmedAt: null,
  };
}

function SettingsGrid({ rows = [], editable = false }) {
  return (
    <div className="shil-summary-kv-grid">
      {rows.filter(Boolean).map(([label, value, control], index) => (
        <article className={`shil-summary-kv-card${editable ? " is-editable" : ""}`} key={`${label}-${index}`}>
          <span className="shil-summary-kv-label">{label}</span>
          {control || <strong className="shil-summary-kv-value">{value || "-"}</strong>}
        </article>
      ))}
    </div>
  );
}

function SettingsSection({ title, meta, children }) {
  return (
    <section className="shil-summary-section" aria-label={title}>
      <header className="shil-summary-section-title">
        <h2>{title}</h2>
        {meta ? <span>{meta}</span> : null}
      </header>
      {children}
    </section>
  );
}

function BankSelect({ title, value, onChange, items, selectedItem, smartMeta, detailRows = [], kind = "equipment" }) {
  const [open, setOpen] = useState(false);
  const activeItem = selectedItem || items.find((item) => item.id === value) || null;
  return (
    <SettingsSection title={title} meta={kind === "battery" ? "بانک باتری" : "اینورتر"}>
      <div className="shil-summary-data" data-keep-card="true">
        <SettingsGrid rows={[
          [kind === "battery" ? "مدل باتری پیشنهادی" : "مدل اینورتر پیشنهادی", optionTitle(activeItem)],
          [kind === "battery" ? "تعداد کل" : "تعداد اینورتر", kind === "battery" ? `${faNumber(activeItem?.count || 0)} عدد` : `${faNumber(activeItem?.count || 1)} عدد`],
          ["وضعیت انتخاب", "انتخاب هوشمند"],
          ["خلاصه فنی", smartMeta || "-"],
        ]} />
        <button type="button" className="shil-summary-accordion-chip" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? "▲ بستن انتخاب و جزئیات" : "▼ تغییر انتخاب و مشاهده جزئیات"}
        </button>
        <div className={open ? "shil-summary-accordion open" : "shil-summary-accordion"}>
          <div className="shil-settings-select-wrap">
            <label>
              <span>انتخاب دستی از بانک تجهیزات</span>
              <select value={value || activeItem?.id || ""} onChange={(e) => onChange(e.target.value)}>
                {items.map((item) => <option key={item.id} value={item.id}>{optionTitle(item)}</option>)}
              </select>
            </label>
          </div>
          <SettingsGrid rows={detailRows} />
        </div>
      </div>
    </SettingsSection>
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

  const inputDraft = readDraft("shil:calculationInputsDraft", readDraft("shil:calculationInputDraft", {}));
  const specificHandoff = readDraft(`shil:systemSetupHandoff:emergency:${handoff?.source?.method || localStorage.getItem("shil:calculationMethod") || "equipment"}`, null);
  const defaultHours = clampEmergencyBackupHours(
    toNumber(specificHandoff?.autonomy?.inputHours, 0)
      || toNumber(specificHandoff?.autonomy?.hours, 0)
      || toNumber(handoff?.autonomy?.inputHours, 0)
      || toNumber(handoff?.autonomy?.hours, 0)
      || toNumber(inputDraft?.autonomyHours, 0)
      || EMERGENCY_DEFAULT_BACKUP_HOURS
  );
  const [backupHours, setBackupHours] = useState(defaultHours);
  const [reserveFactor, setReserveFactor] = useState(defaults.safetyFactor || 1.25);
  const [dodPercent, setDodPercent] = useState(80);
  const [cableLengthM, setCableLengthM] = useState(toNumber(defaults.cableLengthM, 10));
  const [lengthFactor, setLengthFactor] = useState(toNumber(defaults.lengthFactor, 1.15));
  const [manualMode, setManualMode] = useState(false);
  const [inverterId, setInverterId] = useState("");
  const [batteryId, setBatteryId] = useState("");
  const [liveSaved, setLiveSaved] = useState(false);

  const design = useMemo(() => buildEmergencyDesign({ handoff, backupHours, reserveFactor, dodPercent, inverterId, batteryId, manualMode, banks, cableLengthM, lengthFactor }), [handoff, backupHours, reserveFactor, dodPercent, inverterId, batteryId, manualMode, banks, cableLengthM, lengthFactor]);
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
    ["ظرفیت", `${faNumber(design.battery.capacityAh)} AH`],
    ["انرژی هر باتری", `${enNumber(design.battery.unitEnergyKWh, 2)} KWH`],
    ["آرایش سری/موازی", `${faNumber(design.battery.seriesCount || 0)} سری × ${faNumber(design.battery.parallelCount || 0)} موازی`],
    ["ولتاژ پک", `${faNumber(design.battery.packVoltage, 1)} V`],
    ["تعداد کل", `${faNumber(design.battery.count)} عدد`],
    ["ظرفیت بانک", `${faNumber(design.battery.bankCapacityAh)} AH`],
    ["انرژی خام بانک", `${enNumber(design.battery.grossBankEnergyKWh, 2)} KWH`],
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
    <EngineeringPageShell
      title="تنظیمات برق اضطراری"
      className="shil-summary-clear-engineering"
    >
      <style>{`
        .shil-settings-summary-page{
          direction:rtl!important;width:100%!important;margin:0!important;padding:8px 0 18px!important;
          display:flex!important;flex-direction:column!important;gap:18px!important;background:transparent!important;
          background-image:none!important;border:0!important;box-shadow:none!important;min-height:0!important;
        }
        .shil-settings-summary-page::before,.shil-settings-summary-page::after{content:none!important;display:none!important}
        .shil-settings-summary-page .shil-summary-section{
          width:100%!important;margin:0!important;padding:0!important;background:transparent!important;background-image:none!important;
          border:0!important;border-radius:0!important;box-shadow:none!important;backdrop-filter:none!important;
        }
        .shil-settings-summary-page .shil-summary-section + .shil-summary-section{
          padding-top:16px!important;border-top:1px solid rgba(15,23,42,.12)!important;
        }
        .shil-settings-summary-page .shil-summary-section-title{
          display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;min-height:0!important;
          margin:0 0 9px!important;padding:0!important;background:transparent!important;background-image:none!important;
          border:0!important;border-radius:0!important;box-shadow:none!important;
        }
        .shil-settings-summary-page .shil-summary-section-title h2{
          margin:0!important;color:#111827!important;font-size:14px!important;font-weight:900!important;line-height:1.5!important;
        }
        .shil-settings-summary-page .shil-summary-section-title span{
          margin:0!important;padding:0!important;color:#64748b!important;font-size:11px!important;font-weight:700!important;
          line-height:1.4!important;white-space:nowrap!important;background:transparent!important;border:0!important;
        }
        .shil-settings-summary-page .shil-summary-data{
          width:100%!important;margin:0!important;padding:0!important;background:transparent!important;border:0!important;
          border-radius:0!important;box-shadow:none!important;
        }
        .shil-settings-summary-page .shil-summary-kv-grid{
          display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:6px!important;width:100%!important;
          margin:0!important;padding:0!important;
        }
        .shil-settings-summary-page .shil-summary-kv-card{
          min-width:0!important;min-height:56px!important;margin:0!important;padding:7px 8px!important;gap:4px!important;
          display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;
          text-align:center!important;color:#0f172a!important;background:rgba(255,255,255,.95)!important;background-image:none!important;
          border:1px solid #c8dceb!important;border-radius:11px!important;box-shadow:none!important;overflow:hidden!important;
        }
        .shil-settings-summary-page .shil-summary-kv-label{
          display:block!important;max-width:100%!important;margin:0!important;color:#334155!important;font-size:11px!important;
          font-weight:800!important;line-height:1.35!important;overflow-wrap:anywhere!important;
        }
        .shil-settings-summary-page .shil-summary-kv-value{
          display:block!important;max-width:100%!important;margin:0!important;color:#0f172a!important;font-size:12px!important;
          font-weight:900!important;line-height:1.35!important;overflow-wrap:anywhere!important;word-break:break-word!important;
        }
        .shil-settings-summary-page .shil-summary-kv-card input{
          width:100%!important;min-width:0!important;min-height:34px!important;height:34px!important;margin:0!important;padding:4px 7px!important;
          text-align:center!important;color:#0f172a!important;-webkit-text-fill-color:#0f172a!important;font:900 12px/1.35 inherit!important;
          background:#fff!important;background-image:none!important;border:1px solid #cbd5e1!important;border-radius:9px!important;
          box-shadow:none!important;outline:none!important;
        }
        .shil-settings-summary-page .shil-summary-kv-card input:focus{border-color:#7c6ce7!important}
        .shil-settings-summary-page .shil-summary-accordion-chip{
          display:block!important;min-height:34px!important;height:auto!important;margin:8px auto 0!important;padding:5px 11px!important;
          border:1px solid #cbd5e1!important;border-radius:8px!important;background:#fff!important;background-image:none!important;
          color:#334155!important;font:800 11px/1.4 inherit!important;cursor:pointer!important;box-shadow:none!important;
        }
        .shil-settings-summary-page .shil-summary-accordion{max-height:0!important;opacity:0!important;overflow:hidden!important;margin-top:0!important;transition:max-height 220ms ease,opacity 220ms ease,margin-top 220ms ease!important}
        .shil-settings-summary-page .shil-summary-accordion.open{max-height:1400px!important;opacity:1!important;overflow:visible!important;margin-top:8px!important}
        .shil-settings-select-wrap{margin:0 0 8px!important}
        .shil-settings-select-wrap label{display:block!important;margin:0!important;color:#334155!important;font-size:11px!important;font-weight:800!important}
        .shil-settings-select-wrap label span{display:block!important;margin:0 0 5px!important;font-size:11px!important}
        .shil-settings-select-wrap select{width:100%!important;min-height:36px!important;height:36px!important;padding:5px 8px!important;border:1px solid #cbd5e1!important;border-radius:9px!important;background:#fff!important;color:#0f172a!important;font:800 12px/1.35 inherit!important}
        .shil-settings-summary-page .shil-settings-mode-row{display:flex!important;justify-content:center!important;margin-top:8px!important}
        .shil-settings-summary-page .shil-soft-button{min-height:34px!important;height:auto!important;padding:5px 11px!important;border-radius:8px!important;font-size:11px!important;box-shadow:none!important}
        .shil-settings-summary-page .shil-muted-line{margin:7px 0 0!important;text-align:center!important;color:#64748b!important;font-size:11px!important;line-height:1.55!important}
        .shil-settings-summary-page .shil-env-content-confirm-slot{position:static!important;display:flex!important;justify-content:center!important;width:100%!important;margin:0!important;padding:2px 0 0!important;background:transparent!important;border:0!important;box-shadow:none!important}
        .shil-settings-summary-page .shil-env-content-confirm-button{position:static!important;width:max-content!important;min-width:0!important;margin:0!important;padding-inline:14px!important;white-space:nowrap!important}
        @media(max-width:700px){
          .shil-settings-summary-page{gap:15px!important;padding-top:4px!important}
          .shil-settings-summary-page .shil-summary-section + .shil-summary-section{padding-top:13px!important}
          .shil-settings-summary-page .shil-summary-section-title{align-items:flex-start!important;gap:6px!important}
          .shil-settings-summary-page .shil-summary-section-title h2{font-size:13px!important}
          .shil-settings-summary-page .shil-summary-section-title span{font-size:10px!important}
          .shil-settings-summary-page .shil-summary-kv-grid{gap:6px!important}
          .shil-settings-summary-page .shil-summary-kv-card{min-height:56px!important;padding:7px 8px!important;border-radius:11px!important}
          .shil-settings-summary-page .shil-summary-kv-label{font-size:10.5px!important}
          .shil-settings-summary-page .shil-summary-kv-value,.shil-settings-summary-page .shil-summary-kv-card input{font-size:12px!important}
        }
      `}</style>

      <div id="shil-emergency-settings-root" className="shil-page-scroll shil-settings-summary-page shil-emergency-parity-page">
        <SettingsSection title="پارامترهای طراحی" meta={manualMode ? "ورود دستی تجهیزات فعال" : "انتخاب هوشمند فعال"}>
          <div className="shil-summary-data">
            <SettingsGrid editable rows={[
              ["ساعت مبنای تجهیزات", `${EMERGENCY_BASE_LOAD_HOURS} ساعت`, null],
              ["زمان پشتیبانی هدف", null, <input key="hours" value={backupHours} readOnly aria-readonly="true" />],
              ["ضریب اطمینان اینورتر", null, <input key="reserve" value={reserveFactor} inputMode="decimal" onChange={(e) => setReserveFactor(e.target.value)} />],
              ["عمق دشارژ مجاز %", null, <input key="dod" value={dodPercent} inputMode="decimal" onChange={(e) => setDodPercent(e.target.value)} />],
              ["طول یک‌طرفه کابل (m)", null, <input key="length" value={cableLengthM} inputMode="decimal" onChange={(e) => setCableLengthM(e.target.value)} />],
              ["ضریب افزایش متراژ", null, <input key="factor" value={lengthFactor} inputMode="decimal" onChange={(e) => setLengthFactor(e.target.value)} />],
              ["روش ورودی", handoff?.source?.methodTitle || design.sourceMethod],
            ]} />
          </div>
        </SettingsSection>

        <SettingsSection title="نتایج اصلی طراحی" meta="محاسبه زنده">
          <div className="shil-summary-data">
            <SettingsGrid rows={[
              ["توان بار اضطراری", `${faNumber(design.load.totalPowerW)} W`],
              ["پیک راه‌اندازی", `${faNumber(design.load.surgePowerW)} W`],
              ["توان طراحی اینورتر", `${faNumber(design.inverter.designPowerW)} W`],
              ["انرژی خام باتری لازم", `${enNumber(design.battery.requiredRawKWh, 2)} KWH`],
              ["ظرفیت قابل استفاده", `${enNumber(design.battery.usableEnergyKWh, 2)} KWH`],
              ["پشتیبانی واقعی", `${enNumber(design.battery.runtimeHours, 2)} ساعت`],
            ]} />
            <div className="shil-settings-mode-row">
              <button type="button" className={manualMode ? "shil-soft-button active" : "shil-soft-button"} onClick={() => setManualMode((v) => !v)}>
                {manualMode ? "حالت دستی فعال" : "ورود دستی تجهیزات"}
              </button>
            </div>
            <p className="shil-muted-line">{liveSaved ? "ذخیره زنده انجام شد." : "انتخاب‌ها براساس توان، پیک و زمان پشتیبانی به‌روزرسانی می‌شوند."}</p>
          </div>
        </SettingsSection>

        <BankSelect kind="inverter" title="اینورتر برق اضطراری" value={inverterId} onChange={(v) => { setManualMode(true); setInverterId(v); }} items={inverterOptions} selectedItem={design.inverter} smartMeta={`${faNumber(design.inverter.ratedPowerW)} W / DC ${faNumber(design.inverter.dcVoltage || design.inverter.batteryVoltage)} V`} detailRows={emergencyInverterDetailRows} />

        <BankSelect kind="battery" title="بانک ذخیره‌ساز انرژی" value={batteryId} onChange={(v) => { setManualMode(true); setBatteryId(v); }} items={batteryOptions} selectedItem={design.battery} smartMeta={`${faNumber(design.battery.seriesCount || 0)} سری × ${faNumber(design.battery.parallelCount || 0)} موازی`} detailRows={emergencyBatteryDetailRows} />

        <SettingsSection title="حفاظت و کابل پیشنهادی" meta="بر مبنای محاسبات">
          <div className="shil-summary-data">
            <SettingsGrid rows={[
              ["کلید یا فیوز DC باتری", `${faNumber(design.protection.dcBreakerA)} A DC`],
              ["کلید خروجی AC", `${faNumber(design.protection.acBreakerA)} A AC`],
              ["کابل DC باتری", `${faNumber(design.protection.dcCableMm2, 1)} mm² مسی`],
              ["کابل خروجی AC", `${faNumber(design.protection.acCableMm2, 1)} mm² مسی`],
              ["طول مؤثر محاسبات", `${faNumber(design.protection.effectiveLengthM, 1)} m`],
              ["افت ولتاژ مجاز", "DC 2% / AC 3%"],
            ]} />
          </div>
        </SettingsSection>

        <ShilWarningOverlay messages={design.warnings} inline />

        <div className="shil-env-content-confirm-slot" aria-label="تأیید تنظیمات برق اضطراری">
          <ShilPrimaryButton className="shil-env-content-confirm-button" disabled={!design.valid} onClick={confirm} label="تأیید" />
        </div>
      </div>
    </EngineeringPageShell>
  );
}
