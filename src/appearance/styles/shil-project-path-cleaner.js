
const SHIL_PROJECT_PATH_CLEANER_ID = "shil-project-path-cleaner-style";

function injectShilProjectPathCleaner() {
  const old = document.getElementById(SHIL_PROJECT_PATH_CLEANER_ID);
  if (old) old.remove();

  const style = document.createElement("style");
  style.id = SHIL_PROJECT_PATH_CLEANER_ID;

  style.innerHTML = `
html body.shil-project-path-screen .shil-engineering-content > div,
html body.shil-project-path-screen .shil-card-stack,
html body.shil-project-path-screen .shil-card-stack > *,
html body.shil-project-path-screen .shil-section-card,
html body.shil-project-path-screen .shil-section-card::before,
html body.shil-project-path-screen .shil-section-card::after {
  background: transparent !important;
  background-image: none !important;
  border: 0 !important;
  border-right: 0 !important;
  outline: 0 !important;
  box-shadow: none !important;
  border-radius: 0 !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

html body.shil-project-path-screen .shil-section-card::before,
html body.shil-project-path-screen .shil-section-card::after {
  display: none !important;
  content: none !important;
}
`;

  document.head.appendChild(style);
}

injectShilProjectPathCleaner();

setTimeout(injectShilProjectPathCleaner, 100);
setTimeout(injectShilProjectPathCleaner, 500);
setTimeout(injectShilProjectPathCleaner, 1000);

