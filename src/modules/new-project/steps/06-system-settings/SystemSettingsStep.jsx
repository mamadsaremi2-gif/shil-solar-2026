import { AppInput } from "../../../../shared/components/AppInput.jsx";
import { AppSelect } from "../../../../shared/components/AppSelect.jsx";
export function SystemSettingsStep({ value = {}, onChange = () => {} }) {
  return <div className="shil-form"><AppSelect label="ولتاژ سیستم" value={value.systemVoltage || "48"} onChange={(e) => onChange("systemVoltage", e.target.value)} options={[{value:"24", label:"24V"},{value:"48", label:"48V"},{value:"96", label:"96V"}]} /><AppInput label="Autonomy" value={value.autonomy || "1.5"} onChange={(e) => onChange("autonomy", e.target.value)} /></div>;
}
