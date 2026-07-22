/* SHIL UI V5.3 - runtime placement for confirmation buttons only. */
(function () {
  if (window.__SHIL_CONFIRM_BUTTONS_RUNTIME_V53__) return;
  window.__SHIL_CONFIRM_BUTTONS_RUNTIME_V53__ = true;

  const knownSelectors = [
    '#root > div.shil-page-shell.shil-page--project-path.shil-engineering-shell > main > div.shil-engineering-content.shil-ds-engineering-content > div > button.shil-project-path-confirm',
    '.shil-project-path-confirm',
    '.shil-calculation-method-confirm',
    '.shil-project-info-confirm',
    '.shil-project-details-confirm',
    '.shil-project-data-confirm',
    '.shil-env-content-confirm-button',
    '.shil-env-confirm-button',
    '.shil-env-confirm-final-button',
    '.shil-env-confirm-button-final',
    '.shil-flow-content-confirm-button',
    '.shil-confirm-config-button',
    '.shil-inline-confirm-button',
    '.shil-calc-content-confirm-slot > button',
    '.shil-system-content-confirm-slot > button',
    '.shil-summary-content-confirm-slot > button',
    '.shil-run-content-confirm-slot > button',
    '.shil-input-content-confirm-slot > button',
    '.shil-env-content-confirm-slot > button'
  ];

  function isConfirmButton(button) {
    if (!(button instanceof HTMLButtonElement)) return false;
    if (knownSelectors.some((selector) => button.matches(selector))) return true;

    const text = (button.textContent || '').replace(/\s+/g, ' ').trim();
    return /^(تأیید|تایید)/.test(text) ||
      text.includes('تأیید اطلاعات') ||
      text.includes('تأیید مسیر') ||
      text.includes('تأیید تنظیمات') ||
      text.includes('تأیید شرایط') ||
      text.includes('اجرای محاسبات نهایی') ||
      text.includes('اجرا نهایی') ||
      text.includes('ثبت خروجی نهایی') ||
      text.includes('تایید نهایی');
  }

  function styleButton(button) {
    if (!isConfirmButton(button)) return;

    button.style.setProperty('display', 'block', 'important');
    button.style.setProperty('position', 'relative', 'important');
    button.style.setProperty('width', '220px', 'important');
    button.style.setProperty('min-width', '220px', 'important');
    button.style.setProperty('max-width', '220px', 'important');
    button.style.setProperty('height', '46px', 'important');
    button.style.setProperty('min-height', '46px', 'important');
    button.style.setProperty('max-height', '46px', 'important');
    button.style.setProperty('margin-left', 'auto', 'important');
    button.style.setProperty('margin-right', 'auto', 'important');
    button.style.setProperty('left', 'auto', 'important');
    button.style.setProperty('right', 'auto', 'important');
    button.style.setProperty('top', 'auto', 'important');
    button.style.setProperty('bottom', 'auto', 'important');
    button.style.setProperty('inset', 'auto', 'important');
    button.style.setProperty('transform', 'none', 'important');
    button.style.setProperty('float', 'none', 'important');
    button.style.setProperty('align-self', 'center', 'important');
    button.style.setProperty('justify-self', 'center', 'important');
    button.style.setProperty('box-sizing', 'border-box', 'important');
    button.style.setProperty('text-align', 'center', 'important');
  }

  function apply() {
    document.querySelectorAll('button').forEach(styleButton);
  }

  function scheduleApply() {
    apply();
    requestAnimationFrame(apply);
    setTimeout(apply, 50);
    setTimeout(apply, 250);
    setTimeout(apply, 700);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleApply, { once: true });
  } else {
    scheduleApply();
  }

  document.addEventListener('click', () => setTimeout(apply, 0), true);
  window.addEventListener('popstate', scheduleApply);
  window.addEventListener('hashchange', scheduleApply);

  new MutationObserver(scheduleApply).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style', 'disabled']
  });
})();
