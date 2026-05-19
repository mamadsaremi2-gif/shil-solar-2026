import { AppInput } from "../../../../shared/components/AppInput.jsx";
export function ProjectInfoStep({ value = {}, onChange = () => {} }) {
  return <div className="shil-form"><AppInput label="Ù†Ø§Ù… Ù¾Ø±ÙˆÚ˜Ù‡" value={value.projectName || "X"} onChange={(e) => onChange("projectName", e.target.value)} /><AppInput label="Ú©Ø§Ø±ÙØ±Ù…Ø§" value={value.employer || "SHIL CO"} onChange={(e) => onChange("employer", e.target.value)} /></div>;
}
