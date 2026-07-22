import ShilPrimaryButton from "../../components/project/ShilPrimaryButton";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import EngineeringPageShell from "../../components/EngineeringPageShell.jsx";
import ShilWarningOverlay from "../../components/ShilWarningOverlay.jsx";
import { approveProjectStep } from "../../workflow/projectWorkflow.js";
import { getEnabledEquipment } from "../../data/registry/index.js";
import { buildSolarSystemDesign } from "../../engines/solarDesignEngine.js";
import { optionLabel } from "../../engines/solarBankRules.js";
import { getProjectPath, getSystemSetupHandoff, normalizeProjectDomain, writeJson } from "../../engines/projectFlowData.js";
import { buildProjectDesignState, saveProjectDesignState } from "../../engineering/core/projectDesignState.js";

const toEnglishDigits = (value) => String(value ?? "")
  .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
  .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
const enNumber = (value, digits = 0) => toEnglishDigits(Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: digits }));
const faNumber = enNumber;
const kw = (w) => `${enNumber(Math.round(Number(w || 0) / 10) / 100, 2)} kW`;
const whToKwh = (wh) => Math.round(Number(wh || 0) / 10) / 100;
const compactEquipmentLabel = (item, kind) => {
  if (!item) return "-";
  if (kind === "panel") return `${enNumber(item.powerW || item.ratedPowerW)}W`;
  if (kind === "inverter") return `${kw(item.ratedPowerW || item.powerW)} ${item.type ? `/${item.type}` : ""}`.trim();
  if (kind === "battery") return `${enNumber(item.nominalVoltage || item.voltageV, 1)}V ${enNumber(item.capacityAh)}Ah`;
  return optionLabel(item);
};

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
  const [open, setOpen] = useState(false);
  const cleanRows = rows.filter(Boolean);

  const pick = (...keys) => cleanRows.find(([label]) => keys.some((key) => label.includes(key)))?.[1] || "-";

  const mainRows = [
    { label: "توان مصرفی", value: pick("توان مصرفی", "توان مبنا") },
    { label: "انرژی روزانه", value: pick("انرژی روزانه", "مصرف روزانه") },
    { label: "توان آرایه", value: pick("توان کل پنل", "توان مبنای آرایه", "توان هر پنل") },
    { label: "اینورتر", value: pick("اینورتر معرفی", "توان مبنای انتخاب اینورتر") },
    { label: "پنل", value: pick("پنل معرفی", "تعداد پنل") },
    { label: "باتری", value: pick("باتری معرفی") },
    { label: "استرینگ", value: pick("استرینگ") },
    { label: "روش", value: pick("روش ورود") },
  ].filter((item) => item.value && item.value !== "-");

  const cardStyle = {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid rgba(0, 217, 255, 0.35)",
    borderRadius: "22px",
    background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(236,250,255,0.94))",
    boxShadow: "0 12px 28px rgba(0, 27, 65, 0.18), inset 0 1px 0 rgba(255,255,255,0.8)",
    overflow: "hidden",
    direction: "rtl",
  };

  const topGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "8px",
    padding: "10px",
  };

  const itemStyle = {
    minHeight: "64px",
    border: "1px solid rgba(0, 200, 220, 0.28)",
    borderRadius: "16px",
    background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(245,252,255,0.92))",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: "6px",
    padding: "8px 6px",
    boxSizing: "border-box",
    textAlign: "center",
  };

  const labelStyle = {
    fontSize: "12px",
    fontWeight: 800,
    color: "#33516b",
    lineHeight: 1.25,
    whiteSpace: "normal",
  };

  const valueStyle = {
    width: "100%",
    fontSize: "14px",
    fontWeight: 950,
    color: "#071827",
    lineHeight: 1.25,
    overflowWrap: "anywhere",
    wordBreak: "break-word",
    whiteSpace: "normal",
  };

  const detailButtonStyle = {
    width: "100%",
    border: 0,
    borderTop: "1px solid rgba(0, 135, 180, 0.2)",
    background: "linear-gradient(90deg, rgba(178,205,231,0.95), rgba(241,248,255,0.98))",
    minHeight: "42px",
    fontSize: "15px",
    fontWeight: 950,
    color: "#071827",
    cursor: "pointer",
  };

  return <div className="shil-summary-table-card" style={cardStyle}>
    <div style={topGridStyle}>
      {mainRows.slice(0, 8).map(({ label, value }) => (
        <div key={label} className="shil-summary-modern-item" style={itemStyle}>
          <span style={labelStyle}>{label}</span>
          <strong style={valueStyle}>{value || "-"}</strong>
        </div>
      ))}
    </div>

    <button type="button" className="shil-summary-detail-chip" style={detailButtonStyle} onClick={() => setOpen((v) => !v)}>
      {open ? "▲ بستن جزئیات محاسبات" : "▼ مشاهده جزئیات محاسبات"}
    </button>

    <div
      className={open ? "shil-summary-details open" : "shil-summary-details"}
      style={{
        display: open ? "block" : "none",
        padding: "10px",
        background: "rgba(255,255,255,0.72)",
      }}
    >
      <div
        className="shil-summary-details-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "8px",
        }}
      >
        {cleanRows.map(([label, value]) => (
          <div
            key={label}
            className="shil-summary-detail-item"
            style={{
              border: "1px solid rgba(0, 200, 220, 0.22)",
              borderRadius: "14px",
              padding: "8px 6px",
              textAlign: "center",
              background: "rgba(255,255,255,0.86)",
              minWidth: 0,
            }}
          >
            <span style={labelStyle}>{label}</span>
            <strong style={valueStyle}>{value || "-"}</strong>
          </div>
        ))}
      </div>
    </div>
  </div>;
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
      ["توان مبنا", load.totalPowerW ? `${faNumber(load.totalPowerW)} W` : "بر اساس تنظیمات"],
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
    <ShilWarningOverlay messages={summary.warnings} />
  </section>;
}

function BankSelectCard({ title, subtitle, items, value, onChange, smartTitle, smartValue, selectedItem, detailRows = [], disabled = false, kind = "equipment" }) {
  const [open, setOpen] = useState(false);
  const activeItem = selectedItem || items.find((item) => item.id === value) || null;

  const itemLabel =
    kind === "panel" ? "پنل هوشمند" :
    kind === "inverter" ? "اینورتر هوشمند" :
    kind === "battery" ? "باتری هوشمند" :
    "تجهیز هوشمند";

  const qtyLabel =
    kind === "panel" ? "تعداد پنل هوشمند" :
    kind === "inverter" ? "تعداد اینورتر هوشمند" :
    kind === "battery" ? "تعداد باتری هوشمند" :
    "تعداد";

  const sheetLabel =
    kind === "panel" ? "دیتاشیت پنل هوشمند" :
    kind === "inverter" ? "دیتاشیت اینورتر هوشمند" :
    kind === "battery" ? "دیتاشیت باتری هوشمند" :
    "دیتاشیت";

  const qtyValue = String(smartValue || "").split("/")[0].trim() || "-";

  return <section className={`shil-equipment-bank-card ${disabled ? "is-locked" : ""}`}>
    <div className="shil-equipment-bank-title">{title}</div>

    <table className="shil-equipment-bank-table">
      <thead>
        <tr>
          <th>انتخاب</th>
          <th>{itemLabel}</th>
          <th>{qtyLabel}</th>
          <th>{sheetLabel}</th>
        </tr>
      </thead>

      <tbody>
        <tr>
          <td>
            <button type="button" className="shil-equipment-bank-chip" onClick={() => setOpen((v) => !v)} disabled={disabled}>
              {open ? "▲ بستن" : "▼ نمایش"}
            </button>
          </td>
          <td>{compactEquipmentLabel(activeItem, kind)}</td>
          <td>{qtyValue}</td>
          <td>
            <button type="button" className="shil-equipment-bank-sheet" onClick={() => setOpen(true)}>
              📄 مشاهده
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div className={open ? "shil-equipment-bank-details open" : "shil-equipment-bank-details"}>
      <div className="shil-equipment-bank-old-content">
        <select value={value || activeItem?.id || ""} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
          {items.map((item) => <option key={item.id} value={item.id}>{compactEquipmentLabel(item, kind)}</option>)}
        </select>

        <div className="shil-bank-smart-note">
          <span>پیشنهاد هوشمند</span>
          <strong>{smartTitle}</strong>
          <small>{smartValue}</small>
        </div>

        <div className="shil-summary-grid shil-bank-datasheet-grid">
          {detailRows.filter(Boolean).map(([label, val]) => <div key={label}><span>{label}</span><strong>{val || "-"}</strong></div>)}
        </div>
      </div>
    </div>
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

  const initialNeedsBattery = Boolean(handoff?.systemHints?.needsBattery || Number(handoff?.autonomy?.hours || 0) > 0 || Number(handoff?.autonomy?.days || 0) > 0);
  const [systemType, setSystemType] = useState(() => {
    const scenario = String(handoff?.source?.scenario || "").toLowerCase();
    if (["offgrid", "hybrid", "ongrid"].includes(scenario)) return scenario;
    return initialNeedsBattery ? "offgrid" : "ongrid";
  });
  const [designAdjustmentMode, setDesignAdjustmentMode] = useState("decrease");
  const [designAdjustmentPercent, setDesignAdjustmentPercent] = useState("20");
  const lockedAutonomyDays = String(handoff?.autonomy?.inputDays ?? handoff?.autonomy?.days ?? 0);
  const lockedAutonomyHours = String(handoff?.autonomy?.inputHours ?? handoff?.autonomy?.hours ?? 0);
  const [autonomyDays] = useState(() => lockedAutonomyDays);
  const [autonomyHours] = useState(() => lockedAutonomyHours);
  const [panelId, setPanelId] = useState(() => handoff?.routePayload?.panelId || handoff?.routePayload?.selectedPanelId || "");
  const [inverterId, setInverterId] = useState("");
  const [batteryId, setBatteryId] = useState("");

  const settings = useMemo(() => ({ systemType, designAdjustmentPercent, designAdjustmentMode, reservePercent: designAdjustmentPercent, reserveMode: designAdjustmentMode, autonomyDays, autonomyHours, panelId, inverterId, batteryId }), [systemType, designAdjustmentPercent, designAdjustmentMode, autonomyDays, autonomyHours, panelId, inverterId, batteryId]);
  const design = useMemo(() => buildSolarSystemDesign({ handoff, settings, banks: { panels, inverters, batteries } }), [handoff, settings, panels, inverters, batteries]);
  const showBatteryBank = design.system.needsBattery;
  const panelDetailRows = [
    ["توان دقیق پنل", `${faNumber(design.panel?.powerW)} W`],
    ["Vmp / Voc", `${faNumber(design.panel?.vmp, 2)}V / ${faNumber(design.panel?.voc, 2)}V`],
    ["Imp / Isc", `${faNumber(design.panel?.imp, 2)}A / ${faNumber(design.panel?.isc, 2)}A`],
    ["نوع سلول", design.panel?.cellType],
    ["راندمان", design.panel?.efficiency ? `${faNumber(design.panel.efficiency * 100, 2)}%` : null],
    ["ضریب دمایی Voc", design.panel?.tempCoeffVocPctC ? `${design.panel.tempCoeffVocPctC}%/C` : null],
    ["ابعاد", design.panel?.dimensionsMm ? `${design.panel.dimensionsMm.length}×${design.panel.dimensionsMm.width}×${design.panel.dimensionsMm.height} mm` : null],
    ["کاربرد", design.panel?.useCase],
  ];

  const inverterDetailRows = [
    ["توان نامی", `${faNumber(design.inverter?.ratedPowerW)} W`],
    ["تعداد اینورتر", `${faNumber(design.inverter?.count || 1)} عدد`],
    ["باس باتری DC", design.inverter?.batteryVoltage || design.inverter?.dcVoltage ? `${faNumber(design.inverter?.batteryVoltage || design.inverter?.dcVoltage)} V` : "بدون باتری"],
    ["MPPT", `${faNumber(design.inverter?.mpptCount || 1)} ورودی`],
    ["بازه MPPT", `${faNumber(design.inverter?.mpptMinV)}-${faNumber(design.inverter?.mpptMaxV)} V`],
    ["حداکثر Voc PV", `${faNumber(design.inverter?.maxPvVocV || design.inverter?.maxPvVoc)} V`],
    ["حداکثر توان PV", `${faNumber(design.inverter?.maxPvPowerW)} W`],
    ["جریان ورودی PV", `${faNumber(design.inverter?.maxPvInputCurrentA, 2)} A`],
    ["قابلیت پارالل", design.inverter?.parallelCapable ? "دارد" : "ندارد"],
  ];

  const batteryDetailRows = [
    ["ولتاژ نامی", `${faNumber(design.battery?.item?.nominalVoltage, 1)} V`],
    ["ظرفیت", `${faNumber(design.battery?.item?.capacityAh)} Ah`],
    ["انرژی هر باتری", `${faNumber(design.battery?.unitEnergyKWh, 2)} kWh`],
    ["آرایش سری/موازی", `${faNumber(design.battery?.seriesCount || 0)} سری × ${faNumber(design.battery?.parallelCount || 0)} موازی`],
    ["ولتاژ پک", `${faNumber(design.battery?.packVoltage, 1)} V`],
    ["تعداد کل", `${faNumber(design.battery?.count)} عدد`],
    ["انرژی کل", `${faNumber(design.battery?.grossEnergyKWh, 2)} kWh`],
    ["DoD / راندمان", `${faNumber((design.battery?.item?.usableDod || 0.9) * 100)}% / ${faNumber((design.battery?.item?.efficiency || 0.94) * 100)}%`],
  ];

  useEffect(() => {
    if (domain === "emergency") navigate("/new-project/system/emergency", { replace: true });
    if (domain === "utility") navigate("/new-project/system/utility", { replace: true });
  }, [domain, navigate]);

  useEffect(() => {
    if (design.selectedBanks.panelId && panelId !== design.selectedBanks.panelId) setPanelId(design.selectedBanks.panelId);
    if (design.selectedBanks.inverterId && inverterId !== design.selectedBanks.inverterId) setInverterId(design.selectedBanks.inverterId);
    if (design.selectedBanks.batteryId && batteryId !== design.selectedBanks.batteryId) setBatteryId(design.selectedBanks.batteryId);
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
    const centralState = buildProjectDesignState({ domain: "solar", handoff, settings, design, source: "system-settings-confirm" });
    writeJson("shil:systemSettingsDraft", draft);
    writeJson("shil:solarSystemDesign", design);
    saveProjectDesignState(centralState);
    approveProjectStep("system");
    navigate("/new-project/summary/solar");
  };

  return <EngineeringPageShell title="تنظیمات" activeStep="system" backTo="/new-project/inputs/solar">
    <Toast message={warning} />
    <div className="shil-page-scroll shil-system-settings-page" style={{ paddingBottom: "0px" }}>
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
          <label><span>درصد اصلاح انتخاب اینورتر</span><select value={designAdjustmentPercent} onChange={(e) => setDesignAdjustmentPercent(e.target.value)}><option value="10">10%</option><option value="15">15%</option><option value="20">20%</option><option value="25">25%</option><option value="30">30%</option></select></label>
          <label><span>نوع اصلاح اینورتر</span><select value={designAdjustmentMode} onChange={(e) => setDesignAdjustmentMode(e.target.value)}><option value="decrease">کاهش</option><option value="increase">افزایش</option></select></label>
          <label><span>روزهای خودکفایی</span><input value={autonomyDays} readOnly disabled inputMode="decimal" /></label>
          <label><span>ساعت‌های خودکفایی</span><input value={autonomyHours} readOnly disabled inputMode="decimal" placeholder="از مرحله قبل" /></label>
        </div>
      </section>

      <div className="shil-bank-grid">
        <BankSelectCard kind="panel" title="بانک پنل خورشیدی" subtitle="انتخاب خلاصه؛ دیتاشیت در جزئیات" items={panels} value={design.selectedBanks.panelId || panelId} onChange={setPanelId} selectedItem={design.panel} smartTitle={compactEquipmentLabel(design.panel, "panel")} smartValue={`${faNumber(design.pvArray.panelCount)} عدد / ${kw(design.pvArray.arrayPowerW)}`} detailRows={panelDetailRows} />
        <BankSelectCard kind="inverter" title="بانک اینورتر خورشیدی" subtitle="انتخاب خلاصه؛ دیتاشیت در جزئیات" items={inverters} value={design.selectedBanks.inverterId || inverterId} onChange={setInverterId} selectedItem={design.inverter} smartTitle={compactEquipmentLabel(design.inverter, "inverter")} smartValue={`${faNumber(design.inverter?.count || 1)} عدد / ${kw((design.inverter?.ratedPowerW || 0) * (design.inverter?.count || 1))}`} detailRows={inverterDetailRows} />
        {showBatteryBank ? <BankSelectCard kind="battery" title="بانک ذخیره‌ساز انرژی" subtitle="انتخاب خلاصه؛ دیتاشیت در جزئیات" items={batteries} value={design.selectedBanks.batteryId || batteryId} onChange={setBatteryId} selectedItem={design.battery?.item} smartTitle={compactEquipmentLabel(design.battery?.item, "battery")} smartValue={`${faNumber(design.battery?.count)} عدد / ${faNumber(design.battery?.grossEnergyKWh, 2)} kWh`} detailRows={batteryDetailRows} /> : null}
      </div>

      <section className="shil-section-card shil-config-block">
        <div className="shil-section-head"><h2>چکیده تنظیمات</h2><span>{design.valid ? "قابل تأیید" : "نیازمند اصلاح"}</span></div>
        <SummaryGrid rows={[
          ["توان مصرفی مبنا", kw(design.load.basePowerW)],
          ["انرژی روزانه مبنا", `${enNumber(design.load.finalEnergyKWh, 2)} kWh/day`],
          ["توان مبنای آرایه پنل", kw(design.pvArray.baseRequiredPowerW)],
          ["توان مبنای انتخاب اینورتر", `${enNumber(design.pvArray.inverterSizingPowerKW, 2)} kW (${design.load.designAdjustmentMode === "increase" ? "افزایش" : "کاهش"} ${enNumber(design.load.designAdjustmentPercent)}%)`],
          ["پنل معرفی‌شده", `${compactEquipmentLabel(design.panel, "panel")} / ${enNumber(design.pvArray.panelCount)} عدد`],
          ["توان کل پنل‌ها", `${enNumber(design.pvArray.arrayPowerKW, 2)} kW`],
          ["اینورتر معرفی‌شده", `${compactEquipmentLabel(design.inverter, "inverter")} / ${enNumber(design.inverter?.count || 1)} عدد`],
          ["استرینگ پیشنهادی", `${enNumber(design.pvArray.seriesCount)} سری × ${enNumber(design.pvArray.parallelCount)} موازی / MPPT: ${enNumber(design.inverter?.mpptCount || 1)}`],
          ["تولید روزانه تخمینی", `${enNumber(design.pvArray.estimatedDailyKWh, 2)} kWh/day`],
          ["باتری معرفی‌شده", showBatteryBank ? `${compactEquipmentLabel(design.battery?.item, "battery")} / ${faNumber(design.battery?.count)} عدد / ${faNumber(design.battery?.grossEnergyKWh, 2)} kWh` : "غیرفعال در این سناریو"],
        ]} />
        <ShilWarningOverlay messages={design.warnings} />
      </section>

              <div
          className="shil-env-content-confirm-slot"
          aria-label="تأیید تنظیمات"
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            margin: "0px 0px 0px",
            transform: "translateX(33px)",
            zIndex: 20,
          }}
        >
          <ShilPrimaryButton
            className="shil-env-content-confirm-button"
            disabled={!design.valid} onClick={confirm}
            label="تأیید پنل"
            style={{
              position: "static",
              left: "auto",
              right: "auto",
              bottom: "auto",
              top: "auto",
              transform: "none",
              width: "max-content",
              minWidth: 0,
              maxWidth: "none",
              padding: "0 12px",
              whiteSpace: "nowrap",
            }}
          />
        </div>
    </div>
  </EngineeringPageShell>;
}
