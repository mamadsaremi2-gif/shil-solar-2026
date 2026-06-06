import { AppCard } from "../../../../shared/components/AppCard.jsx";
import { PROJECT_PATH_OPTIONS, SOLAR_MODE_OPTIONS } from "./projectPath.options.js";
export function ProjectPathStep({ value = {}, onChange = () => {} }) {
  return <><div className="shil-grid cols-2">{PROJECT_PATH_OPTIONS.map((o) => <AppCard key={o.id} title={o.title} icon={o.id === "backup" ? "⚡" : "☼"} active={value.path === o.id} onClick={() => onChange("path", o.id)} />)}</div><div className="shil-grid cols-3" style={{ marginTop: 10 }}>{SOLAR_MODE_OPTIONS.map((o) => <AppCard key={o.value} title={o.label} active={value.solarMode === o.value} onClick={() => onChange("solarMode", o.value)} />)}</div></>;
}
