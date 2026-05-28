import * as React from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { approveProjectStep } from "../../workflow/projectWorkflow.js";
import EngineeringPageShell from "../../components/EngineeringPageShell.jsx";

const fallbackMethodCards = [
  { key: "equipment", title: "لیست تجهیزات", badge: "Equipment" },
  { key: "profile", title: "پروفایل مصرف", badge: "Profile" },
  { key: "energy", title: "انرژی روزانه", badge: "kWh/day" },
  { key: "solar_panel_power", title: "توان پنل خورشیدی", badge: "PV W" },
  { key: "power", title: "توان کل", badge: "W / kW" },
  { key: "current", title: "جریان کل", badge: "A" },
];

const labels = { offgrid: "آفگرید", hybrid: "هیبرید", ongrid: "آنگرید", emergency: "برق اضطراری", solar: "خورشیدی" };

function readDraft(key) {
  try { return JSON.parse(localStorage.getItem(key) || "null"); }
  catch { return null; }
}

function normalizeCards(cards) {
  if (!Array.isArray(cards) || cards.length === 0) return fallbackMethodCards;
  return cards
    .filter((item) => item && item.key && item.title)
    .slice(0, 6)
    .map((item) => ({
      key: String(item.key),
      title: String(item.title),
      badge: item.badge ? String(item.badge) : String(item.key),
    }));
}

export default function CalculationMethod() {
  const params = useParams();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const storedDomain = localStorage.getItem("shil:calculationDomain") || localStorage.getItem("shil:scenarioDomain");
  const domainFromQuery = query.get("domain");
  const isEmergency = domainFromQuery === "emergency" || location.pathname.includes("/emergency") || params.domain === "emergency" || storedDomain === "emergency";
  const domain = isEmergency ? "emergency" : "solar";
  const subtype = params.connection || (isEmergency ? "emergency" : "solar");
  const title = isEmergency ? "روش محاسبات برق اضطراری" : `روش محاسبات ${labels[subtype] || labels[domain]}`;
  const [methodCards, setMethodCards] = React.useState(fallbackMethodCards);

  const context = React.useMemo(() => ({
    scenario: readDraft("shil:selectedScenario"),
    environment: readDraft("shil:environmentDraft"),
  }), []);

  React.useEffect(() => {
    let alive = true;
    fetch("/calculation-method-cards.json", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!alive) return;
        setMethodCards(normalizeCards(data?.cards || data));
      })
      .catch(() => {
        if (alive) setMethodCards(fallbackMethodCards);
      });
    return () => { alive = false; };
  }, []);

  const handleSelect = (methodKey) => {
    approveProjectStep("method");
    localStorage.setItem("shil:calculationMethod", methodKey);
    localStorage.setItem("shil:calculationDomain", domain);
  };

  return (
    <EngineeringPageShell title={title}>
      <section className="shil-card-stack shil-calculation-method-page">
        <div className="shil-section-card shil-method-minimal-panel">
          <div className="shil-section-head">
            <h2>انتخاب روش محاسبات</h2>
            <span>{domain === "emergency" ? "برق اضطراری" : "خورشیدی"}</span>
          </div>

          <div className="shil-method-context-strip">
            <span>{context.scenario?.title || "مسیر پروژه"}</span>
            <strong>{context.environment?.city || "شرایط محیطی ثبت شد"}</strong>
          </div>

          <div className="shil-method-grid-five shil-method-grid-minimal">
            {methodCards.map((method) => (
              <Link
                key={method.key}
                className="shil-large-choice shil-method-card-engine shil-method-card-minimal"
                onClick={() => handleSelect(method.key)}
                to={`/new-project/input/${domain}/${method.key}`}
                state={{ subtype, from: "calculation-method" }}
              >
                <span className="shil-method-badge">{method.badge}</span>
                <h2>{method.title}</h2>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </EngineeringPageShell>
  );
}
