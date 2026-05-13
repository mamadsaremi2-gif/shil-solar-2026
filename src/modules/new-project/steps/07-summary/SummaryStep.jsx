export function SummaryStep({ value = {} }) {
  return <div className="shil-metrics"><div className="shil-metric"><b>{value.city || "-"}</b><span>موقعیت</span></div><div className="shil-metric"><b>{value.path || "-"}</b><span>مسیر</span></div><div className="shil-metric"><b>{value.dailyEnergy || "-"}</b><span>kWh/day</span></div><div className="shil-metric"><b>{value.systemVoltage || "48"}V</b><span>ولتاژ</span></div></div>;
}
