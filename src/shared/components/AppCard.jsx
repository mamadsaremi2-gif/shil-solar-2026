export function AppCard({ icon, title, note, active = false, onClick, children }) {
  return (
    <button type="button" className={`shil-card ${active ? "is-active" : ""}`} onClick={onClick}>
      {icon ? <div className="shil-card-icon">{icon}</div> : null}
      {title ? <div className="shil-card-title">{title}</div> : null}
      {note ? <div className="shil-card-note">{note}</div> : null}
      {children}
    </button>
  );
}
