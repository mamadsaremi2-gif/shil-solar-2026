function buildPoints(values, width, height, padding = 20) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  return values
    .map((value, index) => {
      const x = padding + (index * (width - padding * 2)) / Math.max(values.length - 1, 1);
      const y = height - padding - ((value - min) * (height - padding * 2)) / range;
      return `${x},${y}`;
    })
    .join(" ");
}

export function SimpleLineChart({ title, labels = [], values = [], secondaryValues = null, suffix = "" }) {
  const width = 640;
  const height = 220;
  const combined = secondaryValues ? [...values, ...secondaryValues] : values;
  const primaryPoints = buildPoints(values, width, height);
  const secondaryPoints = secondaryValues ? buildPoints(secondaryValues, width, height) : null;
  const lastValue = values.at(-1) ?? 0;

  return (
    <div className="chart-card">
      <div className="chart-card__header">
        <strong>{title}</strong>
        <span>{lastValue.toLocaleString("fa-IR")} {suffix}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" role="img" aria-label={title}>
        <polyline fill="none" stroke="currentColor" strokeWidth="3" points={primaryPoints} className="chart-line chart-line--primary" />
        {secondaryPoints ? <polyline fill="none" stroke="currentColor" strokeWidth="2" points={secondaryPoints} className="chart-line chart-line--secondary" /> : null}
      </svg>
      <div className="chart-label-row">
        {labels.filter((_, index) => index % 4 === 0).map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  );
}

export function SimpleBarChart({ title, items = [], suffix = "" }) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <div className="chart-card">
      <div className="chart-card__header">
        <strong>{title}</strong>
      </div>
      <div className="bar-chart">
        {items.map((item) => (
          <div key={item.label} className="bar-chart__item">
            <div className="bar-chart__value">{item.value.toLocaleString("fa-IR")} {suffix}</div>
            <div className="bar-chart__track">
              <div className="bar-chart__fill" style={{ width: `${(item.value / max) * 100}%` }} />
            </div>
            <div className="bar-chart__label">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
