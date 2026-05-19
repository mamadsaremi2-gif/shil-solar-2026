import { AppInput } from "../../../../shared/components/AppInput.jsx";
export function CalculationInputsStep({ value = {}, onChange = () => {} }) {
  return <div className="shil-form"><AppInput label="انرژی روزانه kWh" value={value.dailyEnergy || ""} onChange={(e) => onChange("dailyEnergy", e.target.value)} /><AppInput label="توان پیک kW" value={value.peakPower || ""} onChange={(e) => onChange("peakPower", e.target.value)} /></div>;
}
