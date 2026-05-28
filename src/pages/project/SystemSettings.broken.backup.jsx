import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import EngineeringPageShell from "../../components/EngineeringPageShell.jsx";
import { approveProjectStep } from "../../workflow/projectWorkflow.js";
import { runSurfacePvPreview as runUnifiedPvForUi, pvPreviewToLegacyDesign as unifiedPvToLegacyDesign } from "../../calculationGateway/surfacePreviewData.js";
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
const mw = (w) => `${faNumber(Math.round(Number(w || 0) / 10000) / 100)} Ù…Ú¯Ø§ÙˆØ§Øª`;
const normalizePersianInput = (value) => String(value ?? "")
  .replace(/[Û°-Û¹]/g, (d) => "Û°Û±Û²Û³Û´ÛµÛ¶Û·Û¸Û¹".indexOf(d))
  .replace(/[Ù -Ù©]/g, (d) => "Ù Ù¡Ù¢Ù£Ù¤Ù¥Ù¦Ù§Ù¨Ù©".indexOf(d))
  .replace(/Ù«/g, ".")
  .replace(/Ù¬|,/g, "")
  .trim();
const toNumber = (value, fallback = 0) => {
  const n = Number(normalizePersianInput(value));
  return Number.isFinite(n) ? n : fallback;
};


function batterySpecText(bank = {}) {
  const b = bank.battery || {};
  const count = bank.totalCount || bank.count || "-";
  const voltage = bank.unitVoltageV || bank.voltageV || b.nominalVoltage || b.voltageV || "-";
  const ah = bank.unitCapacityAh || bank.capacityAh || b.capacityAh || "-";
  const unitKWh = bank.unitEnergyKWh || (voltage !== "-" && ah !== "-" ? Math.round((Number(voltage) * Number(ah)) / 10) / 100 : "-");
  const totalKWh = bank.grossEnergyKWh || (bank.grossEnergyWh ? Math.round(bank.grossEnergyWh / 10) / 100 : "-");
  return `${count} Ø¹Ø¯Ø¯ / ${voltage}V / ${ah}Ah / ${unitKWh}kWh Ù‡Ø± Ø¨Ø§ØªØ±ÛŒ / ${totalKWh}kWh Ú©Ù„`;
}

function batteryNoteText(bank = {}) {
  const series = bank.seriesCount || "-";
  const parallel = bank.parallelCount || "-";
  const bankVoltage = bank.bankVoltageV || "-";
  const bankAh = bank.bankCurrentAh || bank.installedAh || "-";
  const branchCurrent = bank.branchCurrentA ? ` / Ø¬Ø±ÛŒØ§Ù† Ø´Ø§Ø®Ù‡ ${bank.branchCurrentA}A` : "";
  return `${series} Ø³Ø±ÛŒ Ã— ${parallel} Ù…ÙˆØ§Ø²ÛŒ / ÙˆÙ„ØªØ§Ú˜ Ø¨Ø§Ù†Ú© ${bankVoltage}V / Ø¸Ø±ÙÛŒØª Ø¬Ø±ÛŒØ§Ù† ${bankAh}Ah${branchCurrent}`;
}

function DetailsToggle({ title, children, defaultOpen = false, attached = false }) {
  const [open, setOpen] = React.useState(defaultOpen);
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

function BankSelect({ title, subtitle, value, onValue, items, renderMeta, renderReason, smartValue, smartTitle }) {
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
      value: `${design.battery.battery.title} / ${batterySpecText(design.battery)}`,
      details: [
        `Ø±ÙˆØ² Ø®ÙˆØ¯Ú©ÙØ§ÛŒÛŒ ${design.settings.autonomyDays} Ø±ÙˆØ² Ø§Ø³Øª Ùˆ Ù…Ø³ØªÙ‚ÛŒÙ… Ø±ÙˆÛŒ ØªØ¹Ø¯Ø§Ø¯ Ø¨Ø§ØªØ±ÛŒ Ø§Ø«Ø± Ù…ÛŒâ€ŒÚ¯Ø°Ø§Ø±Ø¯.`,
        `Ù…Ø´Ø®ØµØ§Øª Ú©Ø§Ù…Ù„ Ø¨Ø§ØªØ±ÛŒ: ${batterySpecText(design.battery)}.`,
        `Ø³Ø§Ø®ØªØ§Ø± Ø§Ø² Ø¬Ø¯ÙˆÙ„ Ù†ØªÛŒØ¬Ù‡: ${batteryNoteText(design.battery)}.`,
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

function SolarPanelPowerResultTable({ design, solarPanelPowerInput = {}, batteryScope = "none", unifiedPvResult = null }) {
  const input = solarPanelPowerInput || {};
  const rawDaily = input.rawDailyEnergyKWh || (input.totalPanelPowerW && input.psh ? Math.round((input.totalPanelPowerW / 1000) * input.psh * 100) / 100 : null);
  const usableDaily = input.generatedDailyKWh || input.usableDailyEnergyKWh || design.panelPowerAnalysis?.array?.dailyEnergyKWh || design.solarSizing?.ePvDailyKWh;
  const panelDistribution = Array.isArray(input.inverterPanelDistribution) && input.inverterPanelDistribution.length
    ? input.inverterPanelDistribution.join(" / ")
    : (design.inverterTopology?.panelDistribution || []).join(" / ");
  const inputPanelCount = toNumber(input.panelCount, design.pvArray?.panelCount || 0);
  const inputPanelPowerW = toNumber(input.panelPowerW || design.panel?.powerW, design.panel?.powerW || 0);
  const inputTotalPowerW = toNumber(input.totalPanelPowerW, inputPanelCount * inputPanelPowerW || design.pvArray?.arrayPowerW || 0);
  const effectivePowerW = toNumber(input.effectivePanelPowerW, inputTotalPowerW * Math.max(0, Math.min(1, (100 - toNumber(input.lossPercent, 0)) / 100)));
  const s = unifiedPvResult?.summary?.important_results || {};
  const rows = [
    ["Ø±ÙˆØ´ Ù…Ø­Ø§Ø³Ø¨Ø§Øª", unifiedPvResult?.summary?.title_fa || METHOD_TITLE_MAP[design?.settings?.calculationMethod] || "Ù…ÙˆØªÙˆØ± ÛŒÚ©Ù¾Ø§Ø±Ú†Ù‡ PV"],
    ["ØªÙˆØ§Ù† Ù¾Ù†Ù„", `${faNumber(s.panel_power_W || inputPanelPowerW || design.panel?.powerW)} W`],
    ["ØªÙˆØ§Ù† Ù…Ø¬Ù…ÙˆØ¹Ù‡ Ù¾Ù†Ù„â€ŒÙ‡Ø§", `${faNumber(s.panel_array_power_W || inputTotalPowerW)} W`],
    ["ØªÙˆØ§Ù† Ù…ÙˆØ«Ø± Ù¾Ø³ Ø§Ø² ØªÙ„ÙØ§Øª", `${faNumber(s.effective_power_after_losses_W || effectivePowerW)} W`],
    ["Ø¶Ø±ÛŒØ¨ Ø±Ø§Ù‡â€ŒØ§Ù†Ø¯Ø§Ø²ÛŒ", `${design.settings.reserveFactor || 1.2}`],
    ["ØªÙˆØ§Ù† Ù†Ù‡Ø§ÛŒÛŒ Ø·Ø±Ø§Ø­ÛŒ", `${faNumber(s.final_design_power_W || design.design.designPowerW)} W`],
    ["ØªÙˆØ§Ù† Ø§ÛŒÙ†ÙˆØ±ØªØ± Ø§Ø¹Ù…Ø§Ù„ Ø´Ø¯Ù‡ Ø¯Ø± Ø¨Ø§Ù†Ú©", `${faNumber(s.inverter_power_W || design.inverter?.ratedPowerW)} W`],
    ["ØªØ¹Ø¯Ø§Ø¯ Ø§ÛŒÙ†ÙˆØ±ØªØ± Ù…Ø´Ø®Øµ Ø´Ø¯Ù‡", `${faNumber(s.inverter_count || design.inverter?.count || 1)} Ø¹Ø¯Ø¯`],
    ["ØªÙˆÙ„ÛŒØ¯ Ø®Ø§Ù… Ø±ÙˆØ²Ø§Ù†Ù‡", s.raw_daily_production_Wh ? `${Math.round(s.raw_daily_production_Wh / 100) / 10} kWh` : (rawDaily ? `${rawDaily} kWh` : "-")],
    ["ØªÙˆÙ„ÛŒØ¯ ÙˆØ§Ù‚Ø¹ÛŒ Ø¨Ø§ ØªÙ„ÙØ§Øª", s.real_daily_production_Wh ? `${Math.round(s.real_daily_production_Wh / 100) / 10} kWh` : (usableDaily ? `${usableDaily} kWh` : "-")],
    ["Ø¨Ø§ØªØ±ÛŒ Ø§Ø¹Ù…Ø§Ù„ Ø´Ø¯Ù‡ Ù¾ÛŒØ´ ÙØ±Ø¶ Ø¨Ø§Ù†Ú©", s.default_battery || design.battery?.battery?.title || "-"],
    ["Ø±ÙˆØ²Ù‡Ø§ÛŒ Ø®ÙˆØ¯Ú©ÙØ§ÛŒÛŒ", `${faNumber(s.autonomy_days || design.settings?.autonomyDays || 0)} Ø±ÙˆØ²`],
    ["Ø¨Ø§ØªØ±ÛŒ Ø§Ø¹Ù…Ø§Ù„ Ø´Ø¯Ù‡ Ù…ØªÙ†Ø§Ø³Ø¨ Ø¨Ø§ Ø±ÙˆØ²Ù‡Ø§ÛŒ Ø®ÙˆØ¯Ú©ÙØ§ÛŒÛŒ", `${faNumber(s.battery_count_for_autonomy || design.battery?.totalCount || 0)} Ø¹Ø¯Ø¯`],
  ];

  return <ResultTableFrame rows={rows} ariaLabel="Ù†ØªÛŒØ¬Ù‡ Ù¾ÛŒÚ©Ø±Ø¨Ù†Ø¯ÛŒ Ù…Ø³ÛŒØ± ØªÙˆØ§Ù† Ù¾Ù†Ù„ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ" />;
}

function GeneralLoadResultTable({ load = {}, design = {} }) {
  const rows = [
    ["Ø±ÙˆØ´ Ù…Ø­Ø§Ø³Ø¨Ø§Øª", METHOD_TITLE_MAP[load.method] || "Ù„ÛŒØ³Øª ØªØ¬Ù‡ÛŒØ²Ø§Øª"],
    ["ØªØ¹Ø¯Ø§Ø¯ ØªØ¬Ù‡ÛŒØ²Ø§Øª", load.selectedCount ? `${faNumber(load.selectedCount)} Ù…ÙˆØ±Ø¯` : "Ø¨Ø¯ÙˆÙ† ØªØ¬Ù‡ÛŒØ² Ø§Ù†ØªØ®Ø§Ø¨ÛŒ / Ø³Ù†Ø§Ø±ÛŒÙˆÛŒ Ø¢Ù…Ø§Ø¯Ù‡"],
    ["ØªÙˆØ§Ù† Ú©Ù„ Ù…ØµØ±ÙÛŒ", `${faNumber(load.totalPowerW || 0)} W`],
    ["Ø§Ù†Ø±Ú˜ÛŒ Ø±ÙˆØ²Ø§Ù†Ù‡", `${load.totalEnergyKWh || 0} kWh`],
    ["Ø¬Ø±ÛŒØ§Ù† AC", `${load.acCurrentA || load.totalCurrentA || 0} A`],
    ["Ø¬Ø±ÛŒØ§Ù† Ø±Ø§Ù‡â€ŒØ§Ù†Ø¯Ø§Ø²ÛŒ", `${load.startCurrentA || 0} A`],
    ["Ù¾ÛŒÚ© Ø§Ø³ØªØ§Ø±Øª", `${faNumber(load.surgePowerW || 0)} W`],
    ["Ù…Ø³ÛŒØ± AC", load.phaseAC === "three" ? "Û³Û¸Û° ÙˆÙ„Øª Ø³Ù‡â€ŒÙØ§Ø²" : `${faNumber(load.voltageAC || 220)} ÙˆÙ„Øª ØªÚ©â€ŒÙØ§Ø²`],
    ["Ø§ÛŒÙ†ÙˆØ±ØªØ± Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯ÛŒ", `${faNumber(load.recommendedInverterW || design.inverter?.ratedPowerW || 0)} W`],
  ];
  return <ResultTableFrame rows={rows} ariaLabel="Ù†ØªÛŒØ¬Ù‡ Ù¾ÛŒÚ©Ø±Ø¨Ù†Ø¯ÛŒ Ø¹Ù…ÙˆÙ…ÛŒ Ø¨Ø§Ø±" />;
}

function ResultTableFrame({ rows, ariaLabel }) {
  return (
    <div className="shil-result-table shil-result-table-final" role="table" aria-label={ariaLabel}>
      <div className="shil-result-row shil-result-header" role="row">
        <span>Ø¨Ø®Ø´</span>
        <strong>Ù†ØªÛŒØ¬Ù‡ Ù†Ù‡Ø§ÛŒÛŒ</strong>
      </div>
      {rows.map(([name, value]) => (
        <div className="shil-result-row" role="row" key={name}>
          <span>{name}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

const METHOD_TITLE_MAP = {
  equipment: "Ù„ÛŒØ³Øª ØªØ¬Ù‡ÛŒØ²Ø§Øª",
  profile: "Ù¾Ø±ÙˆÙØ§ÛŒÙ„ Ù…ØµØ±Ù",
  energy: "Ø§Ù†Ø±Ú˜ÛŒ Ø±ÙˆØ²Ø§Ù†Ù‡",
  power: "ØªÙˆØ§Ù† Ú©Ù„",
  current: "Ø¬Ø±ÛŒØ§Ù† Ú©Ù„",
  solar_panel_power: "ØªÙˆØ§Ù† Ù¾Ù†Ù„ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ",
};

function PanelPowerProCard({ design }) {
  const analysis = design.panelPowerAnalysis || {};
  const array = analysis.array || {};
  const electrical = analysis.electrical || {};
  const physical = analysis.physical || {};
  const checks = analysis.checks || [];
  const recommendations = analysis.recommendations || [];
  const statusLabel = analysis.status === "error" ? "Ù†ÛŒØ§Ø²Ù…Ù†Ø¯ Ø§ØµÙ„Ø§Ø­" : analysis.status === "warning" ? "Ø¯Ø§Ø±Ø§ÛŒ Ù‡Ø´Ø¯Ø§Ø±" : "Ú©Ø§Ù…Ù„";

  return (
    <div className="shil-section-card shil-config-block shil-panel-power-pro-card">
      <div className="shil-section-head">
        <h2>ØªÙˆØ§Ù† Ù¾Ù†Ù„ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ</h2>
        <span>{statusLabel} / Ø§Ù…ØªÛŒØ§Ø² {faNumber(analysis.score || 0)} Ø§Ø² Û±Û°Û°</span>
      </div>

      <div className="shil-summary-grid shil-solar-sizing-preview">
        <div><span>ØªÙˆØ§Ù† Ù‡Ø± Ù¾Ù†Ù„</span><strong>{faNumber(design.panel.powerW)} W</strong></div>
        <div><span>ØªØ¹Ø¯Ø§Ø¯ Ù¾Ù†Ù„</span><strong>{faNumber(design.pvArray.panelCount)} Ø¹Ø¯Ø¯</strong></div>
        <div><span>ØªÙˆØ§Ù† Ù¾ÛŒÚ© DC</span><strong>{array.powerKW || design.solarSizing?.pArrayKW || "-"} kW</strong></div>
        <div><span>ØªÙˆÙ„ÛŒØ¯ Ø±ÙˆØ²Ø§Ù†Ù‡</span><strong>{array.dailyEnergyKWh || design.solarSizing?.ePvDailyKWh || "-"} kWh</strong></div>
        <div><span>Ù¾ÙˆØ´Ø´ Ù…ØµØ±Ù</span><strong>{array.coveragePercent ? `${array.coveragePercent}%` : "Ù†Ø§Ù…Ø´Ø®Øµ"}</strong></div>
        <div><span>Ø±Ø§Ù†Ø¯Ù…Ø§Ù† Ù…Ø¤Ø«Ø±</span><strong>{Math.round((analysis.input?.effectiveEfficiency || 0) * 100)}%</strong></div>
      </div>

      <DetailsToggle title="Ø¬Ø²Ø¦ÛŒØ§Øª Ú©Ø§Ù…Ù„ Ù…Ù‡Ù†Ø¯Ø³ÛŒ ØªÙˆØ§Ù† Ù¾Ù†Ù„" defaultOpen>
        <div className="shil-linked-details-grid">
          <div className="shil-linked-detail-card">
            <div className="shil-linked-detail-head"><span>Ø¢Ø±Ø§ÛŒØ´ Ø§Ù„Ú©ØªØ±ÛŒÚ©ÛŒ</span><strong>{faNumber(design.pvArray.seriesCount)} Ø³Ø±ÛŒ Ã— {faNumber(design.pvArray.parallelCount)} Ù…ÙˆØ§Ø²ÛŒ</strong></div>
            <ul>
              <li>Vmp Ù†Ø§Ù…ÛŒ Ø±Ø´ØªÙ‡: {electrical.stringVmp || "-"}V</li>
              <li>Vmp Ú¯Ø±Ù… Ø±Ø´ØªÙ‡: {electrical.hotStringVmp || "-"}V</li>
              <li>Voc Ø³Ø±Ø¯ Ø±Ø´ØªÙ‡: {electrical.coldStringVoc || "-"}V</li>
              <li>Ø¬Ø±ÛŒØ§Ù† Ø¢Ø±Ø§ÛŒÙ‡: Imp {electrical.arrayImp || "-"}A / Isc {electrical.arrayIsc || "-"}A</li>
            </ul>
          </div>
          <div className="shil-linked-detail-card">
            <div className="shil-linked-detail-head"><span>MPPT Ùˆ ÙˆØ±ÙˆØ¯ÛŒ PV</span><strong>{electrical.mpptMinV || "-"} ØªØ§ {electrical.mpptMaxV || "-"}V</strong></div>
            <ul>
              <li>Ø³Ù‚Ù ÙˆÙ„ØªØ§Ú˜ DC: {electrical.maxDcVoltage || "-"}V</li>
              <li>Ø³Ù‚Ù ØªÙˆØ§Ù† PV Ø§ÛŒÙ†ÙˆØ±ØªØ±Ù‡Ø§: {faNumber(electrical.maxPvPowerW || 0)}W</li>
              <li>Ù†Ø³Ø¨Øª ØªÙˆØ§Ù† Ø¢Ø±Ø§ÛŒÙ‡ Ø¨Ù‡ ÙˆØ±ÙˆØ¯ÛŒ PV: {electrical.pvInputPowerRatio ? `${Math.round(electrical.pvInputPowerRatio * 100)}%` : "Ø«Ø¨Øª Ù†Ø´Ø¯Ù‡"}</li>
            </ul>
          </div>
          <div className="shil-linked-detail-card">
            <div className="shil-linked-detail-head"><span>ÙØ¶Ø§ Ùˆ Ú†Ú¯Ø§Ù„ÛŒ ØªÙˆØ§Ù†</span><strong>{physical.maintenanceAreaM2 || design.space?.maintenanceAreaM2 || "-"} mÂ²</strong></div>
            <ul>
              <li>Ù…Ø³Ø§Ø­Øª Ø®Ø§Ù„Øµ Ø¢Ø±Ø§ÛŒÙ‡: {physical.arrayAreaM2 || "-"} mÂ²</li>
              <li>Ú†Ú¯Ø§Ù„ÛŒ ØªÙˆØ§Ù† Ù¾Ù†Ù„: {physical.powerDensityWm2 || "-"} W/mÂ²</li>
              <li>Ø±Ø§Ù†Ø¯Ù…Ø§Ù† ØªÙ‚Ø±ÛŒØ¨ÛŒ Ù…Ø§Ú˜ÙˆÙ„: {physical.moduleEfficiencyPercent || "-"}%</li>
            </ul>
          </div>
          <div className="shil-linked-detail-card">
            <div className="shil-linked-detail-head"><span>Ù‡Ø¯Ù Ù¾ÙˆØ´Ø´ Ù…ØµØ±Ù</span><strong>{array.targetPanelCount100 ? `${faNumber(array.targetPanelCount100)} Ù¾Ù†Ù„` : "Ù†ÛŒØ§Ø²Ù…Ù†Ø¯ Ù…ØµØ±Ù"}</strong></div>
            <ul>
              <li>ØªØ¹Ø¯Ø§Ø¯ Ù„Ø§Ø²Ù… Ø¨Ø±Ø§ÛŒ Ù¾ÙˆØ´Ø´ Û±Û°Û°Ùª: {array.targetPanelCount100 ? faNumber(array.targetPanelCount100) : "-"}</li>
              <li>ØªØ¹Ø¯Ø§Ø¯ Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯ÛŒ Ø¨Ø§ Ø­Ø§Ø´ÛŒÙ‡ Û²Û°Ùª: {array.targetPanelCount120 ? faNumber(array.targetPanelCount120) : "-"}</li>
              <li>Ú©Ù…Ø¨ÙˆØ¯ Ù¾Ù†Ù„ Ø¨Ø±Ø§ÛŒ Ù¾ÙˆØ´Ø´ Ú©Ø§Ù…Ù„: {faNumber(array.requiredAdditionalPanelsFor100 || 0)} Ø¹Ø¯Ø¯</li>
            </ul>
          </div>
        </div>
      </DetailsToggle>

      <DetailsToggle title="Ú©Ù†ØªØ±Ù„â€ŒÙ‡Ø§ÛŒ Ø§Ø¹ØªØ¨Ø§Ø±Ø³Ù†Ø¬ÛŒ ØªÙˆØ§Ù† Ù¾Ù†Ù„">
        <div className="shil-linked-details-grid">
          {checks.map((item) => (
            <div key={item.code} className="shil-linked-detail-card">
              <div className="shil-linked-detail-head"><span>{item.title}</span><strong>{item.ok ? "ØªØ£ÛŒÛŒØ¯" : item.level === "error" ? "Ø®Ø·Ø§" : item.level === "warning" ? "Ù‡Ø´Ø¯Ø§Ø±" : "Ø§Ø·Ù„Ø§Ø¹"}</strong></div>
              <ul>
                <li>{item.message}</li>
                {!item.ok && item.fix ? <li>{item.fix}</li> : null}
              </ul>
            </div>
          ))}
        </div>
      </DetailsToggle>

      <div className="shil-expert-box shil-linked-protection-report">
        {recommendations.map((item) => <div key={item}><span>Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯ Ù…Ù‡Ù†Ø¯Ø³ÛŒ</span><strong>{item}</strong></div>)}
      </div>
    </div>
  );
}


function InverterMpptTopologyCard({ design, mpptCount, onMpptCount, enabled }) {
  const topology = design.inverterTopology || {};
  if (!enabled) return null;
  return (
    <div className="shil-section-card shil-config-block shil-inverter-mppt-card">
      <div className="shil-section-head">
        <h2>ØªÙ‚Ø³ÛŒÙ… Ø§ÛŒÙ†ÙˆØ±ØªØ± Ùˆ MPPT</h2>
        <span>{topology.inverterCount || design.inverter?.count || 1} Ø§ÛŒÙ†ÙˆØ±ØªØ± / {topology.totalMppt || 1} MPPT</span>
      </div>
      <div className="shil-form-grid shil-param-grid">
        <label><span>ØªØ¹Ø¯Ø§Ø¯ MPPT Ù‡Ø± Ø§ÛŒÙ†ÙˆØ±ØªØ±</span><input type="number" min="1" max="12" value={mpptCount} onChange={(e) => onMpptCount(e.target.value)} /></label>
      </div>
      <div className="shil-summary-grid shil-solar-sizing-preview">
        <div><span>Ø³Ù‡Ù… ØªÙˆØ§Ù† Ù‡Ø± Ø§ÛŒÙ†ÙˆØ±ØªØ±</span><strong>{topology.pvPowerPerInverterKW || "-"} kW</strong></div>
        <div><span>Ù¾Ù†Ù„ ØªÙ‚Ø±ÛŒØ¨ÛŒ Ù‡Ø± Ø§ÛŒÙ†ÙˆØ±ØªØ±</span><strong>{faNumber(topology.panelsPerInverter || 0)} Ø¹Ø¯Ø¯</strong></div>
        <div><span>Ø±Ø´ØªÙ‡ Ù‡Ø± Ø§ÛŒÙ†ÙˆØ±ØªØ±</span><strong>{faNumber(topology.stringsPerInverter || 0)} Ø±Ø´ØªÙ‡</strong></div>
        <div><span>Ø±Ø´ØªÙ‡ Ù‡Ø± MPPT</span><strong>{faNumber(topology.stringsPerMppt || 0)} Ø±Ø´ØªÙ‡</strong></div>
        <div><span>Ø¬Ø±ÛŒØ§Ù† Ù‡Ø± MPPT</span><strong>{topology.mpptCurrentA || "-"} A</strong></div>
        <div><span>Ø¨Ø±ÛŒÚ©Ø± AC Ù‡Ø± Ø§ÛŒÙ†ÙˆØ±ØªØ±</span><strong>{topology.protectionPerInverter?.acBreakerA || "-"} A</strong></div>
      </div>
      {topology.rows?.length ? (
        <DetailsToggle title="Ø¬Ø¯ÙˆÙ„ ØªÙ‚Ø³ÛŒÙ… Ù¾Ù†Ù„â€ŒÙ‡Ø§ Ø¨ÛŒÙ† Ø§ÛŒÙ†ÙˆØ±ØªØ± Ùˆ MPPT" attached>
          <div className="shil-result-table shil-result-table-final" role="table" aria-label="ØªÙ‚Ø³ÛŒÙ… MPPT">
            <div className="shil-result-row shil-result-header" role="row"><span>Ø§ÛŒÙ†ÙˆØ±ØªØ±</span><strong>ØªÙ‚Ø³ÛŒÙ… Ù¾Ù†Ù„ Ùˆ ØªÙˆØ§Ù†</strong><small>MPPT Ùˆ Ø­ÙØ§Ø¸Øª</small></div>
            {topology.rows.map((row) => (
              <div className="shil-result-row" role="row" key={row.inverterNo}>
                <span>Ø§ÛŒÙ†ÙˆØ±ØªØ± {faNumber(row.inverterNo)}</span>
                <strong>{faNumber(row.panelsApprox)} Ù¾Ù†Ù„ / {row.pvPowerKW}kW</strong>
                <small>{faNumber(row.mpptCount)} MPPT / Ø­Ø¯ÙˆØ¯ {faNumber(row.stringsApprox)} Ø±Ø´ØªÙ‡ / Ø¨Ø±ÛŒÚ©Ø± AC {topology.protectionPerInverter?.acBreakerA || "-"}A</small>
              </div>
            ))}
          </div>
          <div className="shil-expert-box">
            {(topology.notes || []).map((note) => <div key={note}><span>MPPT</span><strong>{note}</strong></div>)}
          </div>
        </DetailsToggle>
      ) : null}
    </div>
  );
}

export default function SystemSettings() {
  const { domain: routeDomain } = useParams();
  const navigate = useNavigate();
  const storedDomain = localStorage.getItem("shil:calculationDomain") || "";
  const domain = routeDomain || storedDomain || "solar";
  const emergency = domain === "emergency";
  const utilityGateway = domain === "utility";
  const load = React.useMemo(() => readDraft("shil:loadEngineResult", {}), []);
  const environment = React.useMemo(() => readDraft("shil:environmentDraft", {}), []);
  const solarPanelPowerDraft = React.useMemo(() => readDraft("shil:solarPanelPowerInput", {}), []);
  const calculationMethod = localStorage.getItem("shil:calculationMethod") || "";
  const isSolarPanelPowerRoute = calculationMethod === "solar_panel_power";
  const solarPanelPowerInput = isSolarPanelPowerRoute ? solarPanelPowerDraft : {};

  const [systemType, setSystemType] = React.useState("offgrid");
  const [autonomyDays, setAutonomyDays] = React.useState(isSolarPanelPowerRoute ? 0 : 1);
  const [reserveFactor, setReserveFactor] = React.useState(1.2);
  const [batteryRequired, setBatteryRequired] = React.useState(!isSolarPanelPowerRoute);
  const [batteryScope, setBatteryScope] = React.useState("none");
  const [equipmentManualMode, setEquipmentManualMode] = React.useState(false);
  const [parameterManualMode, setParameterManualMode] = React.useState(false);
  const [panelId, setPanelId] = React.useState(SHIL_SOLAR_PANELS.find((p) => p.powerW === 620)?.id || SHIL_SOLAR_PANELS[0]?.id || "");
  const [inverterId, setInverterId] = React.useState(SHIL_SOLAR_INVERTERS.find((i) => i.ratedPowerW >= 5000)?.id || SHIL_SOLAR_INVERTERS[0]?.id || "");
  const [batteryId, setBatteryId] = React.useState(SHIL_LITHIUM_BATTERIES.find((b) => b.nominalVoltage === 48 && b.capacityAh === 200)?.id || SHIL_LITHIUM_BATTERIES[0]?.id || "");
  const [panelExtraFactor, setPanelExtraFactor] = React.useState(1);
  const [liveSaved, setLiveSaved] = React.useState(false);
  const [inverterExtraFactor, setInverterExtraFactor] = React.useState(1);
  const [batteryExtraFactor, setBatteryExtraFactor] = React.useState(1);
  const [projectScale, setProjectScale] = React.useState(() => domain === "utility" ? (localStorage.getItem("shil:projectScale") || "utility") : "auto");
  const [targetPlantPowerMW, setTargetPlantPowerMW] = React.useState("");
  const [powerBlockSizeKW, setPowerBlockSizeKW] = React.useState("");
  const [mvVoltageKV, setMvVoltageKV] = React.useState("");
  const [blockStationMW, setBlockStationMW] = React.useState("");
  const [exportLimitMW, setExportLimitMW] = React.useState("");
  const [groundCoverageRatio, setGroundCoverageRatio] = React.useState("");
  const [trackerMode, setTrackerMode] = React.useState("auto");
  const [terrainSlopeDeg, setTerrainSlopeDeg] = React.useState("");
  const [usableLandPercent, setUsableLandPercent] = React.useState("");
  const [gridShortCircuitMVA, setGridShortCircuitMVA] = React.useState("");
  const [estimatedMvFaultKA, setEstimatedMvFaultKA] = React.useState("");
  const [plantAvailabilityPercent, setPlantAvailabilityPercent] = React.useState("");
  const [annualDegradationPercent, setAnnualDegradationPercent] = React.useState("");
  const [mpptCountPerInverter, setMpptCountPerInverter] = React.useState("1");
  const [warning, setWarning] = React.useState("");

  const saveSystemDraftOnly = () => {
    try {
      localStorage.setItem("shil:systemSettingsDraft", JSON.stringify({ domain, ...settings, savedAt: new Date().toISOString() }));
      setWarning("Ù¾ÛŒØ´â€ŒÙ†ÙˆÛŒØ³ ØªÙ†Ø¸ÛŒÙ…Ø§Øª Ø³ÛŒØ³ØªÙ… Ø°Ø®ÛŒØ±Ù‡ Ø´Ø¯.");
    } catch {
      setWarning("Ø°Ø®ÛŒØ±Ù‡ Ù¾ÛŒØ´â€ŒÙ†ÙˆÛŒØ³ Ø§Ù†Ø¬Ø§Ù… Ù†Ø´Ø¯Ø› Ø­Ø§ÙØ¸Ù‡ Ù…Ø±ÙˆØ±Ú¯Ø± Ø±Ø§ Ø¨Ø±Ø±Ø³ÛŒ Ú©Ù†ÛŒØ¯.");
    }
  };

  const goPreviousFromSystem = () => {
    if (emergency) {
      navigate("/new-project/emergency?domain=emergency&from=system");
      return;
    }
    if (utilityGateway) {
      navigate("/new-project/path?from=system&gateway=utility");
      return;
    }
    navigate(`/new-project/inputs/${domain || "solar"}?from=system`);
  };

  const activeCalculationMethod = localStorage.getItem("shil:calculationMethod") || (isSolarPanelPowerRoute ? "solar_panel_power" : "equipment");

  const settings = React.useMemo(() => ({
    systemType,
    method: activeCalculationMethod,
    calculationMethod: activeCalculationMethod,
    autonomyDays: toNumber(autonomyDays, isSolarPanelPowerRoute ? 0 : 1),
    reserveFactor: toNumber(reserveFactor, 1.2),
    panelId: equipmentManualMode ? panelId : (isSolarPanelPowerRoute ? (solarPanelPowerInput?.selectedPanelId || undefined) : undefined),
    inverterId: equipmentManualMode ? inverterId : undefined,
    batteryId: equipmentManualMode ? batteryId : (isSolarPanelPowerRoute ? (solarPanelPowerInput?.batteryId || undefined) : undefined),
    panelCount: isSolarPanelPowerRoute ? (toNumber(solarPanelPowerInput?.panelCount, 0) || undefined) : undefined,
    inverterCount: isSolarPanelPowerRoute ? (toNumber(solarPanelPowerInput?.inverterSplitCount, 0) || undefined) : undefined,
    outputAcVoltage: toNumber((isSolarPanelPowerRoute ? solarPanelPowerInput?.acVoltageRoute : null) || load?.voltageAC || 220, 220),
    outputPhase: toNumber((isSolarPanelPowerRoute ? solarPanelPowerInput?.acVoltageRoute : null) || load?.voltageAC || 220, 220) >= 380 ? "three" : "single",
    batteryRequired: isSolarPanelPowerRoute ? toNumber(autonomyDays, 0) > 0 : Boolean(batteryRequired),
    batteryScope,
    inverterPanelDistribution: isSolarPanelPowerRoute && Array.isArray(solarPanelPowerInput?.inverterPanelDistribution) ? solarPanelPowerInput.inverterPanelDistribution : undefined,
    mpptCountPerInverter: Math.max(1, Math.round(toNumber(mpptCountPerInverter, 1))),
    panelExtraFactor: isSolarPanelPowerRoute ? 1 : toNumber(panelExtraFactor, 1),
    inverterExtraFactor: isSolarPanelPowerRoute ? 1 : toNumber(inverterExtraFactor, 1),
    batteryExtraFactor: isSolarPanelPowerRoute ? 1 : toNumber(batteryExtraFactor, 1),
    projectScale,
    targetPlantPowerMW: toNumber(targetPlantPowerMW, 0),
    powerBlockSizeKW: toNumber(powerBlockSizeKW, 0),
    mvVoltageKV: toNumber(mvVoltageKV, 0),
    blockStationMW: toNumber(blockStationMW, 0),
    exportLimitMW: toNumber(exportLimitMW, 0),
    groundCoverageRatio: toNumber(groundCoverageRatio, 0),
    trackerMode,
    terrainSlopeDeg: toNumber(terrainSlopeDeg, 0),
    usableLandPercent: toNumber(usableLandPercent, 0),
    gridShortCircuitMVA: toNumber(gridShortCircuitMVA, 0),
    estimatedMvFaultKA: toNumber(estimatedMvFaultKA, 0),
    plantAvailabilityPercent: toNumber(plantAvailabilityPercent, 0),
    annualDegradationPercent: toNumber(annualDegradationPercent, 0),
    manualMode: equipmentManualMode || parameterManualMode,
    equipmentManualMode,
    parameterManualMode
  }), [systemType, activeCalculationMethod, autonomyDays, reserveFactor, equipmentManualMode, parameterManualMode, panelId, inverterId, batteryId, panelExtraFactor, inverterExtraFactor, batteryExtraFactor, projectScale, targetPlantPowerMW, powerBlockSizeKW, mvVoltageKV, blockStationMW, exportLimitMW, groundCoverageRatio, trackerMode, terrainSlopeDeg, usableLandPercent, gridShortCircuitMVA, estimatedMvFaultKA, plantAvailabilityPercent, annualDegradationPercent, solarPanelPowerInput, load, mpptCountPerInverter, batteryRequired, batteryScope, isSolarPanelPowerRoute]);

  const legacySolarDesign = React.useMemo(() => ({ valid: true, previewOnly: true, panel: { title: "Ù¾Ù†Ù„ Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯ÛŒ", powerW: settings?.panelPowerW || 620 }, inverter: { title: "Ø§ÛŒÙ†ÙˆØ±ØªØ± Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯ÛŒ", count: 1, ratedPowerW: load?.totalPowerW || 3000 }, battery: { totalCount: settings?.autonomyDays > 0 ? 1 : 0 }, pvArray: { panelCount: settings?.panelCount || 0, arrayPowerW: (settings?.panelCount || 0) * (settings?.panelPowerW || 620) }, explanations: ["Ø§ÛŒÙ† ØµÙØ­Ù‡ ÙÙ‚Ø· Ù¾ÛŒØ´â€ŒÙ†Ù…Ø§ÛŒØ´ Ø±ÙˆÚ©Ø´ÛŒ Ø§Ø³ØªØ› Ù…Ø­Ø§Ø³Ø¨Ù‡ Ù‚Ø·Ø¹ÛŒ Ø¯Ø± Ù…Ø±Ø­Ù„Ù‡ Ù†Ù‡Ø§ÛŒÛŒ Ø§Ù†Ø¬Ø§Ù… Ù…ÛŒâ€ŒØ´ÙˆØ¯."] }), [load, settings]);
  const useUnifiedPvEngine = !emergency && !utilityGateway;
  const unifiedPvResult = React.useMemo(() => {
    if (!useUnifiedPvEngine) return null;
    return runUnifiedPvForUi({ load, environment, settings, solarPanelPowerInput });
  }, [useUnifiedPvEngine, load, environment, settings, solarPanelPowerInput]);
  const solarDesign = React.useMemo(() => {
    if (!useUnifiedPvEngine || !unifiedPvResult) return legacySolarDesign;
    return unifiedPvToLegacyDesign(unifiedPvResult, legacySolarDesign);
  }, [useUnifiedPvEngine, unifiedPvResult, legacySolarDesign]);
  const safeSolarDesign = {
    valid: solarDesign?.valid ?? true,
    warnings: Array.isArray(solarDesign?.warnings) ? solarDesign.warnings : [],
    panel: solarDesign?.panel ?? {},
    inverter: solarDesign?.inverter ?? {},
    battery: solarDesign?.battery ?? { battery: {} },
    pvArray: solarDesign?.pvArray ?? {},
    design: solarDesign?.design ?? {},
    systemScale: solarDesign?.systemScale ?? {},
    enterpriseUtility: solarDesign?.enterpriseUtility ?? {},
    utilityElectrical: solarDesign?.utilityElectrical ?? {},
  };

  const scaleTargetPowerW = Number(safeSolarDesign.systemScale?.targetPowerW || safeSolarDesign.design?.designPowerW || 0);
  const utilityScaleActive = utilityGateway && (scaleTargetPowerW > 30000 || !["auto", "small"].includes(projectScale));
  const utilityScaleStatusText = utilityGateway
    ? (utilityScaleActive ? "ÙØ¹Ø§Ù„Ø› Ù…Ø³ÛŒØ± Ù…Ø³ØªÙ‚Ù„ Ù†ÛŒØ±ÙˆÚ¯Ø§Ù‡ÛŒ" : "Ø¢Ù…Ø§Ø¯Ù‡Ø› ØªÙˆØ§Ù† Ù‡Ø¯Ù Ù†ÛŒØ±ÙˆÚ¯Ø§Ù‡ÛŒ Ø±Ø§ ÙˆØ§Ø±Ø¯ Ú©Ù†ÛŒØ¯")
    : "ØºÛŒØ±ÙØ¹Ø§Ù„Ø› ÙÙ‚Ø· Ø¯Ø± Ø¯Ø±Ú¯Ø§Ù‡ Ù…Ø³ØªÙ‚Ù„ Ù†ÛŒØ±ÙˆÚ¯Ø§Ù‡ÛŒ Ù†Ù…Ø§ÛŒØ´ Ø¯Ø§Ø¯Ù‡ Ù…ÛŒâ€ŒØ´ÙˆØ¯";

  React.useEffect(() => {
    if (equipmentManualMode) return;
    setPanelId((isSolarPanelPowerRoute ? solarPanelPowerInput?.selectedPanelId : null) || SHIL_SOLAR_PANELS.find((p) => p.powerW === 620)?.id || solarDesign?.panel?.id || SHIL_SOLAR_PANELS?.[0]?.id || "");
    setInverterId(solarDesign?.inverter?.id || "");
    setBatteryId(solarDesign?.battery?.battery?.id || "");
  }, [equipmentManualMode, isSolarPanelPowerRoute, solarPanelPowerInput?.selectedPanelId, solarDesign?.panel?.id || SHIL_SOLAR_PANELS?.[0]?.id || "", solarDesign?.inverter?.id || "", solarDesign?.battery?.battery?.id || ""]);

  React.useEffect(() => {
    if (!warning) return undefined;
    const timer = setTimeout(() => setWarning(""), 5200);
    return () => clearTimeout(timer);
  }, [warning]);

  React.useEffect(() => {
    try {
      localStorage.setItem("shil:solarSystemDesign:live", JSON.stringify(solarDesign));
      if (unifiedPvResult) localStorage.setItem("shil:unifiedPvEngineResult:live", JSON.stringify(unifiedPvResult));
      localStorage.setItem("shil:systemSettingsDraft:live", JSON.stringify({ domain: "solar", ...settings, design: solarDesign, unifiedPvEngineResult: unifiedPvResult }));
      setLiveSaved(true);
      const timer = setTimeout(() => setLiveSaved(false), 900);
      return () => clearTimeout(timer);
    } catch {
      return undefined;
    }
  }, [solarDesign, settings, unifiedPvResult]);

  const applySmart = () => {
    setEquipmentManualMode(false);
    setParameterManualMode(false);
    setPanelExtraFactor(1);
    setInverterExtraFactor(1);
    setBatteryExtraFactor(1);
    setMpptCountPerInverter("1");
    setBatteryRequired(isSolarPanelPowerRoute ? false : systemType !== "ongrid");
    if (isSolarPanelPowerRoute) { setAutonomyDays(0); setBatteryScope("none"); }
    setProjectScale("auto");
    setTargetPlantPowerMW("");
    setPowerBlockSizeKW("");
    setPanelId((isSolarPanelPowerRoute ? solarPanelPowerInput?.selectedPanelId : null) || SHIL_SOLAR_PANELS.find((p) => p.powerW === 620)?.id || solarDesign?.panel?.id || SHIL_SOLAR_PANELS?.[0]?.id || "");
    setInverterId(solarDesign?.inverter?.id || "");
    setBatteryId(solarDesign?.battery?.battery?.id || "");
  };

  const confirmSolar = () => {
    const finalDesign = { ...solarDesign, solarPanelPowerInput: isSolarPanelPowerRoute ? solarPanelPowerInput : {}, unifiedPvEngineResult: unifiedPvResult, batteryScope: isSolarPanelPowerRoute ? batteryScope : "default", unifiedEngineApplied: Boolean(unifiedPvResult), calculationPipeline: unifiedPvResult?.pipeline_order || [], confirmedAt: new Date().toISOString(), confirmedWithWarnings: !safeSolarDesign.valid };
    approveProjectStep("system");
    localStorage.setItem("shil:solarSystemDesign", JSON.stringify(finalDesign));
    if (unifiedPvResult) localStorage.setItem("shil:unifiedPvEngineResult", JSON.stringify(unifiedPvResult));
    localStorage.setItem("shil:systemSettingsDraft", JSON.stringify({ domain: "solar", ...settings, design: finalDesign, unifiedPvEngineResult: unifiedPvResult }));
    if (!safeSolarDesign.valid) {
      setWarning(safeSolarDesign.nextBlockedReason || "Ù¾ÛŒÚ©Ø±Ø¨Ù†Ø¯ÛŒ Ø¨Ø§ Ù‡Ø´Ø¯Ø§Ø± Ø«Ø¨Øª Ø´Ø¯ Ùˆ Ø¯Ø± Ú†Ú©ÛŒØ¯Ù‡ Ù‚Ø§Ø¨Ù„ Ø¨Ø±Ø±Ø³ÛŒ Ø§Ø³Øª.");
    }
    navigate(`/new-project/summary/${utilityGateway ? "utility" : "solar"}`);
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
          <div className="shil-system-nav-row"><button type="button" className="shil-soft-button" onClick={goPreviousFromSystem}>Ù…Ø±Ø­Ù„Ù‡ Ù‚Ø¨Ù„</button><button type="button" className="shil-soft-button" onClick={saveSystemDraftOnly}>Ø°Ø®ÛŒØ±Ù‡ Ù¾ÛŒØ´â€ŒÙ†ÙˆÛŒØ³</button><button type="button" className="shil-primary-wide" onClick={confirmEmergency}>ØªØ£ÛŒÛŒØ¯ Ù…Ø±Ø­Ù„Ù‡</button></div>
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

        {utilityGateway ? (
        <div className={utilityScaleActive ? "shil-section-card shil-config-block shil-scale-config-block is-active" : "shil-section-card shil-config-block shil-scale-config-block is-locked"}>
          <div className="shil-section-head"><h2>Ù…Ù‚ÛŒØ§Ø³ Ù¾Ø±ÙˆÚ˜Ù‡ Ù†ÛŒØ±ÙˆÚ¯Ø§Ù‡ÛŒ</h2><span>{utilityScaleStatusText}</span></div>
          <div className="shil-summary-grid shil-solar-sizing-preview shil-scale-compact-status">
            <div><span>ØªÙˆØ§Ù† Ø·Ø±Ø§Ø­ÛŒ ÙØ¹Ù„ÛŒ</span><strong>{scaleTargetPowerW > 999999 ? mw(scaleTargetPowerW) : kw(scaleTargetPowerW)}</strong></div>
            <div><span>Ø­Ø§Ù„Øª ØªØ­Ù„ÛŒÙ„</span><strong>{safeSolarDesign.systemScale?.designModeLabel}</strong></div>
            <div><span>Ø¢Ø³ØªØ§Ù†Ù‡ ÙØ¹Ø§Ù„â€ŒØ³Ø§Ø²ÛŒ</span><strong>Û³Û° Ú©ÛŒÙ„ÙˆÙˆØ§Øª</strong></div>
            <div><span>Ù…Ø³ÛŒØ± Ø®Ø±ÙˆØ¬ÛŒ AC</span><strong>{settings.outputAcVoltage === 380 ? "Û³Û¸Û° ÙˆÙ„Øª Ø³Ù‡â€ŒÙØ§Ø²" : "Û²Û²Û° ÙˆÙ„Øª ØªÚ©â€ŒÙØ§Ø²"}</strong></div>
            <div><span>ÙˆØ¶Ø¹ÛŒØª Ø¨Ù„ÙˆÚ©â€ŒÙ‡Ø§ÛŒ Ù†ÛŒØ±ÙˆÚ¯Ø§Ù‡ÛŒ</span><strong>{utilityScaleActive ? "ÙØ¹Ø§Ù„" : "Ø¨Ø³ØªÙ‡"}</strong></div>
          </div>

          {!utilityScaleActive ? (
            <>
              <p className="shil-muted-line">Ú†ÙˆÙ† ØªÙˆØ§Ù† Ù…Ø³ÛŒØ± Ø§Ù†ØªØ®Ø§Ø¨â€ŒØ´Ø¯Ù‡ Ù‡Ù†ÙˆØ² Ø§Ø² Û³Û°kW Ø¨Ø§Ù„Ø§ØªØ± Ù†Ø±ÙØªÙ‡ØŒ ÙÛŒÙ„Ø¯Ù‡Ø§ÛŒ Ù†ÛŒØ±ÙˆÚ¯Ø§Ù‡ÛŒØŒ MVØŒ ØªØ±Ø§Ù†Ø³ØŒ Grid StudyØŒ Tracker/GIS Ùˆ SCADA Ø¨Ø³ØªÙ‡ Ù…ÛŒâ€ŒÙ…Ø§Ù†Ù†Ø¯ ØªØ§ ØµÙØ­Ù‡ Ù¾ÛŒÚ©Ø±Ø¨Ù†Ø¯ÛŒ Ø´Ù„ÙˆØº Ù†Ø´ÙˆØ¯.</p>
              <DetailsToggle title="Ù†Ù…Ø§ÛŒØ´ Ø¯Ø³ØªÛŒ ØªÙ†Ø¸ÛŒÙ…Ø§Øª Ù†ÛŒØ±ÙˆÚ¯Ø§Ù‡ÛŒ Ù¾ÛŒØ´Ø±ÙØªÙ‡">
                <div className="shil-form-grid shil-param-grid">
                  <label><span>Ù…Ù‚ÛŒØ§Ø³ Ù¾Ø±ÙˆÚ˜Ù‡</span><select value={projectScale} onChange={(e) => { setParameterManualMode(true); setProjectScale(e.target.value); }}><option value="auto">Ø®ÙˆØ¯Ú©Ø§Ø±</option><option value="small">Ø®Ø§Ù†Ú¯ÛŒ / Ú©ÙˆÚ†Ú©</option><option value="commercial">ØªØ¬Ø§Ø±ÛŒ / ØµÙ†Ø¹ØªÛŒ Ø³Ø¨Ú©</option><option value="industrial">ØµÙ†Ø¹ØªÛŒ Ø¨Ø²Ø±Ú¯</option><option value="utility">Ù†ÛŒØ±ÙˆÚ¯Ø§Ù‡ÛŒ</option><option value="mega_utility">Ù†ÛŒØ±ÙˆÚ¯Ø§Ù‡ÛŒ Ø¨Ø²Ø±Ú¯</option></select></label>
                  <label><span>ØªÙˆØ§Ù† Ù‡Ø¯Ù Ù†ÛŒØ±ÙˆÚ¯Ø§Ù‡ MW</span><input type="number" step="0.1" min="0" max="30" value={targetPlantPowerMW} onChange={(e) => { setParameterManualMode(true); setTargetPlantPowerMW(e.target.value); }} placeholder="Ù…Ø«Ù„Ø§Ù‹ 5 ÛŒØ§ 10 ÛŒØ§ 25" /></label>
                </div>
                <p className="shil-muted-line">Ø¨Ø§ ÙˆØ§Ø±Ø¯ Ú©Ø±Ø¯Ù† ØªÙˆØ§Ù† Ø¨Ø§Ù„Ø§ØªØ± Ø§Ø² Û°.Û°Û³MW ÛŒØ§ Ø§Ù†ØªØ®Ø§Ø¨ Ù…Ù‚ÛŒØ§Ø³ ØµÙ†Ø¹ØªÛŒ/Ù†ÛŒØ±ÙˆÚ¯Ø§Ù‡ÛŒØŒ Ø¨Ù„ÙˆÚ© Ú©Ø§Ù…Ù„ Ù†ÛŒØ±ÙˆÚ¯Ø§Ù‡ÛŒ ÙØ¹Ø§Ù„ Ù…ÛŒâ€ŒØ´ÙˆØ¯.</p>
              </DetailsToggle>
            </>
          ) : (
            <>
              <div className="shil-form-grid shil-param-grid">
                <label><span>Ù…Ù‚ÛŒØ§Ø³ Ù¾Ø±ÙˆÚ˜Ù‡</span><select value={projectScale} onChange={(e) => { setParameterManualMode(true); setProjectScale(e.target.value); }}><option value="auto">Ø®ÙˆØ¯Ú©Ø§Ø±</option><option value="small">Ø®Ø§Ù†Ú¯ÛŒ / Ú©ÙˆÚ†Ú©</option><option value="commercial">ØªØ¬Ø§Ø±ÛŒ / ØµÙ†Ø¹ØªÛŒ Ø³Ø¨Ú©</option><option value="industrial">ØµÙ†Ø¹ØªÛŒ Ø¨Ø²Ø±Ú¯</option><option value="utility">Ù†ÛŒØ±ÙˆÚ¯Ø§Ù‡ÛŒ</option><option value="mega_utility">Ù†ÛŒØ±ÙˆÚ¯Ø§Ù‡ÛŒ Ø¨Ø²Ø±Ú¯</option></select></label>
                <label><span>ØªÙˆØ§Ù† Ù‡Ø¯Ù Ù†ÛŒØ±ÙˆÚ¯Ø§Ù‡ MW</span><input type="number" step="0.1" min="0" max="30" value={targetPlantPowerMW} onChange={(e) => { setParameterManualMode(true); setTargetPlantPowerMW(e.target.value); }} placeholder="Ù…Ø«Ù„Ø§Ù‹ 5 ÛŒØ§ 10 ÛŒØ§ 25" /></label>
                <label><span>ØªÙˆØ§Ù† Ù‡Ø± Ø¨Ù„ÙˆÚ© kW</span><input type="number" step="50" min="0" max="5000" value={powerBlockSizeKW} onChange={(e) => { setParameterManualMode(true); setPowerBlockSizeKW(e.target.value); }} placeholder="Ø®ÙˆØ¯Ú©Ø§Ø±: 250/500/1000/2500" /></label>
                <label><span>ÙˆÙ„ØªØ§Ú˜ MV kV</span><input type="number" step="1" min="0" max="33" value={mvVoltageKV} onChange={(e) => { setParameterManualMode(true); setMvVoltageKV(e.target.value); }} placeholder="Ø®ÙˆØ¯Ú©Ø§Ø±: 11/20/33" /></label>
                <label><span>Ø¨Ù„ÙˆÚ© ØªØ±Ø§Ù†Ø³ MW</span><input type="number" step="0.5" min="0" max="5" value={blockStationMW} onChange={(e) => { setParameterManualMode(true); setBlockStationMW(e.target.value); }} placeholder="Ø®ÙˆØ¯Ú©Ø§Ø±: 0.5 ØªØ§ 5" /></label>
                <label><span>Ù…Ø­Ø¯ÙˆØ¯ÛŒØª ØªØ²Ø±ÛŒÙ‚ MW</span><input type="number" step="0.1" min="0" max="30" value={exportLimitMW} onChange={(e) => { setParameterManualMode(true); setExportLimitMW(e.target.value); }} placeholder="Ø§Ø®ØªÛŒØ§Ø±ÛŒ" /></label>
                <label><span>GCR Ø²Ù…ÛŒÙ†</span><input type="number" step="0.01" min="0.28" max="0.62" value={groundCoverageRatio} onChange={(e) => { setParameterManualMode(true); setGroundCoverageRatio(e.target.value); }} placeholder="Ø®ÙˆØ¯Ú©Ø§Ø±: 0.42" /></label>
                <label><span>Ù†ÙˆØ¹ Ú†ÛŒØ¯Ù…Ø§Ù† / Tracker</span><select value={trackerMode} onChange={(e) => { setParameterManualMode(true); setTrackerMode(e.target.value); }}><option value="auto">Ø®ÙˆØ¯Ú©Ø§Ø±</option><option value="fixed_tilt">Ø«Ø§Ø¨Øª</option><option value="single_axis">ØªØ±Ú©Ø± ØªÚ©â€ŒÙ…Ø­ÙˆØ±Ù‡</option></select></label>
                <label><span>Ø´ÛŒØ¨ Ø²Ù…ÛŒÙ† Ø¯Ø±Ø¬Ù‡</span><input type="number" step="0.5" min="0" max="18" value={terrainSlopeDeg} onChange={(e) => { setParameterManualMode(true); setTerrainSlopeDeg(e.target.value); }} placeholder="Ø®ÙˆØ¯Ú©Ø§Ø±: 2" /></label>
                <label><span>Ø²Ù…ÛŒÙ† Ù‚Ø§Ø¨Ù„ Ø§Ø³ØªÙØ§Ø¯Ù‡ Ùª</span><input type="number" step="1" min="55" max="92" value={usableLandPercent} onChange={(e) => { setParameterManualMode(true); setUsableLandPercent(e.target.value); }} placeholder="Ø®ÙˆØ¯Ú©Ø§Ø±: 82" /></label>
                <label><span>Ù‚Ø¯Ø±Øª Ø§ØªØµØ§Ù„ Ú©ÙˆØªØ§Ù‡ Ø´Ø¨Ú©Ù‡ MVA</span><input type="number" step="10" min="0" value={gridShortCircuitMVA} onChange={(e) => { setParameterManualMode(true); setGridShortCircuitMVA(e.target.value); }} placeholder="Ø®ÙˆØ¯Ú©Ø§Ø± Ø¨Ø± Ø§Ø³Ø§Ø³ Ù…Ù‚ÛŒØ§Ø³" /></label>
                <label><span>Ø³Ø·Ø­ Ø§ØªØµØ§Ù„ Ú©ÙˆØªØ§Ù‡ MV kA</span><input type="number" step="1" min="0" max="40" value={estimatedMvFaultKA} onChange={(e) => { setParameterManualMode(true); setEstimatedMvFaultKA(e.target.value); }} placeholder="Ø®ÙˆØ¯Ú©Ø§Ø±: 16/20/25" /></label>
                <label><span>Availability Ù†ÛŒØ±ÙˆÚ¯Ø§Ù‡ Ùª</span><input type="number" step="0.1" min="92" max="99.8" value={plantAvailabilityPercent} onChange={(e) => { setParameterManualMode(true); setPlantAvailabilityPercent(e.target.value); }} placeholder="Ø®ÙˆØ¯Ú©Ø§Ø±: 98" /></label>
                <label><span>Ø§ÙØª Ø³Ø§Ù„Ø§Ù†Ù‡ Ù¾Ù†Ù„ Ùª</span><input type="number" step="0.05" min="0.2" max="1.2" value={annualDegradationPercent} onChange={(e) => { setParameterManualMode(true); setAnnualDegradationPercent(e.target.value); }} placeholder="Ø®ÙˆØ¯Ú©Ø§Ø±: 0.55" /></label>
              </div>
              <div className="shil-summary-grid shil-solar-sizing-preview">
                <div><span>Ø­Ø§Ù„Øª ØªØ­Ù„ÛŒÙ„</span><strong>{safeSolarDesign.systemScale?.designModeLabel}</strong></div>
                <div><span>ØªÙˆØ§Ù† Ù‡Ø¯Ù</span><strong>{safeSolarDesign.systemScale?.targetPowerMW >= 1 ? `${safeSolarDesign.systemScale.targetPowerMW} MW` : `${safeSolarDesign.systemScale?.targetPowerKW} kW`}</strong></div>
                <div><span>Ø¨Ù„ÙˆÚ©â€ŒÙ‡Ø§</span><strong>{faNumber(safeSolarDesign.systemScale?.blockCount)} Ø¨Ù„ÙˆÚ©</strong></div>
                <div><span>Ø§ÛŒÙ†ÙˆØ±ØªØ± Ú©Ù„</span><strong>{faNumber(safeSolarDesign.systemScale?.totalInverterCount)} Ø¹Ø¯Ø¯</strong></div>
                <div><span>MV / ÙÛŒØ¯Ø±</span><strong>{safeSolarDesign.utilityElectrical?.active ? `${safeSolarDesign.utilityElectrical?.mv?.voltageKV}kV / ${faNumber(safeSolarDesign.utilityElectrical?.mv?.feederCount)}` : "Ù†ÛŒØ§Ø² Ù†Ø¯Ø§Ø±Ø¯"}</strong></div>
                <div><span>ØªØ±Ø§Ù†Ø³</span><strong>{safeSolarDesign.utilityElectrical?.active ? `${faNumber(safeSolarDesign.utilityElectrical?.transformer?.count)} Ã— ${safeSolarDesign.utilityElectrical?.transformer?.unitMVA}MVA` : "Ù†ÛŒØ§Ø² Ù†Ø¯Ø§Ø±Ø¯"}</strong></div>
                <div><span>Ø²Ù…ÛŒÙ† ØªÙ‚Ø±ÛŒØ¨ÛŒ</span><strong>{safeSolarDesign.utilityElectrical?.active ? `${safeSolarDesign.utilityElectrical?.land?.landAreaHa} ha` : "-"}</strong></div>
                <div><span>ØªÙˆÙ„ÛŒØ¯ Ø³Ø§Ù„Ø§Ù†Ù‡</span><strong>{safeSolarDesign.utilityElectrical?.active ? `${faNumber(safeSolarDesign.utilityElectrical?.yield?.annualKWh)} kWh` : "-"}</strong></div>
                <div><span>Enterprise Score</span><strong>{safeSolarDesign.enterpriseUtility?.active ? `${safeSolarDesign.enterpriseUtility.score}/100` : "-"}</strong></div>
                <div><span>Ø­ÙØ§Ø¸Øª MV</span><strong>{safeSolarDesign.enterpriseUtility?.active ? `${safeSolarDesign.enterpriseUtility?.protection?.requiredBreakerKA}kA / ${safeSolarDesign.enterpriseUtility?.protection?.feederBreakerA}A` : "-"}</strong></div>
                <div><span>Grid Study</span><strong>{safeSolarDesign.enterpriseUtility?.active ? safeSolarDesign.enterpriseUtility?.gridStudy?.studyLevel : "-"}</strong></div>
                <div><span>Tracker/GIS</span><strong>{safeSolarDesign.enterpriseUtility?.active ? `${safeSolarDesign.enterpriseUtility?.tracker?.trackerMode} / ${safeSolarDesign.enterpriseUtility?.terrain?.requiredGrossLandHa} ha` : "-"}</strong></div>
                <div><span>SCADA</span><strong>{safeSolarDesign.enterpriseUtility?.active ? safeSolarDesign.enterpriseUtility?.scada?.communicationTopology : "-"}</strong></div>
                <div><span>P90 Ø³Ø§Ù„ Ø§ÙˆÙ„</span><strong>{safeSolarDesign.enterpriseUtility?.active ? `${faNumber(safeSolarDesign.enterpriseUtility?.advancedYield?.p90KWh)} kWh` : "-"}</strong></div>
              </div>
              <p className="shil-muted-line">Ø§Ú¯Ø± ØªÙˆØ§Ù† Ø§Ø² Û³Û°kW Ø¨Ø§Ù„Ø§ØªØ± Ø¨Ø±ÙˆØ¯ØŒ Ø§Ù¾ Ø®Ø·Ø§ Ù†Ù…ÛŒâ€ŒØ¯Ù‡Ø¯ Ùˆ Ù…Ø­Ø§Ø³Ø¨Ù‡ Ø±Ø§ Ø¨Ù‡ Ú†Ù†Ø¯ Ø§ÛŒÙ†ÙˆØ±ØªØ± Ù…ÙˆØ§Ø²ÛŒ ÛŒØ§ Ø¨Ù„ÙˆÚ©â€ŒØ¨Ù†Ø¯ÛŒ Ù†ÛŒØ±ÙˆÚ¯Ø§Ù‡ÛŒ ØªØ¨Ø¯ÛŒÙ„ Ù…ÛŒâ€ŒÚ©Ù†Ø¯. Ø§ÛŒÙ† Ø¨Ø®Ø´ ÙÙ‚Ø· ØªØ­Ù„ÛŒÙ„ Ù…Ù‡Ù†Ø¯Ø³ÛŒ Ø§Ø³Øª Ùˆ Ù‡ÛŒÚ† Ù‚ÛŒÙ…Øª ÛŒØ§ Ø®Ø±ÛŒØ¯ÛŒ ÙˆØ§Ø±Ø¯ Ø®Ø±ÙˆØ¬ÛŒ Ù†Ù…ÛŒâ€ŒØ´ÙˆØ¯.</p>
            </>
          )}
        </div>
) : null}

        {isSolarPanelPowerRoute ? (
        <div className="shil-section-card shil-config-block">
          <div className="shil-section-head"><h2>Ø§Ø¹Ù…Ø§Ù„ Ø¶Ø±Ø§ÛŒØ¨ Ø§Ø³ØªØ§Ù†Ø¯Ø§Ø±Ø¯</h2><span>{parameterManualMode ? "Ø­Ø§Ù„Øª Ø¯Ø³ØªÛŒ ÙØ¹Ø§Ù„" : "Ø§Ø¹Ù…Ø§Ù„ Ù‡ÙˆØ´Ù…Ù†Ø¯ ÙØ¹Ø§Ù„"}</span></div>
          <div className="shil-form-grid shil-param-grid">
            <label><span>Ø¶Ø±ÛŒØ¨ Ø±Ø§Ù‡â€ŒØ§Ù†Ø¯Ø§Ø²ÛŒ Ù¾ÛŒØ´â€ŒÙØ±Ø¶</span><input type="text" inputMode="decimal" value={reserveFactor} onChange={(e) => { setParameterManualMode(true); setReserveFactor(e.target.value); }} /></label>
            <label><span>Ø±ÙˆØ²Ù‡Ø§ÛŒ Ø®ÙˆØ¯Ú©ÙØ§ÛŒÛŒ</span><input type="text" inputMode="decimal" min="0" max="7" value={autonomyDays} onChange={(e) => { setParameterManualMode(true); const value = e.target.value; setAutonomyDays(value); if (toNumber(value, 0) <= 0) setBatteryScope("none"); else if (batteryScope === "none") setBatteryScope("all"); }} /></label>
            {isSolarPanelPowerRoute && toNumber(autonomyDays, 0) > 0 ? (
              <label><span>Ø§Ø¹Ù…Ø§Ù„ Ø¨Ø§ØªØ±ÛŒ Ø¨Ø±Ø§ÛŒ</span><select value={batteryScope} onChange={(e) => { setParameterManualMode(true); setBatteryScope(e.target.value); }}>
                <option value="all">Ù‡Ù…Ù‡ Ø§ÛŒÙ†ÙˆØ±ØªØ±Ù‡Ø§</option>
                {Array.from({ length: Math.max(1, toNumber(solarPanelPowerInput?.inverterSplitCount, 1)) }, (_, i) => <option key={i + 1} value={String(i + 1)}>Ø§ÛŒÙ†ÙˆØ±ØªØ± {faNumber(i + 1)}</option>)}
              </select></label>
            ) : null}
          </div>
          <div className="shil-summary-grid shil-solar-sizing-preview">
            <div><span>ØªÙˆØ§Ù† Ù¾Ø§ÛŒÙ‡</span><strong>{faNumber(solarPanelPowerInput?.totalPanelPowerW || safeSolarDesign.pvArray?.arrayPowerW || 0)} W</strong></div>
            <div><span>Ø¶Ø±ÛŒØ¨ Ø±Ø§Ù‡â€ŒØ§Ù†Ø¯Ø§Ø²ÛŒ</span><strong>{reserveFactor}</strong></div>
            <div><span>ØªÙˆØ§Ù† Ù†Ù‡Ø§ÛŒÛŒ Ø·Ø±Ø§Ø­ÛŒ</span><strong>{faNumber(safeSolarDesign.design?.designPowerW || 0)} W</strong></div>
            <div><span>ÙˆØ¶Ø¹ÛŒØª Ø¨Ø§ØªØ±ÛŒ</span><strong>{toNumber(autonomyDays, 0) > 0 ? (batteryScope === "all" ? "Ø¨Ø§ØªØ±ÛŒ Ø¨Ø±Ø§ÛŒ Ù‡Ù…Ù‡ Ø§ÛŒÙ†ÙˆØ±ØªØ±Ù‡Ø§" : `Ø¨Ø§ØªØ±ÛŒ Ø¨Ø±Ø§ÛŒ Ø§ÛŒÙ†ÙˆØ±ØªØ± ${batteryScope}`) : "Ø¨Ø§ØªØ±ÛŒ Ø§Ù†ØªØ®Ø§Ø¨ Ù†Ø´Ø¯Ù‡"}</strong></div>
          </div>
          <div className="shil-action-row shil-smart-mode-row">
            <button type="button" className={!equipmentManualMode && !parameterManualMode ? "shil-soft-button active" : "shil-soft-button"} onClick={applySmart}>Ø§Ø¹Ù…Ø§Ù„ Ù‡ÙˆØ´Ù…Ù†Ø¯ SHIL</button>
            <button type="button" className={equipmentManualMode ? "shil-soft-button active" : "shil-soft-button"} onClick={() => setEquipmentManualMode(!equipmentManualMode)}>{equipmentManualMode ? "ÙˆØ±ÙˆØ¯ Ø¯Ø³ØªÛŒ ØªØ¬Ù‡ÛŒØ²Ø§Øª ÙØ¹Ø§Ù„" : "ÙˆØ±ÙˆØ¯ Ø¯Ø³ØªÛŒ ØªØ¬Ù‡ÛŒØ²Ø§Øª"}</button>
          </div>
          <p className="shil-muted-line">{liveSaved ? "Ø°Ø®ÛŒØ±Ù‡ Ùˆ Ø§ØªØµØ§Ù„ Ø²Ù†Ø¯Ù‡ Ø¨Ù‡ Ù…ÙˆØªÙˆØ± Ø§Ù†Ø¬Ø§Ù… Ø´Ø¯." : `Ù¾Ù†Ù„ Ù¾ÛŒØ´â€ŒÙØ±Ø¶ Ù…ÙˆØªÙˆØ±: ${safeSolarDesign.panel?.powerW} ÙˆØ§Øª`}</p>
        </div>
        ) : (
          <div className="shil-section-card shil-config-block">
            <div className="shil-section-head"><h2>Ø§Ø¹Ù…Ø§Ù„ Ø¶Ø±Ø§ÛŒØ¨ Ø§Ø³ØªØ§Ù†Ø¯Ø§Ø±Ø¯</h2><span>{parameterManualMode ? "Ø­Ø§Ù„Øª Ø¯Ø³ØªÛŒ ÙØ¹Ø§Ù„" : "Ø§Ø¹Ù…Ø§Ù„ Ù‡ÙˆØ´Ù…Ù†Ø¯ ÙØ¹Ø§Ù„"}</span></div>
            <div className="shil-form-grid shil-param-grid">
              <label><span>Ø±ÙˆØ²Ù‡Ø§ÛŒ Ø®ÙˆØ¯Ú©ÙØ§ÛŒÛŒ</span><input type="text" inputMode="decimal" min="0" max="7" value={autonomyDays} onChange={(e) => { setParameterManualMode(true); const value = e.target.value; setAutonomyDays(value); setBatteryRequired(toNumber(value, 0) > 0); }} /></label>
              <label><span>Ø¶Ø±ÛŒØ¨ Ø§Ø·Ù…ÛŒÙ†Ø§Ù† Ø§Ø³ØªØ§Ù†Ø¯Ø§Ø±Ø¯</span><input type="text" inputMode="decimal" value={reserveFactor} onChange={(e) => { setParameterManualMode(true); setReserveFactor(e.target.value); }} /></label>
            </div>
            <div className="shil-action-row shil-smart-mode-row">
              <button type="button" className={!equipmentManualMode && !parameterManualMode ? "shil-soft-button active" : "shil-soft-button"} onClick={applySmart}>Ø§Ø¹Ù…Ø§Ù„ Ù‡ÙˆØ´Ù…Ù†Ø¯ SHIL</button>
              <button type="button" className={equipmentManualMode ? "shil-soft-button active" : "shil-soft-button"} onClick={() => setEquipmentManualMode(!equipmentManualMode)}>{equipmentManualMode ? "ÙˆØ±ÙˆØ¯ Ø¯Ø³ØªÛŒ ØªØ¬Ù‡ÛŒØ²Ø§Øª ÙØ¹Ø§Ù„" : "ÙˆØ±ÙˆØ¯ Ø¯Ø³ØªÛŒ ØªØ¬Ù‡ÛŒØ²Ø§Øª"}</button>
            </div>
            <p className="shil-muted-line">Ø¯Ø± Ø­Ø§Ù„Øª Ø¹Ù…ÙˆÙ…ÛŒØŒ Ø±ÙˆØ²Ù‡Ø§ÛŒ Ø®ÙˆØ¯Ú©ÙØ§ÛŒÛŒ Ùˆ Ø¶Ø±ÛŒØ¨ Ø§Ø·Ù…ÛŒÙ†Ø§Ù† Ø±ÙˆÛŒ Ù†ØªÛŒØ¬Ù‡ Ø§ÛŒÙ†ÙˆØ±ØªØ±ØŒ Ø¨Ø§Ù†Ú© Ø¨Ø§ØªØ±ÛŒØŒ Ú©Ø§Ø¨Ù„ Ùˆ Ø­ÙØ§Ø¸Øª Ø§Ø«Ø± Ù…ÛŒâ€ŒÚ¯Ø°Ø§Ø±Ù†Ø¯. Ø§ÛŒÙ† Ø¨Ø®Ø´ Ù…Ø³ØªÙ‚Ù„ Ø§Ø² Ù…Ø³ÛŒØ± Ø§Ø®ØªØµØ§ØµÛŒ ØªÙˆØ§Ù† Ù¾Ù†Ù„ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ Ø§Ø³Øª.</p>
            <p className="shil-muted-line">{liveSaved ? "Ø°Ø®ÛŒØ±Ù‡ Ùˆ Ø§ØªØµØ§Ù„ Ø²Ù†Ø¯Ù‡ Ø¨Ù‡ Ù…ÙˆØªÙˆØ± Ø§Ù†Ø¬Ø§Ù… Ø´Ø¯." : `Ù¾Ù†Ù„ Ù¾ÛŒØ´â€ŒÙØ±Ø¶ Ù…ÙˆØªÙˆØ±: ${safeSolarDesign.panel?.powerW} ÙˆØ§Øª`}</p>
          </div>
        )}

        {isSolarPanelPowerRoute ? (
          <>
            <InverterMpptTopologyCard
              design={solarDesign}
              mpptCount={mpptCountPerInverter}
              onMpptCount={(value) => { setParameterManualMode(true); setMpptCountPerInverter(value); }}
              enabled={Number(safeSolarDesign.inverter?.count || 1) >= 1}
            />

            <div className="shil-section-card shil-config-block">
              <div className="shil-section-head"><h2>Ø¨Ø§Ù†Ú©â€ŒÙ‡Ø§ÛŒ Ù‡ÙˆØ´Ù…Ù†Ø¯ Ù…Ø³ÛŒØ± ØªÙˆØ§Ù† Ù¾Ù†Ù„</h2><span>Ù…ØªØµÙ„ Ø¨Ù‡ ÙˆØ±ÙˆØ¯ÛŒ Ù‚Ø¨Ù„ÛŒ</span></div>
            </div>
          </>
        ) : (
          <div className="shil-section-card shil-config-block">
            <div className="shil-section-head"><h2>Ø¨Ø§Ù†Ú©â€ŒÙ‡Ø§ÛŒ Ø¹Ù…ÙˆÙ…ÛŒ ØªØ¬Ù‡ÛŒØ²Ø§Øª</h2><span>Ù…ØªÙ†Ø§Ø³Ø¨ Ø¨Ø§ Ø±ÙˆØ´ Ù…Ø­Ø§Ø³Ø¨Ø§Øª Ø§Ù†ØªØ®Ø§Ø¨â€ŒØ´Ø¯Ù‡</span></div>
            <p className="shil-muted-line">Ø¯Ø± Ø§ÛŒÙ† Ù…Ø³ÛŒØ± Ø¨Ø§Ù†Ú©â€ŒÙ‡Ø§ Ø¨Ø± Ø§Ø³Ø§Ø³ Ù„ÛŒØ³Øª ØªØ¬Ù‡ÛŒØ²Ø§Øª Ùˆ Ø¨Ø§Ø± Ù…Ø­Ø§Ø³Ø¨Ù‡ Ù…ÛŒâ€ŒØ´ÙˆÙ†Ø¯Ø› ØªÙ†Ø¸ÛŒÙ…Ø§Øª Ø§Ø®ØªØµØ§ØµÛŒ MPPT Ùˆ ØªÙ‚Ø³ÛŒÙ… Ù¾Ù†Ù„ ÙÙ‚Ø· Ø¯Ø± Ù…Ø³ÛŒØ± ØªÙˆØ§Ù† Ù¾Ù†Ù„ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ ÙØ¹Ø§Ù„ Ø§Ø³Øª.</p>
          </div>
        )}

        <div className="shil-system-banks-grid shil-system-banks-grid-final">
          <BankSelect
            title="Ø¨Ø§Ù†Ú© Ø§ÛŒÙ†ÙˆØ±ØªØ± Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ"
            subtitle="1.6kW ØªØ§ 30kW"
            value={inverterId}
            onValue={(v) => { setEquipmentManualMode(true); setInverterId(v); }}
            smartTitle={optionTitle(safeSolarDesign.inverter)}
            items={SHIL_SOLAR_INVERTERS}
            smartValue={`${kw(safeSolarDesign.inverter?.ratedPowerW)} Ã— ${faNumber(safeSolarDesign.inverter?.count)} Ø¹Ø¯Ø¯ / ${safeSolarDesign.inverter?.dcVoltage}V`}
            renderMeta={(item) => <>{item?.ratedPowerW}W / ÙˆØ±ÙˆØ¯ÛŒ Ø¨Ø§ØªØ±ÛŒ {item?.dcVoltage}V / MPPT {item?.mpptMinV}-{item?.mpptMaxV}V / Ø³Ù‚Ù PV {item?.maxPvPowerW}W</>}
            renderReason={() => <>Ø§ÛŒÙ†ÙˆØ±ØªØ± Ù‡ÙˆØ´Ù…Ù†Ø¯ Ø§Ø² Ù…ÙˆØªÙˆØ± ÛŒÚ©Ù¾Ø§Ø±Ú†Ù‡ PV Ø§Ù†ØªØ®Ø§Ø¨ Ù…ÛŒâ€ŒØ´ÙˆØ¯Ø› ØªÙˆØ§Ù†ØŒ MPPTØŒ Ø¬Ø±ÛŒØ§Ù†ØŒ Ø¨Ø§Ù†Ú© ØªØ¬Ù‡ÛŒØ²Ø§Øª Ùˆ Ø®Ø·Ø§Ù‡Ø§ÛŒ Ø§Ø¯Ø§Ù…Ù‡ Ù…Ø³ÛŒØ± Ø§Ø² ÛŒÚ© Pipeline ÙˆØ§Ø­Ø¯ Ø®ÙˆØ§Ù†Ø¯Ù‡ Ù…ÛŒâ€ŒØ´ÙˆÙ†Ø¯.</>}
          />
          <BankSelect
            title="Ø¨Ø§Ù†Ú© Ø¨Ø§ØªØ±ÛŒ"
            subtitle="12V / 24V / 48V"
            value={batteryId}
            onValue={(v) => { setEquipmentManualMode(true); setBatteryId(v); }}
            smartTitle={safeSolarDesign.battery?.battery?.title}
            items={SHIL_LITHIUM_BATTERIES}
            smartValue={isSolarPanelPowerRoute ? (toNumber(autonomyDays, 0) > 0 ? `${safeSolarDesign.battery?.unitVoltageV || safeSolarDesign.battery?.battery?.nominalVoltage}V / ${faNumber(safeSolarDesign.battery?.totalCount)} Ø¹Ø¯Ø¯ / ${safeSolarDesign.battery?.unitEnergyKWh || "-"}kWh / ${batteryScope === "all" ? "Ù‡Ù…Ù‡ Ø§ÛŒÙ†ÙˆØ±ØªØ±Ù‡Ø§" : `Ø§ÛŒÙ†ÙˆØ±ØªØ± ${batteryScope}`}` : "Ø¨Ø§ØªØ±ÛŒ Ø§Ù†ØªØ®Ø§Ø¨ Ù†Ø´Ø¯Ù‡") : (batteryRequired ? `${safeSolarDesign.battery?.unitVoltageV || safeSolarDesign.battery?.battery?.nominalVoltage}V / ${faNumber(safeSolarDesign.battery?.totalCount)} Ø¹Ø¯Ø¯ / ${safeSolarDesign.battery?.unitEnergyKWh || "-"}kWh` : "Ø¨Ø§ØªØ±ÛŒ Ø§Ù†ØªØ®Ø§Ø¨ Ù†Ø´Ø¯Ù‡")}
            renderMeta={(item) => <>{item?.nominalVoltage}V / {item?.capacityAh}Ah / Ø¨Ø§Ø²Ù‡ Ø´Ù†Ø§ÙˆØ± {item?.minVoltage}-{item?.maxVoltage}V / Ø§Ù†Ø±Ú˜ÛŒ Ø®Ø§Ù… {item?.energyWh}Wh</>}
            renderReason={() => <>ÙˆÙ„ØªØ§Ú˜ Ø¨Ø§ØªØ±ÛŒ Ø¨Ù‡ ØµÙˆØ±Øª Ø´Ù†Ø§ÙˆØ± Ú©Ù†ØªØ±Ù„ Ù…ÛŒâ€ŒØ´ÙˆØ¯ Ùˆ Ø¨Ø§ ÙˆØ±ÙˆØ¯ÛŒ DC Ø§ÛŒÙ†ÙˆØ±ØªØ± Ùˆ Ø±ÙˆØ²Ù‡Ø§ÛŒ Ø®ÙˆØ¯Ú©ÙØ§ÛŒÛŒ Ù‡Ù…Ø§Ù‡Ù†Ú¯ Ù…ÛŒâ€ŒØ´ÙˆØ¯.</>}
          />
          <BankSelect
            title="Ø¨Ø§Ù†Ú© Ù¾Ù†Ù„ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ"
            subtitle="Ù¾ÛŒØ´â€ŒÙØ±Ø¶ 620W / Ø¯Ø³ØªÛŒ ØªØ§ 700W"
            value={panelId}
            onValue={(v) => { setEquipmentManualMode(true); setPanelId(v); }}
            smartTitle={safeSolarDesign.panel?.title}
            items={SHIL_SOLAR_PANELS}
            smartValue={isSolarPanelPowerRoute ? `${safeSolarDesign.panel?.powerW}W / ${faNumber(safeSolarDesign.pvArray?.panelCount)} Ø¹Ø¯Ø¯ / ØªÙ‚Ø³ÛŒÙ…: ${(safeSolarDesign.inverterTopology?.panelDistribution || []).join(" / ") || "Ø®ÙˆØ¯Ú©Ø§Ø±"}` : `${safeSolarDesign.panel?.powerW}W / ${faNumber(safeSolarDesign.pvArray?.panelCount)} Ø¹Ø¯Ø¯`}
            renderMeta={(item) => <>{item?.powerW}W / Vmp {item?.vmp}V / Voc {item?.voc}V / Ù…Ø³Ø§Ø­Øª ØªÙ‚Ø±ÛŒØ¨ÛŒ {item?.areaM2}mÂ²</>}
            renderReason={() => <>Ø§ÛŒÙ† Ø¨Ø§Ù†Ú© Ø§Ø² Ø®Ø±ÙˆØ¬ÛŒ Ù…ÙˆØªÙˆØ± ÛŒÚ©Ù¾Ø§Ø±Ú†Ù‡ Ø®ÙˆØ§Ù†Ø¯Ù‡ Ù…ÛŒâ€ŒØ´ÙˆØ¯Ø› Ù‡Ø± ØªØºÛŒÛŒØ± Ù¾Ù†Ù„ØŒ ØªØ¹Ø¯Ø§Ø¯ØŒ Ø§ÛŒÙ†ÙˆØ±ØªØ± ÛŒØ§ Ø¨Ø§ØªØ±ÛŒ Ø¨Ù„Ø§ÙØ§ØµÙ„Ù‡ Ø¯Ø± Ù…Ø­Ø§Ø³Ø¨Ø§Øª MPPTØŒ Ø­ÙØ§Ø¸Øª Ùˆ Ø±Ø§Ù†Ø¯Ù…Ø§Ù† Ø§Ø¹Ù…Ø§Ù„ Ù…ÛŒâ€ŒØ´ÙˆØ¯.</>}
          />
        </div>

        <div className="shil-section-card shil-auto-result-card shil-result-card-final">
          <div className="shil-section-head"><h2>{isSolarPanelPowerRoute ? "Ù†ØªØ§ÛŒØ¬ Ù¾ÛŒÚ©Ø±Ø¨Ù†Ø¯ÛŒ Ø¨Ø§ Ø§Ø³ØªÙØ§Ø¯Ù‡ Ø§Ø² ØªÙˆØ§Ù† Ù¾Ù†Ù„ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ" : "Ù†ØªØ§ÛŒØ¬ Ù¾ÛŒÚ©Ø±Ø¨Ù†Ø¯ÛŒ Ù…ÙˆØªÙˆØ± ÛŒÚ©Ù¾Ø§Ø±Ú†Ù‡"}</h2><span>{safeSolarDesign.valid ? "Ù‚Ø§Ø¨Ù„ ØªØ£ÛŒÛŒØ¯" : "Ù†ÛŒØ§Ø²Ù…Ù†Ø¯ Ø§ØµÙ„Ø§Ø­"}</span></div>
          {unifiedPvResult ? <SolarPanelPowerResultTable design={solarDesign} solarPanelPowerInput={solarPanelPowerInput} batteryScope={batteryScope} unifiedPvResult={unifiedPvResult} /> : <GeneralLoadResultTable load={load} design={solarDesign} />}
          {safeSolarDesign.warnings.map((item) => <div key={item} className="shil-inline-warning">{item}</div>)}
        </div>

        <div className="shil-system-nav-row shil-system-nav-row-final"><button type="button" className="shil-soft-button" onClick={goPreviousFromSystem}>Ù…Ø±Ø­Ù„Ù‡ Ù‚Ø¨Ù„</button><button type="button" className="shil-soft-button" onClick={saveSystemDraftOnly}>Ø°Ø®ÛŒØ±Ù‡ Ù¾ÛŒØ´â€ŒÙ†ÙˆÛŒØ³</button><button type="button" className="shil-primary-wide shil-confirm-config-button" onClick={confirmSolar}>ØªØ£ÛŒÛŒØ¯ Ù…Ø±Ø­Ù„Ù‡</button></div>
      </section>
    </EngineeringPageShell>
  );
}




