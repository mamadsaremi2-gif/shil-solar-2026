import * as React from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { approveProjectStep } from "../workflow/projectWorkflow.js";
import EngineeringPageShell from "../components/EngineeringPageShell.jsx";

const SOLAR_METHOD_CARDS = [
  { key: "power", title: "توان کل", badge: "W / kW", hint: "مبنای طراحی بر اساس توان مصرفی کل" },
  { key: "current", title: "جریان کل", badge: "A", hint: "تبدیل جریان و ولتاژ به توان مصرفی" },
  { key: "solar_panel_power", title: "توان پنل خورشیدی", badge: "PV W", hint: "فعلاً با وضعیت موجود؛ مسیر تولید PV و انتقال نیروگاهی در توان بالا" },
  { key: "equipment", title: "لیست تجهیزات", badge: "Equipment", hint: "محاسبه مصرف واقعی از بانک تجهیزات" },
  { key: "profile", title: "پروفایل مصرف", badge: "Profile", hint: "تحلیل مصرف صبح، ظهر، عصر و شب" },
  { key: "energy", title: "انرژی روزانه", badge: "kWh/day", hint: "مبنای طراحی بر اساس انرژی روزانه" },
];

const EMERGENCY_METHOD_CARDS = [
  { key: "current", title: "جریان کل", badge: "A", hint: "محاسبه بار اضطراری از جریان و ولتاژ" },
  { key: "power", title: "توان کل", badge: "W / kW", hint: "محاسبه اینورتر و باتری بر اساس توان بار ضروری" },
  { key: "equipment", title: "لیست تجهیزات", badge: "Essential", hint: "انتخاب تجهیزات ضروری برای زمان قطعی برق" },
];

const UTILITY_METHOD_CARDS = [
  { key: "utility_scale", title: "مسیر نیروگاهی", badge: "Utility", hint: "فعلاً در وضعیت موقت اختصاصی نیروگاهی باقی می‌ماند" },
];

const DOMAIN_LABELS = {
  solar: "اجرای پروژه با پنل خورشیدی",
  emergency: "اجرای پروژه برق اضطراری",
  utility: "اجرای نیروگاه انرژی خورشیدی",
};

function readDraft(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

function getProjectPathDomain() {
  const draft = readDraft("shil:projectPath") || readDraft("shil:selectedProjectPath");
  if (typeof draft === "string") return draft;
  return draft?.domain || draft?.type || draft?.key || null;
}

function normalizeDomain(value) {
  const normalized = String(value || "").toLowerCase();
  if (normalized.includes("emergency") || normalized.includes("backup")) return "emergency";
  if (normalized.includes("utility") || normalized.includes("plant") || normalized.includes("power-plant")) return "utility";
  return "solar";
}

function getCardsForDomain(domain) {
  if (domain === "emergency") return EMERGENCY_METHOD_CARDS;
  if (domain === "utility") return UTILITY_METHOD_CARDS;
  return SOLAR_METHOD_CARDS;
}

export default function CalculationMethod() {
  const params = useParams();
  const location = useLocation();
  const query = new URLSearchParams(location.search);

  const domain = normalizeDomain(
    params.domain ||
    query.get("domain") ||
    getProjectPathDomain() ||
    localStorage.getItem("shil:calculationDomain") ||
    localStorage.getItem("shil:scenarioDomain") ||
    "solar"
  );

  const methodCards = React.useMemo(() => getCardsForDomain(domain), [domain]);
  const context = React.useMemo(
    () => ({
      projectPath: readDraft("shil:projectPath") || readDraft("shil:selectedProjectPath"),
      scenario: readDraft("shil:selectedScenario"),
      environment: readDraft("shil:environmentDraft"),
    }),
    []
  );

  const handleSelect = (methodKey) => {
    approveProjectStep("method");
    localStorage.setItem("shil:calculationMethod", methodKey);
    localStorage.setItem("shil:selectedCalculationMethod", methodKey);
    localStorage.setItem("shil:calculationDomain", domain);
    localStorage.setItem("shil:scenarioDomain", domain);

    // مسیرها از همین نقطه ایزوله می‌مانند؛ دیتای مسیرهای دیگر نباید وارد UI بعدی شود.
    if (domain === "emergency") {
      localStorage.removeItem("shil:solarPanelPowerInput");
      localStorage.removeItem("shil:solarPanelPowerPreview");
      localStorage.removeItem("shil:unifiedPvEngineResult:input");
    }
  };

  const title = `روش طراحی ${DOMAIN_LABELS[domain] || DOMAIN_LABELS.solar}`;

  return (
    <EngineeringPageShell title={title}>
      <section id="shil-calculation-method-root" className="shil-card-stack shil-calculation-method-page">
        <div className="shil-section-card shil-method-minimal-panel">
          <div className="shil-section-head">
            <h2>انتخاب روش طراحی</h2>
            <span>{DOMAIN_LABELS[domain]}</span>
          </div>

          <div className="shil-method-context-strip">
            <span>{context.projectPath?.title || DOMAIN_LABELS[domain]}</span>
            <strong>{context.environment?.city || "اطلاعات پروژه و شرایط مسیر ثبت می‌شود"}</strong>
          </div>

          <div className="shil-method-grid-five shil-method-grid-minimal">
            {methodCards.map((method, index) => (
              <Link
                key={method.key}
                className="shil-large-choice shil-method-card-engine shil-method-card-minimal"
                onClick={() => handleSelect(method.key)}
                to={method.key === "utility_scale" ? "/new-project/system/utility?from=method" : `/new-project/input/${domain}/${method.key}`}
                state={{ domain, method: method.key, from: "calculation-method" }}
              >
                <span className="shil-method-badge">{method.badge}</span>
                <small>گزینه {index + 1}</small>
                <h2>{method.title}</h2>
                <p>{method.hint}</p>
              </Link>
            ))}
          </div>

          {domain === "emergency" ? (
            <p className="shil-muted-note">
              این صفحه مخصوص برق اضطراری است؛ فقط جریان کل، توان کل و لیست تجهیزات فعال هستند و هیچ مسیر PV، پنل، MPPT یا تولید خورشیدی در ادامه این شاخه نمایش داده نمی‌شود.
            </p>
          ) : null}
        </div>
      </section>
    </EngineeringPageShell>
  );
}
