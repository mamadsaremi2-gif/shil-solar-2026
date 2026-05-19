import React, { useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import ShilPageShell from "../components/ShilPageShell.jsx";
import { clearSession, getCurrentSession, readAllUserRecords } from "../auth/session.js";
import {
  ADMIN_SYSTEM_VERSION,
  DEFAULT_ADMIN_DEFAULTS,
  DEFAULT_EQUIPMENT_CATALOG,
  DEFAULT_PROJECT_PATH_CARDS,
  changeAdminPin,
  createAdminSnapshot,
  exportAdminJson,
  fileToDataUrl,
  importAdminJson,
  isAdminPinVerified,
  readAdminAuditLog,
  readAdminCatalog,
  readAdminDefaults,
  readAdminProjectPathCards,
  readAdminSecurity,
  readAdminSnapshots,
  resetAdminSystem,
  restoreAdminSnapshot,
  saveAdminCatalog,
  saveAdminDefaults,
  saveAdminProjectPathCards,
  validateAdminSystem,
  verifyAdminPin,
} from "../admin/adminStore.js";

function StatCard({ title, value, note, status }) {
  return (
    <article className={`shil-admin-stat ${status || ""}`}>
      <strong>{value}</strong>
      <span>{title}</span>
      {note ? <small>{note}</small> : null}
    </article>
  );
}

function AdminPanel({ title, subtitle, children, action }) {
  return (
    <article className="shil-admin-panel">
      <div className="shil-admin-panel-head">
        <div>
          <h3>{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {action || null}
      </div>
      {children}
    </article>
  );
}

function AdminInput({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <label className="shil-admin-field">
      <span>{label}</span>
      <input type={type} value={value ?? ""} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} dir="auto" />
    </label>
  );
}

function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function normalizeNumber(value, fallback = 0) {
  const parsed = Number(String(value).replace(/[Û°-Û¹]/g, (digit) => "Û°Û±Û²Û³Û´ÛµÛ¶Û·Û¸Û¹".indexOf(digit)).replace(/[Ù -Ù©]/g, (digit) => "Ù Ù¡Ù¢Ù£Ù¤Ù¥Ù¦Ù§Ù¨Ù©".indexOf(digit)));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function AdminGate({ onVerified }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  return (
    <ShilPageShell title="ÙˆØ±ÙˆØ¯ Ø§Ø¯Ù…ÛŒÙ†">
      <section className="shil-admin-lock">
        <span>Admin Secure Layer</span>
        <h2>ØªØ£ÛŒÛŒØ¯ Ø¯Ø³ØªØ±Ø³ÛŒ Ø§Ø¯Ù…ÛŒÙ†</h2>
        <p>Ø¨Ø±Ø§ÛŒ ÙˆØ±ÙˆØ¯ Ø¨Ù‡ Ù…Ø±Ú©Ø² Ù…Ø¯ÛŒØ±ÛŒØªØŒ Ø±Ù…Ø² Ø§Ø¯Ù…ÛŒÙ† Ø±Ø§ ÙˆØ§Ø±Ø¯ Ú©Ù†ÛŒØ¯. Ø±Ù…Ø² Ù¾ÛŒØ´â€ŒÙØ±Ø¶ Ù„ÙˆÚ©Ø§Ù„: Û±Û³Û¶Û¶</p>
        <input value={pin} onChange={(event) => setPin(event.target.value)} placeholder="Ø±Ù…Ø² Ø§Ø¯Ù…ÛŒÙ†" inputMode="numeric" dir="auto" />
        {error ? <small>{error}</small> : null}
        <button type="button" className="shil-primary-wide" onClick={() => {
          if (verifyAdminPin(pin)) onVerified();
          else setError("Ø±Ù…Ø² Ø§Ø¯Ù…ÛŒÙ† ØµØ­ÛŒØ­ Ù†ÛŒØ³Øª.");
        }}>ÙˆØ±ÙˆØ¯ Ø¨Ù‡ Ú©Ø§Ø±ØªØ§Ø¨Ù„ Ø§Ø¯Ù…ÛŒÙ†</button>
      </section>
    </ShilPageShell>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const session = getCurrentSession();
  const importRef = useRef(null);

  const [unlocked, setUnlocked] = useState(() => isAdminPinVerified());
  const [tab, setTab] = useState("overview");
  const [cards, setCards] = useState(() => readAdminProjectPathCards());
  const [catalog, setCatalog] = useState(() => readAdminCatalog());
  const [defaults, setDefaults] = useState(() => readAdminDefaults());
  const [audit, setAudit] = useState(() => readAdminAuditLog());
  const [snapshots, setSnapshots] = useState(() => readAdminSnapshots());
  const [security, setSecurity] = useState(() => readAdminSecurity());
  const [message, setMessage] = useState("");
  const [newPin, setNewPin] = useState("");
  const [health, setHealth] = useState(() => validateAdminSystem());

  const data = useMemo(() => {
    const feedback = readAllUserRecords("shil-feedback");
    const assistant = readAllUserRecords("shil-assistant-questions");
    const projects = readAllUserRecords("shil-projects");
    const userIds = new Set([...feedback, ...assistant, ...projects].map((item) => item.userId).filter(Boolean));
    return { feedback, assistant, projects, userCount: userIds.size };
  }, []);

  const catalogStats = useMemo(() => ({
    panels: catalog.solarPanels?.filter((item) => item.active !== false).length || 0,
    inverters: catalog.solarInverters?.filter((item) => item.active !== false).length || 0,
    batteries: catalog.batteries?.filter((item) => item.active !== false).length || 0,
    emergency: catalog.emergencyPower?.filter((item) => item.active !== false).length || 0,
    protections: catalog.protections?.filter((item) => item.active !== false).length || 0,
  }), [catalog]);

  if (session?.role !== "admin") return <Navigate to="/login" replace />;
  if (!unlocked) return <AdminGate onVerified={() => { setUnlocked(true); setSecurity(readAdminSecurity()); }} />;

  function syncAdminState() {
    setAudit(readAdminAuditLog());
    setSnapshots(readAdminSnapshots());
    setHealth(validateAdminSystem());
    setSecurity(readAdminSecurity());
  }

  function notify(text) {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2600);
    syncAdminState();
  }

  function logout() {
    clearSession();
    navigate("/login", { replace: true });
  }

  function updateCard(index, patch) {
    setCards((prev) => prev.map((card, itemIndex) => (itemIndex === index ? { ...card, ...patch } : card)));
  }

  function addCard() {
    setCards((prev) => [...prev, { key: `path-${Date.now()}`, title: "Ù…Ø³ÛŒØ± Ø¬Ø¯ÛŒØ¯", description: "Ø¯Ø± Ø­Ø§Ù„ ØªÙˆØ³Ø¹Ù‡", image: "", calculationDomain: "future", active: true, order: prev.length + 1 }]);
  }

  function removeCard(index) {
    setCards((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  }

  async function uploadCardPng(index, file) {
    try {
      const image = await fileToDataUrl(file, defaults.maxPngKb);
      updateCard(index, { image });
      notify("ØªØµÙˆÛŒØ± PNG Ú©Ø§Ø±Øª Ù…Ø³ÛŒØ± Ù¾Ø±ÙˆÚ˜Ù‡ Ø¢Ù…Ø§Ø¯Ù‡ Ø°Ø®ÛŒØ±Ù‡ Ø´Ø¯.");
    } catch (error) {
      notify(error.message || "Ø¨Ø§Ø±Ú¯Ø°Ø§Ø±ÛŒ ØªØµÙˆÛŒØ± Ø§Ù†Ø¬Ø§Ù… Ù†Ø´Ø¯.");
    }
  }

  function saveCards() {
    const saved = saveAdminProjectPathCards(cards);
    setCards(saved);
    notify("Ú©Ø§Ø±Øªâ€ŒÙ‡Ø§ÛŒ Ø§Ù†ØªØ®Ø§Ø¨ Ù…Ø³ÛŒØ± Ù¾Ø±ÙˆÚ˜Ù‡ Ø°Ø®ÛŒØ±Ù‡ Ø´Ø¯Ù†Ø¯.");
  }

  function updateCatalogItem(group, index, patch) {
    setCatalog((prev) => ({ ...prev, [group]: (prev[group] || []).map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)) }));
  }

  function addCatalogItem(group) {
    const templates = {
      solarPanels: { id: `panel-${Date.now()}`, title: "Ù¾Ù†Ù„ Ø¬Ø¯ÛŒØ¯", brand: "", powerW: 620, voltageV: 41, currentA: 15, efficiency: 22, active: true },
      solarInverters: { id: `inv-${Date.now()}`, title: "Ø§ÛŒÙ†ÙˆØ±ØªØ± Ø¬Ø¯ÛŒØ¯", brand: "", powerKw: 5, dcVoltageV: 48, mpptMinV: 120, mpptMaxV: 450, type: "hybrid", active: true },
      batteries: { id: `bat-${Date.now()}`, title: "Ø¨Ø§ØªØ±ÛŒ Ø¬Ø¯ÛŒØ¯", brand: "", voltageV: 48, capacityAh: 100, chemistry: "LiFePO4", dod: 0.8, active: true },
      emergencyPower: { id: `ep-${Date.now()}`, title: "Ø¯Ø³ØªÚ¯Ø§Ù‡ Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ Ø¬Ø¯ÛŒØ¯", brand: "", powerKw: 5, batteryVoltageV: 48, active: true },
      protections: { id: `prot-${Date.now()}`, title: "Ø­ÙØ§Ø¸Øª Ø¬Ø¯ÛŒØ¯", group: "shared", rating: "", active: true },
    };
    setCatalog((prev) => ({ ...prev, [group]: [...(prev[group] || []), templates[group]] }));
  }

  function removeCatalogItem(group, index) {
    setCatalog((prev) => ({ ...prev, [group]: (prev[group] || []).filter((_, itemIndex) => itemIndex !== index) }));
  }

  function saveCatalogData() {
    const saved = saveAdminCatalog(catalog);
    setCatalog(saved);
    notify("Ø¨Ø§Ù†Ú© ØªØ¬Ù‡ÛŒØ²Ø§Øª Ø°Ø®ÛŒØ±Ù‡ Ø´Ø¯.");
  }

  function saveDefaultsData() {
    const saved = saveAdminDefaults({
      ...defaults,
      solarPanelDefaultW: normalizeNumber(defaults.solarPanelDefaultW, DEFAULT_ADMIN_DEFAULTS.solarPanelDefaultW),
      solarPanelManualW: normalizeNumber(defaults.solarPanelManualW, DEFAULT_ADMIN_DEFAULTS.solarPanelManualW),
      defaultAutonomyDays: normalizeNumber(defaults.defaultAutonomyDays, DEFAULT_ADMIN_DEFAULTS.defaultAutonomyDays),
      defaultSafetyFactor: normalizeNumber(defaults.defaultSafetyFactor, DEFAULT_ADMIN_DEFAULTS.defaultSafetyFactor),
      emergencyRequiredHours: normalizeNumber(defaults.emergencyRequiredHours, DEFAULT_ADMIN_DEFAULTS.emergencyRequiredHours),
      emergencySafetyFactor: normalizeNumber(defaults.emergencySafetyFactor, DEFAULT_ADMIN_DEFAULTS.emergencySafetyFactor),
      maxPngKb: normalizeNumber(defaults.maxPngKb, DEFAULT_ADMIN_DEFAULTS.maxPngKb),
    });
    setDefaults(saved);
    notify("ØªÙ†Ø¸ÛŒÙ…Ø§Øª Ù¾ÛŒØ´â€ŒÙØ±Ø¶ Ù…Ù‡Ù†Ø¯Ø³ÛŒ Ø°Ø®ÛŒØ±Ù‡ Ø´Ø¯.");
  }

  async function importConfig(file) {
    if (!file) return;
    try {
      const text = await file.text();
      importAdminJson(JSON.parse(text));
      setCards(readAdminProjectPathCards());
      setCatalog(readAdminCatalog());
      setDefaults(readAdminDefaults());
      notify("ØªÙ†Ø¸ÛŒÙ…Ø§Øª Ø§Ø¯Ù…ÛŒÙ† Ø§Ø² ÙØ§ÛŒÙ„ JSON ÙˆØ§Ø±Ø¯ Ø´Ø¯.");
    } catch (error) {
      notify(error.message || "ÙˆØ±ÙˆØ¯ ÙØ§ÛŒÙ„ ØªÙ†Ø¸ÛŒÙ…Ø§Øª Ø§Ù†Ø¬Ø§Ù… Ù†Ø´Ø¯.");
    }
  }

  function resetAll() {
    resetAdminSystem();
    setCards(DEFAULT_PROJECT_PATH_CARDS);
    setCatalog(DEFAULT_EQUIPMENT_CATALOG);
    setDefaults(DEFAULT_ADMIN_DEFAULTS);
    notify("ØªÙ†Ø¸ÛŒÙ…Ø§Øª Ø§Ø¯Ù…ÛŒÙ† Ø¨Ù‡ Ø­Ø§Ù„Øª Ø§Ø³ØªØ§Ù†Ø¯Ø§Ø±Ø¯ Ø¨Ø±Ú¯Ø´Øª.");
  }

  function makeSnapshot() {
    setSnapshots(createAdminSnapshot("Ù†Ø³Ø®Ù‡ Ø¯Ø³ØªÛŒ Ø§Ø¯Ù…ÛŒÙ†"));
    notify("Ù†Ø³Ø®Ù‡ Ù¾Ø´ØªÛŒØ¨Ø§Ù† Ø¯Ø³ØªÛŒ Ø³Ø§Ø®ØªÙ‡ Ø´Ø¯.");
  }

  function restoreSnapshot(id) {
    try {
      restoreAdminSnapshot(id);
      setCards(readAdminProjectPathCards());
      setCatalog(readAdminCatalog());
      setDefaults(readAdminDefaults());
      notify("Ù†Ø³Ø®Ù‡ Ù¾Ø´ØªÛŒØ¨Ø§Ù† Ø¨Ø§Ø²ÛŒØ§Ø¨ÛŒ Ø´Ø¯.");
    } catch (error) {
      notify(error.message || "Ø¨Ø§Ø²ÛŒØ§Ø¨ÛŒ Ø§Ù†Ø¬Ø§Ù… Ù†Ø´Ø¯.");
    }
  }

  function changePin() {
    try {
      changeAdminPin(newPin);
      setNewPin("");
      notify("Ø±Ù…Ø² Ø§Ø¯Ù…ÛŒÙ† ØªØºÛŒÛŒØ± Ú©Ø±Ø¯.");
    } catch (error) {
      notify(error.message || "ØªØºÛŒÛŒØ± Ø±Ù…Ø² Ø§Ù†Ø¬Ø§Ù… Ù†Ø´Ø¯.");
    }
  }

  const tabs = [
    ["overview", "Ù†Ù…Ø§ÛŒ Ú©Ù„ÛŒ"],
    ["cards", "Ú©Ø§Ø±Øªâ€ŒÙ‡Ø§ÛŒ Ù…Ø³ÛŒØ±"],
    ["defaults", "Ù¾ÛŒØ´â€ŒÙØ±Ø¶â€ŒÙ‡Ø§"],
    ["catalog", "Ø¨Ø§Ù†Ú© ØªØ¬Ù‡ÛŒØ²Ø§Øª"],
    ["security", "Ø§Ù…Ù†ÛŒØª Ùˆ Ù†Ø³Ø®Ù‡"],
  ];

  return (
    <ShilPageShell title="Ú©Ø§Ø±ØªØ§Ø¨Ù„ Ø§Ø¯Ù…ÛŒÙ† SHIL">
      <section className="shil-admin-hero">
        <div>
          <span>{ADMIN_SYSTEM_VERSION}</span>
          <h2>Ù…Ø±Ú©Ø² Ù…Ø¯ÛŒØ±ÛŒØª Ú©Ø§Ù…Ù„ SHIL</h2>
          <p>Ù…Ø¯ÛŒØ±ÛŒØª Ú©Ø§Ø±Øªâ€ŒÙ‡Ø§ÛŒ Ù…Ø³ÛŒØ± Ù¾Ø±ÙˆÚ˜Ù‡ØŒ ØªØµØ§ÙˆÛŒØ± PNGØŒ Ø¨Ø§Ù†Ú© ØªØ¬Ù‡ÛŒØ²Ø§ØªØŒ Ø­ÙØ§Ø¸Øªâ€ŒÙ‡Ø§ØŒ Ù¾ÛŒØ´â€ŒÙØ±Ø¶â€ŒÙ‡Ø§ÛŒ Ù…Ù‡Ù†Ø¯Ø³ÛŒØŒ Ù†Ø³Ø®Ù‡ Ù¾Ø´ØªÛŒØ¨Ø§Ù†ØŒ Ø§Ù…Ù†ÛŒØª Ø§Ø¯Ù…ÛŒÙ† Ùˆ Ù„Ø§Ú¯ ØªØºÛŒÛŒØ±Ø§Øª.</p>
        </div>
        <button type="button" className="shil-guest-btn" onClick={logout}>Ø®Ø±ÙˆØ¬ Ø§Ø² Ú©Ø§Ø±ØªØ§Ø¨Ù„ Ø§Ø¯Ù…ÛŒÙ†</button>
      </section>

      {message ? <div className="shil-admin-toast">{message}</div> : null}

      <section className="shil-admin-tabs">
        {tabs.map(([key, label]) => (
          <button key={key} type="button" className={tab === key ? "active" : ""} onClick={() => setTab(key)}>{label}</button>
        ))}
      </section>

      {tab === "overview" ? (
        <>
          <section className="shil-admin-grid">
            <StatCard title="Ø³Ù„Ø§Ù…Øª Admin" value={health.ok ? "Û±Û°Û°Ùª" : "Ù†ÛŒØ§Ø²Ù…Ù†Ø¯ Ø¨Ø±Ø±Ø³ÛŒ"} note={health.ok ? "ØªÙ…Ø§Ù… Ú©Ù†ØªØ±Ù„â€ŒÙ‡Ø§ Ù…Ø¹ØªØ¨Ø± Ø§Ø³Øª" : `${health.warnings.length} Ù‡Ø´Ø¯Ø§Ø±`} status={health.ok ? "ok" : "warn"} />
            <StatCard title="Ú©Ø§Ø±Ø¨Ø±Ø§Ù† Ø¯Ø§Ø±Ø§ÛŒ Ø¯Ø§Ø¯Ù‡" value={data.userCount} note="Ø§Ø² Ø¯Ø§Ø¯Ù‡â€ŒÙ‡Ø§ÛŒ Ù…Ø­Ù„ÛŒ" />
            <StatCard title="Ù¾Ø±ÙˆÚ˜Ù‡â€ŒÙ‡Ø§ÛŒ Ø«Ø¨Øªâ€ŒØ´Ø¯Ù‡" value={data.projects.length} />
            <StatCard title="ØªØ¬Ù‡ÛŒØ²Ø§Øª ÙØ¹Ø§Ù„" value={catalogStats.panels + catalogStats.inverters + catalogStats.batteries + catalogStats.emergency + catalogStats.protections} />
          </section>

          <AdminPanel title="ÙˆØ¶Ø¹ÛŒØª Ø³Ù„Ø§Ù…Øª Ø³ÛŒØ³ØªÙ… Ù…Ø¯ÛŒØ±ÛŒØª" subtitle="Ø§ÛŒÙ† Ø¨Ø®Ø´ Ú©Ù†ØªØ±Ù„ Ù…ÛŒâ€ŒÚ©Ù†Ø¯ Ú©Ù‡ ØªÙ†Ø¸ÛŒÙ…Ø§Øª Ú©Ù„ÛŒØ¯ÛŒ Ø§Ù¾ Ø¨Ø±Ø§ÛŒ Ø§Ù†ØªØ´Ø§Ø± Ù†Ù‡Ø§ÛŒÛŒ Ù…Ø¹ØªØ¨Ø± Ø¨Ø§Ø´Ù†Ø¯.">
            {health.ok ? <div className="shil-admin-health ok">Ù‡Ù…Ù‡ Ú©Ù†ØªØ±Ù„â€ŒÙ‡Ø§ÛŒ Ø§Ø¯Ù…ÛŒÙ† Ø³Ø§Ù„Ù… Ù‡Ø³ØªÙ†Ø¯.</div> : (
              <div className="shil-admin-health warn">
                {health.warnings.map((warning) => <p key={warning}>{warning}</p>)}
              </div>
            )}
          </AdminPanel>

          <section className="shil-admin-actions-row">
            <button type="button" onClick={() => downloadJson("shil-admin-config-100.json", exportAdminJson())}>Ø®Ø±ÙˆØ¬ÛŒ JSON Ú©Ø§Ù…Ù„</button>
            <button type="button" onClick={() => importRef.current?.click()}>ÙˆØ±ÙˆØ¯ JSON ØªÙ†Ø¸ÛŒÙ…Ø§Øª</button>
            <button type="button" onClick={makeSnapshot}>Ø³Ø§Ø®Øª Ù†Ø³Ø®Ù‡ Ù¾Ø´ØªÛŒØ¨Ø§Ù†</button>
            <button type="button" className="danger" onClick={resetAll}>Ø¨Ø§Ø²Ú¯Ø´Øª Ø¨Ù‡ ØªÙ†Ø¸ÛŒÙ…Ø§Øª Ø§Ø³ØªØ§Ù†Ø¯Ø§Ø±Ø¯</button>
            <input ref={importRef} type="file" accept="application/json" hidden onChange={(event) => importConfig(event.target.files?.[0])} />
          </section>
        </>
      ) : null}

      {tab === "cards" ? (
        <AdminPanel title="Ù…Ø¯ÛŒØ±ÛŒØª Ú©Ø§Ø±Øªâ€ŒÙ‡Ø§ÛŒ Ø§Ù†ØªØ®Ø§Ø¨ Ù…Ø³ÛŒØ± Ù¾Ø±ÙˆÚ˜Ù‡" subtitle="Ø§Ø¯Ù…ÛŒÙ† Ù…ÛŒâ€ŒØªÙˆØ§Ù†Ø¯ ØªØµÙˆÛŒØ± PNG Ú©Ø§Ø±Øªâ€ŒÙ‡Ø§ Ø±Ø§ Ø¨Ø¯ÙˆÙ† ØªØºÛŒÛŒØ± Ú©Ø¯ Ø¬Ø§ÛŒÚ¯Ø²ÛŒÙ† Ú©Ù†Ø¯ Ùˆ ØªØ±ØªÛŒØ¨/ÙØ¹Ø§Ù„ Ø¨ÙˆØ¯Ù† Ú©Ø§Ø±Øªâ€ŒÙ‡Ø§ Ø±Ø§ Ú©Ù†ØªØ±Ù„ Ú©Ù†Ø¯." action={<button type="button" onClick={addCard}>Ø§ÙØ²ÙˆØ¯Ù† Ú©Ø§Ø±Øª</button>}>
          <div className="shil-admin-card-editor-grid">
            {cards.map((card, index) => (
              <div className="shil-admin-card-editor" key={card.key || index}>
                <div className="shil-admin-image-preview">{card.image ? <img src={card.image} alt="" /> : <span>Ø¨Ø¯ÙˆÙ† ØªØµÙˆÛŒØ±</span>}</div>
                <AdminInput label="Ø¹Ù†ÙˆØ§Ù† Ú©Ø§Ø±Øª" value={card.title} onChange={(title) => updateCard(index, { title })} />
                <AdminInput label="ØªÙˆØ¶ÛŒØ­ Ú©ÙˆØªØ§Ù‡" value={card.description} onChange={(description) => updateCard(index, { description })} />
                <AdminInput label="Ú©Ù„ÛŒØ¯ Ù…Ø³ÛŒØ±" value={card.key} onChange={(key) => updateCard(index, { key, calculationDomain: key })} />
                <AdminInput label="ØªØ±ØªÛŒØ¨ Ù†Ù…Ø§ÛŒØ´" type="number" value={card.order} onChange={(order) => updateCard(index, { order })} />
                <label className="shil-admin-switch"><input type="checkbox" checked={card.active !== false} onChange={(event) => updateCard(index, { active: event.target.checked })} /><span>ÙØ¹Ø§Ù„</span></label>
                <label className="shil-admin-upload"><span>Ø¬Ø§ÛŒÚ¯Ø²ÛŒÙ†ÛŒ ØªØµÙˆÛŒØ± PNG</span><input type="file" accept="image/png" onChange={(event) => uploadCardPng(index, event.target.files?.[0])} /></label>
                <button type="button" className="danger" onClick={() => removeCard(index)}>Ø­Ø°Ù Ú©Ø§Ø±Øª</button>
              </div>
            ))}
          </div>
          <button type="button" className="shil-primary-wide" onClick={saveCards}>Ø°Ø®ÛŒØ±Ù‡ Ú©Ø§Ø±Øªâ€ŒÙ‡Ø§ÛŒ Ù…Ø³ÛŒØ± Ù¾Ø±ÙˆÚ˜Ù‡</button>
        </AdminPanel>
      ) : null}

      {tab === "defaults" ? (
        <AdminPanel title="ØªÙ†Ø¸ÛŒÙ…Ø§Øª Ù¾ÛŒØ´â€ŒÙØ±Ø¶ Ù…Ù‡Ù†Ø¯Ø³ÛŒ" subtitle="Ø§ÛŒÙ† Ù…Ù‚Ø§Ø¯ÛŒØ± Ù…Ø¨Ù†Ø§ÛŒ Ø±ÙØªØ§Ø± Ù‡ÙˆØ´Ù…Ù†Ø¯ Ø§Ù¾ Ù‡Ø³ØªÙ†Ø¯Ø› Ú©Ø§Ø±Ø¨Ø± Ù‡Ù…Ú†Ù†Ø§Ù† Ù…ÛŒâ€ŒØªÙˆØ§Ù†Ø¯ Ø¯Ø± ØµÙØ­Ø§Øª Ù…Ø¬Ø§Ø² Ø­Ø§Ù„Øª Ø¯Ø³ØªÛŒ Ø±Ø§ Ø§Ù†ØªØ®Ø§Ø¨ Ú©Ù†Ø¯.">
          <div className="shil-admin-form-grid">
            <AdminInput label="Ù¾Ù†Ù„ Ù¾ÛŒØ´â€ŒÙØ±Ø¶ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ W" type="number" value={defaults.solarPanelDefaultW} onChange={(solarPanelDefaultW) => setDefaults((prev) => ({ ...prev, solarPanelDefaultW }))} />
            <AdminInput label="Ù¾Ù†Ù„ Ø¯Ø³ØªÛŒ Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯ÛŒ W" type="number" value={defaults.solarPanelManualW} onChange={(solarPanelManualW) => setDefaults((prev) => ({ ...prev, solarPanelManualW }))} />
            <AdminInput label="Ø±ÙˆØ²Ù‡Ø§ÛŒ Ø®ÙˆØ¯Ú©ÙØ§ÛŒÛŒ Ù¾ÛŒØ´â€ŒÙØ±Ø¶" type="number" value={defaults.defaultAutonomyDays} onChange={(defaultAutonomyDays) => setDefaults((prev) => ({ ...prev, defaultAutonomyDays }))} />
            <AdminInput label="Ø¶Ø±ÛŒØ¨ Ø§Ø·Ù…ÛŒÙ†Ø§Ù† Ù¾ÛŒØ´â€ŒÙØ±Ø¶" type="number" value={defaults.defaultSafetyFactor} onChange={(defaultSafetyFactor) => setDefaults((prev) => ({ ...prev, defaultSafetyFactor }))} />
            <AdminInput label="Ø²Ù…Ø§Ù† Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ Ù…ÙˆØ±Ø¯ Ù†ÛŒØ§Ø²" type="number" value={defaults.emergencyRequiredHours} onChange={(emergencyRequiredHours) => setDefaults((prev) => ({ ...prev, emergencyRequiredHours }))} />
            <AdminInput label="Ø¶Ø±ÛŒØ¨ Ø§Ø·Ù…ÛŒÙ†Ø§Ù† Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ" type="number" value={defaults.emergencySafetyFactor} onChange={(emergencySafetyFactor) => setDefaults((prev) => ({ ...prev, emergencySafetyFactor }))} />
            <AdminInput label="Ø­Ø¯Ø§Ú©Ø«Ø± Ø­Ø¬Ù… PNG Ú©ÛŒÙ„ÙˆØ¨Ø§ÛŒØª" type="number" value={defaults.maxPngKb} onChange={(maxPngKb) => setDefaults((prev) => ({ ...prev, maxPngKb }))} />
            <label className="shil-admin-switch"><input type="checkbox" checked={defaults.autoSnapshot !== false} onChange={(event) => setDefaults((prev) => ({ ...prev, autoSnapshot: event.target.checked }))} /><span>Ù†Ø³Ø®Ù‡ Ù¾Ø´ØªÛŒØ¨Ø§Ù† Ø®ÙˆØ¯Ú©Ø§Ø±</span></label>
          </div>
          <button type="button" className="shil-primary-wide" onClick={saveDefaultsData}>Ø°Ø®ÛŒØ±Ù‡ ØªÙ†Ø¸ÛŒÙ…Ø§Øª Ù¾ÛŒØ´â€ŒÙØ±Ø¶</button>
        </AdminPanel>
      ) : null}

      {tab === "catalog" ? (
        <AdminPanel title="Ø¨Ø§Ù†Ú© ØªØ¬Ù‡ÛŒØ²Ø§Øª Ù…Ù‡Ù†Ø¯Ø³ÛŒ" subtitle="ÙˆÛŒØ±Ø§ÛŒØ´ Ø¨Ø§Ù†Ú© Ù¾Ù†Ù„ØŒ Ø§ÛŒÙ†ÙˆØ±ØªØ±ØŒ Ø¨Ø§ØªØ±ÛŒØŒ Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ Ùˆ Ø³ÛŒØ³ØªÙ…â€ŒÙ‡Ø§ÛŒ Ø­ÙØ§Ø¸ØªÛŒ.">
          <div className="shil-admin-catalog-stack">
            {[
              ["solarPanels", "Ù¾Ù†Ù„â€ŒÙ‡Ø§ÛŒ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ", ["brand", "powerW", "voltageV", "currentA", "efficiency"]],
              ["solarInverters", "Ø§ÛŒÙ†ÙˆØ±ØªØ±Ù‡Ø§ÛŒ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ", ["brand", "powerKw", "dcVoltageV", "mpptMinV", "mpptMaxV", "type"]],
              ["batteries", "Ø¨Ø§ØªØ±ÛŒâ€ŒÙ‡Ø§", ["brand", "voltageV", "capacityAh", "chemistry", "dod"]],
              ["emergencyPower", "ØªØ¬Ù‡ÛŒØ²Ø§Øª Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ", ["brand", "powerKw", "batteryVoltageV", "note"]],
              ["protections", "Ø³ÛŒØ³ØªÙ…â€ŒÙ‡Ø§ÛŒ Ø­ÙØ§Ø¸ØªÛŒ", ["group", "rating"]],
            ].map(([group, title, fields]) => (
              <div className="shil-admin-catalog-group" key={group}>
                <div className="shil-admin-catalog-head"><h4>{title}</h4><button type="button" onClick={() => addCatalogItem(group)}>Ø§ÙØ²ÙˆØ¯Ù†</button></div>
                {(catalog[group] || []).map((item, index) => (
                  <div className="shil-admin-catalog-row wide" key={item.id || index}>
                    <input value={item.title || ""} onChange={(event) => updateCatalogItem(group, index, { title: event.target.value })} dir="auto" placeholder="Ø¹Ù†ÙˆØ§Ù†" />
                    {fields.map((field) => <input key={field} value={item[field] ?? ""} onChange={(event) => updateCatalogItem(group, index, { [field]: event.target.value })} dir="auto" placeholder={field} />)}
                    <label className="shil-admin-switch"><input type="checkbox" checked={item.active !== false} onChange={(event) => updateCatalogItem(group, index, { active: event.target.checked })} /><span>ÙØ¹Ø§Ù„</span></label>
                    <button type="button" className="danger" onClick={() => removeCatalogItem(group, index)}>Ø­Ø°Ù</button>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <button type="button" className="shil-primary-wide" onClick={saveCatalogData}>Ø°Ø®ÛŒØ±Ù‡ Ø¨Ø§Ù†Ú© ØªØ¬Ù‡ÛŒØ²Ø§Øª</button>
        </AdminPanel>
      ) : null}

      {tab === "security" ? (
        <>
          <AdminPanel title="Ø§Ù…Ù†ÛŒØª Ø§Ø¯Ù…ÛŒÙ†" subtitle="Ø§ÛŒÙ† Ù„Ø§ÛŒÙ‡ Ø¨Ø±Ø§ÛŒ Ø¬Ù„ÙˆÚ¯ÛŒØ±ÛŒ Ø§Ø² ÙˆØ±ÙˆØ¯ Ø§ØªÙØ§Ù‚ÛŒ Ø¨Ù‡ Ù¾Ù†Ù„ Ù…Ø¯ÛŒØ±ÛŒØª Ø¯Ø± Ù†Ø³Ø®Ù‡ Ù„ÙˆÚ©Ø§Ù„/PWA Ø§Ø³Øª.">
            <div className="shil-admin-form-grid">
              <AdminInput label="Ø±Ù…Ø² Ø¬Ø¯ÛŒØ¯ Ø§Ø¯Ù…ÛŒÙ†" value={newPin} onChange={setNewPin} placeholder="Ø­Ø¯Ø§Ù‚Ù„ Û´ Ø±Ù‚Ù…" />
              <AdminInput label="Ù…Ø¯Øª Ø§Ø¹ØªØ¨Ø§Ø± ÙˆØ±ÙˆØ¯ Ø¯Ù‚ÛŒÙ‚Ù‡" type="number" value={security.sessionMinutes} onChange={(sessionMinutes) => setSecurity((prev) => ({ ...prev, sessionMinutes }))} />
            </div>
            <section className="shil-admin-actions-row">
              <button type="button" onClick={changePin}>ØªØºÛŒÛŒØ± Ø±Ù…Ø² Ø§Ø¯Ù…ÛŒÙ†</button>
              <button type="button" onClick={() => { localStorage.setItem("shil:admin:security", JSON.stringify({ ...security, sessionMinutes: normalizeNumber(security.sessionMinutes, 60) })); notify("ØªÙ†Ø¸ÛŒÙ…Ø§Øª Ø§Ù…Ù†ÛŒØª Ø§Ø¯Ù…ÛŒÙ† Ø°Ø®ÛŒØ±Ù‡ Ø´Ø¯."); }}>Ø°Ø®ÛŒØ±Ù‡ Ø§Ù…Ù†ÛŒØª</button>
            </section>
          </AdminPanel>

          <AdminPanel title="Ù†Ø³Ø®Ù‡â€ŒÙ‡Ø§ÛŒ Ù¾Ø´ØªÛŒØ¨Ø§Ù† Ùˆ Ø¨Ø§Ø²ÛŒØ§Ø¨ÛŒ" subtitle="Ù‚Ø¨Ù„ Ø§Ø² ØªØºÛŒÛŒØ±Ø§Øª Ù…Ù‡Ù…ØŒ Ù†Ø³Ø®Ù‡ Ù¾Ø´ØªÛŒØ¨Ø§Ù† Ø³Ø§Ø®ØªÙ‡ Ù…ÛŒâ€ŒØ´ÙˆØ¯ Ùˆ Ø§Ù…Ú©Ø§Ù† Ø¨Ø§Ø²Ú¯Ø±Ø¯Ø§Ù†ÛŒ ÙˆØ¬ÙˆØ¯ Ø¯Ø§Ø±Ø¯.">
            <section className="shil-admin-actions-row"><button type="button" onClick={makeSnapshot}>Ø³Ø§Ø®Øª Ù†Ø³Ø®Ù‡ Ø¬Ø¯ÛŒØ¯</button></section>
            <div className="shil-admin-snapshot-list">
              {snapshots.map((snapshot) => (
                <article key={snapshot.id} className="shil-admin-snapshot">
                  <strong>{snapshot.label}</strong>
                  <span>{new Date(snapshot.at).toLocaleString("fa-IR")}</span>
                  <button type="button" onClick={() => restoreSnapshot(snapshot.id)}>Ø¨Ø§Ø²Ú¯Ø±Ø¯Ø§Ù†ÛŒ</button>
                </article>
              ))}
              {!snapshots.length ? <p>Ù‡Ù†ÙˆØ² Ù†Ø³Ø®Ù‡ Ù¾Ø´ØªÛŒØ¨Ø§Ù† Ø³Ø§Ø®ØªÙ‡ Ù†Ø´Ø¯Ù‡ Ø§Ø³Øª.</p> : null}
            </div>
          </AdminPanel>

          <section className="shil-thread-list">
            <article className="shil-thread-card"><h3>Ø¢Ø®Ø±ÛŒÙ† Ù†Ø¸Ø±Ø§Øª</h3>{data.feedback.slice(0, 8).map((item) => <p key={item.id}><strong>{item.userLogin || item.userId}:</strong> {item.category} â€” {item.text}</p>)}{!data.feedback.length ? <p>Ù‡Ù†ÙˆØ² Ù†Ø¸Ø±ÛŒ Ø«Ø¨Øª Ù†Ø´Ø¯Ù‡ Ø§Ø³Øª.</p> : null}</article>
            <article className="shil-thread-card"><h3>Ù„Ø§Ú¯ ØªØºÛŒÛŒØ±Ø§Øª Ø§Ø¯Ù…ÛŒÙ†</h3>{audit.slice(0, 14).map((item) => <p key={item.id}><strong>{item.type}</strong> â€” {new Date(item.at).toLocaleString("fa-IR")}</p>)}{!audit.length ? <p>Ù‡Ù†ÙˆØ² ØªØºÛŒÛŒØ±ÛŒ Ø«Ø¨Øª Ù†Ø´Ø¯Ù‡ Ø§Ø³Øª.</p> : null}</article>
          </section>
        </>
      ) : null}
    </ShilPageShell>
  );
}
