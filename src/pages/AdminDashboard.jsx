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
  const parsed = Number(String(value).replace(/[۰-۹]/g, (digit) => "۰۱۲۳۴۵۶۷۸۹".indexOf(digit)).replace(/[٠-٩]/g, (digit) => "٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function AdminGate({ onVerified }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  return (
    <ShilPageShell title="ورود ادمین">
      <section className="shil-admin-lock">
        <span>Admin Secure Layer</span>
        <h2>تأیید دسترسی ادمین</h2>
        <p>برای ورود به مرکز مدیریت، رمز ادمین را وارد کنید. رمز پیش‌فرض لوکال: ۱۳۶۶</p>
        <input value={pin} onChange={(event) => setPin(event.target.value)} placeholder="رمز ادمین" inputMode="numeric" dir="auto" />
        {error ? <small>{error}</small> : null}
        <button type="button" className="shil-primary-wide" onClick={() => {
          if (verifyAdminPin(pin)) onVerified();
          else setError("رمز ادمین صحیح نیست.");
        }}>ورود به کارتابل ادمین</button>
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
    notify("کارت‌های انتخاب مسیر پروژه ذخیره شدند.");
  }

  function updateCatalogItem(group, index, patch) {
    setCatalog((prev) => ({ ...prev, [group]: (prev[group] || []).map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)) }));
  }

  function addCatalogItem(group) {
    const templates = {
      solarPanels: { id: `panel-${Date.now()}`, title: "پنل جدید", brand: "", powerW: 620, voltageV: 41, currentA: 15, efficiency: 22, active: true },
      solarInverters: { id: `inv-${Date.now()}`, title: "اینورتر جدید", brand: "", powerKw: 5, dcVoltageV: 48, mpptMinV: 120, mpptMaxV: 450, type: "hybrid", active: true },
      batteries: { id: `bat-${Date.now()}`, title: "باتری جدید", brand: "", voltageV: 48, capacityAh: 100, chemistry: "LiFePO4", dod: 0.8, active: true },
      emergencyPower: { id: `ep-${Date.now()}`, title: "دستگاه برق اضطراری جدید", brand: "", powerKw: 5, batteryVoltageV: 48, active: true },
      protections: { id: `prot-${Date.now()}`, title: "حفاظت جدید", group: "shared", rating: "", active: true },
    };
    setCatalog((prev) => ({ ...prev, [group]: [...(prev[group] || []), templates[group]] }));
  }

  function removeCatalogItem(group, index) {
    setCatalog((prev) => ({ ...prev, [group]: (prev[group] || []).filter((_, itemIndex) => itemIndex !== index) }));
  }

  function saveCatalogData() {
    const saved = saveAdminCatalog(catalog);
    setCatalog(saved);
    notify("بانک تجهیزات ذخیره شد.");
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
      notify("نسخه پشتیبان بازیابی شد.");
    } catch (error) {
      notify(error.message || "بازیابی انجام نشد.");
    }
  }

  function changePin() {
    try {
      changeAdminPin(newPin);
      setNewPin("");
      notify("رمز ادمین تغییر کرد.");
    } catch (error) {
      notify(error.message || "تغییر رمز انجام نشد.");
    }
  }

  const tabs = [
    ["overview", "نمای کلی"],
    ["cards", "کارت‌های مسیر"],
    ["defaults", "پیش‌فرض‌ها"],
    ["catalog", "بانک تجهیزات"],
    ["security", "امنیت و نسخه"],
  ];

  return (
    <ShilPageShell title="کارتابل ادمین SHIL">
      <section className="shil-admin-hero">
        <div>
          <span>{ADMIN_SYSTEM_VERSION}</span>
          <h2>مرکز مدیریت کامل SHIL</h2>
          <p>مدیریت کارت‌های مسیر پروژه، تصاویر PNG، بانک تجهیزات، حفاظت‌ها، پیش‌فرض‌های مهندسی، نسخه پشتیبان، امنیت ادمین و لاگ تغییرات.</p>
        </div>
        <button type="button" className="shil-guest-btn" onClick={logout}>خروج از کارتابل ادمین</button>
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
            <StatCard title="سلامت Admin" value={health.ok ? "۱۰۰٪" : "نیازمند بررسی"} note={health.ok ? "تمام کنترل‌ها معتبر است" : `${health.warnings.length} هشدار`} status={health.ok ? "ok" : "warn"} />
            <StatCard title="کاربران دارای داده" value={data.userCount} note="از داده‌های محلی" />
            <StatCard title="پروژه‌های ثبت‌شده" value={data.projects.length} />
            <StatCard title="تجهیزات فعال" value={catalogStats.panels + catalogStats.inverters + catalogStats.batteries + catalogStats.emergency + catalogStats.protections} />
          </section>

          <AdminPanel title="وضعیت سلامت سیستم مدیریت" subtitle="این بخش کنترل می‌کند که تنظیمات کلیدی اپ برای انتشار نهایی معتبر باشند.">
            {health.ok ? <div className="shil-admin-health ok">همه کنترل‌های ادمین سالم هستند.</div> : (
              <div className="shil-admin-health warn">
                {health.warnings.map((warning) => <p key={warning}>{warning}</p>)}
              </div>
            )}
          </AdminPanel>

          <section className="shil-admin-actions-row">
            <button type="button" onClick={() => downloadJson("shil-admin-config-100.json", exportAdminJson())}>خروجی JSON کامل</button>
            <button type="button" onClick={() => importRef.current?.click()}>ورود JSON تنظیمات</button>
            <button type="button" onClick={makeSnapshot}>ساخت نسخه پشتیبان</button>
            <button type="button" className="danger" onClick={resetAll}>بازگشت به تنظیمات استاندارد</button>
            <input ref={importRef} type="file" accept="application/json" hidden onChange={(event) => importConfig(event.target.files?.[0])} />
          </section>
        </>
      ) : null}

      {tab === "cards" ? (
        <AdminPanel title="مدیریت کارت‌های انتخاب مسیر پروژه" subtitle="ادمین می‌تواند تصویر PNG کارت‌ها را بدون تغییر کد جایگزین کند و ترتیب/فعال بودن کارت‌ها را کنترل کند." action={<button type="button" onClick={addCard}>افزودن کارت</button>}>
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
        <AdminPanel title="تنظیمات پیش‌فرض مهندسی" subtitle="این مقادیر مبنای رفتار هوشمند اپ هستند؛ کاربر همچنان می‌تواند در صفحات مجاز حالت دستی را انتخاب کند.">
          <div className="shil-admin-form-grid">
            <AdminInput label="پنل پیش‌فرض خورشیدی W" type="number" value={defaults.solarPanelDefaultW} onChange={(solarPanelDefaultW) => setDefaults((prev) => ({ ...prev, solarPanelDefaultW }))} />
            <AdminInput label="پنل دستی پیشنهادی W" type="number" value={defaults.solarPanelManualW} onChange={(solarPanelManualW) => setDefaults((prev) => ({ ...prev, solarPanelManualW }))} />
            <AdminInput label="روزهای خودکفایی پیش‌فرض" type="number" value={defaults.defaultAutonomyDays} onChange={(defaultAutonomyDays) => setDefaults((prev) => ({ ...prev, defaultAutonomyDays }))} />
            <AdminInput label="ضریب اطمینان پیش‌فرض" type="number" value={defaults.defaultSafetyFactor} onChange={(defaultSafetyFactor) => setDefaults((prev) => ({ ...prev, defaultSafetyFactor }))} />
            <AdminInput label="زمان برق اضطراری مورد نیاز" type="number" value={defaults.emergencyRequiredHours} onChange={(emergencyRequiredHours) => setDefaults((prev) => ({ ...prev, emergencyRequiredHours }))} />
            <AdminInput label="ضریب اطمینان برق اضطراری" type="number" value={defaults.emergencySafetyFactor} onChange={(emergencySafetyFactor) => setDefaults((prev) => ({ ...prev, emergencySafetyFactor }))} />
            <AdminInput label="حداکثر حجم PNG کیلوبایت" type="number" value={defaults.maxPngKb} onChange={(maxPngKb) => setDefaults((prev) => ({ ...prev, maxPngKb }))} />
            <label className="shil-admin-switch"><input type="checkbox" checked={defaults.autoSnapshot !== false} onChange={(event) => setDefaults((prev) => ({ ...prev, autoSnapshot: event.target.checked }))} /><span>نسخه پشتیبان خودکار</span></label>
          </div>
          <button type="button" className="shil-primary-wide" onClick={saveDefaultsData}>ذخیره تنظیمات پیش‌فرض</button>
        </AdminPanel>
      ) : null}

      {tab === "catalog" ? (
        <AdminPanel title="بانک تجهیزات مهندسی" subtitle="ویرایش بانک پنل، اینورتر، باتری، برق اضطراری و سیستم‌های حفاظتی.">
          <div className="shil-admin-catalog-stack">
            {[
              ["solarPanels", "پنل‌های خورشیدی", ["brand", "powerW", "voltageV", "currentA", "efficiency"]],
              ["solarInverters", "اینورترهای خورشیدی", ["brand", "powerKw", "dcVoltageV", "mpptMinV", "mpptMaxV", "type"]],
              ["batteries", "باتری‌ها", ["brand", "voltageV", "capacityAh", "chemistry", "dod"]],
              ["emergencyPower", "تجهیزات برق اضطراری", ["brand", "powerKw", "batteryVoltageV", "note"]],
              ["protections", "سیستم‌های حفاظتی", ["group", "rating"]],
            ].map(([group, title, fields]) => (
              <div className="shil-admin-catalog-group" key={group}>
                <div className="shil-admin-catalog-head"><h4>{title}</h4><button type="button" onClick={() => addCatalogItem(group)}>افزودن</button></div>
                {(catalog[group] || []).map((item, index) => (
                  <div className="shil-admin-catalog-row wide" key={item.id || index}>
                    <input value={item.title || ""} onChange={(event) => updateCatalogItem(group, index, { title: event.target.value })} dir="auto" placeholder="عنوان" />
                    {fields.map((field) => <input key={field} value={item[field] ?? ""} onChange={(event) => updateCatalogItem(group, index, { [field]: event.target.value })} dir="auto" placeholder={field} />)}
                    <label className="shil-admin-switch"><input type="checkbox" checked={item.active !== false} onChange={(event) => updateCatalogItem(group, index, { active: event.target.checked })} /><span>فعال</span></label>
                    <button type="button" className="danger" onClick={() => removeCatalogItem(group, index)}>حذف</button>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <button type="button" className="shil-primary-wide" onClick={saveCatalogData}>ذخیره بانک تجهیزات</button>
        </AdminPanel>
      ) : null}

      {tab === "security" ? (
        <>
          <AdminPanel title="امنیت ادمین" subtitle="این لایه برای جلوگیری از ورود اتفاقی به پنل مدیریت در نسخه لوکال/PWA است.">
            <div className="shil-admin-form-grid">
              <AdminInput label="رمز جدید ادمین" value={newPin} onChange={setNewPin} placeholder="حداقل ۴ رقم" />
              <AdminInput label="مدت اعتبار ورود دقیقه" type="number" value={security.sessionMinutes} onChange={(sessionMinutes) => setSecurity((prev) => ({ ...prev, sessionMinutes }))} />
            </div>
            <section className="shil-admin-actions-row">
              <button type="button" onClick={changePin}>تغییر رمز ادمین</button>
              <button type="button" onClick={() => { localStorage.setItem("shil:admin:security", JSON.stringify({ ...security, sessionMinutes: normalizeNumber(security.sessionMinutes, 60) })); notify("تنظیمات امنیت ادمین ذخیره شد."); }}>ذخیره امنیت</button>
            </section>
          </AdminPanel>

          <AdminPanel title="نسخه‌های پشتیبان و بازیابی" subtitle="قبل از تغییرات مهم، نسخه پشتیبان ساخته می‌شود و امکان بازگردانی وجود دارد.">
            <section className="shil-admin-actions-row"><button type="button" onClick={makeSnapshot}>ساخت نسخه جدید</button></section>
            <div className="shil-admin-snapshot-list">
              {snapshots.map((snapshot) => (
                <article key={snapshot.id} className="shil-admin-snapshot">
                  <strong>{snapshot.label}</strong>
                  <span>{new Date(snapshot.at).toLocaleString("fa-IR")}</span>
                  <button type="button" onClick={() => restoreSnapshot(snapshot.id)}>بازگردانی</button>
                </article>
              ))}
              {!snapshots.length ? <p>هنوز نسخه پشتیبان ساخته نشده است.</p> : null}
            </div>
          </AdminPanel>

          <section className="shil-thread-list">
            <article className="shil-thread-card"><h3>آخرین نظرات</h3>{data.feedback.slice(0, 8).map((item) => <p key={item.id}><strong>{item.userLogin || item.userId}:</strong> {item.category} — {item.text}</p>)}{!data.feedback.length ? <p>هنوز نظری ثبت نشده است.</p> : null}</article>
            <article className="shil-thread-card"><h3>لاگ تغییرات ادمین</h3>{audit.slice(0, 14).map((item) => <p key={item.id}><strong>{item.type}</strong> — {new Date(item.at).toLocaleString("fa-IR")}</p>)}{!audit.length ? <p>هنوز تغییری ثبت نشده است.</p> : null}</article>
          </section>
        </>
      ) : null}
    </ShilPageShell>
  );
}
