import React, { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import ShilPageShell from "../components/ShilPageShell.jsx";
import { logoutCurrentSession } from "../auth/logout.js";
import {
  getCurrentSession,
  readAllUserRecords,
  readAdminLoginCredentials,
  resetAdminLoginCredentials,
  saveAdminLoginCredentials,
} from "../auth/session.js";
import {
  ADMIN_SYSTEM_VERSION,
  DEFAULT_ADMIN_DEFAULTS,
  DEFAULT_EQUIPMENT_CATALOG,
  DEFAULT_PROJECT_PATH_CARDS,
  DEFAULT_ENGINEERING_RULES,
  DEFAULT_ENGINEERING_STANDARDS,
  changeAdminPin,
  createAdminSnapshot,
  exportAdminJson,
  fileToDataUrl,
  importAdminJson,
  isAdminPinVerified,
  readAdminAuditLog,
  logAdminAction,
  readAdminCatalog,
  readAdminDefaults,
  readAdminProjectPathCards,
  readAdminSecurity,
  readAdminSnapshots,
  readEngineeringRules,
  readEngineeringStandards,
  readAdminReleases,
  resetAdminSystem,
  restoreAdminSnapshot,
  saveAdminCatalog,
  saveAdminDefaults,
  saveAdminProjectPathCards,
  saveEngineeringRules,
  saveEngineeringStandards,
  saveReleaseDraft,
  publishEngineeringRelease,
  validateEngineeringRelease,
  validateAdminSystem,
  validateEquipmentCatalog,
  EQUIPMENT_GROUP_LABELS,
  verifyAdminPin,
  verifyAdminSensitivePin,
} from "../admin/adminStore.js";
import {
  readAdminDiagnostics,
  resolveAdminDiagnostic,
  reopenAdminDiagnostic,
  clearResolvedAdminDiagnostics,
  clearAllAdminDiagnostics,
  exportDiagnosticsBundle,
} from "../admin/adminDiagnostics.js";
import {
  deleteCloudRecord,
  getCloudModeLabel,
  isSupabaseReady,
  pushAllLocalRecordsToCloud,
  readCloudRecords,
  saveAdminSettingToCloud,
  upsertCloudRecord,
} from "../services/shilCloudSync.js";
import { getCombinedUserDirectory, readLocalUserDirectory } from "../services/shilUserAccessService.js";
import { CONSUMER_CATEGORY_ORDER, DEFAULT_CONSUMER_EQUIPMENT_LIBRARY, inferConsumerCategory, loadConsumerEquipmentLibrary, saveConsumerEquipmentLibrary } from "../data/catalogs/consumerEquipmentLibrary.js";
import {
  deleteManagedUserCloudData,
  exportManagedUserBundle,
  getManagedUserRecords,
  listManagedProfiles,
  updateManagedProfile,
} from "../services/adminUserService.js";
import {
  listSecurityEvents,
  listSecuritySessions,
  revokeSecuritySession,
} from "../services/securityCenterService.js";
import {activateEmergencyLock,
  configureRecoveryCode,
  createEncryptedRecoveryBackup,
  generateRecoveryCode,
  readEmergencyLock,
  readRecoveryState,
  recoverLocalAdminAccess,
  restoreEncryptedRecoveryBackup,
  unlockEmergencyLock} from "../services/adminRecoveryService.js";
import { getEffectiveAccessRole, isEmergencyLocalAdmin, sessionCan } from "../auth/access.js";
import { PERMISSIONS } from "../auth/roles.js";
import { ADMIN_COMMAND_CENTER_VERSION, adminModuleBadge, buildAdminReadiness } from "../admin/adminCommandCenter.js";
import { publishProjectAsReadyScenario } from "../data/scenarios/adminReadyScenarioLibrary.js";
import { exportElementAsMultiPagePdf, shareElementAsMultiPagePdf } from "../export/shilExportSystem.js";
import "../styles/shil-auth-v3-security.css";
const ADMIN_DATA_KEYS = [
  ["shil-feedback", "نظرات کاربران"],
  ["shil-assistant-questions", "پرسش‌های دستیار"],
  ["shil-projects", "پروژه‌ها و ذخیره‌ها"],
];

function safeParse(value, fallback = []) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function makeAdminId(prefix = "admin") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}


function phase5ParseDate(value) {
  const parsed = Date.parse(value || "");
  return Number.isFinite(parsed) ? parsed : 0;
}

function phase5ProjectDomain(item = {}) {
  const raw = String(item.calculationDomain || item.domain || item.projectType || item.scenario || item.path || item.type || "").toLowerCase();
  if (raw.includes("emergency") || raw.includes("backup") || raw.includes("اضطرار")) return "emergency";
  if (raw.includes("solar") || raw.includes("pv") || raw.includes("خورش")) return "solar";
  return "other";
}

function phase5ProjectStatus(item = {}) {
  return String(item.status || item.projectStatus || item.stageStatus || "").toLowerCase();
}

function phase5DeepNumber(item, keys) {
  const stack = [item];
  const seen = new Set();
  while (stack.length) {
    const value = stack.shift();
    if (!value || typeof value !== "object" || seen.has(value)) continue;
    seen.add(value);
    for (const key of keys) {
      const candidate = value[key];
      const n = Number(candidate);
      if (Number.isFinite(n) && n >= 0) return n;
    }
    Object.values(value).forEach((child) => { if (child && typeof child === "object") stack.push(child); });
  }
  return null;
}

function phase5ProjectSignals(item = {}) {
  let warnings = 0;
  let errors = 0;
  const stack = [item];
  const seen = new Set();
  while (stack.length) {
    const value = stack.shift();
    if (!value || typeof value !== "object" || seen.has(value)) continue;
    seen.add(value);
    Object.entries(value).forEach(([key, child]) => {
      const lower = key.toLowerCase();
      if (Array.isArray(child)) {
        if (lower.includes("warning")) warnings += child.length;
        if (lower.includes("error")) errors += child.length;
        child.forEach((x) => { if (x && typeof x === "object") stack.push(x); });
      } else if (child && typeof child === "object") stack.push(child);
      else if (lower.includes("error") && child === true) errors += 1;
      else if (lower.includes("warning") && child === true) warnings += 1;
    });
  }
  return { warnings, errors };
}

function phase5CatalogFlat(catalog = {}) {
  return Object.entries(catalog).flatMap(([group, items]) => (Array.isArray(items) ? items.map((item) => ({ ...item, __group: group })) : []));
}

function phase5ApproxStorageKb() {
  if (typeof localStorage === "undefined") return 0;
  let chars = 0;
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i) || "";
    chars += key.length + String(localStorage.getItem(key) || "").length;
  }
  return Math.round((chars * 2) / 1024);
}

function Phase5Bar({ label, value, total, note }) {
  const pct = total > 0 ? Math.max(0, Math.min(100, Math.round((value / total) * 100))) : 0;
  return <div className="shil-admin-analytics-bar"><div className="shil-admin-analytics-bar-head"><strong>{label}</strong><span>{value} · {pct}%</span></div><div className="shil-admin-analytics-track"><i style={{ width: `${pct}%` }} /></div>{note ? <small>{note}</small> : null}</div>;
}

function readAdminDataSnapshot() {
  const feedback = readAllUserRecords("shil-feedback");
  const assistant = readAllUserRecords("shil-assistant-questions");
  const projects = readAllUserRecords("shil-projects");
  const byUser = new Map();

  [...feedback, ...assistant, ...projects].forEach((item) => {
    const userId = item.userId || item.sourceKey?.split(":").slice(1).join(":") || "anonymous";
    const current = byUser.get(userId) || {
      userId,
      login: item.userLogin || "",
      role: item.userRole || "user",
      feedback: 0,
      assistant: 0,
      projects: 0,
      lastAt: "",
    };
    current.login = current.login || item.userLogin || "";
    current.role = current.role || item.userRole || "user";
    current.lastAt = [current.lastAt, item.updatedAt, item.createdAt].filter(Boolean).sort().at(-1) || current.lastAt;
    byUser.set(userId, current);
  });

  feedback.forEach((item) => byUser.get(item.userId || "anonymous") && (byUser.get(item.userId || "anonymous").feedback += 1));
  assistant.forEach((item) => byUser.get(item.userId || "anonymous") && (byUser.get(item.userId || "anonymous").assistant += 1));
  projects.forEach((item) => byUser.get(item.userId || "anonymous") && (byUser.get(item.userId || "anonymous").projects += 1));

  const directory = readLocalUserDirectory();
  directory.forEach((person) => {
    const key = person.userId || person.email || person.phone;
    if (!key) return;
    const current = byUser.get(key) || {
      userId: person.userId || key,
      login: person.email || person.phone || "",
      role: person.role || "user",
      feedback: 0,
      assistant: 0,
      projects: 0,
      lastAt: person.lastSeenAt || "",
    };
    byUser.set(key, {
      ...current,
      login: person.email || person.phone || current.login,
      fullName: person.fullName || "",
      email: person.email || "",
      phone: person.phone || "",
      company: person.company || "",
      authType: person.authType || "email",
      loginCount: Number(person.loginCount || 0),
      lastAt: person.lastSeenAt || current.lastAt,
    });
  });
  return {
    feedback,
    assistant,
    projects,
    users: Array.from(byUser.values()).sort((a, b) => String(b.lastAt).localeCompare(String(a.lastAt))),
  };
}

function updateRecordBySourceKey(sourceKey, recordId, patch) {
  const list = safeParse(localStorage.getItem(sourceKey), []);
  const next = list.map((item) => item.id === recordId ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item);
  localStorage.setItem(sourceKey, JSON.stringify(next));
  return next;
}

function deleteRecordBySourceKey(sourceKey, recordId) {
  const list = safeParse(localStorage.getItem(sourceKey), []);
  const next = list.filter((item) => item.id !== recordId);
  localStorage.setItem(sourceKey, JSON.stringify(next));
  return next;
}

function deleteUserAllData(userId) {
  ADMIN_DATA_KEYS.forEach(([baseKey]) => localStorage.removeItem(`${baseKey}:${userId}`));
}

function exportUserBundle(userId) {
  const bundle = { userId, exportedAt: new Date().toISOString(), records: {} };
  ADMIN_DATA_KEYS.forEach(([baseKey]) => {
    bundle.records[baseKey] = safeParse(localStorage.getItem(`${baseKey}:${userId}`), []);
  });
  return bundle;
}

function StatCard({ title, value, note, status }) {
  return (
    <article className={`shil-admin-stat ${status || ""}`}>
      <strong>{value}</strong>
      <span>{title}</span>
      {note ? <small>{note}</small> : null}
    </article>
  );
}

function OverviewKpiCard({ title, value, note, status }) {
  return (
    <details className={`shil-admin-overview-kpi-card ${status || ""}`}>
      <summary>
        <span>{title}</span>
        <strong>{value}</strong>
      </summary>
      {note ? <div className="shil-admin-overview-kpi-detail">{note}</div> : null}
    </details>
  );
}

function AdminPanel({ title, subtitle, children, action, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <article className={`shil-admin-panel ${open ? "is-open" : "is-collapsed"}`}>
      <div className="shil-admin-panel-head">
        <button
          type="button"
          className="shil-admin-panel-toggle"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="shil-admin-panel-title-wrap">
            <h3>{title}</h3>
            {subtitle ? <p>{subtitle}</p> : null}
          </span>
          <span className="shil-admin-panel-chevron" aria-hidden="true">{open ? "−" : "+"}</span>
        </button>
        {action ? <div className="shil-admin-panel-action">{action}</div> : null}
      </div>
      {open ? <div className="shil-admin-panel-body">{children}</div> : null}
    </article>
  );
}


function AdminServiceRow({ title, detail, status = "ok", meta = "" }) {
  return (
    <div className="shil-admin-service-row">
      <span className={`shil-admin-service-dot ${status}`} aria-hidden="true" />
      <div className="shil-admin-service-copy">
        <strong>{title}</strong>
        <small>{detail}</small>
      </div>
      {meta ? <span className="shil-admin-service-meta">{meta}</span> : null}
    </div>
  );
}

function AdminTimelineItem({ title, subtitle, at, tone = "info" }) {
  return (
    <div className="shil-admin-timeline-item">
      <span className={`shil-admin-timeline-dot ${tone}`} aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        {subtitle ? <small>{subtitle}</small> : null}
      </div>
      <time dir="ltr">{at ? new Date(at).toLocaleString("fa-IR", { hour: "2-digit", minute: "2-digit", month: "2-digit", day: "2-digit" }) : "—"}</time>
    </div>
  );
}

function AdminQuickAction({ title, note, onClick }) {
  return (
    <button type="button" className="shil-admin-quick-action" onClick={onClick}>
      <strong>{title}</strong>
      <span>{note}</span>
    </button>
  );
}


function getProjectReviewStatus(item) {
  return item?.engineeringReview?.status || item?.reviewStatus || "submitted";
}

function getProjectDomain(item) {
  const raw = String(item?.domain || item?.calculationDomain || item?.scenario || item?.projectType || "").toLowerCase();
  if (raw.includes("emergency") || raw.includes("backup") || raw.includes("ups")) return "emergency";
  if (raw.includes("solar") || raw.includes("pv")) return "solar";
  return "unknown";
}

function getReviewLabel(status) {
  return ({
    submitted: "ارسال‌شده",
    under_review: "در حال بررسی",
    needs_revision: "نیازمند اصلاح",
    approved: "تأیید مهندسی",
    rejected: "رد شده",
  })[status] || "ارسال‌شده";
}

function projectEngineeringSnapshot(item) {
  const design = item?.designResult || item?.design || item?.finalOutput?.designResult || item?.finalOutput?.design || item?.snapshot?.design || {};
  const load = design?.load || item?.load || {};
  const pv = design?.pvArray || item?.pvArray || {};
  const inverter = design?.inverter || item?.inverter || {};
  const battery = design?.battery || item?.battery || {};
  const protection = design?.protection || item?.protection || {};
  const warnings = design?.warnings || item?.warnings || item?.finalOutput?.warnings || [];
  return { design, load, pv, inverter, battery, protection, warnings: Array.isArray(warnings) ? warnings : [warnings].filter(Boolean) };
}

function ReviewStatusBadge({ status }) {
  return <span className={`shil-admin-review-status ${status}`}>{getReviewLabel(status)}</span>;
}

function ReviewProjectCard({ item, onStatus, onExport }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(item?.engineeringReview?.note || "");
  const status = getProjectReviewStatus(item);
  const domain = getProjectDomain(item);
  const eng = projectEngineeringSnapshot(item);
  const reviewer = item?.engineeringReview?.reviewer || "—";
  const reviewedAt = item?.engineeringReview?.reviewedAt || item?.engineeringReview?.updatedAt || "";
  const projectTitle = item.projectName || item.title || item.customerName || (domain === "emergency" ? "پروژه برق اضطراری" : "پروژه خورشیدی");
  const powerW = eng?.load?.finalPowerW || eng?.load?.totalPowerW || item?.totalPowerW || item?.powerW || 0;
  const energyKWh = eng?.load?.finalEnergyKWh || eng?.load?.dailyEnergyKWh || item?.dailyEnergyKWh || 0;
  const panelCount = eng?.pv?.panelCount || item?.panelCount || 0;
  const backupHours = eng?.design?.settings?.backupHours || eng?.design?.backupHours || item?.backupHours || 0;
  const checklist = item?.engineeringReview?.checklist || {};
  const checks = [
    ["inputs", "ورودی‌ها", Boolean(item?.projectName || item?.title || item?.customerName)],
    ["calculation", "محاسبات", Boolean(item?.designResult || item?.design || item?.finalOutput)],
    ["equipment", "تجهیزات", Boolean(eng?.inverter?.title || eng?.inverter?.name || eng?.pv?.panelCount || eng?.battery?.title || item?.equipment)],
    ["protection", "حفاظت", Boolean(eng?.protection && Object.keys(eng.protection).length)],
  ];
  return (
    <article className={`shil-admin-review-card ${status}`}>
      <button type="button" className="shil-admin-review-summary" onClick={() => setOpen((v) => !v)}>
        <div className="shil-admin-review-main">
          <strong>{projectTitle}</strong>
          <small>{item.userLogin || item.userId || "کاربر"} · {domain === "emergency" ? "برق اضطراری" : domain === "solar" ? "خورشیدی" : "دامنه نامشخص"}</small>
        </div>
        <div className="shil-admin-review-meta">
          <ReviewStatusBadge status={status} />
          <span className="shil-admin-review-chevron">{open ? "−" : "+"}</span>
        </div>
      </button>
      {open ? (
        <div className="shil-admin-review-body">
          <div className="shil-admin-review-facts">
            <div><span>توان مبنا</span><strong dir="ltr">{powerW ? `${Number(powerW).toLocaleString("en-US")} W` : "—"}</strong></div>
            <div><span>انرژی روزانه</span><strong dir="ltr">{energyKWh ? `${Number(energyKWh).toLocaleString("en-US", { maximumFractionDigits: 2 })} kWh` : "—"}</strong></div>
            <div><span>{domain === "emergency" ? "پشتیبانی" : "تعداد پنل"}</span><strong dir="ltr">{domain === "emergency" ? (backupHours ? `${backupHours} h` : "—") : (panelCount || "—")}</strong></div>
            <div><span>هشدارها</span><strong>{eng.warnings.length}</strong></div>
          </div>

          <div className="shil-admin-review-checks">
            {checks.map(([key, label, auto]) => {
              const checked = checklist[key] ?? auto;
              return <span key={key} className={checked ? "ok" : "warn"}>{checked ? "✓" : "!"} {label}</span>;
            })}
          </div>

          {eng.warnings.length ? <details className="shil-admin-review-warnings"><summary>هشدارهای موتور ({eng.warnings.length})</summary>{eng.warnings.map((warning, index) => <p key={`${index}-${String(warning)}`}>{String(warning)}</p>)}</details> : null}

          <label className="shil-admin-review-note">
            <span>یادداشت مهندسی / دلیل تصمیم</span>
            <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="نتیجه بررسی، ایرادها یا توضیح لازم برای کاربر..." />
          </label>

          <div className="shil-admin-review-history">
            <span>بازبین: <strong>{reviewer}</strong></span>
            <span>آخرین تصمیم: <strong dir="ltr">{reviewedAt ? new Date(reviewedAt).toLocaleString("fa-IR") : "—"}</strong></span>
          </div>

          <div className="shil-admin-review-actions">
            <button type="button" onClick={() => onStatus(item, "under_review", note)}>شروع بررسی</button>
            <button type="button" className="success" onClick={() => onStatus(item, "approved", note)}>تأیید مهندسی</button>
            <button type="button" className="warn" onClick={() => onStatus(item, "needs_revision", note)}>نیازمند اصلاح</button>
            <button type="button" className="danger" onClick={() => onStatus(item, "rejected", note)}>رد پروژه</button>
            <button type="button" onClick={() => onExport(item)}>خروجی پرونده</button>
          </div>
        </div>
      ) : null}
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

function AdminTextarea({ label, value, onChange, placeholder = "" }) {
  return (
    <label className="shil-admin-field shil-admin-field-wide">
      <span>{label}</span>
      <textarea value={value ?? ""} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} dir="auto" />
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
  const parsed = Number(String(value).replace(/[۰-۹]/g, (digit) => "۰۱۲۳۴۵۶۷۸۹".indexOf(digit)).replace(/[٠-٩]/g, (digit) => "٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function AdminGate({ onVerified }) {
  const security = readAdminSecurity();
  const needsSetup =
    !security.pinConfigured ||
    !security.pinHash ||
    !security.pinSalt ||
    Number(security.pinVersion || 0) < 2;

  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError("");
    setBusy(true);

    try {
      if (needsSetup) {
        await changeAdminPin(pin);
        onVerified();
        return;
      }

      if (await verifyAdminPin(pin)) {
        onVerified();
      } else {
        setError("\u0631\u0645\u0632 PIN \u0627\u062f\u0645\u06cc\u0646 \u0635\u062d\u06cc\u062d \u0646\u06cc\u0633\u062a.");
      }
    } catch (err) {
      setError(err?.message || "\u062e\u0637\u0627 \u062f\u0631 \u0628\u0631\u0631\u0633\u06cc PIN \u0627\u062f\u0645\u06cc\u0646.");
    } finally {
      setBusy(false);
    }
  }

  function openRecovery() {
    window.location.hash = "#admin-recovery";
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }

  return (
    <ShilPageShell title={"\u0648\u0631\u0648\u062f \u0627\u062f\u0645\u06cc\u0646"}>
      <section className="shil-admin-gate-v4" dir="rtl">
        <div className="shil-admin-gate-v4__title">
          {"\u062a\u0623\u06cc\u06cc\u062f \u062f\u0633\u062a\u0631\u0633\u06cc \u0627\u062f\u0645\u06cc\u0646"}
        </div>

        <p className="shil-admin-gate-v4__caption">
          {needsSetup
            ? "\u0628\u0631\u0627\u06cc \u0648\u0631\u0648\u062f \u0628\u0647 \u0645\u0631\u06a9\u0632 \u0645\u062f\u06cc\u0631\u06cc\u062a\u060c PIN \u0627\u062f\u0645\u06cc\u0646 \u0631\u0627 \u0627\u06cc\u062c\u0627\u062f \u06a9\u0646\u06cc\u062f."
            : "\u0628\u0631\u0627\u06cc \u0648\u0631\u0648\u062f \u0628\u0647 \u0645\u0631\u06a9\u0632 \u0645\u062f\u06cc\u0631\u06cc\u062a\u060c PIN \u0627\u062f\u0645\u06cc\u0646 \u0631\u0627 \u0648\u0627\u0631\u062f \u06a9\u0646\u06cc\u062f."}
        </p>

        <input
          className="shil-admin-gate-v4__pin"
          value={pin}
          onChange={(event) => setPin(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !busy) submit();
          }}
          placeholder={
            needsSetup
              ? "\u062a\u0639\u0631\u06cc\u0641 PIN \u0627\u062f\u0645\u06cc\u0646"
              : "PIN \u0627\u062f\u0645\u06cc\u0646"
          }
          inputMode="numeric"
          autoComplete="off"
          aria-label={"PIN \u0627\u062f\u0645\u06cc\u0646"}
        />

        {error ? (
          <small className="shil-admin-gate-v4__error" role="alert">
            {error}
          </small>
        ) : null}

        <div className="shil-admin-gate-v4__actions">
          <button
            type="button"
            className="shil-admin-gate-v4__btn"
            disabled={busy}
            onClick={submit}
          >
            {busy
              ? "\u062f\u0631 \u062d\u0627\u0644 \u0628\u0631\u0631\u0633\u06cc..."
              : needsSetup
                ? "\u062b\u0628\u062a PIN"
                : "\u0648\u0631\u0648\u062f \u0627\u062f\u0645\u06cc\u0646"}
          </button>

          <button
            type="button"
            className="shil-admin-gate-v4__btn"
            onClick={openRecovery}
          >
            {"\u0628\u0627\u0632\u06cc\u0627\u0628\u06cc"}
          </button>
        </div>
      </section>

      <style>{`
        body:has(.shil-admin-gate-v4) .shil-admin-gate-v4,
        body:has(.shil-admin-gate-v4) section.shil-admin-gate-v4,
        .shil-admin-gate-v4 {
          width: min(92vw, 390px) !important;
          max-width: 390px !important;
          margin: 12px auto 0 !important;
          padding: 0 10px !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: flex-start !important;
          gap: 8px !important;
          background: transparent !important;
          background-color: transparent !important;
          background-image: none !important;
          border: 0 !important;
          outline: 0 !important;
          box-shadow: none !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          color: #f5fbff !important;
        }

        body:has(.shil-admin-gate-v4) .shil-admin-gate-v4::before,
        body:has(.shil-admin-gate-v4) .shil-admin-gate-v4::after {
          content: none !important;
          display: none !important;
          background: none !important;
          box-shadow: none !important;
        }

        .shil-admin-gate-v4,
        .shil-admin-gate-v4 * {
          box-sizing: border-box !important;
        }

        .shil-admin-gate-v4__title {
          width: min(78vw, 310px) !important;
          min-height: 44px !important;
          margin: 0 !important;
          padding: 9px 14px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          text-align: center !important;
          border-radius: 15px !important;
          border: 1px solid rgba(163, 222, 255, .92) !important;
          background: linear-gradient(
            135deg,
            rgba(235, 248, 255, .96) 0%,
            rgba(198, 231, 252, .94) 54%,
            rgba(158, 211, 246, .92) 100%
          ) !important;
          box-shadow:
            0 7px 20px rgba(0, 12, 30, .22),
            inset 0 1px 0 rgba(255, 255, 255, .75) !important;
          color: #092643 !important;
          font-size: clamp(16px, 4.25vw, 19px) !important;
          font-weight: 900 !important;
          line-height: 1.25 !important;
        }

        .shil-admin-gate-v4__caption {
          width: min(84vw, 350px) !important;
          margin: 0 !important;
          padding: 0 2px !important;
          text-align: center !important;
          color: rgba(242, 249, 255, .96) !important;
          background: transparent !important;
          border: 0 !important;
          box-shadow: none !important;
          font-size: clamp(10.5px, 2.9vw, 12.5px) !important;
          font-weight: 700 !important;
          line-height: 1.55 !important;
          text-shadow: 0 1px 7px rgba(0, 7, 18, .9) !important;
        }

        .shil-admin-gate-v4__pin {
          width: min(76vw, 300px) !important;
          height: 44px !important;
          min-height: 44px !important;
          margin: 1px 0 0 !important;
          padding: 0 12px !important;
          border-radius: 14px !important;
          border: 1px solid rgba(157, 218, 255, .96) !important;
          outline: none !important;
          background: linear-gradient(
            135deg,
            rgba(238, 249, 255, .98),
            rgba(190, 227, 252, .94)
          ) !important;
          box-shadow:
            0 6px 18px rgba(0, 14, 34, .22),
            inset 0 1px 0 rgba(255, 255, 255, .8) !important;
          color: #0a2848 !important;
          caret-color: #0a2848 !important;
          text-align: center !important;
          font-size: 14px !important;
          font-weight: 850 !important;
        }

        .shil-admin-gate-v4__pin::placeholder {
          color: rgba(18, 52, 82, .72) !important;
          opacity: 1 !important;
        }

        .shil-admin-gate-v4__error {
          width: min(76vw, 300px) !important;
          margin: 0 !important;
          padding: 6px 8px !important;
          border-radius: 10px !important;
          border: 1px solid rgba(255, 174, 184, .55) !important;
          background: rgba(95, 19, 31, .76) !important;
          color: #fff4f6 !important;
          text-align: center !important;
          font-size: 10.5px !important;
          font-weight: 750 !important;
          line-height: 1.45 !important;
        }

        .shil-admin-gate-v4__actions {
          width: 100% !important;
          margin: 1px 0 0 !important;
          padding: 0 !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 6px !important;
          background: transparent !important;
          border: 0 !important;
          box-shadow: none !important;
        }

        .shil-admin-gate-v4__btn {
          width: min(44vw, 166px) !important;
          min-width: 132px !important;
          height: 38px !important;
          min-height: 38px !important;
          margin: 0 !important;
          padding: 0 14px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          border-radius: 13px !important;
          border: 1px solid rgba(160, 220, 255, .94) !important;
          background: linear-gradient(
            135deg,
            rgba(230, 247, 255, .98),
            rgba(170, 218, 250, .93)
          ) !important;
          box-shadow:
            0 5px 15px rgba(0, 14, 34, .22),
            inset 0 1px 0 rgba(255, 255, 255, .78) !important;
          color: #08233f !important;
          font-size: 12px !important;
          font-weight: 900 !important;
          line-height: 1 !important;
          text-align: center !important;
          white-space: nowrap !important;
          cursor: pointer !important;
        }

        .shil-admin-gate-v4__btn:active {
          transform: translateY(1px) scale(.99) !important;
        }

        .shil-admin-gate-v4__btn:disabled {
          opacity: .58 !important;
          cursor: default !important;
        }

        @media (max-width: 430px) {
          body:has(.shil-admin-gate-v4) .shil-admin-gate-v4,
          .shil-admin-gate-v4 {
            width: 100% !important;
            max-width: 100% !important;
            margin-top: 9px !important;
            padding-inline: 8px !important;
            gap: 7px !important;
          }

          .shil-admin-gate-v4__title {
            width: min(76vw, 290px) !important;
            min-height: 42px !important;
            padding: 8px 12px !important;
            border-radius: 14px !important;
          }

          .shil-admin-gate-v4__caption {
            width: min(84vw, 330px) !important;
          }

          .shil-admin-gate-v4__pin {
            width: min(74vw, 286px) !important;
            height: 42px !important;
            min-height: 42px !important;
          }

          .shil-admin-gate-v4__btn {
            width: min(42vw, 158px) !important;
            min-width: 126px !important;
            height: 37px !important;
            min-height: 37px !important;
            font-size: 11.8px !important;
          }
        }

        @media (max-height: 700px) {
          body:has(.shil-admin-gate-v4) .shil-admin-gate-v4,
          .shil-admin-gate-v4 {
            margin-top: 6px !important;
            gap: 5px !important;
          }

          .shil-admin-gate-v4__title {
            min-height: 38px !important;
            padding-block: 7px !important;
          }

          .shil-admin-gate-v4__caption {
            line-height: 1.38 !important;
          }

          .shil-admin-gate-v4__pin {
            height: 39px !important;
            min-height: 39px !important;
          }

          .shil-admin-gate-v4__btn {
            height: 35px !important;
            min-height: 35px !important;
          }
        }
      `}</style>
    </ShilPageShell>
  );
}
function RecoveryLockGate({ onRecovered }) {
  const lock = readEmergencyLock();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function unlock() {
    setBusy(true); setError("");
    try {
      await unlockEmergencyLock(code);
      onRecovered();
    } catch (err) { setError(err?.message || "بازیابی دسترسی انجام نشد."); }
    finally { setBusy(false); }
  }

  return <ShilPageShell title="بازیابی ادمین">
    <section className="shil-admin-lock">
      <span>Emergency Admin Lock</span>
      <h2>پنل ادمین قفل اضطراری است</h2>
      <p>{lock.reason || "برای بازکردن پنل، Recovery Code معتبر لازم است."}</p>
      <input value={code} onChange={(event)=>setCode(event.target.value)} placeholder="Recovery Code" dir="ltr" autoComplete="off" />
      {error ? <small>{error}</small> : null}
      <button type="button" className="shil-primary-wide" disabled={busy} onClick={unlock}>{busy ? "در حال بررسی..." : "بازکردن قفل اضطراری"}</button>
    </section>
  </ShilPageShell>;
}

function RecordCard({ item, type, onPatch, onDelete, onReply }) {
  const title = item.title || item.projectName || item.customerName || item.category || item.text || "رکورد بدون عنوان";
  return (
    <article className="shil-thread-card shil-admin-record-card">
      <div className="shil-admin-record-head">
        <div>
          <h3>{title}</h3>
          <p>{item.userLogin || item.userId || "کاربر ناشناس"} · {item.createdAt ? new Date(item.createdAt).toLocaleString("en-US") : "بدون تاریخ"}</p>
        </div>
        <span>{type}</span>
      </div>
      {item.text ? <p>{item.text}</p> : null}
      {item.answer ? <p><strong>پاسخ سیستم:</strong> {item.answer}</p> : null}
      {item.adminReply ? <p><strong>پاسخ ادمین:</strong> {item.adminReply}</p> : null}
      <div className="shil-admin-actions-row compact">
        {onReply ? <button type="button" onClick={() => onReply(item)}>پاسخ/ویرایش پاسخ</button> : null}
        <button type="button" onClick={() => onPatch(item, { status: item.status === "closed" ? "open" : "closed" })}>{item.status === "closed" ? "باز کردن" : "بستن"}</button>
        <button type="button" className="danger" onClick={() => onDelete(item)}>حذف</button>
      </div>
    </article>
  );
}


function projectUpdatedAt(item = {}) {
  return item.updatedAt || item.completedAt || item.lastVisitedAt || item.createdAt || "";
}

function projectDomain(item = {}) {
  const snapshot = item.snapshot || {};
  const domain = String(item.domain || snapshot.domain || snapshot.project?.domain || snapshot.systemSettings?.domain || "solar").toLowerCase();
  return domain.includes("emergency") || domain.includes("backup") || domain.includes("ups") ? "emergency" : "solar";
}

function projectDomainLabel(item = {}) {
  return projectDomain(item) === "emergency" ? "مسیر اجرای برق اضطراری" : "مسیر اجرای پنل خورشیدی";
}

function projectUserLabel(item = {}) {
  const snapshot = item.snapshot || {};
  const project = item.finalOutput?.project || snapshot.project || snapshot.projectInfo || {};
  return item.userLogin || project.clientName || project.customerName || project.projectName || item.userId || "کاربر ناشناس";
}

function projectDisplayName(item = {}) {
  const snapshot = item.snapshot || {};
  const project = item.finalOutput?.project || snapshot.project || snapshot.projectInfo || {};
  return item.projectName || project.projectName || project.name || item.title || projectUserLabel(item);
}

function projectReportSections(item = {}) {
  const snapshot = item.snapshot || {};
  const finalOutput = item.finalOutput || snapshot.finalOutput || {};
  return [
    ["اطلاعات پروژه", finalOutput.project || snapshot.project || snapshot.projectInfo || {}],
    ["شرایط محیطی", snapshot.environment || snapshot.environmentDraft || {}],
    ["ورودی محاسبات", snapshot.calculationInputs || {}],
    ["تنظیمات سیستم", snapshot.systemSettings || {}],
    ["چکیده", finalOutput.summary || snapshot.summary || {}],
    ["نتایج نهایی", finalOutput.result || snapshot.result || {}],
    ["تحلیل هوشمند", finalOutput.aiPreview || snapshot.aiPreview || {}],
  ].filter(([, value]) => value && typeof value === "object" && Object.keys(value).length);
}

const PROJECT_FIELD_LABELS = Object.freeze({
  clientName: "نام مشتری", customerName: "نام مشتری", projectName: "نام پروژه", name: "نام",
  registrationDate: "تاریخ ثبت", city: "شهر", province: "استان", address: "آدرس", phone: "تلفن",
  gpsMode: "روش موقعیت", latitude: "عرض جغرافیایی", longitude: "طول جغرافیایی", altitude: "ارتفاع",
  totalLoadW: "توان کل بار", peakLoadW: "توان پیک", dailyEnergyWh: "انرژی روزانه", manualPowerW: "توان دستی",
  manualEnergyKWh: "انرژی روزانه", backupHours: "زمان پشتیبانی", autonomyDays: "روز خودمختاری",
  inverterRatedW: "توان اینورتر", inverterPowerW: "توان اینورتر", batteryAh: "ظرفیت باتری",
  suggestedBatteryAh: "ظرفیت پیشنهادی باتری", suggestedPanels: "تعداد پنل پیشنهادی", panelCount: "تعداد پنل",
  status: "وضعیت", domain: "مسیر پروژه", createdAt: "زمان ایجاد", updatedAt: "آخرین بروزرسانی",
});

function projectFieldLabel(key = "") {
  return PROJECT_FIELD_LABELS[key] || String(key).replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ");
}

function projectStatusLabel(value) {
  const key = String(value || "open").toLowerCase();
  const map = { open:"باز", running:"در حال اجرا", draft:"پیش‌نویس", final:"نهایی", completed:"تکمیل‌شده", submitted:"ارسال‌شده", reviewed:"بررسی‌شده", published:"منتشرشده", archived:"بایگانی" };
  return map[key] || String(value || "باز");
}

function formatAdminDate(value) {
  if (!value) return "بدون تاریخ";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("fa-IR", { year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit", hour12:false }).format(date);
}

function compactProjectValue(value, key = "") {
  if (value === null || value === undefined || value === "") return "—";
  if (key === "status") return projectStatusLabel(value);
  if (typeof value === "boolean") return value ? "بله" : "خیر";
  if (typeof value === "number") return Number.isFinite(value) ? value.toLocaleString("en-US") : "—";
  if (Array.isArray(value)) return value.map((entry) => typeof entry === "object" ? (entry.title || entry.name || entry.item || "رکورد") : String(entry)).slice(0, 8).join("، ") || "—";
  if (typeof value === "object") return value.title || value.name || value.model || projectStatusLabel(value.status) || `${Object.keys(value).length} مقدار`;
  if (/date|time|At$/i.test(key)) return formatAdminDate(value);
  return String(value);
}

function friendlyAdminError(error, fallback = "عملیات انجام نشد.") {
  const raw = String(error?.message || error || "");
  if (/row-level security|rls|policy/i.test(raw)) return "دسترسی Cloud برای این عملیات تأیید نشد. Policy ادمین در Supabase باید بروزرسانی شود.";
  if (/jwt|auth|session|login/i.test(raw)) return "نشست ادمین معتبر نیست. یک بار خارج شوید و دوباره وارد شوید.";
  if (/network|fetch|failed to fetch/i.test(raw)) return "ارتباط با فضای ابری برقرار نشد. اتصال اینترنت را بررسی کنید.";
  return raw || fallback;
}

function ProjectDetailBlock({ title, value }) {
  const entries = Object.entries(value || {}).filter(([, entry]) => entry !== null && entry !== undefined && entry !== "").slice(0, 32);
  if (!entries.length) return null;
  return <details className="shil-admin-project-report-section">
    <summary><strong>{title}</strong><span>{entries.length} مورد</span></summary>
    <div className="shil-admin-project-detail-grid">
      {entries.map(([key, entry]) => <div key={key}><span dir="auto">{projectFieldLabel(key)}</span><strong dir="auto">{compactProjectValue(entry, key)}</strong></div>)}
    </div>
    <details className="shil-admin-project-raw"><summary>داده فنی کامل</summary><pre dir="ltr">{JSON.stringify(value, null, 2)}</pre></details>
  </details>;
}

function ProjectAdminCard({ item, onDelete, onPublishScenario, notify }) {
  const [open, setOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const reportRef = useRef(null);
  const title = projectDisplayName(item);
  const route = projectDomainLabel(item);
  const sections = projectReportSections(item);
  const updated = projectUpdatedAt(item);
  const filename = `${String(title || "shil-project").replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, "-")}-complete.pdf`;

  async function savePdf() {
    try {
      await exportElementAsMultiPagePdf(reportRef.current, filename, title);
      notify?.("PDF کامل پروژه ذخیره شد.");
      setShareOpen(false);
    } catch (error) { notify?.(friendlyAdminError(error, "ساخت PDF پروژه ناموفق بود.")); }
  }

  async function sharePdf() {
    try {
      await shareElementAsMultiPagePdf(reportRef.current, filename, title);
      notify?.("فایل کامل پروژه برای انتقال آماده شد.");
      setShareOpen(false);
    } catch (error) { notify?.(friendlyAdminError(error, "اشتراک‌گذاری پروژه ناموفق بود.")); }
  }

  return <article className={`shil-admin-project-card-v252 ${open ? "is-open" : ""}`}>
    <button type="button" className="shil-admin-project-card-summary-v252" onClick={()=>setOpen((value)=>!value)}>
      <span><strong>{projectUserLabel(item)}</strong><small>{route}</small></span>
      <b>{open ? "−" : "+"}</b>
    </button>
    {open ? <div className="shil-admin-project-card-body-v252">
      <div ref={reportRef} className="shil-admin-project-report-v252" dir="rtl">
        <header><h3>{title}</h3><p>{projectUserLabel(item)} · {route}</p><small>{formatAdminDate(updated)}</small></header>
        <div className="shil-admin-project-top-grid-v252">
          <div><span>وضعیت</span><strong>{projectStatusLabel(item.status)}</strong></div>
          <div><span>مسیر</span><strong>{route}</strong></div>
          <div><span>کاربر</span><strong>{projectUserLabel(item)}</strong></div>
          <details className="shil-admin-project-id-v252"><summary>شناسه فنی پروژه</summary><strong dir="ltr">{item.projectKey || item.id || "—"}</strong></details>
        </div>
        {sections.map(([sectionTitle, value]) => <ProjectDetailBlock key={sectionTitle} title={sectionTitle} value={value} />)}
      </div>
      <div className="shil-admin-project-actions-v252">
        <button type="button" className="danger" onClick={()=>{ if (window.confirm("این پروژه حذف شود؟ این عملیات قابل بازگشت نیست.")) onDelete(item); }}>حذف پروژه</button>
        <button type="button" onClick={()=>onPublishScenario(item)}>انتقال به سناریوهای آماده</button>
        <button type="button" onClick={()=>setShareOpen((value)=>!value)}>اشتراک‌گذاری</button>
      </div>
      {shareOpen ? <div className="shil-admin-project-share-choice-v252"><strong>خروجی پروژه</strong><button type="button" onClick={savePdf}>ذخیره PDF</button><button type="button" onClick={sharePdf}>انتقال / اشتراک</button></div> : null}
    </div> : null}
  </article>;
}


const CMS_GROUPS = [
  ["solarPanels", "پنل‌های خورشیدی"],
  ["solarInverters", "اینورترهای خورشیدی"],
  ["batteries", "باتری‌ها"],
  ["emergencyPower", "تجهیزات برق اضطراری"],
  ["protections", "سیستم‌های حفاظتی"],
];

const CMS_FIELD_MAP = {
  solarPanels: [["powerW","توان نامی","W","number"],["voltageV","ولتاژ نامی","V","number"],["currentA","جریان نامی","A","number"],["efficiency","راندمان","%","number"]],
  solarInverters: [["powerKw","توان نامی","kW","number"],["dcVoltageV","ولتاژ DC","V","number"],["mpptMinV","حداقل MPPT","V","number"],["mpptMaxV","حداکثر MPPT","V","number"],["efficiency","راندمان","%","number"],["pf","ضریب توان","","number"],["type","نوع اینورتر","","text"]],
  batteries: [["voltageV","ولتاژ نامی","V","number"],["capacityAh","ظرفیت","Ah","number"],["chemistry","شیمی باتری","","text"],["dod","DoD","0..1","number"]],
  emergencyPower: [["powerKw","توان نامی","kW","number"],["batteryVoltageV","ولتاژ باتری","V","number"],["efficiency","راندمان","%","number"]],
  protections: [["group","دامنه","","text"],["rating","کلاس / ریتینگ","","text"],["ratedCurrentA","جریان نامی","A","number"],["ratedVoltageV","ولتاژ نامی","V","number"],["breakingCapacityKa","قدرت قطع","kA","number"],["standard","استاندارد","","text"]],
};

function CmsMetric({ label, value }) {
  return <span className="shil-admin-cms-metric"><small>{label}</small><strong dir="auto">{value || "—"}</strong></span>;
}


const CONSUMER_CATEGORIES = CONSUMER_CATEGORY_ORDER;

function ConsumerEquipmentCms({ items, onChange, onSave, notify }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [openId, setOpenId] = useState("");
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (items || []).filter((item) => {
      const itemCategory = inferConsumerCategory(item);
      const categoryOk = category === "all" || itemCategory === category;
      const haystack = `${item.title} ${itemCategory} ${item.brand || ""} ${item.model || ""}`.toLowerCase();
      return categoryOk && (!q || haystack.includes(q));
    });
  }, [items, query, category]);
  const grouped = useMemo(() => {
    const map = new Map(CONSUMER_CATEGORIES.map((name) => [name, []]));
    visible.forEach((item) => {
      const name = inferConsumerCategory(item);
      if (!map.has(name)) map.set(name, []);
      map.get(name).push(item);
    });
    return Array.from(map.entries()).filter(([, list]) => list.length);
  }, [visible]);
  const patch = (id, changes) => onChange((items || []).map((item) => item.id === id ? { ...item, ...changes } : item));
  const add = () => {
    const id = `consumer-${Date.now()}`;
    const nextCategory = category !== "all" ? category : "متفرقه";
    onChange([...(items || []), { id, title:"مصرف‌کننده جدید", baseTitle:"مصرف‌کننده جدید", category:nextCategory, ratedPowerW:1000, defaultPowerW:1000, usageHoursPerDay:1, diversityFactor:1, simultaneityFactor:1, powerFactor:.95, efficiency:1, startupFactor:1, surgeFactor:1, voltage:220, phase:"single", type:"resistive/electronic", profile:"mixed", priority:"عادی", active:true, publishStatus:"published" }]);
    setOpenId(id);
  };
  const remove = (id) => onChange((items || []).filter((item) => item.id !== id));
  return <div className="shil-admin-equipment-cms shil-admin-consumer-cms">
    <section className="shil-admin-cms-toolbar shil-admin-cms-toolbar--sticky-add">
      <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="جستجو؛ مثال: کولر گازی 30000" />
      <select value={category} onChange={(e)=>setCategory(e.target.value)}><option value="all">همه دسته‌ها</option>{CONSUMER_CATEGORIES.map((x)=><option key={x} value={x}>{x}</option>)}</select>
      <button type="button" onClick={add}>+ افزودن مصرف‌کننده</button>
    </section>
    <section className="shil-admin-grid shil-admin-cms-kpis"><StatCard title="کل مصرف‌کننده‌ها" value={(items||[]).length}/><StatCard title="نمایش فعلی" value={visible.length}/></section>
    <div className="shil-admin-cms-groups shil-admin-consumer-category-groups">
      {grouped.map(([categoryName, categoryItems]) => (
        <details className="shil-admin-consumer-category" key={categoryName}>
          <summary><strong>{categoryName}</strong><span>{categoryItems.length} تجهیز</span></summary>
          <div className="shil-admin-cms-item-list">
            {categoryItems.map((item)=><article key={item.id} className="shil-admin-cms-item">
              <button type="button" className="shil-admin-cms-item-summary" onClick={()=>setOpenId(openId===item.id?"":item.id)}>
                <div className="shil-admin-cms-item-main"><strong>{item.title}</strong><small>{inferConsumerCategory(item)} · {Number(item.ratedPowerW||0).toLocaleString("en-US")} W</small></div>
                <div className="shil-admin-cms-item-side"><em className={item.active!==false?"active":"inactive"}>{item.active!==false?"فعال":"غیرفعال"}</em><b>{openId===item.id?"−":"+"}</b></div>
              </button>
              {openId===item.id?<div className="shil-admin-cms-item-body">
                <div className="shil-admin-cms-form-grid">
                  <AdminInput label="عنوان" value={item.title} onChange={(v)=>patch(item.id,{title:v,baseTitle:v})}/>
                  <label className="shil-admin-field"><span>دسته</span><select value={inferConsumerCategory(item)} onChange={(e)=>patch(item.id,{category:e.target.value})}>{CONSUMER_CATEGORIES.map((x)=><option key={x} value={x}>{x}</option>)}</select></label>
                  <AdminInput label="برند" value={item.brand||""} onChange={(v)=>patch(item.id,{brand:v})}/>
                  <AdminInput label="مدل" value={item.model||""} onChange={(v)=>patch(item.id,{model:v})}/>
                  <AdminInput label="توان نامی W" type="number" value={item.ratedPowerW} onChange={(v)=>patch(item.id,{ratedPowerW:Number(v),defaultPowerW:Number(v)})}/>
                  <AdminInput label="ساعت مصرف روزانه" type="number" value={item.usageHoursPerDay} onChange={(v)=>patch(item.id,{usageHoursPerDay:Number(v)})}/>
                  <AdminInput label="ضریب راه‌اندازی" type="number" value={item.startupFactor} onChange={(v)=>patch(item.id,{startupFactor:Number(v),surgeFactor:Number(v)})}/>
                  <AdminInput label="ضریب توان" type="number" value={item.powerFactor} onChange={(v)=>patch(item.id,{powerFactor:Number(v)})}/>
                  <AdminInput label="ولتاژ V" type="number" value={item.voltage} onChange={(v)=>patch(item.id,{voltage:Number(v)})}/>
                  <label className="shil-admin-field"><span>فاز</span><select value={item.phase||"single"} onChange={(e)=>patch(item.id,{phase:e.target.value})}><option value="single">تک‌فاز</option><option value="three">سه‌فاز</option></select></label>
                  <label className="shil-admin-field"><span>اولویت</span><select value={item.priority||"عادی"} onChange={(e)=>patch(item.id,{priority:e.target.value})}><option>حیاتی</option><option>مهم</option><option>عادی</option><option>قابل حذف</option></select></label>
                  <label className="shil-admin-switch"><input type="checkbox" checked={item.active!==false} onChange={(e)=>patch(item.id,{active:e.target.checked})}/><span>فعال برای کاربران</span></label>
                </div>
                <div className="shil-admin-actions-row"><button type="button" className="danger" onClick={()=>remove(item.id)}>حذف</button></div>
              </div>:null}
            </article>)}
          </div>
        </details>
      ))}
      {!grouped.length ? <p className="shil-admin-cms-empty">رکوردی مطابق جستجو یا دسته انتخابی پیدا نشد.</p> : null}
    </div>
    <div className="shil-admin-cms-save"><button type="button" className="shil-primary-wide" onClick={async()=>{try{await onSave();notify?.("بانک مصرف‌کننده‌ها ذخیره و برای کاربران منتشر شد.");}catch(error){notify?.(friendlyAdminError(error,"ذخیره بانک مصرف‌کننده‌ها ناموفق بود."));}}}>ذخیره و انتشار برای کاربران</button></div>
  </div>;
}

function equipmentSubcategory(group, item = {}) {
  if (String(item.subCategory || "").trim()) return String(item.subCategory).trim();
  if (group === "solarInverters") {
    const type = String(item.type || "").toLowerCase();
    if (type.includes("hybrid")) return "هیبرید";
    if (type.includes("off")) return "آفگرید";
    if (type.includes("on")) return "آنگرید";
    return item.category && item.category !== "اینورتر خورشیدی" ? item.category : "متفرقه";
  }
  if (group === "batteries") return item.chemistry || item.category || "متفرقه";
  if (group === "protections") {
    if (item.group === "solar") return "حفاظت خورشیدی";
    if (item.group === "emergency") return "حفاظت برق اضطراری";
    if (item.group === "shared") return "حفاظت مشترک";
    return item.category && item.category !== "حفاظت" ? item.category : "متفرقه";
  }
  if (group === "solarPanels") return item.technology || item.type || (item.category && item.category !== "پنل خورشیدی" ? item.category : "پنل خورشیدی");
  if (group === "emergencyPower") return item.category && item.category !== "برق اضطراری" ? item.category : "برق اضطراری";
  return item.category || "متفرقه";
}

function EquipmentCms({ catalog, onUpdate, onAdd, onRemove, onSave, notify }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [addGroup, setAddGroup] = useState("solarPanels");
  const [openGroups, setOpenGroups] = useState(() => Object.fromEntries(CMS_GROUPS.map(([key]) => [key, false])));
  const [openItems, setOpenItems] = useState({});
  const validation = useMemo(() => validateEquipmentCatalog(catalog), [catalog]);
  const errorMap = useMemo(() => {
    const map = new Map();
    validation.forEach((entry) => map.set(`${entry.group}:${entry.index}`, entry.errors));
    return map;
  }, [validation]);
  const lowerQuery = query.trim().toLocaleLowerCase("fa");

  const summary = useMemo(() => {
    const all = CMS_GROUPS.flatMap(([group]) => (catalog[group] || []).map((item) => ({...item, _group: group})));
    return {
      total: all.length,
      active: all.filter((x) => x.active !== false).length,
      published: all.filter((x) => x.publishStatus === "published").length,
      incomplete: validation.length,
    };
  }, [catalog, validation]);

  const setField = (group, index, field, value) => onUpdate(group, index, { [field]: value });
  const toggleItem = (group, item, index) => {
    const key = `${group}:${item.id || index}`;
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="shil-admin-equipment-cms">
      <section className="shil-admin-cms-toolbar shil-admin-cms-toolbar--sticky-add">
        <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="جستجو در عنوان، برند، مدل، استاندارد..." dir="auto" />
        <select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)}>
          <option value="all">همه وضعیت‌ها</option><option value="active">فعال</option><option value="inactive">غیرفعال</option><option value="published">منتشرشده</option><option value="draft">پیش‌نویس</option>
        </select>
        <select value={addGroup} onChange={(e)=>setAddGroup(e.target.value)}>{CMS_GROUPS.map(([key,title])=><option value={key} key={key}>{title}</option>)}</select>
        <button type="button" onClick={()=>{onAdd(addGroup);setOpenGroups((prev)=>({...prev,[addGroup]:true}));}}>+ افزودن تجهیز</button>
      </section>
      <section className="shil-admin-cms-kpis">
        <CmsMetric label="کل تجهیزات" value={summary.total} /><CmsMetric label="فعال" value={summary.active} /><CmsMetric label="منتشرشده" value={summary.published} /><CmsMetric label="نیازمند اصلاح" value={summary.incomplete} />
      </section>
      {validation.length ? <div className="shil-admin-cms-errors shil-admin-cms-errors--summary"><strong>{validation.length} تجهیز نیازمند اصلاح است.</strong><span>جزئیات خطا داخل همان تجهیز نمایش داده می‌شود.</span></div> : null}
      <div className="shil-admin-cms-groups">
        {CMS_GROUPS.map(([group, title]) => {
          const sourceItems = catalog[group] || [];
          const filtered = sourceItems.map((item,index)=>({item,index})).filter(({item}) => {
            const hay = `${item.title||""} ${item.brand||""} ${item.model||""} ${equipmentSubcategory(group,item)} ${(item.standards||[]).join?.(" ") || item.standards || ""}`.toLocaleLowerCase("fa");
            const searchOk = !lowerQuery || hay.includes(lowerQuery);
            const statusOk = statusFilter === "all" || (statusFilter === "active" && item.active !== false) || (statusFilter === "inactive" && item.active === false) || item.publishStatus === statusFilter;
            return searchOk && statusOk;
          });
          const subgroups = new Map();
          filtered.forEach((entry) => {
            const name = equipmentSubcategory(group, entry.item) || "متفرقه";
            if (!subgroups.has(name)) subgroups.set(name, []);
            subgroups.get(name).push(entry);
          });
          const isOpen = openGroups[group];
          return <section className="shil-admin-cms-group" key={group}>
            <button type="button" className="shil-admin-cms-group-head" onClick={()=>setOpenGroups(prev=>({...prev,[group]:!prev[group]}))}>
              <div><strong>{title}</strong><small>{filtered.length} از {sourceItems.length} رکورد · {subgroups.size} دسته</small></div><span>{isOpen ? "−" : "+"}</span>
            </button>
            {isOpen ? <div className="shil-admin-cms-subcategory-list">
              {Array.from(subgroups.entries()).map(([subcategory, entries]) => (
                <details className="shil-admin-cms-subcategory" key={`${group}:${subcategory}`}>
                  <summary><strong>{subcategory}</strong><span>{entries.length} تجهیز</span></summary>
                  <div className="shil-admin-cms-item-list">
                    {entries.map(({item,index}) => {
                      const key = `${group}:${item.id || index}`;
                      const isItemOpen = !!openItems[key];
                      const errors = errorMap.get(`${group}:${index}`) || [];
                      const primary = group === "solarPanels" ? `${item.powerW || "—"} W` : group === "solarInverters" || group === "emergencyPower" ? `${item.powerKw || "—"} KW` : group === "batteries" ? `${item.voltageV || "—"} V · ${item.capacityAh || "—"} AH` : (item.rating || item.standard || "—");
                      return <article className={`shil-admin-cms-item ${errors.length ? "has-error" : ""}`} key={key}>
                        <button type="button" className="shil-admin-cms-item-summary" onClick={()=>toggleItem(group,item,index)}>
                          <div className="shil-admin-cms-item-main"><strong>{item.title || "تجهیز بدون عنوان"}</strong><small>{item.brand || "بدون برند"}{item.model ? ` · ${item.model}` : ""}</small></div>
                          <div className="shil-admin-cms-item-side"><span dir="ltr">{primary}</span><em className={item.active !== false ? "active" : "inactive"}>{item.active !== false ? "فعال" : "غیرفعال"}</em><b>{isItemOpen ? "−" : "+"}</b></div>
                        </button>
                        {isItemOpen ? <div className="shil-admin-cms-item-body">
                          {errors.length ? <div className="shil-admin-cms-errors">{errors.map((e,i)=><span key={i}>• {e}</span>)}</div> : null}
                          <div className="shil-admin-cms-form-grid">
                            <AdminInput label="عنوان تجهیز" value={item.title} onChange={(v)=>setField(group,index,"title",v)} />
                            <AdminInput label="دسته / زیرگروه" value={equipmentSubcategory(group,item)} onChange={(v)=>setField(group,index,"subCategory",v || "متفرقه")} />
                            <AdminInput label="برند" value={item.brand} onChange={(v)=>setField(group,index,"brand",v)} />
                            <AdminInput label="مدل" value={item.model} onChange={(v)=>setField(group,index,"model",v)} />
                            <AdminInput label="کشور سازنده" value={item.country} onChange={(v)=>setField(group,index,"country",v)} />
                            {(CMS_FIELD_MAP[group] || []).map(([field,label,unit,type]) => <AdminInput key={field} label={`${label}${unit ? ` (${unit})` : ""}`} type={type} value={item[field]} onChange={(v)=>setField(group,index,field,v)} />)}
                            <AdminInput label="حداقل دمای کاری (°C)" type="number" value={item.temperatureMinC} onChange={(v)=>setField(group,index,"temperatureMinC",v)} />
                            <AdminInput label="حداکثر دمای کاری (°C)" type="number" value={item.temperatureMaxC} onChange={(v)=>setField(group,index,"temperatureMaxC",v)} />
                            <AdminInput label="استانداردها (با کاما جدا شود)" value={Array.isArray(item.standards) ? item.standards.join(", ") : item.standards} onChange={(v)=>setField(group,index,"standards",v.split(",").map(x=>x.trim()).filter(Boolean))} />
                            <AdminInput label="لینک Datasheet" value={item.datasheetUrl} onChange={(v)=>setField(group,index,"datasheetUrl",v)} />
                            <AdminInput label="نسخه Datasheet" value={item.datasheetVersion} onChange={(v)=>setField(group,index,"datasheetVersion",v)} />
                            <AdminInput label="Revision" type="number" value={item.revision || 1} onChange={(v)=>setField(group,index,"revision",v)} />
                            <label className="shil-admin-field"><span>وضعیت انتشار</span><select value={item.publishStatus || "draft"} onChange={(e)=>setField(group,index,"publishStatus",e.target.value)}><option value="draft">پیش‌نویس</option><option value="review">در انتظار بررسی</option><option value="published">منتشرشده</option><option value="retired">بازنشسته</option></select></label>
                          </div>
                          <AdminTextarea label="یادداشت مهندسی" value={item.engineeringNote || item.note || ""} onChange={(v)=>setField(group,index,"engineeringNote",v)} placeholder="ملاحظات نصب، محدودیت‌ها، توضیح Revision یا مرجع فنی..." />
                          <div className="shil-admin-cms-meta"><span>Revision: <strong dir="ltr">{item.revision || 1}</strong></span><span>آخرین ویرایش: <strong>{item.updatedAt ? new Date(item.updatedAt).toLocaleString("fa-IR") : "پس از ذخیره ثبت می‌شود"}</strong></span><span>تاریخچه: <strong>{Array.isArray(item.history) ? item.history.length : 0}</strong></span></div>
                          {Array.isArray(item.history) && item.history.length ? <details className="shil-admin-cms-history"><summary>تاریخچه تغییرات</summary>{item.history.slice(0,8).map((h,i)=><p key={i}><span>{h.action === "create" ? "ایجاد" : "ویرایش"} · Rev {h.revision}</span><time>{h.at ? new Date(h.at).toLocaleString("fa-IR") : "—"}</time></p>)}</details> : null}
                          <div className="shil-admin-cms-actions"><label className="shil-admin-switch"><input type="checkbox" checked={item.active !== false} onChange={(e)=>setField(group,index,"active",e.target.checked)} /><span>فعال در موتور</span></label><button type="button" className="danger" onClick={()=>onRemove(group,index)}>حذف تجهیز</button></div>
                        </div> : null}
                      </article>;
                    })}
                  </div>
                </details>
              ))}
              {!filtered.length ? <p className="shil-admin-cms-empty">رکوردی مطابق فیلتر پیدا نشد.</p> : null}
            </div> : null}
          </section>;
        })}
      </div>
      <div className="shil-admin-cms-save"><button type="button" className="shil-primary-wide" onClick={()=>{ if(validation.length){notify?.("ابتدا خطاهای اعتبارسنجی تجهیزات را اصلاح کنید."); return;} onSave(); }}>اعتبارسنجی و ذخیره بانک تجهیزات</button></div>
    </div>
  );
}

function phase6DiagnosticTone(item = {}) {
  if (item.severity === "error" || item.severity === "critical") return "error";
  if (item.severity === "warning" || item.severity === "warn") return "warn";
  return "info";
}

function Phase6DiagnosticCard({ item, onResolve, onReopen }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(item.resolutionNote || "");
  const tone = phase6DiagnosticTone(item);
  return (
    <article className={`shil-admin-diag-card ${tone} ${item.status === "resolved" ? "resolved" : ""}`}>
      <button type="button" className="shil-admin-diag-head" onClick={() => setOpen((v) => !v)}>
        <span className={`shil-admin-service-dot ${tone === "error" ? "warn" : tone}`} />
        <span className="shil-admin-diag-copy">
          <strong>{item.message || "خطای بدون پیام"}</strong>
          <small><b dir="ltr">{item.type || "runtime"}</b> · {item.source || "app"} · {item.createdAt ? new Date(item.createdAt).toLocaleString("fa-IR") : "—"}</small>
        </span>
        <span className={`shil-admin-diag-status ${item.status === "resolved" ? "ok" : "open"}`}>{item.status === "resolved" ? "حل‌شده" : "باز"}</span>
      </button>
      {open ? <div className="shil-admin-diag-body">
        <div className="shil-admin-diag-meta">
          <span>مسیر: <b dir="ltr">{item.route || "—"}</b></span>
          <span>Project: <b dir="ltr">{item.projectId || "—"}</b></span>
          <span>User: <b dir="ltr">{item.userId || "—"}</b></span>
        </div>
        {item.stack ? <details><summary>Stack / جزئیات فنی</summary><pre dir="ltr">{item.stack}</pre></details> : null}
        {item.context && Object.keys(item.context).length ? <details><summary>Context</summary><pre dir="ltr">{JSON.stringify(item.context, null, 2)}</pre></details> : null}
        {item.userAgent ? <details><summary>Device / Browser</summary><pre dir="ltr">{item.userAgent}</pre></details> : null}
        <label className="shil-admin-field"><span>یادداشت رفع خطا</span><textarea value={note} onChange={(e)=>setNote(e.target.value)} placeholder="علت، اقدام اصلاحی یا نتیجه بررسی..." /></label>
        <div className="shil-admin-actions-row">
          {item.status === "resolved" ? <button type="button" onClick={()=>onReopen(item.id)}>بازگشایی</button> : <button type="button" className="shil-primary-wide" onClick={()=>onResolve(item.id,note)}>علامت‌گذاری به‌عنوان حل‌شده</button>}
        </div>
      </div> : null}
    </article>
  );
}

function SensitiveActionDialog({ request, onClose, notify }) {
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  if (!request) return null;

  async function submit(event) {
    event?.preventDefault?.();
    try {
      setBusy(true);
      const valid = await verifyAdminSensitivePin(pin);
      if (!valid) {
        notify("PIN عملیات حساس صحیح نیست.");
        return;
      }
      await request.action();
      onClose();
    } catch (error) {
      notify(error?.message || "عملیات حساس انجام نشد.");
    } finally {
      setBusy(false);
      setPin("");
    }
  }

  return <div className="shil-admin-sensitive-backdrop" role="presentation">
    <form className="shil-admin-sensitive-dialog" onSubmit={submit} dir="rtl">
      <strong>تأیید عملیات حساس</strong>
      <p>{request.label}</p>
      <input value={pin} onChange={(event)=>setPin(event.target.value)} inputMode="numeric" autoComplete="off" placeholder="PIN ادمین" autoFocus />
      <div className="shil-admin-actions-row compact">
        <button type="button" onClick={onClose} disabled={busy}>انصراف</button>
        <button type="submit" className="danger" disabled={busy || !pin}>{busy ? "در حال بررسی..." : "تأیید و اجرا"}</button>
      </div>
    </form>
  </div>;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const session = getCurrentSession();
  const importRef = useRef(null);
const [tab, setTab] = useState("overview");
  const [adminView, setAdminView] = useState("hub");
  const [cards, setCards] = useState(() => readAdminProjectPathCards());
  const [catalog, setCatalog] = useState(() => readAdminCatalog());
  const [consumerCatalog, setConsumerCatalog] = useState(() => DEFAULT_CONSUMER_EQUIPMENT_LIBRARY);
  const [defaults, setDefaults] = useState(() => readAdminDefaults());
  const [defaultsPath, setDefaultsPath] = useState(null);
  const [audit, setAudit] = useState(() => readAdminAuditLog());
  const [snapshots, setSnapshots] = useState(() => readAdminSnapshots());
  const [security, setSecurity] = useState(() => readAdminSecurity());
  const [recoveryRequested, setRecoveryRequested] = useState(
    () => window.location.hash === "#admin-recovery"
  );

  useEffect(() => {
    const syncRecoveryHash = () => {
      setRecoveryRequested(window.location.hash === "#admin-recovery");
    };

    window.addEventListener("hashchange", syncRecoveryHash);
    return () => window.removeEventListener("hashchange", syncRecoveryHash);
  }, []);
  const [message, setMessage] = useState("");
  const [newPin, setNewPin] = useState("");
  const [health, setHealth] = useState(() => validateAdminSystem());
  const [adminCredentials, setAdminCredentials] = useState(() => readAdminLoginCredentials());
  const [dataVersion, setDataVersion] = useState(0);
  const [replyDraft, setReplyDraft] = useState({ id: "", sourceKey: "", text: "" });
  const [cloudData, setCloudData] = useState(null);
  const [cloudStatus, setCloudStatus] = useState(() => ({ online: isSupabaseReady(), loading: false, message: getCloudModeLabel() }));
  const [globalSearch, setGlobalSearch] = useState("");
  const [reviewFilter, setReviewFilter] = useState("all");
  const [reviewDomain, setReviewDomain] = useState("all");
  const [reviewSearch, setReviewSearch] = useState("");
  const [engineeringRules, setEngineeringRules] = useState(() => readEngineeringRules());
  const [engineeringStandards, setEngineeringStandards] = useState(() => readEngineeringStandards());
  const [releaseState, setReleaseState] = useState(() => readAdminReleases());
  const [releaseDraft, setReleaseDraft] = useState(() => readAdminReleases().draft);
  const [releaseValidation, setReleaseValidation] = useState(() => validateEngineeringRelease());
  const [diagnostics, setDiagnostics] = useState(() => readAdminDiagnostics());
  const [diagFilter, setDiagFilter] = useState("open");
  const [diagType, setDiagType] = useState("all");
  const [diagSearch, setDiagSearch] = useState("");
  const [managedProfiles, setManagedProfiles] = useState([]);
  const [managedProfilesState, setManagedProfilesState] = useState({ loading: false, error: "" });
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userStatusFilter, setUserStatusFilter] = useState("all");
  const [expandedManagedUser, setExpandedManagedUser] = useState("");
  const [managedUserRecords, setManagedUserRecords] = useState({});
  const [managedUserRecordState, setManagedUserRecordState] = useState({ loading: "", error: "" });
  const [sensitiveRequest, setSensitiveRequest] = useState(null);
  const [securityEvents, setSecurityEvents] = useState([]);
  const [securitySessions, setSecuritySessions] = useState([]);
  const [securityCenterState, setSecurityCenterState] = useState({ loading: false, error: "" });
  const [securityEventFilter, setSecurityEventFilter] = useState("all");
  const [recoveryState, setRecoveryState] = useState(() => readRecoveryState());
  const [emergencyLock, setEmergencyLock] = useState(() => readEmergencyLock());
  const [generatedRecoveryCode, setGeneratedRecoveryCode] = useState("");
  const [recoveryCodeInput, setRecoveryCodeInput] = useState("");
  const [recoveryReset, setRecoveryReset] = useState({ login: "", password: "", pin: "" });
  const recoveryFileRef = useRef(null);
  const canCloudAdmin = sessionCan(PERMISSIONS.CLOUD_ADMIN, session);
  const canManageRoles = sessionCan(PERMISSIONS.ROLE_MANAGE, session);
  const effectiveAdminRole = getEffectiveAccessRole(session);
  const canGrantAdminRoles = effectiveAdminRole === "super_admin";
  const emergencyLocalAdmin = isEmergencyLocalAdmin(session);


  const managedProfileSummary = useMemo(() => ({
    total: managedProfiles.length,
    approved: managedProfiles.filter((item) => item.status === "approved").length,
    pending: managedProfiles.filter((item) => item.status === "pending").length,
    suspended: managedProfiles.filter((item) => ["suspended", "disabled", "rejected"].includes(item.status)).length,
    admins: managedProfiles.filter((item) => ["admin", "super_admin"].includes(item.role)).length,
  }), [managedProfiles]);

  const securitySummary = useMemo(() => {
    const now = Date.now();
    const active = securitySessions.filter((item) => !item.ended_at && !item.revoked_at && now - Date.parse(item.last_seen_at || 0) < 5 * 60 * 1000).length;
    const revoked = securitySessions.filter((item) => item.revoked_at).length;
    const failed = securityEvents.filter((item) => ["login_failed", "login_blocked"].includes(item.event_type)).length;
    return { active, revoked, failed, events: securityEvents.length };
  }, [securityEvents, securitySessions]);

  const adminReadiness = useMemo(() => buildAdminReadiness({
    health,
    cloudStatus,
    recoveryState,
    securitySummary,
    managedProfileSummary,
    releaseValidation,
    diagnostics,
    emergencyLocalAdmin,
    adminCredentials,
    authType: session?.authType,
  }), [health, cloudStatus, recoveryState, securitySummary, managedProfileSummary, releaseValidation, diagnostics, emergencyLocalAdmin, adminCredentials, session?.authType]);

  const filteredSecurityEvents = useMemo(() => securityEvents.filter((item) => securityEventFilter === "all" || item.event_type === securityEventFilter), [securityEvents, securityEventFilter]);

  const filteredManagedProfiles = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return managedProfiles.filter((profile) => {
      const searchOk = !q || [profile.full_name, profile.email, profile.id].some((value) => String(value || "").toLowerCase().includes(q));
      const roleOk = userRoleFilter === "all" || profile.role === userRoleFilter;
      const statusOk = userStatusFilter === "all" || profile.status === userStatusFilter;
      return searchOk && roleOk && statusOk;
    }).sort((a, b) => String(b.activity?.lastActivityAt || "").localeCompare(String(a.activity?.lastActivityAt || "")));
  }, [managedProfiles, userSearch, userRoleFilter, userStatusFilter]);

  const localData = useMemo(() => readAdminDataSnapshot(), [dataVersion]);
  const data = cloudData?.online ? cloudData : localData;
  const sortedAdminProjects = useMemo(() => [...(data.projects || [])].sort((a,b) => new Date(projectUpdatedAt(b) || 0) - new Date(projectUpdatedAt(a) || 0)), [data.projects]);

  useEffect(() => {
    if (session?.role === "admin" && canCloudAdmin) loadCloudData(false);
  }, []);

  useEffect(() => {
    if (session?.role === "admin" && canCloudAdmin) loadManagedProfiles();
  }, []);

  useEffect(() => {
    loadConsumerEquipmentLibrary({ includeUnpublished: true, persistBaseline: true }).then((list) => { if (Array.isArray(list)) setConsumerCatalog(list); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (session?.role === "admin" && canCloudAdmin && session?.authType === "supabase") loadSecurityCenter();
  }, []);

  async function loadSecurityCenter(showMessage = false) {
    if (!canCloudAdmin || session?.authType !== "supabase") return;
    try {
      setSecurityCenterState({ loading: true, error: "" });
      const [events, sessions] = await Promise.all([listSecurityEvents(200), listSecuritySessions(200)]);
      setSecurityEvents(events);
      setSecuritySessions(sessions);
      setSecurityCenterState({ loading: false, error: "" });
      if (showMessage) notify("Security Center بروزرسانی شد.");
    } catch (error) {
      setSecurityCenterState({ loading: false, error: error?.message || "دریافت رخدادهای امنیتی ناموفق بود." });
    }
  }

  function revokeManagedSession(item) {
    requestSensitiveAction(`خروج اجباری Session ${item.login || item.user_id}`, async () => {
      await revokeSecuritySession(item.session_id);
      await loadSecurityCenter(false);
      logAdminAction("security:session-revoked", { targetSessionId: item.session_id, targetUserId: item.user_id, entity: "security-session" });
      setAudit(readAdminAuditLog());
      notify("Session انتخاب‌شده برای خروج اجباری علامت‌گذاری شد.");
    });
  }

  function requestSensitiveAction(label, action) {
    setSensitiveRequest({ label, action });
  }

  async function loadManagedProfiles(showMessage = false) {
    if (!canCloudAdmin) return;
    try {
      setManagedProfilesState({ loading: true, error: "" });
      const profiles = await listManagedProfiles();
      setManagedProfiles(profiles);
      setManagedProfilesState({ loading: false, error: "" });
      if (showMessage) notify("پروفایل‌های کاربران از Supabase بروزرسانی شد.");
    } catch (error) {
      setManagedProfilesState({ loading: false, error: error?.message || "دریافت کاربران Cloud ناموفق بود." });
    }
  }

  function changeManagedProfile(profile, patch) {
    const detail = patch.role ? `تغییر نقش ${profile.email || profile.id} به ${patch.role}` : `تغییر وضعیت ${profile.email || profile.id} به ${patch.status}`;
    requestSensitiveAction(detail, async () => {
      const updated = await updateManagedProfile(profile.id, patch);
      setManagedProfiles((prev) => prev.map((item) => item.id === updated.id ? { ...item, ...updated, activity: item.activity } : item));
      logAdminAction("user-profile:update", { targetUserId: profile.id, email: profile.email || "", ...patch, entity: "profile" });
      setAudit(readAdminAuditLog());
      notify("پروفایل کاربر بروزرسانی شد.");
    });
  }

  async function toggleManagedUserDetails(profile) {
    if (expandedManagedUser === profile.id) {
      setExpandedManagedUser("");
      return;
    }
    setExpandedManagedUser(profile.id);
    if (managedUserRecords[profile.id]) return;
    try {
      setManagedUserRecordState({ loading: profile.id, error: "" });
      const rows = await getManagedUserRecords(profile.id);
      setManagedUserRecords((prev) => ({ ...prev, [profile.id]: rows }));
      setManagedUserRecordState({ loading: "", error: "" });
    } catch (error) {
      setManagedUserRecordState({ loading: "", error: error?.message || "دریافت فعالیت کاربر ناموفق بود." });
    }
  }

  function exportManagedUser(profile) {
    requestSensitiveAction(`خروجی Cloud کاربر ${profile.email || profile.id}`, async () => {
      const bundle = await exportManagedUserBundle(profile.id);
      downloadJson(`shil-cloud-user-${profile.id}.json`, bundle);
      logAdminAction("user-cloud:export", { targetUserId: profile.id, email: profile.email || "", entity: "user-data" });
      setAudit(readAdminAuditLog());
      notify("خروجی Cloud کاربر آماده شد.");
    });
  }

  function removeManagedUserCloudData(profile) {
    requestSensitiveAction(`حذف تمام داده‌های Cloud کاربر ${profile.email || profile.id}`, async () => {
      await deleteManagedUserCloudData(profile.id);
      setManagedUserRecords((prev) => ({ ...prev, [profile.id]: [] }));
      await loadManagedProfiles(false);
      logAdminAction("user-cloud:delete-all", { targetUserId: profile.id, email: profile.email || "", entity: "user-data" });
      setAudit(readAdminAuditLog());
      notify("داده‌های Cloud کاربر حذف شد؛ حساب Auth حذف نشده است.");
    });
  }

  const catalogStats = useMemo(() => ({
    panels: catalog.solarPanels?.filter((item) => item.active !== false).length || 0,
    inverters: catalog.solarInverters?.filter((item) => item.active !== false).length || 0,
    batteries: catalog.batteries?.filter((item) => item.active !== false).length || 0,
    emergency: catalog.emergencyPower?.filter((item) => item.active !== false).length || 0,
    protections: catalog.protections?.filter((item) => item.active !== false).length || 0,
  }), [catalog]);

  const phase5Analytics = useMemo(() => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const projects = Array.isArray(data.projects) ? data.projects : [];
    const users = Array.isArray(data.users) ? data.users : [];
    const equipment = phase5CatalogFlat(catalog);
    const solar = projects.filter((item) => phase5ProjectDomain(item) === "solar").length;
    const emergency = projects.filter((item) => phase5ProjectDomain(item) === "emergency").length;
    const completed = projects.filter((item) => ["completed","final","done","approved","closed"].includes(phase5ProjectStatus(item))).length;
    const recent30 = projects.filter((item) => { const t = phase5ParseDate(item.updatedAt || item.createdAt); return t && now - t <= 30 * day; }).length;
    const userActivity = [1,7,30].map((days) => users.filter((user) => { const t = phase5ParseDate(user.lastAt); return t && now - t <= days * day; }).length);
    const signals = projects.map(phase5ProjectSignals);
    const projectsWithErrors = signals.filter((x) => x.errors > 0).length;
    const projectsWithWarnings = signals.filter((x) => x.warnings > 0).length;
    const reviewAttention = projects.filter((item) => ["submitted","under_review","needs_revision"].includes(String(item.engineeringReview?.status || item.reviewStatus || ""))).length;
    const powers = projects.map((item) => phase5DeepNumber(item,["totalPowerKw","powerKw","pvPowerKw","systemPowerKw","loadPowerKw"])).filter((x) => Number.isFinite(x));
    const energies = projects.map((item) => phase5DeepNumber(item,["dailyEnergyKwh","energyKwh","dailyKwh"])).filter((x) => Number.isFinite(x));
    const avg = (arr) => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : null;
    const missingBrand = equipment.filter((item) => !String(item.brand || "").trim()).length;
    const missingDatasheet = equipment.filter((item) => !String(item.datasheetUrl || "").trim()).length;
    const publishedEquipment = equipment.filter((item) => item.publishStatus === "published").length;
    const inactiveEquipment = equipment.filter((item) => item.active === false).length;
    const catalogValidation = validateEquipmentCatalog(catalog);
    const projectNoOutput = projects.filter((item) => !(item.finalOutput || item.output || item.result || item.results || item.calculationResult)).length;
    return {
      totalProjects: projects.length, solar, emergency, completed, recent30, reviewAttention, projectsWithErrors, projectsWithWarnings,
      active1d:userActivity[0], active7d:userActivity[1], active30d:userActivity[2], totalUsers:users.length,
      avgPowerKw:avg(powers), avgEnergyKwh:avg(energies),
      equipmentTotal:equipment.length, missingBrand, missingDatasheet, publishedEquipment, inactiveEquipment, catalogValidationCount:catalogValidation.length,
      projectNoOutput, storageKb:phase5ApproxStorageKb(), auditCount:audit.length, snapshotCount:snapshots.length, releaseCount:releaseState.history?.length || 0,
    };
  }, [data.projects, data.users, catalog, audit.length, snapshots.length, releaseState.history]);

  const phase6Diagnostics = useMemo(() => {
    const query = diagSearch.trim().toLowerCase();
    const all = Array.isArray(diagnostics) ? diagnostics : [];
    const open = all.filter((item) => item.status !== "resolved");
    const resolved = all.filter((item) => item.status === "resolved");
    const errors = all.filter((item) => ["error","critical"].includes(String(item.severity || "").toLowerCase()));
    const warnings = all.filter((item) => ["warning","warn"].includes(String(item.severity || "").toLowerCase()));
    const runtime = all.filter((item) => ["runtime","promise","react-boundary"].includes(item.type));
    const cloud = all.filter((item) => item.type === "cloud-sync");
    const visible = all.filter((item) => {
      if (diagFilter === "open" && item.status === "resolved") return false;
      if (diagFilter === "resolved" && item.status !== "resolved") return false;
      if (diagType !== "all" && item.type !== diagType) return false;
      if (!query) return true;
      return [item.message,item.type,item.source,item.projectId,item.userId,item.route].some((v)=>String(v||"").toLowerCase().includes(query));
    });
    const last24h = all.filter((item)=>{ const t=Date.parse(item.createdAt||""); return Number.isFinite(t) && Date.now()-t <= 86400000; }).length;
    return { all, open, resolved, errors, warnings, runtime, cloud, visible, last24h };
  }, [diagnostics, diagFilter, diagType, diagSearch]);

  function refreshDiagnostics() { setDiagnostics(readAdminDiagnostics()); }
  function handleResolveDiagnostic(id, note) { setDiagnostics(resolveAdminDiagnostic(id, note)); logAdminAction("diagnostics:resolved", { id, note: String(note || "") }); setAudit(readAdminAuditLog()); }
  function handleReopenDiagnostic(id) { setDiagnostics(reopenAdminDiagnostic(id)); logAdminAction("diagnostics:reopened", { id }); setAudit(readAdminAuditLog()); }
  function handleClearResolvedDiagnostics() { setDiagnostics(clearResolvedAdminDiagnostics()); logAdminAction("diagnostics:clear-resolved", {}); setAudit(readAdminAuditLog()); }
  function handleClearAllDiagnostics() { if (!window.confirm("همه رخدادهای Diagnostic پاک شوند؟")) return; setDiagnostics(clearAllAdminDiagnostics()); logAdminAction("diagnostics:clear-all", {}); setAudit(readAdminAuditLog()); }
  function handleExportDiagnostics() { downloadJson(`shil-admin-diagnostics-${Date.now()}.json`, exportDiagnosticsBundle({ adminVersion: ADMIN_SYSTEM_VERSION, activeRelease: releaseState.activeRelease || null })); logAdminAction("diagnostics:export", { count: diagnostics.length }); setAudit(readAdminAuditLog()); }

  const overviewMetrics = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const recentProjects = data.projects.filter((item) => {
      const at = Date.parse(item.updatedAt || item.createdAt || "");
      return Number.isFinite(at) && now - at <= dayMs;
    });
    const finalProjects = data.projects.filter((item) => ["completed", "final", "done", "approved", "closed"].includes(String(item.status || "").toLowerCase()));
    const openFeedback = data.feedback.filter((item) => item.status !== "answered" && item.status !== "closed");
    return {
      recentProjects: recentProjects.length,
      finalProjects: finalProjects.length,
      openFeedback: openFeedback.length,
      activeEquipment: catalogStats.panels + catalogStats.inverters + catalogStats.batteries + catalogStats.emergency + catalogStats.protections,
    };
  }, [data.projects, data.feedback, catalogStats]);

  const overviewTimeline = useMemo(() => {
    const adminEvents = audit.slice(0, 8).map((item) => ({
      key: `audit-${item.id}`,
      title: String(item.type || "رویداد مدیریتی").replaceAll("-", " ").replaceAll(":", " · "),
      subtitle: "ثبت‌شده در گزارش فعالیت ادمین",
      at: item.at,
      tone: String(item.type || "").includes("failed") ? "warn" : "info",
    }));
    const projectEvents = data.projects.slice(0, 6).map((item) => ({
      key: `project-${item.id || item.sourceKey}`,
      title: item.projectName || item.title || "پروژه بروزرسانی شد",
      subtitle: item.userLogin || item.userId || "کاربر",
      at: item.updatedAt || item.createdAt,
      tone: "ok",
    }));
    return [...adminEvents, ...projectEvents]
      .filter((item) => item.at)
      .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
      .slice(0, 10);
  }, [audit, data.projects]);

  const globalSearchResults = useMemo(() => {
    const query = globalSearch.trim().toLocaleLowerCase("fa");
    if (!query) return [];
    const pool = [
      ...data.users.map((item) => ({ type: "کاربر", title: item.login || item.userId, detail: item.userId || "", tab: "users" })),
      ...data.projects.map((item) => ({ type: "پروژه", title: item.projectName || item.title || item.customerName || "پروژه", detail: `${item.city || ""} ${item.userLogin || item.userId || ""}`, tab: "projects" })),
      ...(catalog.solarPanels || []).map((item) => ({ type: "پنل", title: item.title || item.brand || "پنل", detail: `${item.brand || ""} ${item.powerW || ""} W`, tab: "catalog" })),
      ...(catalog.solarInverters || []).map((item) => ({ type: "اینورتر", title: item.title || item.brand || "اینورتر", detail: `${item.brand || ""} ${item.powerKw || ""} kW`, tab: "catalog" })),
      ...(catalog.batteries || []).map((item) => ({ type: "باتری", title: item.title || item.brand || "باتری", detail: `${item.brand || ""} ${item.voltageV || ""} V`, tab: "catalog" })),
    ];
    return pool.filter((item) => `${item.title} ${item.detail} ${item.type}`.toLocaleLowerCase("fa").includes(query)).slice(0, 12);
  }, [globalSearch, data.users, data.projects, catalog]);

  const reviewProjects = useMemo(() => {
    const q = reviewSearch.trim().toLocaleLowerCase("fa");
    return data.projects.filter((item) => {
      const status = getProjectReviewStatus(item);
      const domain = getProjectDomain(item);
      const matchesStatus = reviewFilter === "all" || status === reviewFilter;
      const matchesDomain = reviewDomain === "all" || domain === reviewDomain;
      const haystack = `${item.projectName || ""} ${item.title || ""} ${item.customerName || ""} ${item.userLogin || ""} ${item.userId || ""}`.toLocaleLowerCase("fa");
      return matchesStatus && matchesDomain && (!q || haystack.includes(q));
    }).sort((a, b) => Date.parse(b.updatedAt || b.createdAt || 0) - Date.parse(a.updatedAt || a.createdAt || 0));
  }, [data.projects, reviewFilter, reviewDomain, reviewSearch]);

  const reviewMetrics = useMemo(() => {
    const counts = { submitted: 0, under_review: 0, needs_revision: 0, approved: 0, rejected: 0 };
    data.projects.forEach((item) => { const key = getProjectReviewStatus(item); counts[key] = (counts[key] || 0) + 1; });
    return counts;
  }, [data.projects]);

  if (session?.role !== "admin") return <Navigate to="/login" replace />;
  if (emergencyLock.locked || recoveryRequested) {
    return (
      <RecoveryLockGate
        onRecovered={() => {
          if (window.location.hash === "#admin-recovery") {
            window.history.replaceState(
              null,
              "",
              window.location.pathname + window.location.search
            );
          }
          setRecoveryRequested(false);
          setEmergencyLock(readEmergencyLock());
          setUnlocked(false);
        }}
      />
    );
  }
async function setupOrRotateRecoveryCode() {
    const code = generateRecoveryCode();
    try {
      await configureRecoveryCode(code);
      setGeneratedRecoveryCode(code);
      setRecoveryState(readRecoveryState());
      notify("Recovery Code جدید ساخته شد. آن را در محل امن نگهداری کنید؛ بعداً دوباره نمایش داده نمی‌شود.");
    } catch (error) { notify(error?.message || "ساخت Recovery Code ناموفق بود."); }
  }

  async function exportRecoveryBackup() {
    try {
      const backup = await createEncryptedRecoveryBackup(recoveryCodeInput);
      downloadJson(`shil-admin-recovery-backup-${new Date().toISOString().slice(0,10)}.json`, backup);
      setRecoveryCodeInput("");
      notify("Backup امنیتی رمزگذاری‌شده ساخته شد.");
    } catch (error) { notify(error?.message || "ساخت Backup امنیتی ناموفق بود."); }
  }

  async function importRecoveryBackup(file) {
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      await restoreEncryptedRecoveryBackup(payload, recoveryCodeInput);
      setRecoveryCodeInput("");
      setAdminCredentials(readAdminLoginCredentials());
      setSecurity(readAdminSecurity());
      setRecoveryState(readRecoveryState());
      syncAdminState();
      notify("Backup امنیتی با موفقیت بازیابی شد.");
    } catch (error) { notify(error?.message || "بازیابی Backup امنیتی ناموفق بود."); }
    finally { if (recoveryFileRef.current) recoveryFileRef.current.value = ""; }
  }

  function lockAdminImmediately() {
    requestSensitiveAction("فعال‌سازی قفل اضطراری پنل ادمین", async () => {
      if (!readRecoveryState().configured) throw new Error("ابتدا Recovery Code را فعال کنید؛ بدون Recovery Code قفل اضطراری مجاز نیست.");
      const lock = activateEmergencyLock("قفل اضطراری توسط مدیر فعال شد");
      setEmergencyLock(lock);
      setUnlocked(false);
    });
  }

  async function resetAccessWithRecovery() {
    try {
      await recoverLocalAdminAccess(recoveryCodeInput, recoveryReset);
      setAdminCredentials(readAdminLoginCredentials());
      setSecurity(readAdminSecurity());
      setEmergencyLock(readEmergencyLock());
      setRecoveryCodeInput("");
      setRecoveryReset({ login: "", password: "", pin: "" });
      notify("Credential و PIN محلی ادمین با Recovery Code بازنشانی شد.");
    } catch (error) { notify(error?.message || "بازیابی دسترسی محلی ناموفق بود."); }
  }

  async function loadCloudData(showMessage = false) {
    if (!canCloudAdmin) {
      setCloudStatus({ online: false, loading: false, message: "Emergency Local Admin: دسترسی Cloud مدیریتی غیرفعال است." });
      return;
    }
    if (!isSupabaseReady()) {
      setCloudStatus({ online: false, loading: false, message: "Supabase تنظیم نشده؛ حالت لوکال فعال است." });
      return;
    }
    try {
      setCloudStatus((prev) => ({ ...prev, online: true, loading: true, message: "در حال دریافت داده از Supabase..." }));
      const snapshot = await readCloudRecords();
      const directoryUsers = await getCombinedUserDirectory();
      if (directoryUsers.length) snapshot.users = directoryUsers;
      const cloudUsers = await readCloudUserDirectory();
      if (cloudUsers.length) snapshot.users = cloudUsers;
      setCloudData(snapshot);
      setCloudStatus({ online: true, loading: false, message: `Supabase متصل است؛ ${snapshot.projects.length + snapshot.feedback.length + snapshot.assistant.length} رکورد آنلاین دریافت شد.` });
      if (showMessage) notify("داده‌های آنلاین Supabase بروزرسانی شد.");
    } catch (error) {
      setCloudStatus({ online: false, loading: false, message: error.message || "اتصال Supabase ناموفق بود." });
    }
  }

  async function pushLocalToCloud() {
    if (!canCloudAdmin) { notify("برای Sync مدیریتی باید با ادمین آنلاین وارد شوید."); return; }
    try {
      setCloudStatus((prev) => ({ ...prev, loading: true, message: "در حال ارسال داده‌های لوکال به Supabase..." }));
      const count = await pushAllLocalRecordsToCloud();
      await loadCloudData(false);
      notify(`${count} رکورد لوکال به Supabase ارسال شد.`);
    } catch (error) {
      setCloudStatus({ online: false, loading: false, message: error.message || "ارسال به Supabase انجام نشد." });
      notify(error.message || "ارسال به Supabase انجام نشد.");
    }
  }

  function syncAdminState() {
    setAudit(readAdminAuditLog());
    setSnapshots(readAdminSnapshots());
    setHealth(validateAdminSystem());
    setSecurity(readAdminSecurity());
    setDataVersion((value) => value + 1);
  }

  function notify(text) {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2600);
    syncAdminState();
  }

  async function logout() {
    await logoutCurrentSession();
    navigate("/login", { replace: true });
  }

  function updateCard(index, patch) {
    setCards((prev) => prev.map((card, itemIndex) => (itemIndex === index ? { ...card, ...patch } : card)));
  }

  function addCard() {
    setCards((prev) => [...prev, { key: `path-${Date.now()}`, title: "مسیر جدید", description: "در حال توسعه", image: "", calculationDomain: "future", active: true, order: prev.length + 1 }]);
  }

  function removeCard(index) {
    setCards((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  }

  async function uploadCardPng(index, file) {
    try {
      const image = await fileToDataUrl(file, defaults.maxPngKb);
      updateCard(index, { image });
      notify("تصویر PNG کارت مسیر پروژه آماده ذخیره شد.");
    } catch (error) {
      notify(error.message || "بارگذاری تصویر انجام نشد.");
    }
  }

  function saveCards() {
    const saved = saveAdminProjectPathCards(cards);
    setCards(saved);
    setReleaseValidation(validateEngineeringRelease());
    notify("کارت‌های مسیر پروژه ذخیره شدند.");
  }

  async function saveConsumerCatalogData() {
    const saved = await saveConsumerEquipmentLibrary(consumerCatalog);
    setConsumerCatalog(saved);
    logAdminAction("consumer-equipment:update", { count: saved.length, entity: "consumer-equipment" });
    setAudit(readAdminAuditLog());
    return saved;
  }

  function updateCatalogItem(group, index, patch) {
    setCatalog((prev) => ({ ...prev, [group]: (prev[group] || []).map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)) }));
  }

  function addCatalogItem(group) {
    const templates = {
      solarPanels: { id: `panel-${Date.now()}`, title: "پنل جدید", brand: "", model: "", powerW: 620, voltageV: 41, currentA: 15, efficiency: 22, category: "پنل خورشیدی", publishStatus: "draft", revision: 1, standards: ["IEC 61215", "IEC 61730"], active: true },
      solarInverters: { id: `inv-${Date.now()}`, title: "اینورتر جدید", brand: "", model: "", powerKw: 5, dcVoltageV: 48, mpptMinV: 120, mpptMaxV: 450, type: "hybrid", category: "اینورتر خورشیدی", publishStatus: "draft", revision: 1, standards: ["IEC 62109"], active: true },
      batteries: { id: `bat-${Date.now()}`, title: "باتری جدید", brand: "", model: "", voltageV: 48, capacityAh: 100, chemistry: "LiFePO4", dod: 0.8, category: "باتری", publishStatus: "draft", revision: 1, standards: ["IEC 62619"], active: true },
      emergencyPower: { id: `ep-${Date.now()}`, title: "دستگاه برق اضطراری جدید", brand: "", model: "", powerKw: 5, batteryVoltageV: 48, category: "برق اضطراری", publishStatus: "draft", revision: 1, standards: ["IEC 62040"], active: true },
      protections: { id: `prot-${Date.now()}`, title: "حفاظت جدید", brand: "", model: "", group: "shared", rating: "", category: "حفاظت", standard: "IEC 60947-2", publishStatus: "draft", revision: 1, standards: ["IEC 60947-2"], active: true },
    };
    setCatalog((prev) => ({ ...prev, [group]: [...(prev[group] || []), templates[group]] }));
  }

  function removeCatalogItem(group, index) {
    setCatalog((prev) => ({ ...prev, [group]: (prev[group] || []).filter((_, itemIndex) => itemIndex !== index) }));
  }

  function saveCatalogData() {
    try {
      const saved = saveAdminCatalog(catalog);
      setCatalog(saved);
      setReleaseValidation(validateEngineeringRelease());
      notify("بانک تجهیزات مهندسی ذخیره و نسخه‌بندی شد.");
    } catch (error) {
      notify(error.message || "اعتبارسنجی بانک تجهیزات ناموفق بود.");
    }
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
    setReleaseValidation(validateEngineeringRelease());
    notify("تنظیمات پیش‌فرض مهندسی ذخیره شد.");
  }

  async function importConfig(file) {
    if (!file) return;
    try {
      const text = await file.text();
      importAdminJson(JSON.parse(text));
      setCards(readAdminProjectPathCards());
      setCatalog(readAdminCatalog());
      setDefaults(readAdminDefaults());
      setEngineeringRules(readEngineeringRules());
      setEngineeringStandards(readEngineeringStandards());
      setReleaseState(readAdminReleases());
      setReleaseDraft(readAdminReleases().draft);
      setReleaseValidation(validateEngineeringRelease());
      notify("تنظیمات ادمین از فایل JSON وارد شد.");
    } catch (error) {
      notify(error.message || "ورود فایل تنظیمات انجام نشد.");
    }
  }

  function resetAll() {
    resetAdminSystem();
    setCards(DEFAULT_PROJECT_PATH_CARDS);
    setCatalog(DEFAULT_EQUIPMENT_CATALOG);
    setDefaults(DEFAULT_ADMIN_DEFAULTS);
    setEngineeringRules(DEFAULT_ENGINEERING_RULES);
    setEngineeringStandards(DEFAULT_ENGINEERING_STANDARDS);
    setReleaseState(readAdminReleases());
    setReleaseDraft(readAdminReleases().draft);
    setReleaseValidation(validateEngineeringRelease());
    notify("تنظیمات ادمین به حالت استاندارد برگشت.");
  }

  function makeSnapshot() {
    setSnapshots(createAdminSnapshot("نسخه دستی ادمین"));
    notify("نسخه پشتیبان دستی ساخته شد.");
  }

  function restoreSnapshot(id) {
    try {
      restoreAdminSnapshot(id);
      setCards(readAdminProjectPathCards());
      setCatalog(readAdminCatalog());
      setDefaults(readAdminDefaults());
      setEngineeringRules(readEngineeringRules());
      setEngineeringStandards(readEngineeringStandards());
      setReleaseState(readAdminReleases());
      setReleaseDraft(readAdminReleases().draft);
      setReleaseValidation(validateEngineeringRelease());
      notify("نسخه پشتیبان بازیابی شد.");
    } catch (error) {
      notify(error.message || "بازیابی انجام نشد.");
    }
  }

  async function changePin() {
    try {
      await changeAdminPin(newPin);
      setNewPin("");
      setSecurity(readAdminSecurity());
      notify("رمز امن لایه دوم ادمین تغییر کرد.");
    } catch (error) {
      notify(error.message || "تغییر رمز انجام نشد.");
    }
  }

  async function saveCredentials() {
    try {
      const savedCredentials = await saveAdminLoginCredentials(adminCredentials);
      setAdminCredentials(savedCredentials);
      notify("ورود محلی ادمین با PBKDF2 ذخیره شد؛ پسورد خام ذخیره یا Cloud Sync نمی‌شود.");
    } catch (error) {
      notify(error.message || "ذخیره یوزر و پسورد انجام نشد.");
    }
  }

  function getBaseKeyFromItem(item) {
    return item.baseKey || item.sourceKey?.split(":")[0] || "shil-records";
  }

  function patchRecord(item, patch) {
    const updatedList = updateRecordBySourceKey(item.sourceKey, item.id, patch);
    const updated = updatedList.find((record) => record.id === item.id) || { ...item, ...patch };
    if (cloudData?.online || isSupabaseReady()) upsertCloudRecord(getBaseKeyFromItem(item), updated).then(() => loadCloudData(false)).catch((error) => notify(error.message || "بروزرسانی Supabase انجام نشد."));
    notify("رکورد کاربر بروزرسانی شد.");
  }

  function removeRecord(item) {
    deleteRecordBySourceKey(item.sourceKey, item.id);
    if (cloudData?.online || isSupabaseReady()) deleteCloudRecord(getBaseKeyFromItem(item), item.id).then(() => loadCloudData(false)).catch((error) => notify(error.message || "حذف از Supabase انجام نشد."));
    notify("رکورد کاربر حذف شد.");
  }

  async function publishProjectScenario(item) {
    try {
      const scenario = await publishProjectAsReadyScenario(item);
      const patch = { scenarioPublishedAt: new Date().toISOString(), scenarioId: scenario.id, status: item.status || "reviewed" };
      const updatedList = updateRecordBySourceKey(item.sourceKey, item.id, patch);
      const updated = updatedList.find((record) => record.id === item.id) || { ...item, ...patch };
      if (cloudData?.online || isSupabaseReady()) {
        upsertCloudRecord(getBaseKeyFromItem(item), updated)
          .then(() => loadCloudData(false))
          .catch((error) => console.warn("SHIL project scenario metadata sync:", error?.message || error));
      }
      notify(`پروژه به سناریوهای آماده ${projectDomain(item) === "emergency" ? "برق اضطراری" : "خورشیدی"} منتقل شد.`);
    } catch (error) {
      notify(friendlyAdminError(error, "انتقال پروژه به سناریوهای آماده ناموفق بود."));
    }
  }

  function openReply(item) {
    setReplyDraft({ id: item.id, sourceKey: item.sourceKey, text: item.adminReply || "" });
    setTab("feedback");
  }

  function saveReply() {
    if (!replyDraft.id || !replyDraft.sourceKey) return;
    updateRecordBySourceKey(replyDraft.sourceKey, replyDraft.id, {
      adminReply: replyDraft.text.trim() || "در انتظار پاسخ ادمین",
      status: replyDraft.text.trim() ? "answered" : "open",
      answeredBy: "admin-root",
      answeredAt: new Date().toISOString(),
    });
    setReplyDraft({ id: "", sourceKey: "", text: "" });
    notify("پاسخ ادمین برای کاربر ذخیره شد.");
  }

  function setEngineeringReview(item, status, note = "") {
    const now = new Date().toISOString();
    const previous = item?.engineeringReview || {};
    const patch = {
      engineeringReview: {
        ...previous,
        status,
        note: String(note || "").trim(),
        reviewer: session?.login || session?.username || session?.userLogin || "admin",
        reviewedAt: now,
        updatedAt: now,
        history: [
          { status, note: String(note || "").trim(), at: now, reviewer: session?.login || session?.username || session?.userLogin || "admin" },
          ...(Array.isArray(previous.history) ? previous.history : []),
        ].slice(0, 30),
      },
      reviewStatus: status,
    };
    patchRecord(item, patch);
    setDataVersion((v) => v + 1);
    logAdminAction(`engineering-review:${status}`, { projectId: item.id, projectName: item.projectName || item.title || "", userId: item.userId || "", note: patch.engineeringReview.note });
    setAudit(readAdminAuditLog());
  }

  function updateRule(group, key, value) {
    setEngineeringRules((prev) => ({ ...prev, [group]: { ...(prev[group] || {}), [key]: value } }));
  }

  function saveRules() {
    try {
      const next = saveEngineeringRules(engineeringRules);
      setEngineeringRules(next);
      setReleaseValidation(validateEngineeringRelease());
      notify("قوانین مهندسی ذخیره شد؛ برای اثرگذاری رسمی، Release را Publish کنید.");
    } catch (error) { notify(error.message || "ذخیره قوانین انجام نشد."); }
  }

  function addStandard() {
    setEngineeringStandards((prev) => [...prev, { id: makeAdminId("std"), code: "IEC ", title: "", domain: "shared", active: true, note: "" }]);
  }

  function updateStandard(index, patch) {
    setEngineeringStandards((prev) => prev.map((item, i) => i === index ? { ...item, ...patch } : item));
  }

  function removeStandard(index) { setEngineeringStandards((prev) => prev.filter((_, i) => i !== index)); }

  function saveStandards() {
    try {
      const next = saveEngineeringStandards(engineeringStandards);
      setEngineeringStandards(next);
      setReleaseValidation(validateEngineeringRelease());
      notify("مرکز استانداردها ذخیره شد.");
    } catch (error) { notify(error.message || "ذخیره استانداردها انجام نشد."); }
  }

  function persistReleaseDraft() {
    try {
      const next = saveReleaseDraft(releaseDraft);
      setReleaseState(next);
      setReleaseDraft(next.draft);
      notify("پیش‌نویس Release ذخیره شد.");
    } catch (error) { notify(error.message || "ذخیره Release انجام نشد."); }
  }

  function publishRelease() {
    try {
      const next = publishEngineeringRelease({ ...releaseDraft, actor: session?.login || session?.username || "admin" });
      setReleaseState(next);
      setReleaseDraft(next.draft);
      setReleaseValidation(validateEngineeringRelease());
      setAudit(readAdminAuditLog());
      setSnapshots(readAdminSnapshots());
      notify(`نسخه ${next.activeRelease?.version || "مهندسی"} منتشر شد.`);
    } catch (error) { notify(error.message || "انتشار نسخه متوقف شد."); }
  }

  function exportReviewProject(item) {
    downloadJson(`shil-engineering-review-${item.id || Date.now()}.json`, {
      exportedAt: new Date().toISOString(),
      adminSystemVersion: ADMIN_SYSTEM_VERSION,
      project: item,
      review: item.engineeringReview || { status: getProjectReviewStatus(item) },
      engineeringSnapshot: projectEngineeringSnapshot(item),
    });
  }

  function exportPhase5Report(kind) {
    const now = new Date().toISOString();
    const base = { exportedAt: now, adminSystemVersion: ADMIN_SYSTEM_VERSION, activeRelease: releaseState.activeRelease || null };
    const payloads = {
      projects: { ...base, projects: data.projects },
      users: { ...base, users: data.users },
      equipment: { ...base, equipmentCatalog: catalog, validation: validateEquipmentCatalog(catalog) },
      reviews: { ...base, reviews: data.projects.map((item) => ({ id:item.id, title:item.projectName || item.title || "", userId:item.userId || "", domain:phase5ProjectDomain(item), review:item.engineeringReview || null })) },
      diagnostics: { ...base, analytics: phase5Analytics, health, releaseValidation, audit: audit.slice(0,160) },
    };
    downloadJson(`shil-admin-${kind}-${Date.now()}.json`, payloads[kind] || { ...base, analytics: phase5Analytics });
    logAdminAction(`analytics:export:${kind}`, { projectCount: data.projects.length });
    setAudit(readAdminAuditLog());
  }

  const tabs = [
    ["overview", "نمای کلی"],
    ["review", "بررسی مهندسی"],
    ["users", "کاربران"],
    ["projects", "سیوها و پروژه‌ها"],
    ["feedback", "نظرات و پاسخ‌ها"],
    ["cards", "کارت‌های مسیر"],
    ["defaults", "پیش‌فرض‌ها"],
    ["loads", "مصرف‌کننده‌ها"],
    ["catalog", "بانک تجهیزات"],
    ["rules", "قوانین و Release"],
    ["analytics", "تحلیل و پایش"],
    ["diagnostics", "خطا و Diagnostics"],
    ["security", "امنیت و نسخه"],
    ["cloud", "ابر/Supabase"],
  ];

  const adminGroups = [
    { key: "monitoring", title: "نمای کلی", note: "داشبورد، KPIها و گزارش‌های مدیریتی", items: [{ key: "overview", label: "نمای کلی" }, { key: "analytics", label: "تحلیل و پایش" }] },
    { key: "engineering", title: "بررسی مهندسی", note: "صف بررسی، تأیید و اصلاح پروژه‌ها", items: [{ key: "review", label: "بررسی مهندسی" }] },
    { key: "people", title: "کاربران", note: "کاربران، نظرات و پاسخ‌های ادمین", items: [{ key: "users", label: "کاربران" }, { key: "feedback", label: "نظرات و پاسخ‌ها" }] },
    { key: "projects", title: "پروژه‌ها", note: "مدیریت پروژه‌ها، Saveها و کارت‌های مسیر", items: [{ key: "projects", label: "سیوها و پروژه‌ها" }, { key: "cards", label: "کارت‌های مسیر" }] },
    { key: "equipment", title: "تجهیزات", note: "بانک مصرف‌کننده‌ها، تجهیزات فنی و پیش‌فرض‌های مهندسی", items: [{ key: "loads", label: "مصرف‌کننده‌ها" }, { key: "catalog", label: "بانک تجهیزات" }, { key: "defaults", label: "پیش‌فرض‌ها" }] },
    { key: "release", title: "قوانین", note: "Rule Engine، استانداردها و Release", items: [{ key: "rules", label: "قوانین و Release" }] },
    { key: "security", title: "امنیت", note: "دسترسی ادمین، PIN و نسخه‌های پشتیبان", items: [{ key: "security", label: "امنیت و نسخه" }] },
    { key: "services", title: "خطا و سرویس‌ها", note: "Diagnostics، Supabase و همگام‌سازی", items: [{ key: "diagnostics", label: "خطا و Diagnostics" }, { key: "cloud", label: "ابر/Supabase" }] },
  ];

  const currentAdminGroup = adminGroups.find((group) => group.items.some((item) => item.key === tab)) || adminGroups[0];

  const engineeringDefaultSteps = [
    { key: "path", title: "مسیر پروژه", note: "انتخاب شاخه و رفتار شروع پروژه" },
    { key: "info", title: "اطلاعات پروژه", note: "پیش‌فرض‌های ثبت مشخصات پروژه" },
    { key: "environment", title: "شرایط محیطی", note: "مبنای داده‌های محیطی و اقلیمی" },
    { key: "method", title: "روش ورود دیتا", note: "روش ورود و آماده‌سازی داده‌ها" },
    { key: "inputs", title: "ورودی محاسبات", note: "مقادیر پایه ورودی موتور" },
    { key: "system", title: "تنظیمات", note: "پارامترهای طراحی و تجهیزات" },
    { key: "summary", title: "چکیده طراحی", note: "کنترل خروجی پیش از اجرا" },
    { key: "run", title: "اجرا", note: "مبنای اجرای نهایی موتور" },
  ];

  function openDefaultsPath(path) {
    setDefaultsPath(path);
    setTab("defaults");
    setAdminView("section");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function publishDefaultsPath(path) {
    const saved = saveAdminDefaults({
      ...defaults,
      solarPanelDefaultW: normalizeNumber(defaults.solarPanelDefaultW, DEFAULT_ADMIN_DEFAULTS.solarPanelDefaultW),
      solarPanelManualW: normalizeNumber(defaults.solarPanelManualW, DEFAULT_ADMIN_DEFAULTS.solarPanelManualW),
      defaultAutonomyDays: normalizeNumber(defaults.defaultAutonomyDays, DEFAULT_ADMIN_DEFAULTS.defaultAutonomyDays),
      defaultSafetyFactor: normalizeNumber(defaults.defaultSafetyFactor, DEFAULT_ADMIN_DEFAULTS.defaultSafetyFactor),
      emergencyRequiredHours: Math.max(1, Math.min(24, normalizeNumber(defaults.emergencyRequiredHours, 3))),
      emergencySafetyFactor: normalizeNumber(defaults.emergencySafetyFactor, DEFAULT_ADMIN_DEFAULTS.emergencySafetyFactor),
      maxPngKb: normalizeNumber(defaults.maxPngKb, DEFAULT_ADMIN_DEFAULTS.maxPngKb),
    });
    setDefaults(saved);
    notify(`پیش‌فرض‌های ${path === "solar" ? "خورشیدی" : "برق اضطراری"} ذخیره و برای Runtime کاربران منتشر شد.`);
  }

  function resetDefaultsPath(path) {
    if (!window.confirm("پیش‌فرض‌های این مسیر به مقادیر کارخانه برگردد؟")) return;
    setDefaults((prev) => path === "solar" ? {
      ...prev,
      solarPanelDefaultW: DEFAULT_ADMIN_DEFAULTS.solarPanelDefaultW,
      solarPanelManualW: DEFAULT_ADMIN_DEFAULTS.solarPanelManualW,
      defaultAutonomyDays: DEFAULT_ADMIN_DEFAULTS.defaultAutonomyDays,
      defaultSafetyFactor: DEFAULT_ADMIN_DEFAULTS.defaultSafetyFactor,
    } : {
      ...prev,
      emergencyRequiredHours: DEFAULT_ADMIN_DEFAULTS.emergencyRequiredHours,
      emergencySafetyFactor: DEFAULT_ADMIN_DEFAULTS.emergencySafetyFactor,
    });
    notify("مقادیر کارخانه در پیش‌نویس قرار گرفت؛ برای اعمال، انتشار را بزنید.");
  }

  function DefaultField({ label, value, onChange, min, max, step = "any", suffix = "" }) {
    return <label className="shil-default-field-v254"><span>{label}</span><div><input type="number" value={value} min={min} max={max} step={step} onChange={(e)=>onChange(e.target.value)} />{suffix ? <small>{suffix}</small> : null}</div></label>;
  }

  function DefaultsStageBody({ path, stepKey }) {
    const solar = path === "solar";
    if (stepKey === "path") return <div className="shil-default-note-v254"><strong>پیش‌فرض مسیر</strong><span>{solar ? "اجرای پروژه با پنل خورشیدی" : "اجرای پروژه برق اضطراری"}</span></div>;
    if (stepKey === "info") return <div className="shil-default-note-v254"><strong>پیش‌فرض‌های اطلاعات پروژه</strong><span>اطلاعات هویتی پروژه توسط کاربر ثبت می‌شود و مقدار اجباری از سمت ادمین ندارد.</span></div>;
    if (stepKey === "environment") return <div className="shil-default-note-v254"><strong>پیش‌فرض‌های شرایط محیطی</strong><span>{solar ? "داده‌های اقلیمی و موقعیت پروژه مبنای محاسبه خورشیدی هستند." : "شرایط محیطی در مسیر برق اضطراری ثبت می‌شود و پارامتر مستقل اجباری ندارد."}</span></div>;
    if (stepKey === "method") return <div className="shil-default-note-v254"><strong>پیش‌فرض‌های روش ورود دیتا</strong><span>روش ورود دیتا در پروژه توسط کاربر انتخاب می‌شود.</span></div>;
    if (stepKey === "inputs") return solar ? <div className="shil-default-fields-v254"><DefaultField label="توان پنل پیش‌فرض" suffix="W" value={defaults.solarPanelDefaultW} min="1" onChange={(v)=>setDefaults(p=>({...p,solarPanelDefaultW:v}))}/><DefaultField label="توان پنل دستی پیشنهادی" suffix="W" value={defaults.solarPanelManualW} min="1" onChange={(v)=>setDefaults(p=>({...p,solarPanelManualW:v}))}/></div> : <div className="shil-default-note-v254"><strong>پیش‌فرض بارهای اضطراری</strong><span>ساعت مبنای همه مصرف‌کننده‌ها ثابت و برابر ۱ ساعت است. ضرایب همزمانی فعلی حفظ می‌شوند.</span></div>;
    if (stepKey === "system") return solar ? <div className="shil-default-fields-v254"><DefaultField label="روز خودکفایی" suffix="روز" value={defaults.defaultAutonomyDays} min="1" onChange={(v)=>setDefaults(p=>({...p,defaultAutonomyDays:v}))}/><DefaultField label="ضریب اطمینان" value={defaults.defaultSafetyFactor} min="1" step="0.01" onChange={(v)=>setDefaults(p=>({...p,defaultSafetyFactor:v}))}/></div> : <div className="shil-default-fields-v254"><DefaultField label="زمان برق اضطراری" suffix="ساعت" value={defaults.emergencyRequiredHours} min="1" max="24" step="1" onChange={(v)=>setDefaults(p=>({...p,emergencyRequiredHours:v}))}/><DefaultField label="ضریب اطمینان" value={defaults.emergencySafetyFactor} min="1" step="0.01" onChange={(v)=>setDefaults(p=>({...p,emergencySafetyFactor:v}))}/><div className="shil-default-note-v254"><strong>قاعده موتور</strong><span>زمان پیش‌فرض ۳ ساعت و محدوده مجاز کاربر ۱ تا ۲۴ ساعت است؛ انتخاب اینورتر از توان مؤثر و باتری از توان مؤثر × زمان پشتیبانی انجام می‌شود.</span></div></div>;
    if (stepKey === "summary") return <div className="shil-default-note-v254"><strong>پیش‌فرض‌های چکیده</strong><span>چکیده از داده‌های تأییدشده مراحل قبل ساخته می‌شود و مقدار مستقل قابل تغییر ندارد.</span></div>;
    return <div className="shil-default-note-v254"><strong>پیش‌فرض‌های اجرا</strong><span>اجرای نهایی از موتور محاسبات و تنظیمات منتشرشده همین مسیر استفاده می‌کند.</span></div>;
  }

  function openAdminTab(key) {
    setTab(key);
    setAdminView("section");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <ShilPageShell title="کارتابل ادمین SHIL">
      <div className="shil-admin-v16-root shil-admin-v17-root shil-admin-v18-root shil-admin-v19-root shil-admin-v24-root" dir="rtl">
      <div className="shil-admin-management-title-v13" role="heading" aria-level="2">مرکز مدیریت SHIL</div>

      {adminView === "hub" ? (
        <div className="shil-admin-module-hub-v10" aria-label="بخش‌های کارتابل ادمین">
          <section className="shil-default-entry-v254" aria-label="پیش‌فرض‌های مسیر پروژه">
            <button type="button" onClick={() => openDefaultsPath("solar")}><strong>پیش‌فرض‌های خورشیدی</strong><span>مسیر اجرای پنل خورشیدی</span></button>
            <button type="button" onClick={() => openDefaultsPath("emergency")}><strong>پیش‌فرض‌های برق اضطراری</strong><span>مسیر اجرای برق اضطراری</span></button>
          </section>
          {adminGroups.map((group) => (
            <article key={group.key} className="shil-admin-module-card-v10">
              <button type="button" className="shil-admin-module-open-v13" onClick={() => openAdminTab(group.items[0].key)}>
                <span className="shil-admin-module-arrow-v10" aria-hidden="true">‹</span>
                <strong>{group.title}</strong>
                <span className="shil-admin-module-badge-v40">{adminModuleBadge({ groupKey: group.key, health, managedProfileSummary, securitySummary, diagnostics, recoveryState, cloudStatus })}</span>
                <span className="shil-admin-module-mark-v10" aria-hidden="true">◇</span>
              </button>
              <details className="shil-admin-module-details-v13">
                <summary>جزئیات</summary>
                <p>{group.note}</p>
              </details>
            </article>
          ))}
        </div>
      ) : (
        <div className="shil-admin-section-nav-v10">
          {currentAdminGroup.key !== "monitoring" ? (
            <div className="shil-admin-section-title-v10">
              <strong>{currentAdminGroup.title}</strong>
              <details className="shil-admin-section-details-v13"><summary>جزئیات</summary><p>{currentAdminGroup.note}</p></details>
            </div>
          ) : <div className="shil-admin-section-nav-spacer-v13" aria-hidden="true" />}
          {currentAdminGroup.items.length > 1 ? (
            <div className="shil-admin-child-tabs-v10">
              {currentAdminGroup.items.map((item) => (
                <button key={item.key} type="button" className={tab === item.key ? "active" : ""} onClick={() => setTab(item.key)}>{item.label}</button>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {message ? <div className="shil-admin-toast">{message}</div> : null}

      {adminView === "section" ? <>
      {tab === "overview" ? (
        <div className="shil-admin-command-center shil-admin-overview-v17">
          <section className="shil-admin-command-head shil-admin-overview-hero-v17">
            <div>
              <h3>داشبورد عملیاتی SHIL</h3>
            </div>
            <span className={`shil-admin-command-status ${health.ok ? "ok" : "warn"}`}>{health.ok ? "سیستم پایدار" : `${health.warnings.length} هشدار`}</span>
          </section>

          <section className="shil-admin-overview-readiness-v17" aria-label="وضعیت آمادگی سامانه">
            <details className={`shil-admin-readiness-score-v17 ${adminReadiness.ready ? "ready" : "blocked"}`}>
              <summary>
                <span>آمادگی سامانه</span>
                <strong>{adminReadiness.score}%</strong>
              </summary>
              <div className="shil-admin-readiness-score-detail-v17">
                <span>Production Readiness</span>
                <small>Admin Command Center v{ADMIN_COMMAND_CENTER_VERSION}</small>
              </div>
            </details>

            <div className="shil-admin-readiness-checks-v17">
              {adminReadiness.checks.map((item) => {
                const target = item.key === "recovery" || item.key === "sessions" || item.key === "auth" ? "security"
                  : item.key === "users" ? "users"
                  : item.key === "diagnostics" ? "diagnostics"
                  : item.key === "release" ? "rules"
                  : item.key === "cloud" ? "cloud" : "overview";
                return (
                  <details key={item.key} className={`shil-admin-readiness-card-v17 ${item.ok ? "ok" : item.required ? "blocker" : "warn"}`}>
                    <summary>
                      <span className="shil-admin-readiness-state-v17" aria-hidden="true">{item.ok ? "✓" : item.required ? "!" : "•"}</span>
                      <strong>{item.title}</strong>
                    </summary>
                    <div className="shil-admin-readiness-detail-v17">
                      <small>{item.detail}</small>
                      {target !== "overview" ? <button type="button" onClick={() => openAdminTab(target)}>باز کردن</button> : null}
                    </div>
                  </details>
                );
              })}
            </div>
          </section>

          <section className="shil-admin-overview-search shil-admin-overview-search-v17">
            <input value={globalSearch} onChange={(event) => setGlobalSearch(event.target.value)} placeholder="جستجوی کاربر، پروژه یا تجهیز..." dir="auto" />
            {globalSearch.trim() ? (
              <div className="shil-admin-search-results">
                {globalSearchResults.map((item, index) => (
                  <button key={`${item.type}-${item.title}-${index}`} type="button" onClick={() => { setTab(item.tab); setGlobalSearch(""); }}>
                    <span>{item.type}</span><strong>{item.title}</strong><small>{item.detail || "مشاهده"}</small>
                  </button>
                ))}
                {!globalSearchResults.length ? <p>موردی پیدا نشد.</p> : null}
              </div>
            ) : null}
          </section>

          <section className="shil-admin-overview-kpi-grid-v17">
            <OverviewKpiCard title="سلامت سیستم" value={health.ok ? "100%" : `${Math.max(0, 100 - health.warnings.length * 12)}%`} note={health.ok ? "کنترل‌های اصلی معتبر" : `${health.warnings.length} هشدار فعال`} status={health.ok ? "ok" : "warn"} />
            <OverviewKpiCard title="کاربران دارای داده" value={data.users.length} note={data.online ? "Supabase" : "Local/PWA"} />
            <OverviewKpiCard title="پروژه‌های کل" value={data.projects.length} note={`${overviewMetrics.recentProjects} بروزرسانی در 24 ساعت`} />
            <OverviewKpiCard title="پروژه‌های نهایی" value={overviewMetrics.finalProjects} note="بر اساس وضعیت ذخیره‌شده" />
            <OverviewKpiCard title="تجهیزات فعال" value={overviewMetrics.activeEquipment} note="بانک فنی قابل استفاده" />
            <OverviewKpiCard title="پیام‌های باز" value={overviewMetrics.openFeedback} note={`${data.feedback.length} پیام ثبت‌شده`} status={overviewMetrics.openFeedback ? "warn" : "ok"} />
          </section>

          <section className="shil-admin-overview-accordion-grid-v17">
            <AdminPanel title="سلامت سرویس‌ها">
              <div className="shil-admin-service-list">
                <AdminServiceRow title="موتور محاسبات" detail={health.ok ? "Validation پایدار" : "بررسی Validation"} status={health.ok ? "ok" : "warn"} meta={ADMIN_SYSTEM_VERSION} />
                <AdminServiceRow title="Supabase" detail={cloudStatus.message} status={cloudStatus.online ? "ok" : "idle"} meta={cloudStatus.loading ? "Sync..." : cloudStatus.online ? "Online" : "Local"} />
                <AdminServiceRow title="ذخیره PWA" detail="LocalStorage و Snapshot" status="ok" meta={`${snapshots.length} Snapshot`} />
                <AdminServiceRow title="بانک تجهیزات" detail={`${overviewMetrics.activeEquipment} تجهیز فعال`} status={overviewMetrics.activeEquipment ? "ok" : "warn"} meta="Catalog" />
              </div>
            </AdminPanel>

            <AdminPanel title="اعلان‌های مدیریتی">
              <div className="shil-admin-alert-list">
                {health.warnings.map((warning) => <div className="shil-admin-alert warn" key={warning}><strong>هشدار سیستم</strong><span>{warning}</span></div>)}
                {(reviewMetrics.submitted + reviewMetrics.under_review + reviewMetrics.needs_revision) ? <button type="button" className="shil-admin-alert warn" onClick={() => openAdminTab("review")}><strong>بررسی مهندسی</strong><span>{reviewMetrics.submitted + reviewMetrics.under_review + reviewMetrics.needs_revision} پروژه</span></button> : null}
                {overviewMetrics.openFeedback ? <button type="button" className="shil-admin-alert info" onClick={() => openAdminTab("feedback")}><strong>پیام‌های باز</strong><span>{overviewMetrics.openFeedback} مورد</span></button> : null}
                {!cloudStatus.online ? <button type="button" className="shil-admin-alert neutral" onClick={() => openAdminTab("cloud")}><strong>حالت Local</strong><span>Sync غیرفعال</span></button> : null}
                {health.ok && !overviewMetrics.openFeedback && cloudStatus.online ? <div className="shil-admin-alert ok"><strong>وضعیت مناسب</strong><span>مورد بحرانی نیست.</span></div> : null}
              </div>
            </AdminPanel>

            <AdminPanel title="عملیات سریع">
              <div className="shil-admin-quick-grid">
                <AdminQuickAction title="بررسی مهندسی" note="صف پروژه‌ها" onClick={() => openAdminTab("review")} />
                <AdminQuickAction title="پروژه‌ها" note="مدیریت Saveها" onClick={() => openAdminTab("projects")} />
                <AdminQuickAction title="کاربران" note="پروفایل کاربران" onClick={() => openAdminTab("users")} />
                <AdminQuickAction title="تجهیزات" note="بانک تجهیزات" onClick={() => openAdminTab("catalog")} />
                <AdminQuickAction title="قوانین" note="Rule و Release" onClick={() => openAdminTab("rules")} />
                <AdminQuickAction title="Cloud" note="Sync" onClick={() => openAdminTab("cloud")} />
              </div>
            </AdminPanel>

            <AdminPanel title="آخرین فعالیت‌ها">
              <div className="shil-admin-timeline">
                {overviewTimeline.map((item) => <AdminTimelineItem key={item.key} {...item} />)}
                {!overviewTimeline.length ? <p className="shil-admin-empty-mini">فعالیتی ثبت نشده است.</p> : null}
              </div>
            </AdminPanel>

            <AdminPanel title="نسخه و داده">
              <div className="shil-admin-version-list">
                <div><span>Admin / Engine</span><strong dir="ltr">{ADMIN_SYSTEM_VERSION}</strong></div>
                <div><span>Equipment DB</span><strong>{overviewMetrics.activeEquipment} Active</strong></div>
                <div><span>Storage</span><strong>{cloudStatus.online ? "Supabase + Local" : "Local / PWA"}</strong></div>
                <div><span>Validation</span><strong dir="ltr">{health.checkedAt ? new Date(health.checkedAt).toLocaleString("en-US") : "—"}</strong></div>
              </div>
            </AdminPanel>
          </section>

          <section className="shil-admin-overview-tools-v17">
            <button type="button" onClick={() => downloadJson("shil-admin-config-100.json", exportAdminJson())}>خروجی JSON</button>
            <button type="button" onClick={() => importRef.current?.click()}>ورود JSON</button>
            <button type="button" onClick={() => downloadJson("shil-admin-users-data.json", data)}>داده عملیاتی</button>
            <button type="button" onClick={makeSnapshot}>Snapshot</button>
            <button type="button" className="danger" onClick={() => requestSensitiveAction("بازگشت کامل تنظیمات ادمین به استاندارد", resetAll)}>استاندارد</button>
            <input ref={importRef} type="file" accept="application/json" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) requestSensitiveAction("ورود فایل JSON و جایگزینی تنظیمات ادمین", () => importConfig(file)); event.target.value = ""; }} />
          </section>
        </div>
      ) : null}

      
{tab === "review" ? (
        <div className="shil-admin-review-center">
          <section className="shil-admin-review-head">
            <div>
              <span>Engineering Review Center</span>
              <h3>صف بررسی و تأیید مهندسی پروژه‌ها</h3>
              <p>هر تصمیم همراه با یادداشت، بازبین و زمان ثبت در پرونده پروژه و Audit Log ذخیره می‌شود.</p>
            </div>
            <button type="button" onClick={() => downloadJson("shil-engineering-review-queue.json", reviewProjects)}>خروجی صف</button>
          </section>

          <section className="shil-admin-grid shil-admin-review-kpis">
            <StatCard title="ارسال‌شده" value={reviewMetrics.submitted} />
            <StatCard title="در حال بررسی" value={reviewMetrics.under_review} />
            <StatCard title="نیازمند اصلاح" value={reviewMetrics.needs_revision} status={reviewMetrics.needs_revision ? "warn" : "ok"} />
            <StatCard title="تأیید مهندسی" value={reviewMetrics.approved} status="ok" />
            <StatCard title="رد شده" value={reviewMetrics.rejected} status={reviewMetrics.rejected ? "warn" : ""} />
          </section>

          <section className="shil-admin-review-toolbar">
            <input value={reviewSearch} onChange={(event) => setReviewSearch(event.target.value)} placeholder="جستجو در نام پروژه، کاربر یا کارفرما..." dir="auto" />
            <select value={reviewFilter} onChange={(event) => setReviewFilter(event.target.value)}>
              <option value="all">همه وضعیت‌ها</option>
              <option value="submitted">ارسال‌شده</option>
              <option value="under_review">در حال بررسی</option>
              <option value="needs_revision">نیازمند اصلاح</option>
              <option value="approved">تأیید مهندسی</option>
              <option value="rejected">رد شده</option>
            </select>
            <select value={reviewDomain} onChange={(event) => setReviewDomain(event.target.value)}>
              <option value="all">همه مسیرها</option>
              <option value="solar">خورشیدی</option>
              <option value="emergency">برق اضطراری</option>
            </select>
          </section>

          <div className="shil-admin-review-list">
            {reviewProjects.map((item) => <ReviewProjectCard key={`${item.sourceKey}-${item.id}`} item={item} onStatus={setEngineeringReview} onExport={exportReviewProject} />)}
            {!reviewProjects.length ? <div className="shil-admin-review-empty">پروژه‌ای مطابق فیلتر فعلی وجود ندارد.</div> : null}
          </div>
        </div>
      ) : null}

      {tab === "users" ? (
        <AdminPanel title="مرکز مدیریت کاربران" subtitle="مدیریت Profile، Role، Status و فعالیت Cloud در کنار داده‌های Local/PWA.">
          {emergencyLocalAdmin ? <div className="shil-admin-alert warn"><strong>حالت Emergency Local Admin</strong><span>مدیریت کاربران Cloud در این حالت فقط قابل مشاهده نیست و کاملاً غیرفعال است؛ برای عملیات Cloud با ادمین Supabase وارد شوید.</span></div> : null}

          {canCloudAdmin ? <section className="shil-admin-user-center">
            <div className="shil-admin-user-stats">
              <StatCard title="کل کاربران Cloud" value={managedProfileSummary.total} note={`${managedProfileSummary.approved} حساب تأییدشده`} />
              <StatCard title="در انتظار تأیید" value={managedProfileSummary.pending} status={managedProfileSummary.pending ? "warn" : "ok"} />
              <StatCard title="مسدود / ردشده" value={managedProfileSummary.suspended} status={managedProfileSummary.suspended ? "warn" : "ok"} />
              <StatCard title="مدیران" value={managedProfileSummary.admins} note={canGrantAdminRoles ? "Super Admin فعال" : "اعطای نقش مدیریتی محدود"} />
            </div>

            <div className="shil-admin-user-toolbar">
              <input value={userSearch} onChange={(e)=>setUserSearch(e.target.value)} placeholder="جستجو نام، ایمیل یا شناسه..." dir="auto" />
              <select value={userStatusFilter} onChange={(e)=>setUserStatusFilter(e.target.value)}>
                <option value="all">همه وضعیت‌ها</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="suspended">Suspended</option><option value="rejected">Rejected</option><option value="disabled">Disabled</option>
              </select>
              <select value={userRoleFilter} onChange={(e)=>setUserRoleFilter(e.target.value)}>
                <option value="all">همه نقش‌ها</option><option value="super_admin">Super Admin</option><option value="admin">Admin</option><option value="engineer">Engineer</option><option value="reviewer">Reviewer</option><option value="viewer">Viewer</option><option value="user">User</option>
              </select>
              <button type="button" onClick={()=>loadManagedProfiles(true)} disabled={managedProfilesState.loading}>{managedProfilesState.loading ? "در حال دریافت..." : "بروزرسانی"}</button>
            </div>

            {managedProfilesState.error ? <p className="shil-auth-error">{managedProfilesState.error}</p> : null}
            {managedUserRecordState.error ? <p className="shil-auth-error">{managedUserRecordState.error}</p> : null}

            <div className="shil-admin-user-list">
              {filteredManagedProfiles.map((profile)=>{
                const activity = profile.activity || {};
                const isSelf = profile.id === session?.userId;
                const detailsOpen = expandedManagedUser === profile.id;
                const records = managedUserRecords[profile.id] || [];
                return <article className="shil-admin-user-card" key={profile.id}>
                  <header>
                    <div><h3>{profile.full_name || profile.email || profile.id}</h3><p>{profile.email || "بدون ایمیل"}</p></div>
                    <div className="shil-admin-user-badges"><span>{profile.role || "viewer"}</span><span className={profile.status === "approved" ? "ok" : "warn"}>{profile.status || "pending"}</span>{isSelf ? <span>حساب فعال</span> : null}</div>
                  </header>
                  <div className="shil-admin-user-activity">
                    <span>پروژه <strong>{activity.projects || 0}</strong></span>
                    <span>بازخورد <strong>{activity.feedback || 0}</strong></span>
                    <span>پرسش <strong>{activity.assistant || 0}</strong></span>
                    <span>آخرین فعالیت <strong>{activity.lastActivityAt ? new Date(activity.lastActivityAt).toLocaleString("en-US") : "ثبت نشده"}</strong></span>
                  </div>
                  <p className="shil-admin-user-id" dir="ltr">{profile.id}</p>
                  <div className="shil-admin-user-controls">
                    <label>وضعیت <select value={profile.status || "pending"} disabled={isSelf} onChange={(e)=>changeManagedProfile(profile,{status:e.target.value})}><option value="pending">Pending</option><option value="approved">Approved</option><option value="suspended">Suspended</option><option value="rejected">Rejected</option><option value="disabled">Disabled</option></select></label>
                    <label>نقش <select value={profile.role || "viewer"} disabled={!canManageRoles || isSelf} onChange={(e)=>changeManagedProfile(profile,{role:e.target.value})}>
                      {canGrantAdminRoles ? <><option value="super_admin">Super Admin</option><option value="admin">Admin</option></> : null}
                      <option value="engineer">Engineer</option><option value="reviewer">Reviewer</option><option value="viewer">Viewer</option><option value="user">User</option>
                    </select></label>
                  </div>
                  <div className="shil-admin-actions-row compact">
                    <button type="button" onClick={()=>toggleManagedUserDetails(profile)}>{detailsOpen ? "بستن جزئیات" : "فعالیت Cloud"}</button>
                    <button type="button" onClick={()=>exportManagedUser(profile)}>خروجی Cloud</button>
                    <button type="button" className="danger" disabled={isSelf} onClick={()=>removeManagedUserCloudData(profile)}>حذف داده Cloud</button>
                  </div>
                  {detailsOpen ? <div className="shil-admin-user-details">
                    {managedUserRecordState.loading === profile.id ? <p>در حال دریافت فعالیت...</p> : records.slice(0, 30).map((row)=><div className="shil-admin-user-record" key={row.id}>
                      <strong>{row.base_key}</strong><span>{row.status || "open"}</span><small>{row.updated_at ? new Date(row.updated_at).toLocaleString("en-US") : "—"}</small>
                    </div>)}
                    {!records.length && managedUserRecordState.loading !== profile.id ? <p>رکورد Cloud برای این کاربر ثبت نشده است.</p> : null}
                  </div> : null}
                </article>;
              })}
              {!filteredManagedProfiles.length && !managedProfilesState.loading ? <p>کاربری مطابق فیلتر فعلی وجود ندارد.</p> : null}
            </div>
          </section> : null}

          <section className="shil-admin-local-user-data">
            <h3>داده‌های Local/PWA کاربران</h3>
            <div className="shil-thread-list">
              {data.users.map((user) => <article className="shil-thread-card" key={user.userId}>
                <h3>{user.login || user.userId}</h3>
                <p><strong>نقش ثبت‌شده:</strong> {user.role} · <strong>آخرین فعالیت:</strong> {user.lastAt ? new Date(user.lastAt).toLocaleString("en-US") : "نامشخص"}</p>
                <p>پروژه: {user.projects} · بازخورد: {user.feedback} · پرسش: {user.assistant}</p>
                <div className="shil-admin-actions-row compact">
                  <button type="button" onClick={() => downloadJson(`shil-user-${user.userId}.json`, exportUserBundle(user.userId))}>خروجی Local</button>
                  <button type="button" className="danger" onClick={() => requestSensitiveAction(`حذف تمام داده‌های Local کاربر ${user.login || user.userId}`, () => { deleteUserAllData(user.userId); logAdminAction("user-data:delete-all", { targetUserId: user.userId, entity: "user-data" }); setDataVersion((v)=>v+1); notify("تمام اطلاعات Local این کاربر حذف شد."); })}>حذف Local</button>
                </div>
              </article>)}
              {!data.users.length ? <p>هنوز کاربری داده Local ثبت نکرده است.</p> : null}
            </div>
          </section>
        </AdminPanel>
      ) : null}

      {tab === "projects" ? (
        <AdminPanel title="مدیریت پروژه‌ها" subtitle="جدیدترین پروژه در ردیف اول؛ جزئیات با لمس هر پروژه باز می‌شود.">
          <section className="shil-admin-actions-row">
            <button type="button" onClick={() => downloadJson("shil-all-project-saves.json", sortedAdminProjects)}>خروجی داده پروژه‌ها</button>
          </section>
          <div className="shil-admin-project-list-v252">
            {sortedAdminProjects.map((item) => (
              <ProjectAdminCard key={`${item.sourceKey}-${item.id}`} item={item} onDelete={removeRecord} onPublishScenario={publishProjectScenario} notify={notify} />
            ))}
            {!sortedAdminProjects.length ? <p>هنوز پروژه یا ذخیره‌ای ثبت نشده است.</p> : null}
          </div>
        </AdminPanel>
      ) : null}

      {tab === "feedback" ? (
        <AdminPanel title="نظرات کاربران و پاسخ ادمین" subtitle="پاسخ ادمین داخل رکورد کاربر ذخیره می‌شود و در صفحه نظرات همان کاربر قابل نمایش است.">
          {replyDraft.id ? (
            <div className="shil-feedback-form">
              <AdminTextarea label="متن پاسخ ادمین" value={replyDraft.text} onChange={(text) => setReplyDraft((prev) => ({ ...prev, text }))} placeholder="پاسخ رسمی به کاربر..." />
              <section className="shil-admin-actions-row compact">
                <button type="button" onClick={saveReply}>ذخیره پاسخ</button>
                <button type="button" className="danger" onClick={() => setReplyDraft({ id: "", sourceKey: "", text: "" })}>انصراف</button>
              </section>
            </div>
          ) : null}
          <section className="shil-admin-actions-row">
            <button type="button" onClick={() => downloadJson("shil-feedback-and-questions.json", { feedback: data.feedback, assistant: data.assistant })}>خروجی نظرات و پرسش‌ها</button>
          </section>
          <div className="shil-thread-list">
            {data.feedback.map((item) => (
              <RecordCard key={`${item.sourceKey}-${item.id}`} item={item} type="نظر کاربر" onPatch={patchRecord} onDelete={removeRecord} onReply={openReply} />
            ))}
            {data.assistant.map((item) => (
              <RecordCard key={`${item.sourceKey}-${item.id}`} item={item} type="پرسش دستیار" onPatch={patchRecord} onDelete={removeRecord} onReply={openReply} />
            ))}
            {!data.feedback.length && !data.assistant.length ? <p>هنوز نظری یا پرسشی ثبت نشده است.</p> : null}
          </div>
        </AdminPanel>
      ) : null}

      {tab === "cards" ? (
        <AdminPanel title="مدیریت کارت‌های مسیر پروژه" subtitle="ادمین می‌تواند تصویر PNG کارت‌ها را بدون تغییر کد جایگزین کند و ترتیب/فعال بودن کارت‌ها را کنترل کند." action={<button type="button" onClick={addCard}>افزودن کارت</button>}>
          <div className="shil-admin-card-editor-grid">
            {cards.map((card, index) => (
              <div className="shil-admin-card-editor" key={card.key || index}>
                <div className="shil-admin-image-preview">{card.image ? <img src={card.image} alt="" /> : <span>بدون تصویر</span>}</div>
                <AdminInput label="عنوان کارت" value={card.title} onChange={(title) => updateCard(index, { title })} />
                <AdminInput label="توضیح کوتاه" value={card.description} onChange={(description) => updateCard(index, { description })} />
                <AdminInput label="کلید مسیر" value={card.key} onChange={(key) => updateCard(index, { key, calculationDomain: key })} />
                <AdminInput label="ترتیب نمایش" type="number" value={card.order} onChange={(order) => updateCard(index, { order })} />
                <label className="shil-admin-switch"><input type="checkbox" checked={card.active !== false} onChange={(event) => updateCard(index, { active: event.target.checked })} /><span>فعال</span></label>
                <label className="shil-admin-upload"><span>جایگزینی تصویر PNG</span><input type="file" accept="image/png" onChange={(event) => uploadCardPng(index, event.target.files?.[0])} /></label>
                <button type="button" className="danger" onClick={() => removeCard(index)}>حذف کارت</button>
              </div>
            ))}
          </div>
          <button type="button" className="shil-primary-wide" onClick={saveCards}>ذخیره کارت‌های مسیر پروژه</button>
        </AdminPanel>
      ) : null}

      {tab === "defaults" ? (
        <section className="shil-defaults-shell-v254">
          {!defaultsPath ? (
            <>
              <header className="shil-defaults-head-v254"><strong>پیش‌فرض‌های مسیر پروژه</strong><span>مسیر موردنظر را انتخاب کنید.</span></header>
              <div className="shil-default-path-grid-v254">
                <button type="button" onClick={()=>setDefaultsPath("solar")}><strong>پیش‌فرض‌های خورشیدی</strong><span>۸ مرحله مهندسی</span></button>
                <button type="button" onClick={()=>setDefaultsPath("emergency")}><strong>پیش‌فرض‌های برق اضطراری</strong><span>۸ مرحله مهندسی</span></button>
              </div>
            </>
          ) : (
            <>
              <header className="shil-defaults-head-v254">
                <button type="button" className="shil-default-back-v254" onClick={()=>setDefaultsPath(null)}>‹</button>
                <div><strong>{defaultsPath === "solar" ? "پیش‌فرض‌های خورشیدی" : "پیش‌فرض‌های برق اضطراری"}</strong><span>۸ مرحله مطابق مسیر واقعی صفحات مهندسی</span></div>
              </header>
              <div className="shil-default-stage-grid-v254">
                {engineeringDefaultSteps.map((step,index)=>(
                  <details key={step.key} className="shil-default-stage-v254">
                    <summary><b>{String(index+1).padStart(2,"0")}</b><span><strong>{step.title}</strong><small>{step.note}</small></span><i>+</i></summary>
                    <div className="shil-default-stage-body-v254"><h4>پیش‌فرض‌های {step.title}</h4><DefaultsStageBody path={defaultsPath} stepKey={step.key}/></div>
                  </details>
                ))}
              </div>
              <div className="shil-default-actions-v254">
                <button type="button" onClick={()=>saveDefaultsData()}>ذخیره پیش‌نویس</button>
                <button type="button" className="primary" onClick={()=>publishDefaultsPath(defaultsPath)}>انتشار برای کاربران</button>
                <button type="button" onClick={()=>resetDefaultsPath(defaultsPath)}>بازگردانی کارخانه</button>
              </div>
            </>
          )}
        </section>
      ) : null}

      {tab === "loads" ? (
        <AdminPanel title="بانک مصرف‌کننده‌ها و بارهای پروژه" subtitle="هر موردی که اینجا اضافه و منتشر شود در مسیر انتخاب تجهیزات کاربر قابل جستجو و انتخاب است؛ مثال: کولر گازی 30000.">
          <ConsumerEquipmentCms items={consumerCatalog} onChange={setConsumerCatalog} onSave={saveConsumerCatalogData} notify={notify} />
        </AdminPanel>
      ) : null}

      {tab === "catalog" ? (
        <AdminPanel title="Equipment Engineering CMS" subtitle="مدیریت نسخه‌پذیر تجهیزات، مشخصات فنی، استانداردها، Datasheet، وضعیت انتشار و اعتبارسنجی مهندسی.">
          <EquipmentCms catalog={catalog} onUpdate={updateCatalogItem} onAdd={addCatalogItem} onRemove={removeCatalogItem} onSave={saveCatalogData} notify={notify} />
        </AdminPanel>
      ) : null}


      {tab === "rules" ? (
        <div className="shil-admin-rule-center">
          <AdminPanel title="Rule Engine مهندسی" subtitle="قوانین طراحی به‌صورت Draft و نسخه‌پذیر ذخیره می‌شوند؛ Publish از Release Center انجام می‌شود.">
            <div className="shil-admin-rule-groups">
              {[
                ["solar", "خورشیدی", [["safetyFactor","ضریب اطمینان"],["dcAcRatioMin","حداقل DC/AC"],["dcAcRatioMax","حداکثر DC/AC"],["voltageMarginPct","حاشیه ولتاژ %"],["temperatureDeratingPct","Derating دما %"],["stringCurrentFactor","ضریب جریان String"]]],
                ["battery", "باتری", [["defaultDod","DoD پیش‌فرض"],["roundTripEfficiency","راندمان رفت‌وبرگشت"],["reservePct","ذخیره ظرفیت %"],["temperatureDeratingPct","Derating دما %"]]],
                ["emergency", "برق اضطراری", [["safetyFactor","ضریب اطمینان"],["startupMarginFactor","ضریب راه‌اندازی"],["minimumBackupHours","حداقل پشتیبانی h"],["reservePct","ذخیره ظرفیت %"]]],
                ["protection", "حفاظت", [["breakerFactor","ضریب کلید"],["fuseFactor","ضریب فیوز"],["dcIsolatorFactor","ضریب Isolator"],["spdDcType","SPD DC"],["spdAcType","SPD AC"]]],
                ["cable", "کابل", [["maxVoltageDropDcPct","افت ولتاژ DC %"],["maxVoltageDropAcPct","افت ولتاژ AC %"],["ampacityMarginFactor","ضریب ظرفیت جریان"]]],
              ].map(([group, title, fields]) => (
                <details className="shil-admin-rule-group" key={group} open={group === "solar"}>
                  <summary><strong>{title}</strong><span>{Object.keys(engineeringRules[group] || {}).length} قانون</span></summary>
                  <div className="shil-admin-rule-fields">
                    {fields.map(([key,label]) => <label key={key}><span>{label}</span><input dir="ltr" value={engineeringRules[group]?.[key] ?? ""} onChange={(event) => updateRule(group, key, event.target.value)} /></label>)}
                  </div>
                </details>
              ))}
            </div>
            <div className="shil-admin-release-meta">
              <label><span>نسخه Rule</span><input dir="ltr" value={engineeringRules.version || ""} onChange={(event) => setEngineeringRules((prev) => ({...prev, version:event.target.value}))} /></label>
              <label><span>وضعیت</span><select value={engineeringRules.status || "draft"} onChange={(event) => setEngineeringRules((prev) => ({...prev,status:event.target.value}))}><option value="draft">Draft</option><option value="published">Published</option></select></label>
            </div>
            <button type="button" className="shil-primary-wide" onClick={saveRules}>ذخیره Draft قوانین</button>
          </AdminPanel>

          <AdminPanel title="Standards Center" subtitle="استاندارد مرجع هر حوزه را فعال/غیرفعال کنید. کد و عنوان استاندارد در Release ثبت می‌شود.">
            <div className="shil-admin-standards-list">
              {engineeringStandards.map((item,index) => (
                <article className="shil-admin-standard-row" key={item.id || index}>
                  <input dir="ltr" value={item.code || ""} onChange={(e)=>updateStandard(index,{code:e.target.value})} placeholder="IEC ..." />
                  <input dir="auto" value={item.title || ""} onChange={(e)=>updateStandard(index,{title:e.target.value})} placeholder="عنوان استاندارد" />
                  <select value={item.domain || "shared"} onChange={(e)=>updateStandard(index,{domain:e.target.value})}><option value="solar">Solar</option><option value="battery">Battery</option><option value="inverter">Inverter</option><option value="protection">Protection</option><option value="cable">Cable</option><option value="shared">Shared</option></select>
                  <label className="shil-admin-switch"><input type="checkbox" checked={item.active !== false} onChange={(e)=>updateStandard(index,{active:e.target.checked})}/><span>فعال</span></label>
                  <button type="button" className="danger" onClick={()=>removeStandard(index)}>حذف</button>
                  <textarea dir="auto" value={item.note || ""} onChange={(e)=>updateStandard(index,{note:e.target.value})} placeholder="توضیح کاربرد استاندارد" />
                </article>
              ))}
            </div>
            <section className="shil-admin-actions-row"><button type="button" onClick={addStandard}>افزودن استاندارد</button><button type="button" onClick={saveStandards}>ذخیره استانداردها</button></section>
          </AdminPanel>

          <AdminPanel title="Release Center" subtitle="قبل از انتشار، سلامت سیستم، اعتبارسنجی بانک تجهیزات فاز ۳، Rule Validation و Standards Check اجرا می‌شود و Snapshot ساخته می‌شود.">
            <section className="shil-admin-grid shil-admin-release-kpis">
              <StatCard title="Validation" value={releaseValidation.ok ? "PASS" : "BLOCKED"} note={releaseValidation.ok ? "آماده انتشار" : `${releaseValidation.warnings.length} هشدار`} status={releaseValidation.ok ? "ok" : "warn"} />
              <StatCard title="Rule Version" value={engineeringRules.version || "—"} note="نسخه قوانین Draft" />
              <StatCard title="Standards" value={engineeringStandards.filter((x)=>x.active!==false).length} note="استاندارد فعال" />
              <StatCard title="Active Release" value={releaseState.activeRelease?.version || "—"} note={releaseState.activeRelease?.publishedAt ? new Date(releaseState.activeRelease.publishedAt).toLocaleString("fa-IR") : "هنوز منتشر نشده"} />
            </section>
            {!releaseValidation.ok ? <div className="shil-admin-health warn">{releaseValidation.warnings.map((warning,index)=><p key={index}>• {warning}</p>)}</div> : <div className="shil-admin-health ok"><p>تمام کنترل‌های سیستم، بانک تجهیزات، Ruleها و استانداردها برای انتشار عبور کرده‌اند.</p></div>}
            <div className="shil-admin-form-grid">
              <AdminInput label="نسخه Release" value={releaseDraft.version || ""} onChange={(version)=>setReleaseDraft((prev)=>({...prev,version}))} placeholder="ENG-1.0.0" />
              <AdminInput label="عنوان Release" value={releaseDraft.title || ""} onChange={(title)=>setReleaseDraft((prev)=>({...prev,title}))} />
            </div>
            <label className="shil-admin-review-note"><span>Release Notes</span><textarea dir="auto" value={releaseDraft.note || ""} onChange={(e)=>setReleaseDraft((prev)=>({...prev,note:e.target.value}))} placeholder="تغییرات مهندسی این نسخه..." /></label>
            <section className="shil-admin-actions-row"><button type="button" onClick={persistReleaseDraft}>ذخیره Draft</button><button type="button" className="shil-primary-wide" disabled={!releaseValidation.ok} onClick={() => requestSensitiveAction("انتشار رسمی نسخه Engineering Release", publishRelease)}>Validate + Snapshot + Publish</button></section>
            <div className="shil-admin-release-history">
              {(releaseState.history || []).map((release)=><article key={release.id}><strong dir="ltr">{release.version}</strong><span>{release.title}</span><small>{release.publishedBy} · <span dir="ltr">{new Date(release.publishedAt).toLocaleString("fa-IR")}</span></small><details><summary>جزئیات نسخه</summary><p>Rule: <b dir="ltr">{release.ruleVersion}</b></p><p>Equipment: <b dir="ltr">{release.equipmentVersion || "—"}</b></p><p>Standards: <span dir="ltr">{(release.standards || []).join(", ")}</span></p><p>{release.note || "بدون توضیح"}</p></details></article>)}
              {!releaseState.history?.length ? <p>هنوز Release رسمی ثبت نشده است.</p> : null}
            </div>
          </AdminPanel>
        </div>
      ) : null}


      {tab === "analytics" ? (
        <div className="shil-admin-phase5">
          <AdminPanel title="Engineering Analytics" subtitle="شاخص‌ها فقط از داده‌های واقعی ذخیره‌شده در پروژه، کاربران، بانک تجهیزات، Review و Audit محاسبه می‌شوند؛ داده ساختگی نمایش داده نمی‌شود.">
            <section className="shil-admin-grid shil-admin-phase5-kpis">
              <StatCard title="کل پروژه‌ها" value={phase5Analytics.totalProjects} note={`${phase5Analytics.recent30} پروژه با فعالیت در ۳۰ روز اخیر`} />
              <StatCard title="پروژه‌های خورشیدی" value={phase5Analytics.solar} note="Solar / PV" />
              <StatCard title="برق اضطراری" value={phase5Analytics.emergency} note="Emergency / Backup" />
              <StatCard title="پروژه‌های نهایی" value={phase5Analytics.completed} note="Completed / Approved" status="ok" />
              <StatCard title="نیازمند Review" value={phase5Analytics.reviewAttention} note="ارسال‌شده، در بررسی یا نیازمند اصلاح" status={phase5Analytics.reviewAttention ? "warn" : "ok"} />
              <StatCard title="پروژه دارای Error" value={phase5Analytics.projectsWithErrors} note={`${phase5Analytics.projectsWithWarnings} پروژه دارای Warning`} status={phase5Analytics.projectsWithErrors ? "warn" : "ok"} />
            </section>
          </AdminPanel>

          <AdminPanel title="ترکیب پروژه‌ها و کاربران" subtitle="نمایش توزیع پروژه‌ها و فعالیت کاربران بر اساس آخرین timestamp ثبت‌شده.">
            <div className="shil-admin-phase5-two">
              <div className="shil-admin-analytics-bars">
                <Phase5Bar label="خورشیدی" value={phase5Analytics.solar} total={phase5Analytics.totalProjects} />
                <Phase5Bar label="برق اضطراری" value={phase5Analytics.emergency} total={phase5Analytics.totalProjects} />
                <Phase5Bar label="نهایی / تأییدشده" value={phase5Analytics.completed} total={phase5Analytics.totalProjects} />
              </div>
              <section className="shil-admin-grid compact">
                <StatCard title="فعال امروز" value={phase5Analytics.active1d} note="کاربر با فعالیت ثبت‌شده" />
                <StatCard title="فعال ۷ روز" value={phase5Analytics.active7d} note={`از ${phase5Analytics.totalUsers} کاربر`} />
                <StatCard title="فعال ۳۰ روز" value={phase5Analytics.active30d} note="بر اساس آخرین فعالیت" />
              </section>
            </div>
          </AdminPanel>

          <AdminPanel title="شاخص‌های مهندسی پروژه" subtitle="میانگین‌ها فقط زمانی محاسبه می‌شوند که فیلد عددی متناظر در رکورد پروژه موجود باشد.">
            <section className="shil-admin-grid">
              <StatCard title="میانگین توان ثبت‌شده" value={phase5Analytics.avgPowerKw == null ? "—" : `${phase5Analytics.avgPowerKw.toFixed(2)} kW`} note="از پروژه‌های دارای مقدار قابل استخراج" />
              <StatCard title="میانگین انرژی روزانه" value={phase5Analytics.avgEnergyKwh == null ? "—" : `${phase5Analytics.avgEnergyKwh.toFixed(2)} kWh`} note="از پروژه‌های دارای مقدار قابل استخراج" />
              <StatCard title="بدون خروجی قابل تشخیص" value={phase5Analytics.projectNoOutput} note="برای Data Quality نیازمند بررسی" status={phase5Analytics.projectNoOutput ? "warn" : "ok"} />
            </section>
          </AdminPanel>

          <AdminPanel title="Data Quality — Equipment CMS" subtitle="کیفیت داده‌های فاز ۳، وضعیت انتشار و خطاهای Validation بانک تجهیزات.">
            <section className="shil-admin-grid">
              <StatCard title="کل تجهیزات" value={phase5Analytics.equipmentTotal} note={`${phase5Analytics.publishedEquipment} منتشرشده`} />
              <StatCard title="بدون برند" value={phase5Analytics.missingBrand} note="نیازمند تکمیل مشخصات" status={phase5Analytics.missingBrand ? "warn" : "ok"} />
              <StatCard title="بدون Datasheet" value={phase5Analytics.missingDatasheet} note="مرجع فنی ثبت نشده" status={phase5Analytics.missingDatasheet ? "warn" : "ok"} />
              <StatCard title="غیرفعال" value={phase5Analytics.inactiveEquipment} note="در موتور انتخاب نمی‌شود" />
              <StatCard title="خطای Validation" value={phase5Analytics.catalogValidationCount} note="Release را می‌تواند مسدود کند" status={phase5Analytics.catalogValidationCount ? "warn" : "ok"} />
            </section>
            {phase5Analytics.catalogValidationCount ? <div className="shil-admin-health warn">{validateEquipmentCatalog(catalog).slice(0,8).map((item,index)=><p key={index}>• {item.message || item.error || String(item)}</p>)}</div> : <div className="shil-admin-health ok"><p>بانک تجهیزات از Validation فعلی عبور کرده است.</p></div>}
          </AdminPanel>

          <AdminPanel title="Alert Center" subtitle="هشدارهای قابل اقدام از Review، Data Quality، Cloud و Release.">
            <div className="shil-admin-alert-list">
              {phase5Analytics.reviewAttention ? <button type="button" className="shil-admin-alert warn" onClick={()=>setTab("review")}><strong>صف بررسی مهندسی</strong><span>{phase5Analytics.reviewAttention} پروژه نیازمند تصمیم یا پیگیری است.</span></button> : null}
              {phase5Analytics.catalogValidationCount ? <button type="button" className="shil-admin-alert warn" onClick={()=>setTab("catalog")}><strong>اعتبارسنجی بانک تجهیزات</strong><span>{phase5Analytics.catalogValidationCount} خطا یا ناسازگاری ثبت شده است.</span></button> : null}
              {!releaseValidation.ok ? <button type="button" className="shil-admin-alert warn" onClick={()=>setTab("rules")}><strong>Release مسدود است</strong><span>{releaseValidation.warnings?.length || 0} هشدار Release باید رفع شود.</span></button> : null}
              {!cloudStatus.online ? <button type="button" className="shil-admin-alert neutral" onClick={()=>setTab("cloud")}><strong>Cloud Sync فعال نیست</strong><span>پنل اکنون بر داده Local/PWA تکیه دارد.</span></button> : null}
              {!phase5Analytics.reviewAttention && !phase5Analytics.catalogValidationCount && releaseValidation.ok && cloudStatus.online ? <div className="shil-admin-health ok"><p>هشدار عملیاتی مهمی از کنترل‌های فعلی شناسایی نشد.</p></div> : null}
            </div>
          </AdminPanel>

          <AdminPanel title="Version & Performance Monitor" subtitle="نمای نسخه فعال و اندازه تقریبی داده‌های محلی؛ این بخش جایگزین APM یا مانیتورینگ Backend واقعی نیست.">
            <section className="shil-admin-grid">
              <StatCard title="Admin System" value={ADMIN_SYSTEM_VERSION} note="نسخه UI/Store ادمین" />
              <StatCard title="Active Release" value={releaseState.activeRelease?.version || "—"} note={`${phase5Analytics.releaseCount} Release در History`} />
              <StatCard title="Rule Version" value={engineeringRules.version || "—"} note={engineeringRules.status || "draft"} />
              <StatCard title="Audit Events" value={phase5Analytics.auditCount} note="رویداد ثبت‌شده محلی" />
              <StatCard title="Snapshots" value={phase5Analytics.snapshotCount} note="نسخه پشتیبان محلی" />
              <StatCard title="LocalStorage تقریبی" value={`${phase5Analytics.storageKb} KB`} note="برآورد UTF-16؛ نه اندازه دیتابیس Cloud" />
            </section>
          </AdminPanel>

          <AdminPanel title="گزارش‌های مدیریتی" subtitle="خروجی JSON قابل آرشیو برای تحلیل خارج از اپ یا بررسی نسخه.">
            <section className="shil-admin-actions-row shil-admin-phase5-reports">
              <button type="button" onClick={()=>exportPhase5Report("projects")}>گزارش پروژه‌ها</button>
              <button type="button" onClick={()=>exportPhase5Report("users")}>گزارش کاربران</button>
              <button type="button" onClick={()=>exportPhase5Report("equipment")}>گزارش تجهیزات</button>
              <button type="button" onClick={()=>exportPhase5Report("reviews")}>گزارش Review</button>
              <button type="button" onClick={()=>exportPhase5Report("diagnostics")}>گزارش Diagnostics</button>
            </section>
          </AdminPanel>
        </div>
      ) : null}

      {tab === "diagnostics" ? (
        <div className="shil-admin-phase6">
          <AdminPanel title="Error & Diagnostics Center" subtitle="مرکز یکپارچه خطاهای Runtime، Promise، React Boundary و شکست‌های Cloud Sync. رخدادها از اجرای واقعی اپ ثبت می‌شوند و قابل پیگیری تا وضعیت حل‌شده هستند.">
            <section className="shil-admin-grid shil-admin-phase6-kpis">
              <StatCard title="رخداد باز" value={phase6Diagnostics.open.length} note={`${phase6Diagnostics.last24h} رخداد در ۲۴ ساعت اخیر`} status={phase6Diagnostics.open.length ? "warn" : "ok"} />
              <StatCard title="Error / Critical" value={phase6Diagnostics.errors.length} note="رخدادهای با شدت بالا" status={phase6Diagnostics.errors.length ? "warn" : "ok"} />
              <StatCard title="Warning" value={phase6Diagnostics.warnings.length} note="هشدارهای ثبت‌شده" />
              <StatCard title="Runtime / UI" value={phase6Diagnostics.runtime.length} note="Window, Promise, React Boundary" />
              <StatCard title="Cloud Sync" value={phase6Diagnostics.cloud.length} note="شکست‌های Sync پس‌زمینه" />
              <StatCard title="حل‌شده" value={phase6Diagnostics.resolved.length} note={`از ${phase6Diagnostics.all.length} رخداد`} status="ok" />
            </section>
          </AdminPanel>

          <AdminPanel title="فیلتر و عملیات" subtitle="برای استفاده سنگین، فقط رخدادهای موردنیاز را باز کنید؛ جزئیات Stack و Context داخل آکاردئون است.">
            <div className="shil-admin-diag-toolbar">
              <input value={diagSearch} onChange={(e)=>setDiagSearch(e.target.value)} placeholder="جستجو در پیام، مسیر، Project ID، User ID..." />
              <select value={diagFilter} onChange={(e)=>setDiagFilter(e.target.value)}><option value="open">باز</option><option value="resolved">حل‌شده</option><option value="all">همه</option></select>
              <select value={diagType} onChange={(e)=>setDiagType(e.target.value)}><option value="all">همه انواع</option><option value="runtime">Runtime</option><option value="promise">Promise</option><option value="react-boundary">React Boundary</option><option value="cloud-sync">Cloud Sync</option></select>
            </div>
            <div className="shil-admin-actions-row">
              <button type="button" onClick={refreshDiagnostics}>بروزرسانی</button>
              <button type="button" onClick={handleExportDiagnostics}>Export Diagnostics</button>
              <button type="button" onClick={handleClearResolvedDiagnostics}>پاک‌سازی حل‌شده‌ها</button>
              <button type="button" className="danger" onClick={handleClearAllDiagnostics}>پاک‌سازی همه</button>
            </div>
          </AdminPanel>

          <AdminPanel title="رخدادهای ثبت‌شده" subtitle={`${phase6Diagnostics.visible.length} مورد مطابق فیلتر فعلی`}>
            <div className="shil-admin-diag-list">
              {phase6Diagnostics.visible.slice(0,120).map((item)=><Phase6DiagnosticCard key={item.id} item={item} onResolve={handleResolveDiagnostic} onReopen={handleReopenDiagnostic} />)}
              {!phase6Diagnostics.visible.length ? <div className="shil-admin-health ok"><p>رخدادی مطابق فیلتر فعلی ثبت نشده است.</p></div> : null}
            </div>
            {phase6Diagnostics.visible.length > 120 ? <p className="shil-admin-cms-empty">برای حفظ Performance فقط ۱۲۰ رخداد اول نمایش داده شده است. از فیلتر یا Export استفاده کنید.</p> : null}
          </AdminPanel>

          <AdminPanel title="پوشش Diagnostics" subtitle="این فاز Telemetry ساختگی تولید نمی‌کند و فقط نقاطی را که واقعاً Instrument شده‌اند گزارش می‌دهد.">
            <div className="shil-admin-health ok"><p>فعال: Global Runtime Error، Unhandled Promise، React Error Boundary، Cloud Mirror Sync Failure.</p></div>
            <div className="shil-admin-health warn"><p>برای APM واقعی، Latency سرور، Crash Rate بین همه کاربران، IP/Device server-side و Alerting مرکزی، اتصال Backend Telemetry در فاز امنیت/Production لازم است.</p></div>
          </AdminPanel>
        </div>
      ) : null}

      {tab === "cloud" ? (
        <>
          <AdminPanel title="اتصال ابری Supabase" subtitle="در این بخش داده‌های لوکال/PWA با دیتابیس Supabase همگام می‌شود تا پنل ادمین از چند دستگاه قابل استفاده باشد.">
            <section className="shil-admin-grid">
              <StatCard title="وضعیت اتصال" value={cloudStatus.online ? "متصل" : "لوکال"} note={cloudStatus.message} status={cloudStatus.online ? "ok" : "warn"} />
              <StatCard title="رکوردهای آنلاین" value={(cloudData?.projects?.length || 0) + (cloudData?.feedback?.length || 0) + (cloudData?.assistant?.length || 0)} note="پروژه‌ها، نظرات و پرسش‌ها" />
              <StatCard title="رکوردهای لوکال" value={localData.projects.length + localData.feedback.length + localData.assistant.length} note="قبل از ارسال به ابر" />
            </section>
            <section className="shil-admin-actions-row">
              <button type="button" onClick={() => loadCloudData(true)} disabled={cloudStatus.loading}>دریافت از Supabase</button>
              <button type="button" onClick={pushLocalToCloud} disabled={cloudStatus.loading || !isSupabaseReady()}>ارسال داده‌های لوکال به Supabase</button>
              <button type="button" onClick={() => downloadJson("shil-cloud-data.json", cloudData || {})}>خروجی داده آنلاین</button>
            </section>
            <div className="shil-admin-health warn">
              <p>برای فعال شدن این بخش باید فایل <strong>.env</strong> شامل <strong>VITE_SUPABASE_URL</strong> و <strong>VITE_SUPABASE_ANON_KEY</strong> باشد و فایل <strong>supabase/schema.sql</strong> در Supabase اجرا شده باشد.</p>
              <p>Policy فعلی برای تست و PWA باز است. برای نسخه عمومی باید Supabase Auth و RLS اختصاصی ادمین فعال شود.</p>
            </div>
          </AdminPanel>
        </>
      ) : null}

      {tab === "security" ? (
        <>
          <AdminPanel title="Security & Audit Center" subtitle="Sessionهای اپ SHIL، رخدادهای ورود و خروج، ورودهای ناموفق و خروج اجباری کاربران آنلاین.">
            {emergencyLocalAdmin ? <div className="shil-admin-alert warn"><strong>Emergency Local Admin</strong><span>Security Center ابری فقط با ادمین آنلاین Supabase فعال است.</span></div> : null}
            {!emergencyLocalAdmin ? <>
              <div className="shil-admin-user-stats">
                <StatCard title="Session فعال" value={securitySummary.active} />
                <StatCard title="ورود ناموفق" value={securitySummary.failed} />
                <StatCard title="Session لغوشده" value={securitySummary.revoked} />
                <StatCard title="رخداد امنیتی" value={securitySummary.events} />
              </div>
              <section className="shil-admin-actions-row compact">
                <select value={securityEventFilter} onChange={(e)=>setSecurityEventFilter(e.target.value)}><option value="all">همه رخدادها</option><option value="login_success">Login Success</option><option value="login_failed">Login Failed</option><option value="login_blocked">Login Blocked</option><option value="logout">Logout</option><option value="logout_idle">Idle Logout</option><option value="session_revoked">Session Revoked</option></select>
                <button type="button" onClick={()=>loadSecurityCenter(true)} disabled={securityCenterState.loading}>{securityCenterState.loading ? "در حال دریافت..." : "بروزرسانی امنیت"}</button>
              </section>
              {securityCenterState.error ? <p className="shil-auth-error">{securityCenterState.error}</p> : null}
              <div className="shil-admin-security-grid">
                <article className="shil-thread-card"><h3>Sessionهای اخیر</h3>{securitySessions.slice(0,40).map((item)=>{ const active=!item.ended_at&&!item.revoked_at&&(Date.now()-Date.parse(item.last_seen_at||0)<5*60*1000); return <div className="shil-admin-security-session" key={item.session_id}><div><strong>{item.login || item.user_id}</strong><small>{item.role} · {active ? "فعال" : item.revoked_at ? "لغوشده" : item.ended_at ? "پایان‌یافته" : "غیرفعال"}</small><small dir="ltr">{item.last_seen_at ? new Date(item.last_seen_at).toLocaleString("en-US") : "—"}</small></div><button type="button" className="danger" disabled={!active || item.session_id===session?.sessionInstanceId} onClick={()=>revokeManagedSession(item)}>خروج اجباری</button></div>})}{!securitySessions.length ? <p>Session ابری ثبت نشده است.</p> : null}</article>
                <article className="shil-thread-card"><h3>رخدادهای امنیتی</h3>{filteredSecurityEvents.slice(0,60).map((item)=><div className="shil-admin-security-event" key={item.id}><strong>{item.event_type}</strong><span>{item.payload?.login || item.user_id || "anonymous"}</span><small dir="ltr">{new Date(item.created_at).toLocaleString("en-US")}</small></div>)}{!filteredSecurityEvents.length ? <p>رخداد مطابق فیلتر ثبت نشده است.</p> : null}</article>
              </div>
              <p className="shil-admin-security-note">این بخش Sessionهای ثبت‌شده توسط اپ SHIL را مدیریت می‌کند؛ Sessionهای خام Auth Provider باید در Supabase/Backend مدیریت شوند.</p>
            </> : null}
          </AdminPanel>

          <AdminPanel title="یوزر و پسورد ورود ادمین" subtitle="ورود محلی اضطراری ادمین را کنترل می‌کند. پسورد خام ذخیره نمی‌شود و Credential پیش‌فرض در نسخه جدید وجود ندارد.">
            <div className="shil-admin-catalog-stack">
              {adminCredentials.map((credential, index) => (
                <div className="shil-admin-catalog-row wide" key={`${credential.login}-${index}`}>
                  <input value={credential.login} onChange={(event) => setAdminCredentials((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, login: event.target.value } : item))} placeholder="یوزر ادمین" dir="ltr" />
                  <input type="password" autoComplete="new-password" value={credential.password} onChange={(event) => setAdminCredentials((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, password: event.target.value } : item))} placeholder={credential.configured ? "برای حفظ پسورد فعلی خالی بگذارید" : "پسورد جدید حداقل ۱۰ کاراکتر"} dir="ltr" />
                  <button type="button" className="danger" onClick={() => setAdminCredentials((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}>حذف</button>
                </div>
              ))}
            </div>
            <section className="shil-admin-actions-row">
              <button type="button" onClick={() => setAdminCredentials((prev) => [...prev, { login: "", password: "" }])}>افزودن یوزر ادمین</button>
              <button type="button" onClick={() => requestSensitiveAction("تغییر Credentialهای ورود محلی ادمین", saveCredentials)}>ذخیره یوزر/پسورد</button>
              <button type="button" className="danger" onClick={() => requestSensitiveAction("حذف همه Credentialهای ورود محلی ادمین", () => { setAdminCredentials(resetAdminLoginCredentials()); logAdminAction("admin-security:local-credentials-cleared", {}); notify("همه Credentialهای ورود محلی ادمین حذف شدند."); })}>حذف همه ورودهای محلی</button>
            </section>
          </AdminPanel>

          <AdminPanel title="امنیت ادمین" subtitle="این لایه برای جلوگیری از ورود اتفاقی به پنل مدیریت در نسخه لوکال/PWA است.">
            <div className="shil-admin-form-grid">
              <AdminInput label="رمز جدید لایه دوم ادمین" value={newPin} onChange={setNewPin} placeholder="حداقل ۶ رقم" />
              <AdminInput label="مدت اعتبار ورود دقیقه" type="number" value={security.sessionMinutes} onChange={(sessionMinutes) => setSecurity((prev) => ({ ...prev, sessionMinutes }))} />
            </div>
            <section className="shil-admin-actions-row">
              <button type="button" onClick={changePin}>تغییر رمز لایه دوم</button>
              <button type="button" onClick={() => { localStorage.setItem("shil:admin:security", JSON.stringify({ ...security, sessionMinutes: normalizeNumber(security.sessionMinutes, 60) })); notify("تنظیمات امنیت ادمین ذخیره شد."); }}>ذخیره امنیت</button>
            </section>
          </AdminPanel>

          <AdminPanel title="Admin Recovery & Emergency Lock" subtitle="Recovery Code مستقل از PIN است، خام ذخیره نمی‌شود و برای بازکردن قفل اضطراری یا Backup امنیتی استفاده می‌شود.">
            <section className="shil-admin-grid">
              <StatCard title="Recovery Code" value={recoveryState.configured ? "فعال" : "تنظیم نشده"} note={recoveryState.configuredAt ? `فعال از ${new Date(recoveryState.configuredAt).toLocaleDateString("en-US")}` : "برای Production فعال شود"} status={recoveryState.configured ? "ok" : "warn"} />
              <StatCard title="Emergency Lock" value={emergencyLock.locked ? "قفل" : "باز"} note={emergencyLock.at ? new Date(emergencyLock.at).toLocaleString("en-US") : "غیرفعال"} status={emergencyLock.locked ? "warn" : "ok"} />
            </section>
            <section className="shil-admin-actions-row">
              <button type="button" onClick={() => requestSensitiveAction(recoveryState.configured ? "چرخش Recovery Code" : "ساخت Recovery Code", setupOrRotateRecoveryCode)}>{recoveryState.configured ? "ساخت Recovery Code جدید" : "فعال‌سازی Recovery Code"}</button>
              <button type="button" className="danger" disabled={!recoveryState.configured} onClick={lockAdminImmediately}>قفل اضطراری پنل</button>
            </section>
            {generatedRecoveryCode ? <div className="shil-admin-alert warn"><strong>Recovery Code فقط همین بار نمایش داده می‌شود</strong><span dir="ltr" style={{wordBreak:"break-all"}}>{generatedRecoveryCode}</span><button type="button" onClick={()=>navigator.clipboard?.writeText(generatedRecoveryCode)}>کپی</button><button type="button" onClick={()=>setGeneratedRecoveryCode("")}>مخفی کردن</button></div> : null}
            <div className="shil-admin-form-grid">
              <AdminInput label="Recovery Code برای Backup/Recovery" value={recoveryCodeInput} onChange={setRecoveryCodeInput} placeholder="XXXX-XXXX-..." />
              <AdminInput label="نام کاربری جدید در Recovery" value={recoveryReset.login} onChange={(login)=>setRecoveryReset((prev)=>({...prev,login}))} placeholder="فقط برای Reset دسترسی" />
              <AdminInput label="پسورد جدید در Recovery" value={recoveryReset.password} onChange={(password)=>setRecoveryReset((prev)=>({...prev,password}))} placeholder="حداقل ۱۰ کاراکتر" />
              <AdminInput label="PIN جدید در Recovery" value={recoveryReset.pin} onChange={(pin)=>setRecoveryReset((prev)=>({...prev,pin}))} placeholder="حداقل ۶ رقم" />
            </div>
            <section className="shil-admin-actions-row">
              <button type="button" disabled={!recoveryState.configured} onClick={exportRecoveryBackup}>Export Backup رمزگذاری‌شده</button>
              <button type="button" disabled={!recoveryState.configured} onClick={()=>recoveryFileRef.current?.click()}>Restore Backup رمزگذاری‌شده</button>
              <input ref={recoveryFileRef} type="file" accept="application/json,.json" style={{display:"none"}} onChange={(event)=>importRecoveryBackup(event.target.files?.[0])} />
              <button type="button" className="danger" disabled={!recoveryState.configured} onClick={()=>requestSensitiveAction("Reset Credential و PIN با Recovery Code", resetAccessWithRecovery)}>Reset دسترسی محلی</button>
            </section>
            <p className="shil-admin-security-note">Recovery Code را خارج از دستگاه نگهداری کنید. Backup بدون Recovery Code قابل رمزگشایی نیست. چرخش Recovery Code باعث می‌شود Backupهای جدید با کد جدید ساخته شوند؛ Backup قدیمی همچنان به کد قبلی خود نیاز دارد.</p>
          </AdminPanel>

          <AdminPanel title="نسخه‌های پشتیبان و بازیابی" subtitle="قبل از تغییرات مهم، نسخه پشتیبان ساخته می‌شود و امکان بازگردانی وجود دارد.">
            <section className="shil-admin-actions-row"><button type="button" onClick={makeSnapshot}>ساخت نسخه جدید</button></section>
            <div className="shil-admin-snapshot-list">
              {snapshots.map((snapshot) => (
                <article key={snapshot.id} className="shil-admin-snapshot">
                  <strong>{snapshot.label}</strong>
                  <span>{new Date(snapshot.at).toLocaleString("en-US")}</span>
                  <button type="button" onClick={() => restoreSnapshot(snapshot.id)}>بازگردانی</button>
                </article>
              ))}
              {!snapshots.length ? <p>هنوز نسخه پشتیبان ساخته نشده است.</p> : null}
            </div>
          </AdminPanel>

          <section className="shil-thread-list">
            <article className="shil-thread-card"><h3>آخرین نظرات</h3>{data.feedback.slice(0, 8).map((item) => <p key={item.id}><strong>{item.userLogin || item.userId}:</strong> {item.category} — {item.text}</p>)}{!data.feedback.length ? <p>هنوز نظری ثبت نشده است.</p> : null}</article>
            <article className="shil-thread-card"><h3>لاگ تغییرات ادمین</h3>{audit.slice(0, 14).map((item) => <p key={item.id}><strong>{item.type}</strong> — {new Date(item.at).toLocaleString("en-US")}</p>)}{!audit.length ? <p>هنوز تغییری ثبت نشده است.</p> : null}</article>
          </section>
        </>
      ) : null}
      </> : null}

      <SensitiveActionDialog request={sensitiveRequest} onClose={() => setSensitiveRequest(null)} notify={notify} />

      {adminView === "section" ? (
        <div className={`shil-admin-section-back-row-v16 ${tab === "overview" ? "shil-admin-overview-back-v18" : ""}`}>
          <button type="button" className="shil-admin-back-hub-v16" onClick={() => setAdminView("hub")}>بازگشت</button>
        </div>
      ) : (
        <div className="shil-admin-logout-row-v13">
          <button type="button" className="shil-admin-logout-v13" onClick={logout}>خروج از کارتابل ادمین</button>
        </div>
      )}

      {/* Admin visual system is consolidated in shil-admin-v24-clean-consolidated.css. */}
      </div>
    </ShilPageShell>
  );
}


