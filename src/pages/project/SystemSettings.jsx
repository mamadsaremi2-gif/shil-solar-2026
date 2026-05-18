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
const kw = (w) => `${faNumber(Math.round(Number(w || 0) / 100) / 10)} Ú©ÛŒÙ„ÙˆÙˆØ§Øª`;

function DetailsToggle({ title, children, defaultOpen = false, attached = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={attached ? "shil-details-box shil-details-attached" : "shil-details-box"}>
      <button type="button" className="shil-details-toggle" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>{title}</span>
        <b>{open ? "Ø¨Ø³ØªÙ†" : "Ù†Ù…Ø§ÛŒØ´ Ø¬Ø²Ø¦ÛŒØ§Øª"}</b>
      </button>
      {open ? <div className="shil-details-content">{children}</div> : null}
    </div>
  );
}

function DesignModeCards({ value, onChange }) {
  const items = [
    { key: "offgrid", label: "Ø¢ÙÚ¯Ø±ÛŒØ¯", hint: "Ø¨Ø§ØªØ±ÛŒ Ù…Ø­ÙˆØ±", note: "Ù…Ù†Ø§Ø³Ø¨ Ù†Ù‚Ø§Ø· Ø¨Ø¯ÙˆÙ† Ø´Ø¨Ú©Ù‡ ÛŒØ§ Ù†ÛŒØ§Ø²Ù…Ù†Ø¯ Ø§Ø³ØªÙ‚Ù„Ø§Ù„ Ú©Ø§Ù…Ù„" },
    { key: "ongrid", label: "Ø¢Ù†Ú¯Ø±ÛŒØ¯", hint: "Ø´Ø¨Ú©Ù‡ Ù…Ø­ÙˆØ±", note: "Ù…Ù†Ø§Ø³Ø¨ ØªØ²Ø±ÛŒÙ‚ ÛŒØ§ Ù…ØµØ±Ù Ù‡Ù…Ø²Ù…Ø§Ù† Ø¨Ø§ Ø´Ø¨Ú©Ù‡" },
    { key: "hybrid", label: "Ù‡ÛŒØ¨Ø±ÛŒØ¯", hint: "ØªØ±Ú©ÛŒØ¨ÛŒ", note: "ØªØ±Ú©ÛŒØ¨ Ø´Ø¨Ú©Ù‡ØŒ PV Ùˆ Ø°Ø®ÛŒØ±Ù‡â€ŒØ³Ø§Ø²" }
  ];
  return (
    <div className="shil-system-type-cards shil-design-mode-cards">
      {items.map((item) => (
        <button key={item.key} type="button" className={value === item.key ? "active" : ""} onClick={() => onChange(item.key)}>
          <span className="shil-mode-icon">{item.key === "offgrid" ? "â›­" : item.key === "ongrid" ? "âŒ" : "â—‡"}</span>
          <strong>{item.label}</strong>
          <small>{item.hint}</small>
          <em>{item.note}</em>
        </button>
      ))}
    </div>
  );
}

function BankSelect({ title, subtitle, value, extraFactor, onValue, onExtraFactor, items, renderMeta, renderReason, smartValue, smartTitle }) {
  const selected = items.find((item) => item.id === value);
  return (
    <div className="shil-bank-card shil-bank-card-final shil-bank-collapsed-field">
      <div className="shil-bank-topline">
        <div>
          <h2>{title}</h2>
          <span>{subtitle}</span>
        </div>
        <b>{smartValue}</b>
      </div>

      <div className="shil-smart-pick-box">
        <span>Ø§Ù†ØªØ®Ø§Ø¨ Ù‡ÙˆØ´Ù…Ù†Ø¯ Ø§Ù¾</span>
        <strong>{smartTitle || optionTitle(selected)}</strong>
        <small>{smartValue}</small>
      </div>

      <DetailsToggle title="ØªØºÛŒÛŒØ± Ø¨Ø§Ù†Ú© Ùˆ ØªÙˆØ³Ø¹Ù‡ Ø¢ÛŒÙ†Ø¯Ù‡">
        <div className="shil-bank-body">
          <label className="shil-bank-field">
            <span>Ø§Ù†ØªØ®Ø§Ø¨ Ø§Ø² Ø¨Ø§Ù†Ú© SHIL</span>
            <select value={value} onChange={(e) => onValue(e.target.value)}>
              {items.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
          </label>

          <label className="shil-bank-field shil-bank-count-field">
            <span>Ø¶Ø±ÛŒØ¨ Ø§Ø¶Ø§ÙÙ‡ Ú©Ø±Ø¯Ù†</span>
            <input type="number" step="0.05" min="1" value={extraFactor} onChange={(e) => onExtraFactor(e.target.value)} />
          </label>
        </div>
      </DetailsToggle>

      <DetailsToggle title="ØªÙˆØ¶ÛŒØ­Ø§Øª Ø§ÛŒÙ† Ø¨Ø§Ù†Ú©">
        <div className="shil-bank-meta">{renderMeta(selected)}</div>
        {renderReason ? <div className="shil-bank-reason">{renderReason(selected)}</div> : null}
      </DetailsToggle>
    </div>
  );
}

function ConfigurationLinkedDetails({ design }) {
  const protectionReport = design.protection?.report || [];
  const explanations = design.explanations || [];
  const detailRows = [
    {
      title: "Ø§ÛŒÙ†ÙˆØ±ØªØ± Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ",
      value: `${optionTitle(design.inverter)} / ${faNumber(design.inverter.count)} Ø¹Ø¯Ø¯`,
      details: [
        `ØªÙˆØ§Ù† Ù…Ø¨Ù†Ø§ÛŒ Ø·Ø±Ø§Ø­ÛŒ Ø§Ø² Ø¬Ø¯ÙˆÙ„ Ù†ØªÛŒØ¬Ù‡ Ø®ÙˆØ§Ù†Ø¯Ù‡ Ù…ÛŒâ€ŒØ´ÙˆØ¯: ${faNumber(design.load.totalPowerW)} ÙˆØ§Øª Ã— Ø¶Ø±ÛŒØ¨ ${design.settings.reserveFactor} = ${faNumber(design.load.totalPowerW * design.settings.reserveFactor)} ÙˆØ§Øª.`,
        `Ù†ÙˆØ¹ Ø§Ø¬Ø±Ø§: ${design.settings.systemType === "offgrid" ? "Ø¢ÙÚ¯Ø±ÛŒØ¯" : design.settings.systemType === "hybrid" ? "Ù‡ÛŒØ¨Ø±ÛŒØ¯" : "Ø¢Ù†Ú¯Ø±ÛŒØ¯"}. Ø§ÛŒÙ† Ù…Ù‚Ø¯Ø§Ø± Ù†ÙˆØ¹ Ø§ÛŒÙ†ÙˆØ±ØªØ± Ù†Ù‡Ø§ÛŒÛŒ Ø±Ø§ Ø¯Ø± Ú†Ú©ÛŒØ¯Ù‡ Ùˆ Ø§Ø¬Ø±Ø§ÛŒ Ù…Ø­Ø§Ø³Ø¨Ø§Øª Ù…Ø´Ø®Øµ Ù…ÛŒâ€ŒÚ©Ù†Ø¯.`,
        `ÙˆÙ„ØªØ§Ú˜ DC Ø§ÛŒÙ†ÙˆØ±ØªØ± ${design.inverter.dcVoltage} ÙˆÙ„Øª Ø§Ø³ØªØ› Ø¨Ø§ØªØ±ÛŒ Ø¨Ø§ÛŒØ¯ Ø¨Ø§ Ø¨Ø§Ø²Ù‡ Ø´Ù†Ø§ÙˆØ± Ù‡Ù…Ø§Ù† Ú©Ù„Ø§Ø³ ÙˆÙ„ØªØ§Ú˜ Ù‡Ù…Ø®ÙˆØ§Ù† Ø¨Ø§Ø´Ø¯.`
      ]
    },
    {
      title: "Ø¨Ø§ØªØ±ÛŒ Ùˆ Ø®ÙˆØ¯Ú©ÙØ§ÛŒÛŒ",
      value: `${design.battery.battery.title} / ${faNumber(design.battery.totalCount)} Ø¹Ø¯Ø¯`,
      details: [
        `Ø±ÙˆØ² Ø®ÙˆØ¯Ú©ÙØ§ÛŒÛŒ ${design.settings.autonomyDays} Ø±ÙˆØ² Ø§Ø³Øª Ùˆ Ù…Ø³ØªÙ‚ÛŒÙ… Ø±ÙˆÛŒ ØªØ¹Ø¯Ø§Ø¯ Ø¨Ø§ØªØ±ÛŒ Ø§Ø«Ø± Ù…ÛŒâ€ŒÚ¯Ø°Ø§Ø±Ø¯.`,
        `Ø³Ø§Ø®ØªØ§Ø± Ø§Ø² Ø¬Ø¯ÙˆÙ„ Ù†ØªÛŒØ¬Ù‡: ${faNumber(design.battery.seriesCount)} Ø³Ø±ÛŒ Ã— ${faNumber(design.battery.parallelCount)} Ù…ÙˆØ§Ø²ÛŒ.`,
        `Ø¨Ø§Ø²Ù‡ ÙˆÙ„ØªØ§Ú˜ Ø´Ù†Ø§ÙˆØ± ${design.battery.voltageRange} Ø§Ø³Øª Ùˆ Ø¨Ø§ ÙˆØ±ÙˆØ¯ÛŒ DC Ø§ÛŒÙ†ÙˆØ±ØªØ± Ú©Ù†ØªØ±Ù„ Ù…ÛŒâ€ŒØ´ÙˆØ¯.`
      ]
    },
    {
      title: "Ù¾Ù†Ù„ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ Ùˆ Ø¢Ø±Ø§ÛŒÙ‡ PV",
      value: `${design.panel.title} / ${faNumber(design.pvArray.panelCount)} Ø¹Ø¯Ø¯`,
      details: [
        `ØªÙˆØ§Ù† Ø¢Ø±Ø§ÛŒÙ‡ ${faNumber(design.pvArray.arrayPowerW)} ÙˆØ§Øª Ø§Ø³Øª Ùˆ Ø§Ø² ØªØ¹Ø¯Ø§Ø¯ Ù¾Ù†Ù„ Ùˆ ØªÙˆØ§Ù† Ù¾Ù†Ù„ Ø§Ù†ØªØ®Ø§Ø¨â€ŒØ´Ø¯Ù‡ Ù…Ø­Ø§Ø³Ø¨Ù‡ Ù…ÛŒâ€ŒØ´ÙˆØ¯.`,
        `Ø³Ø§Ø®ØªØ§Ø± Ø¢Ø±Ø§ÛŒÙ‡: ${faNumber(design.pvArray.seriesCount)} Ø³Ø±ÛŒ Ã— ${faNumber(design.pvArray.parallelCount)} Ù…ÙˆØ§Ø²ÛŒ.`,
        "Ø³Ø±ÛŒ Ù¾Ù†Ù„â€ŒÙ‡Ø§ Ø¨Ø±Ø§ÛŒ Ù‚Ø±Ø§Ø± Ú¯Ø±ÙØªÙ† Ø¯Ø± Ù…Ø­Ø¯ÙˆØ¯Ù‡ MPPT Ø§ÛŒÙ†ÙˆØ±ØªØ± Ùˆ Ù…ÙˆØ§Ø²ÛŒâ€ŒÙ‡Ø§ Ø¨Ø±Ø§ÛŒ Ù¾ÙˆØ´Ø´ ØªÙˆØ§Ù† Ùˆ ØªÙˆØ³Ø¹Ù‡ Ø¢ÛŒÙ†Ø¯Ù‡ Ø§Ù†ØªØ®Ø§Ø¨ Ø´Ø¯Ù‡â€ŒØ§Ù†Ø¯."
      ]
    },
    {
      title: "ÙØ¶Ø§ØŒ Ú©Ø§Ø¨Ù„ Ùˆ Ø­ÙØ§Ø¸Øª",
      value: `${design.space.maintenanceAreaM2} mÂ² / DC ${design.protection.dcBreakerA}A / AC ${design.protection.acBreakerA}A`,
      details: [
        `ÙØ¶Ø§ÛŒ Ù†ØµØ¨ Ø¨Ø§ ØªØ¹Ø¯Ø§Ø¯ Ù¾Ù†Ù„ØŒ Ù…Ø³Ø§Ø­Øª Ù¾Ù†Ù„ Ùˆ ÙØ¶Ø§ÛŒ Ø³Ø±ÙˆÛŒØ³ Ù…Ø­Ø§Ø³Ø¨Ù‡ Ø´Ø¯Ù‡ Ø§Ø³Øª: ${design.space.note}`,
        `Ú©Ø§Ø¨Ù„â€ŒÙ‡Ø§: DC ${design.protection.dcCable}ØŒ PV ${design.protection.pvCable}ØŒ Ø¨Ø§ØªØ±ÛŒ ${design.protection.batteryCable}.`,
        "Ø­ÙØ§Ø¸Øª Ø¨Ø§ ØªÙÚ©ÛŒÚ© Ø³Ù…Øª DC/ACØŒ Ø¬Ø±ÛŒØ§Ù† Ú©Ø§Ø±ÛŒØŒ Ø¶Ø±ÛŒØ¨ Ø§Ø·Ù…ÛŒÙ†Ø§Ù† Ùˆ Ø§Ø¶Ø§ÙÙ‡â€ŒØ¨Ø§Ø± Ø§Ù†ØªØ®Ø§Ø¨ Ù…ÛŒâ€ŒØ´ÙˆØ¯."
      ]
    }
  ];

  return (
    <DetailsToggle title="Ù†Ù…Ø§ÛŒØ´ Ø¬Ø²Ø¦ÛŒØ§Øª Ø¬Ø¯ÙˆÙ„ØŒ Ú©Ø§Ø¨Ù„ Ùˆ Ø­ÙØ§Ø¸Øª" attached>
      <div className="shil-linked-details-grid">
        {detailRows.map((row) => (
          <div className="shil-linked-detail-card" key={row.title}>
            <div className="shil-linked-detail-head">
              <span>{row.title}</span>
              <strong>{row.value}</strong>
            </div>
            <ul>
              {row.details.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="shil-expert-box shil-linked-protection-report">
        {protectionReport.map((item) => <div key={item}><span>Ø­ÙØ§Ø¸Øª</span><strong>{item}</strong></div>)}
        {explanations.map((item) => <div key={item}><span>SHIL</span><strong>{item}</strong></div>)}
      </div>
    </DetailsToggle>
  );
}

function ResultTable({ design }) {
  const rows = [
    ["Ù†ÙˆØ¹ Ø§Ø¬Ø±Ø§", design.settings.systemType === "offgrid" ? "Ø¢ÙÚ¯Ø±ÛŒØ¯" : design.settings.systemType === "hybrid" ? "Ù‡ÛŒØ¨Ø±ÛŒØ¯" : "Ø¢Ù†Ú¯Ø±ÛŒØ¯", "Ù†ÙˆØ¹ Ø§ÛŒÙ†ÙˆØ±ØªØ± Ùˆ Ø³Ø§Ø®ØªØ§Ø± Ù†Ù‡Ø§ÛŒÛŒ Ø·Ø±Ø§Ø­ÛŒ"],
    ["ØªÙˆØ§Ù† Ø·Ø±Ø§Ø­ÛŒ", `${faNumber(design.load.totalPowerW)}W Ã— Ø¶Ø±ÛŒØ¨ ${design.settings.reserveFactor}`, `${kw(design.load.totalPowerW * design.settings.reserveFactor)} Ù…Ø¨Ù†Ø§ÛŒ Ø§Ù†ØªØ®Ø§Ø¨ Ø§ÛŒÙ†ÙˆØ±ØªØ±`],
    ["Ø§ÛŒÙ†ÙˆØ±ØªØ±", `${optionTitle(design.inverter)} / ${faNumber(design.inverter.count)} Ø¹Ø¯Ø¯`, design.inverter.parallelRequired ? "Ù†ÛŒØ§Ø²Ù…Ù†Ø¯ Ú©Ø§Ø±Ú©Ø±Ø¯ Ù…ÙˆØ§Ø²ÛŒ" : "Ù¾ÙˆØ´Ø´ Ù…Ø³ØªÙ‚ÛŒÙ… ØªÙˆØ§Ù†"],
    ["Ø¨Ø§ØªØ±ÛŒ", `${design.battery.battery.title} / ${faNumber(design.battery.totalCount)} Ø¹Ø¯Ø¯`, `${faNumber(design.battery.seriesCount)} Ø³Ø±ÛŒ Ã— ${faNumber(design.battery.parallelCount)} Ù…ÙˆØ§Ø²ÛŒ / Ø¨Ø§Ø²Ù‡ ${design.battery.voltageRange}`],
    ["Ù¾Ù†Ù„", `${design.panel.title} / ${faNumber(design.pvArray.panelCount)} Ø¹Ø¯Ø¯`, `${faNumber(design.pvArray.seriesCount)} Ø³Ø±ÛŒ Ã— ${faNumber(design.pvArray.parallelCount)} Ù…ÙˆØ§Ø²ÛŒ / ${faNumber(design.pvArray.arrayPowerW)}W`],
    ["ÙØ¶Ø§ÛŒ Ù†ØµØ¨", `${design.space.maintenanceAreaM2} mÂ²`, design.space.note],
    ["Ø­ÙØ§Ø¸Øª", `DC ${design.protection.dcBreakerA}A / AC ${design.protection.acBreakerA}A`, "Ø¨Ø± Ø§Ø³Ø§Ø³ Ø¬Ø±ÛŒØ§Ù† Ú©Ø§Ø±ÛŒØŒ Ø¶Ø±ÛŒØ¨ Ø§Ø·Ù…ÛŒÙ†Ø§Ù† Ùˆ Ø­ÙØ§Ø¸Øª Ø§Ø¶Ø§ÙÙ‡â€ŒØ¨Ø§Ø±"],
    ["Ú©Ø§Ø¨Ù„", `DC ${design.protection.dcCable}`, `PV ${design.protection.pvCable} / Ø¨Ø§ØªØ±ÛŒ ${design.protection.batteryCable}`]
  ];

  return (
    <div className="shil-result-table shil-result-table-final" role="table" aria-label="Ù†ØªÛŒØ¬Ù‡ Ù¾ÛŒÚ©Ø±Ø¨Ù†Ø¯ÛŒ Ø³ÛŒØ³ØªÙ…">
      <div className="shil-result-row shil-result-header" role="row">
        <span>Ø¨Ø®Ø´</span>
        <strong>Ù…Ù‚Ø¯Ø§Ø± Ù…Ø­Ø§Ø³Ø¨Ù‡â€ŒØ´Ø¯Ù‡</strong>
        <small>Ø¯Ù„ÛŒÙ„ / Ø§Ø«Ø± Ø¯Ø± Ù…Ø­Ø§Ø³Ø¨Ø§Øª</small>
      </div>
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
  const [equipmentManualMode, setEquipmentManualMode] = useState(false);
  const [parameterManualMode, setParameterManualMode] = useState(false);
  const [panelId, setPanelId] = useState(SHIL_SOLAR_PANELS.find((p) => p.powerW === 620)?.id || SHIL_SOLAR_PANELS[0]?.id || "");
  const [inverterId, setInverterId] = useState(SHIL_SOLAR_INVERTERS.find((i) => i.ratedPowerW >= 5000)?.id || SHIL_SOLAR_INVERTERS[0]?.id || "");
  const [batteryId, setBatteryId] = useState(SHIL_LITHIUM_BATTERIES.find((b) => b.nominalVoltage === 48 && b.capacityAh === 200)?.id || SHIL_LITHIUM_BATTERIES[0]?.id || "");
  const [panelExtraFactor, setPanelExtraFactor] = useState(1);
  const [liveSaved, setLiveSaved] = useState(false);
  const [inverterExtraFactor, setInverterExtraFactor] = useState(1);
  const [batteryExtraFactor, setBatteryExtraFactor] = useState(1);
  const [warning, setWarning] = useState("");

  const settings = useMemo(() => ({
    systemType,
    autonomyDays: Number(autonomyDays) || 1,
    reserveFactor: Number(reserveFactor) || 1.2,
    panelId: equipmentManualMode ? panelId : undefined,
    inverterId: equipmentManualMode ? inverterId : undefined,
    batteryId: equipmentManualMode ? batteryId : undefined,
    panelExtraFactor: Number(panelExtraFactor) || 1,
    inverterExtraFactor: Number(inverterExtraFactor) || 1,
    batteryExtraFactor: Number(batteryExtraFactor) || 1,
    manualMode: equipmentManualMode || parameterManualMode,
    equipmentManualMode,
    parameterManualMode
  }), [systemType, autonomyDays, reserveFactor, equipmentManualMode, parameterManualMode, panelId, inverterId, batteryId, panelExtraFactor, inverterExtraFactor, batteryExtraFactor]);

  const solarDesign = useMemo(() => runSolarAutoDesign({ load, environment, settings }), [load, environment, settings]);

  useEffect(() => {
    if (equipmentManualMode) return;
    setPanelId(SHIL_SOLAR_PANELS.find((p) => p.powerW === 620)?.id || solarDesign.panel.id);
    setInverterId(solarDesign.inverter.id);
    setBatteryId(solarDesign.battery.battery.id);
  }, [equipmentManualMode, solarDesign.panel.id, solarDesign.inverter.id, solarDesign.battery.battery.id]);

  useEffect(() => {
    if (!warning) return undefined;
    const timer = setTimeout(() => setWarning(""), 5200);
    return () => clearTimeout(timer);
  }, [warning]);

  useEffect(() => {
    try {
      localStorage.setItem("shil:solarSystemDesign:live", JSON.stringify(solarDesign));
      localStorage.setItem("shil:systemSettingsDraft:live", JSON.stringify({ domain: "solar", ...settings, design: solarDesign }));
      setLiveSaved(true);
      const timer = setTimeout(() => setLiveSaved(false), 900);
      return () => clearTimeout(timer);
    } catch {
      return undefined;
    }
  }, [solarDesign, settings]);

  const applySmart = () => {
    setEquipmentManualMode(false);
    setParameterManualMode(false);
    setPanelExtraFactor(1);
    setInverterExtraFactor(1);
    setBatteryExtraFactor(1);
    setPanelId(SHIL_SOLAR_PANELS.find((p) => p.powerW === 620)?.id || solarDesign.panel.id);
    setInverterId(solarDesign.inverter.id);
    setBatteryId(solarDesign.battery.battery.id);
  };

  const confirmSolar = () => {
    const finalDesign = { ...solarDesign, confirmedAt: new Date().toISOString(), confirmedWithWarnings: !solarDesign.valid };
    approveProjectStep("system");
    localStorage.setItem("shil:solarSystemDesign", JSON.stringify(finalDesign));
    localStorage.setItem("shil:systemSettingsDraft", JSON.stringify({ domain: "solar", ...settings, design: finalDesign }));
    if (!solarDesign.valid) {
      setWarning(solarDesign.nextBlockedReason || "Ù¾ÛŒÚ©Ø±Ø¨Ù†Ø¯ÛŒ Ø¨Ø§ Ù‡Ø´Ø¯Ø§Ø± Ø«Ø¨Øª Ø´Ø¯ Ùˆ Ø¯Ø± Ú†Ú©ÛŒØ¯Ù‡ Ù‚Ø§Ø¨Ù„ Ø¨Ø±Ø±Ø³ÛŒ Ø§Ø³Øª.");
    }
    navigate("/new-project/summary/solar");
  };

  const confirmEmergency = () => {
    approveProjectStep("system");
    localStorage.setItem("shil:systemSettingsDraft", JSON.stringify({ domain: "emergency", displayName: "Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ Ø¨Ø§ Ø§ÛŒÙ†ÙˆØ±ØªØ± Ùˆ Ø¨Ø§ØªØ±ÛŒ", calculationModel: "ups_like_battery_inverter" }));
    navigate("/new-project/summary/emergency");
  };

  if (emergency) {
    return (
      <EngineeringPageShell title="ØªÙ†Ø¸ÛŒÙ…Ø§Øª Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ">
        <section className="shil-card-stack">
          <div className="shil-section-card">
            <div className="shil-section-head"><h2>Ù¾ÛŒÚ©Ø±Ø¨Ù†Ø¯ÛŒ Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ</h2><span>Battery + Inverter Core</span></div>
            <p className="shil-muted-line">Ù…Ø³ÛŒØ± Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ Ø§Ø² Ù‡Ù…Ø§Ù† Ø¨Ø§Ù†Ú© Ø¨Ø§ØªØ±ÛŒ Ùˆ Ø§ÛŒÙ†ÙˆØ±ØªØ± Ø§Ø³ØªÙØ§Ø¯Ù‡ Ù…ÛŒâ€ŒÚ©Ù†Ø¯ Ùˆ Ø¯Ø± Ú†Ú©ÛŒØ¯Ù‡ Ù†Ù‡Ø§ÛŒÛŒ Ø«Ø¨Øª Ù…ÛŒâ€ŒØ´ÙˆØ¯.</p>
          </div>
          <button type="button" className="shil-primary-wide" onClick={confirmEmergency}>ØªØ£ÛŒÛŒØ¯ Ùˆ Ù…Ø´Ø§Ù‡Ø¯Ù‡ Ú†Ú©ÛŒØ¯Ù‡</button>
        </section>
      </EngineeringPageShell>
    );
  }

  return (
    <EngineeringPageShell title="Ù¾ÛŒÚ©Ø±Ø¨Ù†Ø¯ÛŒ ØªØ¬Ù‡ÛŒØ²Ø§Øª Ø³ÛŒØ³ØªÙ…">
      <section className="shil-card-stack shil-solar-config-page shil-system-final-page">
        <Toast message={warning} />

        <div className="shil-section-card shil-config-block">
          <div className="shil-section-head"><h2>Ú©Ù†ØªØ±Ù„ Ø·Ø±Ø§Ø­ÛŒ</h2><span>Ù†ÙˆØ¹ Ø§Ø¬Ø±Ø§ÛŒ Ø§ÛŒÙ†ÙˆØ±ØªØ± Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ</span></div>
          <DesignModeCards value={systemType} onChange={(nextType) => { setSystemType(nextType); setEquipmentManualMode(false); setWarning(`Ù…Ø¯Ù„ Ø·Ø±Ø§Ø­ÛŒ ${nextType === "offgrid" ? "Ø¢ÙÚ¯Ø±ÛŒØ¯" : nextType === "ongrid" ? "Ø¢Ù†Ú¯Ø±ÛŒØ¯" : "Ù‡ÛŒØ¨Ø±ÛŒØ¯"} Ø¯Ø± Ù…ÙˆØªÙˆØ± Ù…Ø­Ø§Ø³Ø¨Ø§Øª Ø§Ø¹Ù…Ø§Ù„ Ø´Ø¯.`); }} />
        </div>

        <div className="shil-section-card shil-config-block">
          <div className="shil-section-head"><h2>Ù¾Ø§Ø±Ø§Ù…ØªØ±Ù‡Ø§ÛŒ Ø§Ø«Ø±Ú¯Ø°Ø§Ø±</h2><span>{parameterManualMode ? "Ø­Ø§Ù„Øª Ø¯Ø³ØªÛŒ ÙØ¹Ø§Ù„" : "Ø§Ø¹Ù…Ø§Ù„ Ù‡ÙˆØ´Ù…Ù†Ø¯ ÙØ¹Ø§Ù„"}</span></div>
          <div className="shil-form-grid shil-param-grid">
            <label><span>Ø±ÙˆØ²Ù‡Ø§ÛŒ Ø®ÙˆØ¯Ú©ÙØ§ÛŒÛŒ</span><input type="number" min="1" max="7" value={autonomyDays} onChange={(e) => { setParameterManualMode(true); setAutonomyDays(e.target.value); }} /></label>
            <label><span>Ø¶Ø±ÛŒØ¨ Ø§Ø·Ù…ÛŒÙ†Ø§Ù† Ø§Ø³ØªØ§Ù†Ø¯Ø§Ø±Ø¯</span><input type="number" step="0.05" min="1" value={reserveFactor} onChange={(e) => { setParameterManualMode(true); setReserveFactor(e.target.value); }} /></label>
          </div>
          <div className="shil-action-row shil-smart-mode-row">
            <button type="button" className={!equipmentManualMode && !parameterManualMode ? "shil-soft-button active" : "shil-soft-button"} onClick={applySmart}>Ø§Ø¹Ù…Ø§Ù„ Ù‡ÙˆØ´Ù…Ù†Ø¯ SHIL</button>
            <button type="button" className={equipmentManualMode ? "shil-soft-button active" : "shil-soft-button"} onClick={() => setEquipmentManualMode(!equipmentManualMode)}>{equipmentManualMode ? "ÙˆØ±ÙˆØ¯ Ø¯Ø³ØªÛŒ ØªØ¬Ù‡ÛŒØ²Ø§Øª ÙØ¹Ø§Ù„" : "ÙˆØ±ÙˆØ¯ Ø¯Ø³ØªÛŒ ØªØ¬Ù‡ÛŒØ²Ø§Øª"}</button>
          </div>
          <p className="shil-muted-line">Ø¯Ø± Ø­Ø§Ù„Øª Ù¾ÛŒØ´â€ŒÙØ±Ø¶ØŒ Ø±ÙˆØ²Ù‡Ø§ÛŒ Ø®ÙˆØ¯Ú©ÙØ§ÛŒÛŒ Ùˆ Ø¶Ø±ÛŒØ¨ Ø§Ø·Ù…ÛŒÙ†Ø§Ù† Ø§Ø³ØªØ§Ù†Ø¯Ø§Ø±Ø¯ Ù…Ø³ØªÙ‚ÛŒÙ… Ø±ÙˆÛŒ Ù…ÙˆØªÙˆØ± Ù…Ø­Ø§Ø³Ø¨Ø§Øª ÙˆØ§Ø±Ù¾ Ù…ÛŒâ€ŒØ´ÙˆÙ†Ø¯Ø› Ø¨Ø§ ÙˆØ±ÙˆØ¯ Ø¹Ø¯Ø¯ Ø¬Ø¯ÛŒØ¯ØŒ Ù‡Ù…Ø§Ù† Ù„Ø­Ø¸Ù‡ Ø­Ø§Ù„Øª Ø¯Ø³ØªÛŒ Ù¾Ø§Ø±Ø§Ù…ØªØ± ÙØ¹Ø§Ù„ Ùˆ Ù…Ø­Ø§Ø³Ø¨Ø§Øª Ø¯ÙˆØ¨Ø§Ø±Ù‡ Ø§Ù†Ø¬Ø§Ù… Ù…ÛŒâ€ŒØ´ÙˆØ¯.</p>
          <p className="shil-muted-line">{liveSaved ? "Ø°Ø®ÛŒØ±Ù‡ Ùˆ Ø§ØªØµØ§Ù„ Ø²Ù†Ø¯Ù‡ Ø¨Ù‡ Ù…ÙˆØªÙˆØ± Ø§Ù†Ø¬Ø§Ù… Ø´Ø¯." : `Ù¾Ù†Ù„ Ù¾ÛŒØ´â€ŒÙØ±Ø¶ Ù…ÙˆØªÙˆØ±: ${solarDesign.panel.powerW} ÙˆØ§Øª`}</p>
        </div>

        <div className="shil-system-banks-grid shil-system-banks-grid-final">
          <BankSelect
            title="Ø¨Ø§Ù†Ú© Ø§ÛŒÙ†ÙˆØ±ØªØ± Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ"
            subtitle="1.6kW ØªØ§ 30kW"
            value={inverterId}
            extraFactor={inverterExtraFactor}
            onValue={(v) => { setEquipmentManualMode(true); setInverterId(v); }}
            onExtraFactor={(v) => { setEquipmentManualMode(true); setInverterExtraFactor(v); }}
            smartTitle={optionTitle(solarDesign.inverter)}
            items={SHIL_SOLAR_INVERTERS}
            smartValue={`${kw(solarDesign.inverter.ratedPowerW)} / ${solarDesign.inverter.dcVoltage}V`}
            renderMeta={(item) => <>{item?.ratedPowerW}W / ÙˆØ±ÙˆØ¯ÛŒ Ø¨Ø§ØªØ±ÛŒ {item?.dcVoltage}V / MPPT {item?.mpptMinV}-{item?.mpptMaxV}V / Ø³Ù‚Ù PV {item?.maxPvPowerW}W</>}
            renderReason={(item) => <>{item?.title} Ø²Ù…Ø§Ù†ÛŒ Ù…Ø¬Ø§Ø² Ø§Ø³Øª Ú©Ù‡ ØªÙˆØ§Ù† Ø¯Ø§Ø¦Ù…ØŒ ØªÙˆØ§Ù† Ù„Ø­Ø¸Ù‡â€ŒØ§ÛŒ Ùˆ Ø¨Ø§Ø²Ù‡ ÙˆÙ„ØªØ§Ú˜ Ø´Ù†Ø§ÙˆØ± Ø¨Ø§ØªØ±ÛŒ Ø¨Ø§ Ù†ÛŒØ§Ø² Ù…ØµØ±Ùâ€ŒÚ©Ù†Ù†Ø¯Ù‡ Ù‡Ù…Ø®ÙˆØ§Ù†ÛŒ Ø¯Ø§Ø´ØªÙ‡ Ø¨Ø§Ø´Ø¯.</>}
          />
          <BankSelect
            title="Ø¨Ø§Ù†Ú© Ø¨Ø§ØªØ±ÛŒ"
            subtitle="12V / 24V / 48V"
            value={batteryId}
            extraFactor={batteryExtraFactor}
            onValue={(v) => { setEquipmentManualMode(true); setBatteryId(v); }}
            onExtraFactor={(v) => { setEquipmentManualMode(true); setBatteryExtraFactor(v); }}
            smartTitle={solarDesign.battery.battery.title}
            items={SHIL_LITHIUM_BATTERIES}
            smartValue={`${solarDesign.battery.battery.nominalVoltage}V / ${faNumber(solarDesign.battery.totalCount)} Ø¹Ø¯Ø¯`}
            renderMeta={(item) => <>{item?.nominalVoltage}V / {item?.capacityAh}Ah / Ø¨Ø§Ø²Ù‡ Ø´Ù†Ø§ÙˆØ± {item?.minVoltage}-{item?.maxVoltage}V / Ø§Ù†Ø±Ú˜ÛŒ Ø®Ø§Ù… {item?.energyWh}Wh</>}
            renderReason={() => <>ÙˆÙ„ØªØ§Ú˜ Ø¨Ø§ØªØ±ÛŒ Ø¨Ù‡ ØµÙˆØ±Øª Ø´Ù†Ø§ÙˆØ± Ú©Ù†ØªØ±Ù„ Ù…ÛŒâ€ŒØ´ÙˆØ¯Ø› Ø¨Ø±Ø§ÛŒ Ø§ÛŒÙ†ÙˆØ±ØªØ± 12ØŒ 24 Ùˆ 48 ÙˆÙ„ØªØŒ Ø¨Ø§Ø²Ù‡ Ø¨Ø§ØªØ±ÛŒ Ù…Ø¹Ø§Ø¯Ù„ Ù‡Ù…Ø§Ù† ÙˆÙ„ØªØ§Ú˜ Ø¨Ø§ÛŒØ¯ Ø¯Ø§Ø®Ù„ Ù…Ø­Ø¯ÙˆØ¯Ù‡ Ù…Ø¬Ø§Ø² Ø§ÛŒÙ†ÙˆØ±ØªØ± Ø¨Ø§Ø´Ø¯.</>}
          />
          <BankSelect
            title="Ø¨Ø§Ù†Ú© Ù¾Ù†Ù„ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ"
            subtitle="Ù¾ÛŒØ´â€ŒÙØ±Ø¶ 620W / Ø¯Ø³ØªÛŒ ØªØ§ 700W"
            value={panelId}
            extraFactor={panelExtraFactor}
            onValue={(v) => { setEquipmentManualMode(true); setPanelId(v); }}
            onExtraFactor={(v) => { setEquipmentManualMode(true); setPanelExtraFactor(v); }}
            smartTitle={solarDesign.panel.title}
            items={SHIL_SOLAR_PANELS}
            smartValue={`${solarDesign.panel.powerW}W / ${faNumber(solarDesign.pvArray.panelCount)} Ø¹Ø¯Ø¯`}
            renderMeta={(item) => <>{item?.powerW}W / Vmp {item?.vmp}V / Voc {item?.voc}V / Ù…Ø³Ø§Ø­Øª ØªÙ‚Ø±ÛŒØ¨ÛŒ {item?.areaM2}mÂ²</>}
            renderReason={() => <>ØªØ¹Ø¯Ø§Ø¯ Ø³Ø±ÛŒ Ù¾Ù†Ù„â€ŒÙ‡Ø§ Ø·ÙˆØ±ÛŒ ØªØ¹ÛŒÛŒÙ† Ù…ÛŒâ€ŒØ´ÙˆØ¯ Ú©Ù‡ ÙˆÙ„ØªØ§Ú˜ Ø±Ø´ØªÙ‡ Ø¯Ø§Ø®Ù„ Ù…Ø­Ø¯ÙˆØ¯Ù‡ MPPT Ø§ÛŒÙ†ÙˆØ±ØªØ± Ø¨Ù…Ø§Ù†Ø¯ Ùˆ ØªØ¹Ø¯Ø§Ø¯ Ù…ÙˆØ§Ø²ÛŒ ØªÙˆØ§Ù† Ù…ÙˆØ±Ø¯ Ù†ÛŒØ§Ø² Ùˆ ØªÙˆØ³Ø¹Ù‡ Ø¢ÛŒÙ†Ø¯Ù‡ Ø±Ø§ Ù¾ÙˆØ´Ø´ Ø¯Ù‡Ø¯.</>}
          />
        </div>

        <div className="shil-section-card shil-auto-result-card shil-result-card-final">
          <div className="shil-section-head"><h2>Ù†ØªÛŒØ¬Ù‡ Ù¾ÛŒÚ©Ø±Ø¨Ù†Ø¯ÛŒ</h2><span>{solarDesign.valid ? "Ù‚Ø§Ø¨Ù„ ØªØ£ÛŒÛŒØ¯" : "Ù†ÛŒØ§Ø²Ù…Ù†Ø¯ Ø§ØµÙ„Ø§Ø­"}</span></div>
          <ResultTable design={solarDesign} />
          {solarDesign.warnings.map((item) => <div key={item} className="shil-inline-warning">{item}</div>)}
          <ConfigurationLinkedDetails design={solarDesign} />
        </div>

        <button type="button" className="shil-primary-wide shil-confirm-config-button shil-system-confirm-footer" onClick={confirmSolar}>ØªØ£ÛŒÛŒØ¯ Ù¾ÛŒÚ©Ø±Ø¨Ù†Ø¯ÛŒ Ùˆ Ø±ÙØªÙ† Ø¨Ù‡ Ú†Ú©ÛŒØ¯Ù‡</button>
      </section>
    </EngineeringPageShell>
  );
}


