export function AppSelect({ label, options = [], ...props }) {
  return <div className="shil-field"><label>{label}</label><select className="shil-select" {...props}>{options.map((o) => <option key={o.value ?? o.id} value={o.value ?? o.id}>{o.label ?? o.title}</option>)}</select></div>;
}
