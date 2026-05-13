import { AppCard } from "../../shared/components/AppCard.jsx";
import { DASHBOARD_CONFIG } from "./dashboard.config.js";

const items = ["پروژه جدید", "پروژه‌ها", "سناریوهای آماده", "دستیار هوشمند", "بازخورد کاربر", "ارتباط با ما"];

export function DashboardPage({ onNavigate = () => {} }) {
  return <section className="shil-panel"><div className="shil-panel-title"><h2>داشبورد</h2><span>{DASHBOARD_CONFIG.layoutMode}</span></div><div className="shil-hero"><h1>{DASHBOARD_CONFIG.heroText}</h1></div><div className="shil-grid cols-2">{items.map((title) => <AppCard key={title} title={title} icon="▣" onClick={() => onNavigate(title)} />)}</div></section>;
}
