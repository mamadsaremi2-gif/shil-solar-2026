import { AppInput } from "../../../../shared/components/AppInput.jsx";
export function ProjectInfoStep({ value = {}, onChange = () => {} }) {
  return <div className="shil-form"><AppInput label="نام پروژه" value={value.projectName || ""} onChange={(e) => onChange("projectName", e.target.value)} /><AppInput label="کارفرما" value={value.employer || ""} onChange={(e) => onChange("employer", e.target.value)} /></div>;
}
