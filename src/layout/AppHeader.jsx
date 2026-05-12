import { APP_LAYOUT } from './layout.config';

export function AppHeader({ title, onBack, backMode = 'back', className = '' }) {
  const icon = backMode === 'dashboard' ? APP_LAYOUT.header.dashboardIcon : APP_LAYOUT.header.backIcon;
  return (
    <header className={`${APP_LAYOUT.header.className} ${className}`.trim()}>
      <button className="mobile-back-btn" type="button" onClick={onBack} aria-label="بازگشت">{icon}</button>
      <img className="mobile-header-logo" src={APP_LAYOUT.header.logo} alt={APP_LAYOUT.header.logoAlt} />
      <span className="mobile-title-pill">{title}</span>
    </header>
  );
}
