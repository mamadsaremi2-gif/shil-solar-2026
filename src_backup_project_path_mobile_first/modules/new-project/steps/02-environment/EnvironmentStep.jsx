import { AppInput } from "../../../../shared/components/AppInput.jsx";
export function EnvironmentStep({ value = {}, onChange = () => {} }) {
  return <><div className="shil-map"><div><strong>⌖</strong><br />نقشه ایران</div></div><div className="shil-form" style={{ marginTop: 10 }}><AppInput label="شهر" value={value.city || ""} onChange={(e) => onChange("city", e.target.value)} /><AppInput label="تابش مؤثر" value={value.sunHours || ""} onChange={(e) => onChange("sunHours", e.target.value)} /></div></>;
}
