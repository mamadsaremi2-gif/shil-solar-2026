export function AppInput({ label, textarea = false, ...props }) {
  const Control = textarea ? "textarea" : "input";
  return <div className="shil-field"><label>{label}</label><Control className={textarea ? "shil-textarea" : "shil-input"} {...props} /></div>;
}
