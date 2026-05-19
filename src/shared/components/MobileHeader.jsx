export function MobileHeader({ title = "Ø¯Ø§Ø´Ø¨ÙˆØ±Ø¯", onBack, onDashboard, workflow = false }) {
  return (
    <header className="shil-header">
      <div className="shil-header-row">
        <button className="shil-mini-btn" onClick={workflow ? onDashboard : onBack} aria-label={workflow ? "Ø¯Ø§Ø´Ø¨ÙˆØ±Ø¯" : "Ø¨Ø§Ø²Ú¯Ø´Øª"}>
          {workflow ? "Ø®Ø§Ù†Ù‡" : "Ø¨Ø§Ø²Ú¯Ø´Øª"}
        </button>
        <div className="shil-brand">SHIL<small>ENGINEERING UI</small></div>
        <div className="shil-capsule" title={title}>{title}</div>
      </div>
    </header>
  );
}
