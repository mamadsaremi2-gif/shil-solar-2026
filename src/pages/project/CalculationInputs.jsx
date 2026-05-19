import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ShilPageShell from "../../components/ShilPageShell.jsx";
import ProjectMiniRail from "../../components/ProjectMiniRail.jsx";
import { consumerEquipmentLibrary, searchConsumerEquipment } from "../../data/catalogs/consumerEquipmentLibrary.js";
import { buildScenarioCalculationInput } from "../../core/scenario/scenarioToEngineeringForm.js";
import { METHOD_LABELS, persistLoadEngineResult, runLoadEngine } from "../../core/calculation/loadEngine.js";

function readDraft(key) {
  try { return JSON.parse(localStorage.getItem(key) || "null"); }
  catch { return null; }
}

function mergeItemWithOverride(item, override = {}) {
  return {
    ...item,
    ...override,
    quantity: Number(override.quantity ?? item.quantity ?? 1) || 1,
    usageHoursPerDay: Number(override.usageHoursPerDay ?? item.usageHoursPerDay ?? 0) || 0,
    hasSoftStarter: Boolean(override.hasSoftStarter ?? item.hasSoftStarter ?? false),
  };
}

export default function CalculationInputs() {
  const navigate = useNavigate();
  const params = useParams();
  const domain = params.domain || localStorage.getItem("shil:scenarioDomain") || "solar";
  const method = params.method || localStorage.getItem("shil:calculationMethod") || "equipment";

  const [query, setQuery] = useState("");
  const [isEquipmentPickerOpen, setIsEquipmentPickerOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [itemOverrides, setItemOverrides] = useState({});
  const [showExpert, setShowExpert] = useState(false);
  const [manualEnergyKWh, setManualEnergyKWh] = useState("");
  const [manualPowerW, setManualPowerW] = useState("");
  const [manualCurrentA, setManualCurrentA] = useState("");
  const [manualVoltage, setManualVoltage] = useState(domain === "emergency" ? "220" : "220");
  const [manualHours, setManualHours] = useState(domain === "emergency" ? "6" : "5");

  const scenario = useMemo(() => readDraft("shil:selectedScenario"), []);
  const environment = useMemo(() => readDraft("shil:environmentDraft"), []);
  const environmentAssessment = useMemo(() => readDraft("shil:environmentAssessment"), []);

  const items = useMemo(() => {
    const results = searchConsumerEquipment(query);
    return results.slice(0, 250);
  }, [query]);

  const selectedItems = useMemo(() => {
    return consumerEquipmentLibrary
      .filter((item) => selectedIds.has(item.id))
      .map((item) => mergeItemWithOverride(item, itemOverrides[item.id]));
  }, [selectedIds, itemOverrides]);

  const enginePreview = useMemo(() => {
    const voltage = Number(manualVoltage || 220);
    const powerFromCurrent = method === "current" && manualCurrentA ? Number(manualCurrentA) * voltage : 0;
    const energyFromManual = method === "energy" && manualEnergyKWh ? Number(manualEnergyKWh) * 1000 : 0;
    const powerFromManual = method === "power" && manualPowerW ? Number(manualPowerW) : 0;
    return runLoadEngine({
      domain,
      method,
      scenario,
      environment,
      environmentAssessment,
      selectedItems,
      voltageAC: voltage,
      manualEnergyWh: energyFromManual,
      manualPowerW: powerFromCurrent || powerFromManual,
      manualHours: Number(manualHours || 0),
    });
  }, [domain, method, scenario, environment, environmentAssessment, selectedItems, manualEnergyKWh, manualPowerW, manualCurrentA, manualVoltage, manualHours]);

  const toggleItem = (item) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) next.delete(item.id);
      else {
        next.add(item.id);
        setItemOverrides((old) => ({
          ...old,
          [item.id]: {
            quantity: old[item.id]?.quantity ?? 1,
            usageHoursPerDay: old[item.id]?.usageHoursPerDay ?? item.usageHoursPerDay,
            hasSoftStarter: old[item.id]?.hasSoftStarter ?? false,
          },
        }));
      }
      return next;
    });
  };

  const patchOverride = (id, patch) => {
    setItemOverrides((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), ...patch } }));
  };

  const applySmartDetails = () => {
    setShowExpert(true);
    setItemOverrides((prev) => {
      const next = { ...prev };
      consumerEquipmentLibrary.forEach((item) => {
        if (!selectedIds.has(item.id)) return;
        const isMotor = item.type === "inductive" || Number(item.startupFactor || item.surgeFactor || 1) > 1.7;
        next[item.id] = {
          ...(next[item.id] || {}),
          quantity: next[item.id]?.quantity ?? 1,
          usageHoursPerDay: next[item.id]?.usageHoursPerDay ?? item.usageHoursPerDay,
          simultaneityFactor: next[item.id]?.simultaneityFactor ?? item.simultaneityFactor ?? item.diversityFactor ?? 1,
          powerFactor: next[item.id]?.powerFactor ?? item.powerFactor ?? (isMotor ? 0.82 : 0.95),
          isMotor,
          hasSoftStarter: next[item.id]?.hasSoftStarter ?? false,
          loadKind: isMotor ? "motor" : "resistive/electronic",
        };
      });
      return next;
    });
  };

  const confirmLoad = () => {
    const result = persistLoadEngineResult({
      domain,
      method,
      scenario,
      environment,
      environmentAssessment,
      selectedItems,
      voltageAC: Number(manualVoltage || 220),
      manualEnergyWh: method === "energy" && manualEnergyKWh ? Number(manualEnergyKWh) * 1000 : 0,
      manualPowerW: method === "current" && manualCurrentA ? Number(manualCurrentA) * Number(manualVoltage || 220) : Number(manualPowerW || 0),
      manualHours: Number(manualHours || 0),
    });

    localStorage.setItem("shil:loadEngineResult", JSON.stringify(result));
    buildScenarioCalculationInput();
    navigate(`/new-project/system/${domain}?from=calculation-inputs`);
  };

  return (
    <ShilPageShell title={METHOD_LABELS[method] || "ÙˆØ±ÙˆØ¯ÛŒ Ù…Ø­Ø§Ø³Ø¨Ø§Øª"}>
      <ProjectMiniRail />
      <div className="shil-equipment-page">
        <section className="shil-env-card">
          <h3 className="shil-section-title">Ø²Ù…ÛŒÙ†Ù‡ Ù…Ø­Ø§Ø³Ø¨Ø§Øª</h3>
          <div className="shil-summary-grid">
            <div><span>Ø±ÙˆØ´</span><strong>{METHOD_LABELS[method] || method}</strong></div>
            <div><span>Ù‡Ø³ØªÙ‡</span><strong>{domain === "emergency" ? "Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ" : "Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ"}</strong></div>
            <div><span>Ø³Ù†Ø§Ø±ÛŒÙˆ</span><strong>{scenario?.title || "Ø¯Ø³ØªÛŒ"}</strong></div>
            <div><span>Ø´Ù‡Ø±</span><strong>{environment?.city || "Ø§ØµÙÙ‡Ø§Ù†"}</strong></div>
          </div>
        </section>

        {method === "equipment" || method === "profile" ? (
          <section className="shil-env-card shil-equipment-picker-card">
            <h3 className="shil-section-title">Ù„ÛŒØ³Øª ØªØ¬Ù‡ÛŒØ²Ø§Øª</h3>
            <button type="button" className="shil-equipment-field" onClick={() => setIsEquipmentPickerOpen((v) => !v)}>
              <span>Ø§Ù†ØªØ®Ø§Ø¨ Ø§Ø² Ø¨Ø§Ù†Ú© Û²ÛµÛ° ØªØ¬Ù‡ÛŒØ²</span>
              <strong>{selectedItems.length ? `${selectedItems.length} ØªØ¬Ù‡ÛŒØ² Ø§Ù†ØªØ®Ø§Ø¨ Ø´Ø¯Ù‡` : "Ø¨Ø§Ø² Ú©Ø±Ø¯Ù† Ù„ÛŒØ³Øª"}</strong>
            </button>

            {isEquipmentPickerOpen ? (
              <div className="shil-equipment-picker-panel">
                <input
                  className="shil-input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ø¬Ø³ØªØ¬Ùˆ: Ù¾Ù…Ù¾ØŒ Ø±ÙˆØ´Ù†Ø§ÛŒÛŒØŒ Ú©ÙˆÙ„Ø±ØŒ Ø³Ø±ÙˆØ±..."
                />
                <div className="shil-equipment-scroll-list">
                  {items.map((item) => {
                    const selected = selectedIds.has(item.id);
                    const isMotor = item.type === "inductive" || Number(item.surgeFactor || item.startupFactor || 1) > 1.7;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`shil-equipment-option ${selected ? "active" : ""}`}
                        onClick={() => toggleItem(item)}
                      >
                        <strong>{item.title}</strong>
                        <span>{item.ratedPowerW}W Â· {item.usageHoursPerDay}h Â· {isMotor ? "Ù…ÙˆØªÙˆØ±ÛŒ" : "Ù…ØµØ±ÙÛŒ"}</span>
                      </button>
                    );
                  })}
                </div>
                <button type="button" className="shil-secondary-wide" onClick={() => setIsEquipmentPickerOpen(false)}>
                  Ø¨Ø³ØªÙ† Ù„ÛŒØ³Øª ØªØ¬Ù‡ÛŒØ²Ø§Øª
                </button>
              </div>
            ) : null}

            <div className="shil-equipment-actions">
              <button type="button" className="shil-secondary-wide" onClick={applySmartDetails}>
                Ø§Ø¹Ù…Ø§Ù„ Ù‡ÙˆØ´Ù…Ù†Ø¯
              </button>
              <button type="button" className="shil-secondary-wide" onClick={() => setShowExpert((v) => !v)}>
                {showExpert ? "Ø®Ù„Ø§ØµÙ‡ Ø³Ø§Ø¯Ù‡" : "Ù†Ù…Ø§ÛŒØ´ Ø¬Ø²Ø¦ÛŒØ§Øª ØªØ®ØµØµÛŒ"}
              </button>
            </div>

            <p className="shil-muted-note">Ø§Ù†ØªØ®Ø§Ø¨ ØªØ¬Ù‡ÛŒØ²Ø§Øª ÙÙ‚Ø· Ø¯Ø§Ø®Ù„ Ù‡Ù…ÛŒÙ† ÙÛŒÙ„Ø¯ Ø§Ù†Ø¬Ø§Ù… Ù…ÛŒâ€ŒØ´ÙˆØ¯Ø› Ø¨Ø§ Ø¬Ø³ØªØ¬Ùˆ ÛŒØ§ Ø§Ø³Ú©Ø±ÙˆÙ„ Ø§Ù†ØªØ®Ø§Ø¨ Ú©Ù†ØŒ Ø³Ù¾Ø³ Ù„ÛŒØ³Øª Ø±Ø§ Ø¨Ø¨Ù†Ø¯ Ùˆ ØªØ¬Ù‡ÛŒØ²Ø§Øª Ø§Ù†ØªØ®Ø§Ø¨ÛŒ Ø±Ø§ Ø§ØµÙ„Ø§Ø­ Ú©Ù†.</p>
          </section>
        ) : null}

        {method !== "equipment" ? (
          <section className="shil-env-card">
            <h3 className="shil-section-title">ÙˆØ±ÙˆØ¯ÛŒ Ù…Ø³ØªÙ‚ÛŒÙ… Ø±ÙˆØ´ Ø§Ù†ØªØ®Ø§Ø¨â€ŒØ´Ø¯Ù‡</h3>
            <div className="shil-form-grid">
              {method === "energy" ? <label>Ø§Ù†Ø±Ú˜ÛŒ Ø±ÙˆØ²Ø§Ù†Ù‡ kWh<input className="shil-input" value={manualEnergyKWh} onChange={(e) => setManualEnergyKWh(e.target.value)} placeholder="Ù…Ø«Ù„Ø§Ù‹ 12.5" inputMode="decimal" /></label> : null}
              {method === "power" ? <label>ØªÙˆØ§Ù† Ú©Ù„ W<input className="shil-input" value={manualPowerW} onChange={(e) => setManualPowerW(e.target.value)} placeholder="Ù…Ø«Ù„Ø§Ù‹ 3500" inputMode="numeric" /></label> : null}
              {method === "current" ? <label>Ø¬Ø±ÛŒØ§Ù† Ú©Ù„ A<input className="shil-input" value={manualCurrentA} onChange={(e) => setManualCurrentA(e.target.value)} placeholder="Ù…Ø«Ù„Ø§Ù‹ 16" inputMode="decimal" /></label> : null}
              <label>ÙˆÙ„ØªØ§Ú˜ AC<input className="shil-input" value={manualVoltage} onChange={(e) => setManualVoltage(e.target.value)} inputMode="numeric" /></label>
              <label>Ø³Ø§Ø¹Øª Ø§Ø³ØªÙØ§Ø¯Ù‡ / Ø²Ù…Ø§Ù† Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ Ù…ÙˆØ±Ø¯ Ù†Ø¸Ø±<input className="shil-input" value={manualHours} onChange={(e) => setManualHours(e.target.value)} inputMode="decimal" /></label>
            </div>
          </section>
        ) : null}

        <section className="shil-env-card">
          <h3 className="shil-section-title">Ø®Ø±ÙˆØ¬ÛŒ Ø²Ù†Ø¯Ù‡ Ù…ÙˆØªÙˆØ± Ø¨Ø§Ø±</h3>
          <div className="shil-summary-grid">
            <div><span>ØªØ¹Ø¯Ø§Ø¯ ØªØ¬Ù‡ÛŒØ²Ø§Øª</span><strong>{enginePreview.selectedCount || "Auto"}</strong></div>
            <div><span>ØªÙˆØ§Ù† Ú©Ù„</span><strong>{enginePreview.totalPowerW} W</strong></div>
            <div><span>Ø§Ù†Ø±Ú˜ÛŒ Ø±ÙˆØ²Ø§Ù†Ù‡</span><strong>{enginePreview.totalEnergyKWh} kWh</strong></div>
            <div><span>Ø¬Ø±ÛŒØ§Ù† AC</span><strong>{enginePreview.acCurrentA} A</strong></div>
            <div><span>Ø¬Ø±ÛŒØ§Ù† Ø±Ø§Ù‡â€ŒØ§Ù†Ø¯Ø§Ø²ÛŒ</span><strong>{enginePreview.startCurrentA} A</strong></div>
            <div><span>Ù¾ÛŒÚ© Ø§Ø³ØªØ§Ø±Øª</span><strong>{enginePreview.surgePowerW} W</strong></div>
            <div><span>Ù…ÙˆØªÙˆØ±ÛŒ/Ø³Ø§ÙØª</span><strong>{enginePreview.motorCount || 0}/{enginePreview.softStarterCount || 0}</strong></div>
            <div><span>Ø¨Ø§ØªØ±ÛŒ Ù…Ø±Ø¬Ø¹</span><strong>{Math.round(enginePreview.recommendedBatteryWh / 1000)} kWh</strong></div>
          </div>
          {showExpert ? (
            <div className="shil-expert-box">
              <strong>Ù…Ù†Ø·Ù‚ Ù¾Ø´Øª Ù¾Ø±Ø¯Ù‡:</strong>
              <p>{enginePreview.expertSummary?.rule}</p>
              <p>{enginePreview.expertSummary?.motorStartRule}</p>
            </div>
          ) : null}
          {enginePreview.warnings?.length ? (
            <ul className="shil-warning-list">
              {enginePreview.warnings.map((warning) => <li key={warning}>{warning}</li>)}
            </ul>
          ) : null}
        </section>

        {method === "profile" ? (
          <section className="shil-env-card">
            <h3 className="shil-section-title">Ù¾Ø±ÙˆÙØ§ÛŒÙ„ Ù…ØµØ±Ù ØªØ®Ù…ÛŒÙ†ÛŒ</h3>
            <div className="shil-summary-grid">
              <div><span>ØµØ¨Ø­</span><strong>{Math.round(enginePreview.loadProfile.buckets.morning / 1000)} kWh</strong></div>
              <div><span>Ø¸Ù‡Ø±</span><strong>{Math.round(enginePreview.loadProfile.buckets.noon / 1000)} kWh</strong></div>
              <div><span>Ø¹ØµØ±</span><strong>{Math.round(enginePreview.loadProfile.buckets.evening / 1000)} kWh</strong></div>
              <div><span>Ø´Ø¨</span><strong>{Math.round(enginePreview.loadProfile.buckets.night / 1000)} kWh</strong></div>
            </div>
          </section>
        ) : null}

        {method === "equipment" || method === "profile" ? (
          <section className="shil-selected-equipment-list">
            <h3 className="shil-section-title">ØªØ¬Ù‡ÛŒØ²Ø§Øª Ø§Ù†ØªØ®Ø§Ø¨ÛŒ</h3>
            {!selectedItems.length ? (
              <div className="shil-empty-selection">Ù‡Ù†ÙˆØ² ØªØ¬Ù‡ÛŒØ²ÛŒ Ø§Ù†ØªØ®Ø§Ø¨ Ù†Ø´Ø¯Ù‡ Ø§Ø³Øª.</div>
            ) : selectedItems.map((item) => {
              const override = itemOverrides[item.id] || {};
              const preview = enginePreview.selectedItems?.find((x) => x.id === item.id);
              const isMotor = item.type === "inductive" || Number(item.surgeFactor || item.startupFactor || 1) > 1.7;
              return (
                <article key={item.id} className="shil-equipment-card active">
                  <div className="shil-selected-equipment-head">
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.category} | {isMotor ? "Ù…ÙˆØªÙˆØ±ÛŒ" : "Ù…Ù‚Ø§ÙˆÙ…ØªÛŒ/Ø§Ù„Ú©ØªØ±ÙˆÙ†ÛŒÚ©ÛŒ"}</span>
                    </div>
                    <button type="button" className="shil-remove-equipment" onClick={() => toggleItem(item)}>Ø­Ø°Ù</button>
                  </div>
                  <div className="shil-equipment-controls">
                    <label>ØªØ¹Ø¯Ø§Ø¯<input className="shil-input" value={override.quantity ?? item.quantity ?? 1} onChange={(e) => patchOverride(item.id, { quantity: e.target.value })} inputMode="numeric" /></label>
                    <label>Ø³Ø§Ø¹Øª Ù…ØµØ±Ù<input className="shil-input" value={override.usageHoursPerDay ?? item.usageHoursPerDay} onChange={(e) => patchOverride(item.id, { usageHoursPerDay: e.target.value })} inputMode="decimal" /></label>
                    {showExpert ? (
                      <>
                        <label>Ø¶Ø±ÛŒØ¨ Ù‡Ù…Ø²Ù…Ø§Ù†ÛŒ<input className="shil-input" value={override.simultaneityFactor ?? item.simultaneityFactor ?? item.diversityFactor ?? 1} onChange={(e) => patchOverride(item.id, { simultaneityFactor: e.target.value })} inputMode="decimal" /></label>
                        <label>Ø±Ø§Ù†Ø¯Ù…Ø§Ù†/PF<input className="shil-input" value={override.powerFactor ?? item.powerFactor ?? 0.95} onChange={(e) => patchOverride(item.id, { powerFactor: e.target.value })} inputMode="decimal" /></label>
                      </>
                    ) : null}
                    {isMotor ? (
                      <label className="shil-check-row">
                        <input type="checkbox" checked={Boolean(override.hasSoftStarter)} onChange={(e) => patchOverride(item.id, { hasSoftStarter: e.target.checked })} />
                        Ø³Ø§ÙØªâ€ŒØ§Ø³ØªØ§Ø±ØªØ± Ø¯Ø§Ø±Ø¯Ø› Ø¬Ø±ÛŒØ§Ù† Ø±Ø§Ù‡â€ŒØ§Ù†Ø¯Ø§Ø²ÛŒ Ø§Ø² Û².ÛµÃ— Ø¨Ù‡ Û±.Û²Ã— Ø¬Ø±ÛŒØ§Ù† Ù†Ø§Ù…ÛŒ Ú©Ø§Ù‡Ø´ ÛŒØ§Ø¨Ø¯
                      </label>
                    ) : showExpert ? (
                      <div className="shil-load-kind-note">Ù†ÙˆØ¹ Ø¨Ø§Ø±: Ù…Ù‚Ø§ÙˆÙ…ØªÛŒ/Ø§Ù„Ú©ØªØ±ÙˆÙ†ÛŒÚ©ÛŒ</div>
                    ) : null}
                    {showExpert && preview ? (
                      <div className="shil-expert-mini">
                        <span>Ø¬Ø±ÛŒØ§Ù† Ù†Ø§Ù…ÛŒ: {preview.nominalCurrentA} A</span>
                        <span>Ø¬Ø±ÛŒØ§Ù† Ú©Ø§Ø±Ú©Ø±Ø¯: {preview.runningCurrentA} A</span>
                        <span>Ø¬Ø±ÛŒØ§Ù† Ø±Ø§Ù‡â€ŒØ§Ù†Ø¯Ø§Ø²ÛŒ: {preview.startCurrentA} A</span>
                        <span>Ø¶Ø±ÛŒØ¨ Ø§Ø³ØªØ§Ø±Øª: Ã—{preview.currentStartFactor}</span>
                        <small>{preview.expertReason}</small>
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </section>
        ) : null}

        <button type="button" className="shil-primary-wide" onClick={confirmLoad}>
          ØªØ£ÛŒÛŒØ¯ Ø§Ø·Ù„Ø§Ø¹Ø§Øª Ùˆ ÙˆØ±ÙˆØ¯ Ø¨Ù‡ Ù¾ÛŒÚ©Ø±Ø¨Ù†Ø¯ÛŒ ØªÙ†Ø¸ÛŒÙ…Ø§Øª
        </button>
      </div>
    </ShilPageShell>
  );
}
