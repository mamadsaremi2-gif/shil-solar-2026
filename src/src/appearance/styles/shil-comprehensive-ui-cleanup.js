const PROTECTED_SELECTOR = [
  'input', 'textarea', 'select', 'button', 'table',
  '[role="table"]', '[role="dialog"]', '[role="alert"]', '[role="status"]',
  '[data-result]', '[data-answer]', '[data-output]', '[data-keep-card="true"]',
  '.shil-keep-card', '.shil-input', '.shil-textarea', '.shil-field',
  '.shil-field-card', '.shil-form-grid', '.shil-summary-grid',
  '.shil-summary-item', '.shil-summary-details', '.shil-summary-detail-table',
  '.shil-compact-summary-table', '.shil-final-compact-table',
  '.shil-final-equipment-table', '.shil-equipment-bank-table',
  '.shil-equipment-results-card', '.shil-selected-equipment-list',
  '.shil-inline-warning', '.shil-floating-warning', '.shil-warning-list',
  '.shil-map-container', '.shil-upload-box', '.shil-thread-card'
].join(',');

const EMPTY_CARD_SELECTOR = [
  '.shil-section-card', '.shil-card-stack', '.shil-panel', '.shil-config-block',
  '.shil-env-card', '.shil-choice-card', '.shil-project-path-card',
  '.shil-nav-card', '.shil-execution-card', '.shil-final-compact-card',
  '.shil-compact-summary-card', '[class*="empty-card"]',
  '[class*="placeholder-card"]'
].join(',');

const PAGE_ROOT_SELECTOR = [
  '.shil-page-scroll', '.shil-page-content', '.shil-page-shell', '.shil-frame',
  '.shil-screen', '.shil-project-path-screen', '.shil-project-info-screen',
  '.shil-environment-screen', '.shil-calculation-method-screen',
  '.shil-summary-page', '.shil-system-settings-page', '.shil-system-final-page',
  '.shil-equipment-page', '[class$="-page"]', '[class$="-screen"]'
].join(',');

function hasMeaningfulContent(element) {
  if (element.matches(PROTECTED_SELECTOR) || element.querySelector(PROTECTED_SELECTOR)) return true;
  if (element.querySelector('img,svg,canvas,video,a,[contenteditable="true"]')) return true;
  return (element.textContent || '').replace(/\s+/g, '').length > 0;
}

function cleanRoot(root = document) {
  root.querySelectorAll(PAGE_ROOT_SELECTOR).forEach((element) => {
    element.style.removeProperty('background');
    element.style.removeProperty('background-image');
    element.style.removeProperty('backdrop-filter');
    element.style.removeProperty('-webkit-backdrop-filter');
  });

  root.querySelectorAll(EMPTY_CARD_SELECTOR).forEach((element) => {
    if (element.dataset.keepCard === 'true' || element.classList.contains('shil-keep-card')) return;
    if (!hasMeaningfulContent(element)) element.remove();
  });
}

function startCleanup() {
  cleanRoot(document);
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) cleanRoot(node);
      });
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startCleanup, { once: true });
} else {
  startCleanup();
}
