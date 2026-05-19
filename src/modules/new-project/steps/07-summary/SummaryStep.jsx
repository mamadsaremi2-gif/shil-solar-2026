export function SummaryStep({ value = {} }) {
  return <div className="shil-metrics"><div className="shil-metric"><b>{value.city || "-"}</b><span>Ù…ÙˆÙ‚Ø¹ÛŒØª</span></div><div className="shil-metric"><b>{value.path || "-"}</b><span>Ù…Ø³ÛŒØ±</span></div><div className="shil-metric"><b>{value.dailyEnergy || "-"}</b><span>kWh/day</span></div><div className="shil-metric"><b>{value.systemVoltage || "48"}V</b><span>ÙˆÙ„ØªØ§Ú˜</span></div></div>;
}
