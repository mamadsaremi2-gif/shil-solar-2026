export function MobileHeader({ title = "داشبورد", onBack, onDashboard, workflow = false }) {
  return (
    <header className="shil-header">
      <div className="shil-header-row">
        <button className="shil-mini-btn" onClick={workflow ? onDashboard : onBack} aria-label={workflow ? "داشبورد" : "بازگشت"}>
          {workflow ? "خانه" : "بازگشت"}
        </button>
        <div className="shil-brand">SHIL<small>ENGINEERING UI</small></div>
        <div className="shil-capsule" title={title}>{title}</div>
      </div>
    </header>
  );
}
