import { DashboardActionCard } from "./DashboardActionCard";

export function DashboardActionGrid({ cards }) {
  return (
    <section className="shil-dashboard__cards" aria-label="کارت‌های اصلی داشبورد">
      {cards.map((card) => (
        <DashboardActionCard key={card.key} card={card} />
      ))}
    </section>
  );
}
