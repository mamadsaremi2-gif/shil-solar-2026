export function AppFooter({ routeName = 'dashboard', onHome, onPrev, onNext, onSave, className = '' }) {
  const isWorkspace = routeName === 'workspace';

  return (
    <footer className={`shil-v17-footer ${className}`.trim()} dir="rtl">
      <div className="shil-v17-footer__frame">
        {isWorkspace ? (
          <>
            <button type="button" className="shil-v17-footer__btn shil-v17-footer__btn--secondary" onClick={onPrev}>مرحله قبل</button>
            <button type="button" className="shil-v17-footer__btn shil-v17-footer__btn--ghost" onClick={onSave}>ذخیره</button>
            <button type="button" className="shil-v17-footer__btn shil-v17-footer__btn--primary" onClick={onNext}>مرحله بعد</button>
          </>
        ) : (
          <>
            <button type="button" className="shil-v17-footer__btn shil-v17-footer__btn--primary" onClick={onHome}>داشبورد</button>
          </>
        )}
      </div>
    </footer>
  );
}
