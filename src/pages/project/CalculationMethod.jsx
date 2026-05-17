import React, { useMemo } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { approveProjectStep } from "../../workflow/projectWorkflow.js";
import EngineeringPageShell from "../../components/EngineeringPageShell.jsx";

const methodCards = [
  {
    key: "equipment",
    title: "لیست تجهیزات",
    badge: "250 تجهیز",
    description: "انتخاب تجهیزات مصرفی سبک و سنگین با ساعت استفاده، ضریب همزمانی، توان و انرژی روزانه.",
    output: "توان، انرژی، جریان، پیک استارت",
  },
  {
    key: "profile",
    title: "پروفایل مصرف",
    badge: "Load Profile",
    description: "تعریف الگوی مصرف صبح، ظهر، عصر و شب برای پروژه‌هایی که زمان مصرف مهم است.",
    output: "پیک مصرف، بار پایه، ضریب همزمانی",
  },
  {
    key: "energy",
    title: "انرژی مورد نیاز",
    badge: "kWh/day",
    description: "ورود مستقیم انرژی روزانه مورد نیاز برای طراحی سریع خورشیدی یا برق اضطراری.",
    output: "Wh/day و kWh/day",
  },
  {
    key: "power",
    title: "توان کل",
    badge: "W / kW",
    description: "ورود مستقیم توان کل مصرفی و ضریب پیک برای محاسبات سریع اینورتر و باتری.",
    output: "توان پیوسته و توان لحظه‌ای",
  },
  {
    key: "current",
    title: "جریان کل",
    badge: "A",
    description: "ورود جریان کل برای پروژه‌هایی که دیتای آمپری یا تابلو برق در دسترس است.",
    output: "جریان AC، جریان DC، توان متناظر",
  },
];

const labels = { offgrid: "آفگرید", hybrid: "هیبرید", ongrid: "آنگرید", emergency: "برق اضطراری" };

function readDraft(key) {
  try { return JSON.parse(localStorage.getItem(key) || "null"); }
  catch { return null; }
}

export default function CalculationMethod() {
  const params = useParams();
  const location = useLocation();
  const storedDomain = localStorage.getItem("shil:scenarioDomain");
  const isEmergency = location.pathname.includes("/emergency") || params.domain === "emergency" || storedDomain === "emergency";
  const domain = isEmergency ? "emergency" : "solar";
  const subtype = params.connection || (isEmergency ? "emergency" : "solar");
  const title = isEmergency ? "روش محاسبات برق اضطراری" : `روش محاسبات ${labels[subtype] || "انرژی خورشیدی"}`;

  const context = useMemo(() => ({
    scenario: readDraft("shil:selectedScenario"),
    environment: readDraft("shil:environmentDraft"),
    assessment: readDraft("shil:environmentAssessment"),
  }), []);

  const handleSelect = (methodKey) => {
    approveProjectStep("method");
    localStorage.setItem("shil:calculationMethod", methodKey);
    localStorage.setItem("shil:calculationDomain", domain);
  };

  return (
    <EngineeringPageShell title={title}>
      <section className="shil-card-stack">
        <div className="shil-section-card">
          <div className="shil-section-head">
            <h2>یکی از روش‌های محاسبات بار را انتخاب کنید</h2>
            <span>{isEmergency ? "Emergency Load Core" : "Solar Load Core"}</span>
          </div>

          <div className="shil-summary-grid">
            <div><span>سناریو</span><strong>{context.scenario?.title || "سناریوی آماده / دستی"}</strong></div>
            <div><span>شهر/اقلیم</span><strong>{context.environment?.city || "اصفهان"}</strong></div>
            <div><span>مسیر بعد</span><strong>روش محاسبات ← موتور بار ← طراحی سیستم</strong></div>
            <div><span>هسته نهایی</span><strong>{domain === "emergency" ? "برق اضطراری" : "خورشیدی"}</strong></div>
          </div>

          <div className="shil-method-grid-five">
            {methodCards.map((method) => (
              <Link
                key={method.key}
                className="shil-large-choice shil-method-card-engine"
                onClick={() => handleSelect(method.key)}
                to={`/new-project/input/${domain}/${method.key}`}
                state={{ subtype, from: "calculation-method" }}
              >
                <span className="shil-method-badge">{method.badge}</span>
                <h2>{method.title}</h2>
                <p>{method.description}</p>
                <small>{method.output}</small>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </EngineeringPageShell>
  );
}
