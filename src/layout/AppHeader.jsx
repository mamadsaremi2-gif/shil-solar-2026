import { APP_LAYOUT } from './layout.config';

export function AppHeader({ title = 'SHIL', onHome, className = '' }) {
  return (
    <header className={`shil-v17-header ${className}`.trim()} dir="rtl">
      <div className="shil-v17-header__frame">
        <div className="shil-v17-header__title-pill" title={title}>
          <span>{title}</span>
        </div>

        <div className="shil-v17-header__logo-slot" aria-hidden="true">
          <img
            className="shil-v17-header__logo"
            src={APP_LAYOUT.header.logo}
            alt={APP_LAYOUT.header.logoAlt}
          />
        </div>

        <button
          type="button"
          className="shil-v17-header__home"
          onClick={onHome}
          aria-label="رفتن به داشبورد"
        >
          <span>⌂</span>
        </button>
      </div>
    </header>
  );
}
