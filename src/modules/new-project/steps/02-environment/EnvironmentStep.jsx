import { AppInput } from "../../../../shared/components/AppInput.jsx";
export function EnvironmentStep({ value = {}, onChange = () => {} }) {
  return <><div className="shil-map"><div><strong>âŒ–</strong><br />Ù†Ù‚Ø´Ù‡ Ø§ÛŒØ±Ø§Ù†</div></div><div className="shil-form" style={{ marginTop: 10 }}><AppInput label="Ø´Ù‡Ø±" value={value.city || ""} onChange={(e) => onChange("city", e.target.value)} /><AppInput label="ØªØ§Ø¨Ø´ Ù…Ø¤Ø«Ø±" value={value.sunHours || ""} onChange={(e) => onChange("sunHours", e.target.value)} /></div></>;
}
