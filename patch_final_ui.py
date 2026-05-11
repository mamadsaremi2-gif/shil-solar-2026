from pathlib import Path
p=Path('/mnt/data/shil_final/src/features/project-workspace/components/ProjectWorkspaceSections.jsx')
s=p.read_text()
s=s.replace('export function FlowHeader({ title, onBack }) {\n  return (\n    <header className="mobile-fixed-header workspace-fixed-header">\n      <button className="mobile-back-btn" type="button" onClick={onBack}>‹</button>\n      <img className="mobile-header-logo" src="/images/branding/shil-logo.png" alt="SHIL IRAN" />\n      <span className="mobile-title-pill">{title}</span>\n    </header>\n  );\n}', 'export function FlowHeader({ title, onDashboard }) {\n  return (\n    <header className="mobile-fixed-header workspace-fixed-header unified-shil-header">\n      <button className="mobile-back-btn mobile-dashboard-btn" type="button" onClick={onDashboard} aria-label="بازگشت به داشبورد">⌂</button>\n      <img className="mobile-header-logo" src="/images/branding/header-center-logo.webp" alt="SHIL IRAN" />\n      <span className="mobile-title-pill">{title}</span>\n    </header>\n  );\n}')
s=s.replace('''export function DesignOverview({ onStart }) {
  return (
    <section className="design-overview-card pro-design-overview v15-design-overview project-start-overview" aria-label="مسیر شروع پروژه">
      <div className="design-overview-card__title project-start-overview__title">
        <span>مسیر طراحی</span>
        <small>همه مراحل قبل از شروع پروژه جدید قابل بررسی هستند؛ برای شروع رسمی پروژه از مرحله اول اقدام نمایید.</small>
      </div>
      <div className="design-path-grid project-start-overview__grid">
        {DESIGN_STEPS.map((step, index) => (
          <button
            key={step}
            type="button"
            className="design-path-item pro-path-item v15-path-item project-start-step-card"
            style={{ "--delay": `${index * 95}ms`, "--spin-delay": `${index * -220}ms` }}
            onClick={() => onStart(index)}
          >
            <span className="project-start-step-card__number">{index + 1}</span>
            <i className="project-start-step-card__icon">{STEP_META[index].icon}</i>
            <strong>{step}</strong>
          </button>
        ))}
      </div>
    </section>
  );
}''','''export function DesignOverview({ onStart }) {
  return (
    <section className="design-overview-card pro-design-overview v15-design-overview project-start-overview new-project-launcher" aria-label="مسیر شروع پروژه">
      <div className="design-path-grid project-start-overview__grid new-project-grid-3x3">
        {DESIGN_STEPS.map((step, index) => (
          <button
            key={step}
            type="button"
            className="design-path-item pro-path-item v15-path-item project-start-step-card banking-step-icon"
            style={{ "--delay": `${index * 95}ms`, "--spin-delay": `${index * -220}ms` }}
            onClick={() => onStart(index)}
          >
            <span className="project-start-step-card__number">{String(index + 1).padStart(2, "0")}</span>
            <i className="project-start-step-card__icon">{STEP_META[index].icon}</i>
            <strong>{step}</strong>
          </button>
        ))}
        <button type="button" className="design-path-item pro-path-item v15-path-item project-start-step-card banking-step-icon is-future" disabled>
          <span className="project-start-step-card__number">09</span>
          <i className="project-start-step-card__icon">＋</i>
          <strong>توسعه آینده</strong>
        </button>
      </div>
    </section>
  );
}''')
# Replace PathSelect image filenames
s=s.replace('/images/cards/solar-project-card.png','/images/routes/solar-project-route-card.webp')
s=s.replace('/images/cards/backup-power-card.png','/images/routes/backup-power-route-card.webp')
# Insert env map at top of site stage and hide old via class
s=s.replace('<div className="form-instruction-top">فاز Site Survey فعال است: GPS، عکس محل، قطب‌نما، سایه و Climate Cache همگی در موتور واحد ذخیره و وارد گزارش نهایی می‌شوند.</div>', '<section className="environment-map-panel environment-map-panel--top" aria-label="نقشه تابش ایران"><img src="/images/branding/environment-map.jpg" alt="نقشه تابش و شرایط اقلیمی ایران" /><div className="environment-map-panel__overlay"><strong>{form.city || "انتخاب شهر"}</strong><span>{city.province || "استان"}</span></div></section><div className="form-instruction-top shil-warning-top">فاز Site Survey فعال است: GPS، عکس محل، قطب‌نما، سایه و Climate Cache همگی در موتور واحد ذخیره و وارد گزارش نهایی می‌شوند.</div>')
s=s.replace('<section className="environment-map-panel" aria-label="نقشه تابش ایران">','<section className="environment-map-panel environment-map-panel--legacy" aria-label="نقشه تابش ایران">')
p.write_text(s)

p=Path('/mnt/data/shil_final/src/features/project-workspace/ProjectWorkspacePage.jsx')
s=p.read_text()
s=s.replace('const { activeProject, stepIndex, updateForm, updateLoadItem, addLoadItem, removeLoadItem, saveProject, goDashboard, goToStep } = useProjectStore();','const { activeProject, stepIndex, updateForm, updateLoadItem, addLoadItem, removeLoadItem, saveProject, goDashboard, goToStep } = useProjectStore();')
s=s.replace('<FlowHeader title={headerTitle} onBack={() => (started && activeIndex > 0 ? jumpToStep(activeIndex - 1) : goDashboard())} onDashboard={goDashboard} />','<FlowHeader title={headerTitle} onDashboard={goDashboard} />')
old='''      {!started ? <DesignOverview onStart={(index = 0) => jumpToStep(index)} /> : (
        <div className="focus-layout">
          <FlowStepper activeIndex={activeIndex} form={form} completedSteps={completedSteps} goToStep={jumpToStep} />
          <section className={`focus-content-card pro-content-card ${previousConfirmed ? "is-confirmable" : "is-readonly-step"}`}>
            {!previousConfirmed ? <div className="step-lock-banner">این صفحه قابل مشاهده و تکمیل آزمایشی است؛ اما تایید آن تا تایید مرحله قبل غیرفعال می‌ماند.</div> : null}
            {content()}
            {activeIndex < 7 ? (
              <div className="focus-actions pro-actions">
                <button className="btn btn--ghost" type="button" onClick={() => activeIndex > 0 ? jumpToStep(activeIndex - 1) : setStarted(false)}>مرحله قبل</button>
                <button className="btn btn--secondary" type="button" onClick={saveProject}>ذخیره پیش‌نویس</button>
                <button className="btn btn--primary" type="button" disabled={!canConfirm} onClick={next}>{activeIndex === 6 ? "تایید و اجرای محاسبات" : "تایید مرحله"}</button>
              </div>
            ) : null}
            {(touchedConfirm || blockingMessages.length > 0) && !canConfirm && activeIndex < 7 ? <div className="form-error-panel">{blockingMessages.map((item, index) => <p key={index}>⚠️ {item}</p>)}</div> : null}
          </section>
        </div>
      )}'''
new='''      {!started ? (
        <>
          <section className="mobile-scroll-content no-stepbar project-start-scroll"><DesignOverview onStart={(index = 0) => jumpToStep(index)} /></section>
          <footer className="mobile-fixed-footer unified-shil-footer"><button className="btn btn--ghost" type="button" onClick={goDashboard}>برگشت</button></footer>
        </>
      ) : (
        <div className="focus-layout workspace-fixed-shell">
          <FlowStepper activeIndex={activeIndex} form={form} completedSteps={completedSteps} goToStep={jumpToStep} />
          <section className={`focus-content-card pro-content-card workspace-scroll-frame ${previousConfirmed ? "is-confirmable" : "is-readonly-step"}`}>
            {!previousConfirmed ? <div className="step-lock-banner shil-warning-top">این صفحه قابل مشاهده و تکمیل آزمایشی است؛ اما تایید آن تا تایید مرحله قبل غیرفعال می‌ماند.</div> : null}
            {content()}
            {(touchedConfirm || blockingMessages.length > 0) && !canConfirm && activeIndex < 7 ? <div className="form-error-panel shil-warning-top">{blockingMessages.map((item, index) => <p key={index}>⚠️ {item}</p>)}</div> : null}
          </section>
          {activeIndex < 7 ? (
            <footer className="mobile-fixed-footer unified-shil-footer workspace-action-footer">
              <button className="btn btn--ghost" type="button" onClick={() => activeIndex > 0 ? jumpToStep(activeIndex - 1) : setStarted(false)}>مرحله قبل</button>
              <button className="btn btn--secondary" type="button" onClick={saveProject}>ذخیره پیش‌نویس</button>
              <button className="btn btn--primary" type="button" disabled={!canConfirm} onClick={next}>{activeIndex === 6 ? "تایید و اجرای محاسبات" : "تایید مرحله"}</button>
            </footer>
          ) : null}
        </div>
      )}'''
if old not in s:
    print('old workspace block not found')
else:
    s=s.replace(old,new)
p.write_text(s)
