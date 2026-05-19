import { AppInput } from "../../../../shared/components/AppInput.jsx";
export function CalculationInputsStep({ value = {}, onChange = () => {} }) {
  return <div className="shil-form"><AppInput label="Ø§Ù†Ø±Ú˜ÛŒ Ø±ÙˆØ²Ø§Ù†Ù‡ kWh" value={value.dailyEnergy || ""} onChange={(e) => onChange("dailyEnergy", e.target.value)} /><AppInput label="ØªÙˆØ§Ù† Ù¾ÛŒÚ© kW" value={value.peakPower || ""} onChange={(e) => onChange("peakPower", e.target.value)} /></div>;
}
