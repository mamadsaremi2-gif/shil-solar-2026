import { AppCard } from "../../../../shared/components/AppCard.jsx";
import { CALCULATION_METHODS } from "./calculationMethods.config.js";
export function CalculationMethodStep({ value = {}, onChange = () => {} }) {
  return <div className="shil-grid cols-2">{CALCULATION_METHODS.map((m) => <AppCard key={m.value} title={m.label} active={value.method === m.value} onClick={() => onChange("method", m.value)} />)}</div>;
}
