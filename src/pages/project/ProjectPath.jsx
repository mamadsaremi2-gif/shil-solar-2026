import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { approveProjectStep } from "../../workflow/projectWorkflow.js";
import { clearScenarioFlow, startUtilityGateway, setWorkflowMode, FLOW_MODES } from "../../workflow/flowIsolation.js";
import EngineeringPageShell from "../../components/EngineeringPageShell.jsx";
import { readAdminDefaults, readAdminProjectPathCards } from "../../admin/adminStore.js";

const fallbackOptions = [
  {
    key: "solar",
    title: "برق خورشیدی با پنل",
    description: "طراحی خورشیدی معمولی با پنل، باتری، اینورتر و خروجی مهندسی تا محدوده سبک/متوسط",
    image: "/assets/shil/execution/solar-execution.svg",
    calculationDomain: "solar",
    order: 1,
  },
  {
    key: "emergency",
    title: "برق اضطراری",
    description: "طراحی سیستم پشتیبان با اینورتر، باتری و زمان برق اضطراری مورد نیاز",
    image: "/assets/shil/execution/emergency-inverter-battery.svg",
    calculationDomain: "emergency",
    order: 2,
  },
  {
    key: "utility",
    title: "نیروگاهی",
    description: "درگاه مستقل طراحی نیروگاه خورشیدی بالای ۳۰kW تا ظرفیت‌های MW، شامل بلوک‌بندی، MV، ترانس و Grid Study مقدماتی",
    image: "/assets/shil/execution/solar-execution.svg",
    calculationDomain: "utility",
    order: 3,
  },
];

function normalizeCards(cards) {
  if (!Array.isArray(cards)) return fallbackOptions;
  const safeCards = cards
    .filter((item) => item && item.key && item.title && item.active !== false)
    .filter((item) => !["future", "development", "under-development", "coming-soon"].includes(String(item.key || "").toLowerCase()))
    .filter((item) => !/در حال توسعه|توسعه/.test(String(item.title || "")))
    .map((item) => ({
      key: String(item.key),
      title: String(item.title),
      description: String(item.description || ""),
      image: String(item.image || ""),
      calculationDomain: String(item.calculationDomain || item.key),
      order: Number(item.order || 99),
    }));

  const base = safeCards.length ? safeCards : fallbackOptions;
  const withoutDev = base.filter((item) => !["future", "development", "under-development", "coming-soon"].includes(String(item.key || "").toLowerCase()) && !/در حال توسعه|توسعه/.test(String(item.title || "")));
  const hasUtility = withoutDev.some((item) => item.calculationDomain === "utility" || item.key === "utility");
  const withUtility = hasUtility ? withoutDev : [...withoutDev, fallbackOptions.find((item) => item.key === "utility")].filter(Boolean);
  return withUtility.sort((a, b) => (Number(a.order || 99) - Number(b.order || 99)));
}

export default function ProjectPath() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState("");
  const [warning, setWarning] = useState("");
  const [options, setOptions] = useState(() => normalizeCards(readAdminProjectPathCards()));

  useEffect(() => {
    let alive = true;
    const adminCards = normalizeCards(readAdminProjectPathCards());
    if (adminCards.length) {
      setOptions(adminCards);
      return () => { alive = false; };
    }

    fetch(`/project-path-cards.json?v=${Date.now()}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : fallbackOptions))
      .then((cards) => {
        if (alive) setOptions(normalizeCards(cards));
      })
      .catch(() => {
        if (alive) setOptions(fallbackOptions);
      });

    return () => { alive = false; };
  }, []);

  const selectedOption = useMemo(
    () => options.find((item) => item.key === selected),
    [options, selected]
  );

  const confirm = () => {
    if (!selectedOption) {
      setWarning("لطفاً یکی از مسیرهای پروژه را انتخاب کنید.");
      return;
    }

    const domain = selectedOption.calculationDomain || selectedOption.key;

    clearScenarioFlow();
    setWorkflowMode(domain === "utility" ? FLOW_MODES.UTILITY : FLOW_MODES.MANUAL);
    approveProjectStep("path");
    localStorage.setItem("shil:projectPath", selectedOption.key);
    localStorage.setItem("shil:selectedProjectPath", JSON.stringify(selectedOption));
    localStorage.setItem("shil:executionMethod", selectedOption.key);
    localStorage.setItem("shil:calculationDomain", domain);
    localStorage.setItem("shil:scenarioDomain", domain);

    if (domain === "future") {
      navigate("/new-project/future");
      return;
    }

    if (domain === "utility") {
      approveProjectStep("method");
      approveProjectStep("inputs");
      localStorage.setItem("shil:selectedCalculationMethod", JSON.stringify({ key: "utility_scale", title: "نیروگاهی" }));
      localStorage.setItem("shil:calculationMethod", "utility_scale");
      startUtilityGateway("project-path");
      navigate("/new-project/system/utility?from=project-path&gateway=utility");
      return;
    }

    if (domain === "emergency") {
      localStorage.setItem("shil:selectedCalculationMethod", JSON.stringify({ key: "emergency", title: "برق اضطراری" }));
      localStorage.setItem("shil:calculationMethod", "equipment");
      const adminDefaults = readAdminDefaults();
      localStorage.setItem("shil:emergencyPowerSettings", JSON.stringify({ requiredEmergencyHours: adminDefaults.emergencyRequiredHours || 2, safetyFactor: adminDefaults.emergencySafetyFactor || 1.25, autoMode: true }));
      navigate("/new-project/emergency?domain=emergency&from=project-path", { state: { method: "برق اضطراری" } });
      return;
    }

    navigate(`/new-project/method?domain=${encodeURIComponent(domain)}&from=project-path`);
  };

  return (
    <EngineeringPageShell title="انتخاب مسیر پروژه">
      <section className="shil-card-stack">
        <div className="shil-section-card">
          <div className="shil-section-head">
            <h2>مسیر پروژه را انتخاب کنید</h2>
            <span>Project Path</span>
          </div>

          <p className="shil-section-note">
            مسیرهای معمولی مرحله‌به‌مرحله پیش می‌روند. طراحی نیروگاهی از کارت مستقل «نیروگاهی» شروع می‌شود تا منطق MW داخل مسیر پنل یا برق اضطراری شلوغی ایجاد نکند.
          </p>

          <div className="shil-execution-grid shil-project-path-two-cards">
            {options.map((option) => (
              <button
                type="button"
                key={option.key}
                className={`shil-execution-card ${selected === option.key ? "active" : ""}`}
                onClick={() => { setSelected(option.key); setWarning(""); }}
              >
                {option.image ? <img src={option.image} alt="" className="shil-execution-image" /> : null}
                <span className="shil-execution-check">{selected === option.key ? "✓" : ""}</span>
                <h3>{option.title}</h3>
                <p>{option.description}</p>
              </button>
            ))}
          </div>

          {warning ? <div className="shil-inline-warning">{warning}</div> : null}
          <button type="button" className="shil-primary-wide" onClick={confirm}>تأیید مسیر پروژه</button>
        </div>
      </section>
    </EngineeringPageShell>
  );
}
