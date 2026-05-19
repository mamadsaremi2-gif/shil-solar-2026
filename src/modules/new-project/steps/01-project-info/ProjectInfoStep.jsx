import { AppInput } from "../../../../shared/components/AppInput.jsx";
export function ProjectInfoStep({ value = {}, onChange = () => {} }) {
  return <div className="shil-form"><AppInput label="نام پروژه" value={value.projectName || "X"} onChange={(e) => onChange("projectName", e.target.value)} /><AppInput label="کارفرما" value={value.employer || "SHIL CO"} onChange={(e) => onChange("employer", e.target.value)} /></div>;
}
