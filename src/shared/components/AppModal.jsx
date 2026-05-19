export function AppModal({ open, title, children, onClose }) {
  if (!open) return null;
  return <div className="shil-panel" role="dialog" aria-modal="true"><div className="shil-panel-title"><h3>{title}</h3><button className="shil-mini-btn" onClick={onClose}>بستن</button></div>{children}</div>;
}
