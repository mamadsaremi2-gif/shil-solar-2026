export function MetricCard({ label, value, accent = "blue" }) {
  return (
    <div className={`metric-card metric-card--${accent}`}>
      <div className="metric-card__label">{label}</div>
      <div className="metric-card__value">{value}</div>
    </div>
  );
}
