import ShilIcon from "../../../ui/ShilIcon";
function SmartIcon({ name }) {
  return <span className="shil-dashboard-card__icon" aria-hidden="true"><ShilIcon name={name} /></span>;
}

export function DashboardActionCard({ card }) {
  return (
    <button
      type="button"
      className={`shil-dashboard-card is-${card.tone}`}
      onClick={card.action}
    >
      <span className="shil-dashboard-card__shine" />
      <SmartIcon name={card.iconKey} />
      <span className="shil-dashboard-card__meta">{card.meta}</span>
      <strong>{card.title}</strong>
      <small>{card.caption}</small>
      {card.adminOnly ? <em>فقط برای ادمین</em> : null}
    </button>
  );
}
