import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { approveProjectStep } from "../../workflow/projectWorkflow.js";
import EngineeringPageShell from "../../components/EngineeringPageShell.jsx";

const fallbackMethodCards = [
  { key: "equipment", title: "Ù„ÛŒØ³Øª ØªØ¬Ù‡ÛŒØ²Ø§Øª", badge: "Equipment" },
  { key: "profile", title: "Ù¾Ø±ÙˆÙØ§ÛŒÙ„ Ù…ØµØ±Ù", badge: "Profile" },
  { key: "energy", title: "Ø§Ù†Ø±Ú˜ÛŒ Ø±ÙˆØ²Ø§Ù†Ù‡", badge: "kWh/day" },
  { key: "power", title: "ØªÙˆØ§Ù† Ú©Ù„", badge: "W / kW" },
  { key: "current", title: "Ø¬Ø±ÛŒØ§Ù† Ú©Ù„", badge: "A" },
];

const labels = { offgrid: "Ø¢ÙÚ¯Ø±ÛŒØ¯", hybrid: "Ù‡ÛŒØ¨Ø±ÛŒØ¯", ongrid: "Ø¢Ù†Ú¯Ø±ÛŒØ¯", emergency: "Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ", solar: "Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ" };

function readDraft(key) {
  try { return JSON.parse(localStorage.getItem(key) || "null"); }
  catch { return null; }
}

function normalizeCards(cards) {
  if (!Array.isArray(cards) || cards.length === 0) return fallbackMethodCards;
  return cards
    .filter((item) => item && item.key && item.title)
    .slice(0, 5)
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
  const title = isEmergency ? "Ø±ÙˆØ´ Ù…Ø­Ø§Ø³Ø¨Ø§Øª Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ" : `Ø±ÙˆØ´ Ù…Ø­Ø§Ø³Ø¨Ø§Øª ${labels[subtype] || labels[domain]}`;
  const [methodCards, setMethodCards] = useState(fallbackMethodCards);

  const context = useMemo(() => ({
    scenario: readDraft("shil:selectedScenario"),
    environment: readDraft("shil:environmentDraft"),
  }), []);

  useEffect(() => {
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
            <h2>Ø§Ù†ØªØ®Ø§Ø¨ Ø±ÙˆØ´ Ù…Ø­Ø§Ø³Ø¨Ø§Øª</h2>
            <span>{domain === "emergency" ? "Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ" : "Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ"}</span>
          </div>

          <div className="shil-method-context-strip">
            <span>{context.scenario?.title || "Ù…Ø³ÛŒØ± Ù¾Ø±ÙˆÚ˜Ù‡"}</span>
            <strong>{context.environment?.city || "Ø´Ø±Ø§ÛŒØ· Ù…Ø­ÛŒØ·ÛŒ Ø«Ø¨Øª Ø´Ø¯"}</strong>
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
