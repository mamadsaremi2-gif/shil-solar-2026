import { AppCard } from "../../shared/components/AppCard.jsx";
import { DASHBOARD_CONFIG } from "./dashboard.config.js";

const items = ["Ù¾Ø±ÙˆÚ˜Ù‡ Ø¬Ø¯ÛŒØ¯", "Ù¾Ø±ÙˆÚ˜Ù‡â€ŒÙ‡Ø§", "Ø³Ù†Ø§Ø±ÛŒÙˆÙ‡Ø§ÛŒ Ø¢Ù…Ø§Ø¯Ù‡", "Ø¯Ø³ØªÛŒØ§Ø± Ù‡ÙˆØ´Ù…Ù†Ø¯", "Ø¨Ø§Ø²Ø®ÙˆØ±Ø¯ Ú©Ø§Ø±Ø¨Ø±", "Ø§Ø±ØªØ¨Ø§Ø· Ø¨Ø§ Ù…Ø§"];

export function DashboardPage({ onNavigate = () => {} }) {
  return <section className="shil-panel"><div className="shil-panel-title"><h2>Ø¯Ø§Ø´Ø¨ÙˆØ±Ø¯</h2><span>{DASHBOARD_CONFIG.layoutMode}</span></div><div className="shil-hero"><h1>{DASHBOARD_CONFIG.heroText}</h1></div><div className="shil-grid cols-2">{items.map((title) => <AppCard key={title} title={title} icon="â–£" onClick={() => onNavigate(title)} />)}</div></section>;
}
