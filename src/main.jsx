import './pwa/shilPwaHead.js';
import './appearance/styles/shil-force-welcome-after-login.js';
import './appearance/styles/shil-auth-page-body-class.js';

import React from "react";
import { registerGlobalErrorHandlers } from "./production/errors/globalErrors.js";
import ReactDOM from "react-dom/client";
import App from "./app/App.jsx";

import "./appearance/styles/shil-ui.css";
import "./appearance/styles/app.css";
import "./appearance/styles/shil-ui-final-100.css";
import "./appearance/styles/shil-ux-flow-100.css";
import "./appearance/styles/shil-project-management-100.css";
import "./appearance/styles/shil-final-user-update.css";
import "./appearance/styles/shil-v16-rebuild-stabilization.css";
import './appearance/styles/shil-neon-round-icons.css';
import './appearance/styles/shil-global-background-except-auth.css';
import './appearance/styles/shil-map-pin.css';
import './appearance/styles/shil-final-light-engineering-ui.css';
import './appearance/styles/shil-project-rail-horizontal-fix.css';
import './appearance/styles/shil-contrast-borders-nav-buttons.css';
import './appearance/styles/shil-unified-color-system.css';
import './appearance/styles/shil-background-image-final.css';
import './appearance/styles/shil-dashboard-newproject-icons-direct.css';
import './appearance/styles/shil-matte-glass-no-lines.css';

window.React = React;
registerGlobalErrorHandlers();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

import './appearance/styles/shil-dashboard-project-fix.css';
import './appearance/styles/shil-dashboard-icons-match-project-final.css';

import './appearance/styles/shil-final-mobile-engineering-skin.css';

import './appearance/styles/shil-dashboard-icon-text-fix.css';


import './appearance/styles/shil-dashboard-icon-text-final.css';

import './appearance/styles/shil-color-theme-v2.css';


import './appearance/styles/shil-color-theme-v2-final.css';

import './appearance/styles/shil-blue-purple-green-theme.css';

import './appearance/styles/shil-engineering-color-theme.css';

import './appearance/styles/shil-blue-purple-energy-theme.css';


import './appearance/styles/shil-final-text-number-rules.css';


import './appearance/styles/shil-real-class-final-theme.css';


import './appearance/styles/shil-emergency-readability-fix.css';





import './appearance/styles/shil-last-override.css';





import './appearance/styles/shil-persian-runtime-fix.css';




/* Project UI V3: the only active visual layer for engineering sub-pages. */
import './appearance/styles/shil-project-unified-v4-compact.css';

import './appearance/styles/shil-app-unification-final.css';

/* SHIL UI V5 final page-aware layer */
import './appearance/styles/shil-app-unification-v5-final.css';

/* SHIL UI V5.2 - unified confirmation buttons */
import "./appearance/styles/shil-confirm-buttons-unified-v5-2.css";

/* SHIL UI V5.3 - runtime confirmation button placement */
import "./appearance/styles/shil-confirm-buttons-runtime-v5-3.js";

/* SHIL UI V5.4 - shared main image on every non-auth page */
import './appearance/styles/shil-all-pages-main-background-v5-4.css';
import './appearance/styles/environment-unified-v5-7-final.css';

/* SHIL Environment V5.8 hard isolation - must stay last */
import './appearance/styles/environment-hard-override-v5-8-final.css';

/* SHIL Calculation Inputs V5.9 hard isolation - must stay last */
import './appearance/styles/calculation-inputs-hard-override-v5-9-final.css';
/* SHIL System Settings V5.10 hard isolation - must stay last */
import './appearance/styles/system-settings-hard-override-v5-10-final.css';

/* SHIL Summary V5.11 hard isolation - must stay last */
import './appearance/styles/summary-hard-override-v5-11-final.css';
/* SHIL Run Output V5.12 hard isolation - must stay last */
import './appearance/styles/run-output-hard-override-v5-12-final.css';

/* SHIL V5.13 - global compact layout, must stay last */
import "./appearance/styles/all-pages-compact-unified-v5-13-final.css";

/* SHIL Calculation Method V5.14 hard isolation - must stay last */
import './appearance/styles/calculation-method-hard-override-v5-14-final.css';

/* SHIL System Settings V5.15 - compact data layout + sticky rail */
import './appearance/styles/system-settings-compact-sticky-v5-15-final.css';

/* SHIL System Settings V5.16 focused fix - settings page only */
import './appearance/styles/system-settings-v5-16-focused-fix.css';

/* SHIL Calculation Inputs V5.17 focused fix - calculation inputs page only */
import './appearance/styles/calculation-inputs-v5-17-focused-fix.css';

/* SHIL Environment V5.18 focused compact layout - environment page only */
import './appearance/styles/environment-v5-18-focused-compact.css';

/* SHIL Calculation Method V5.19 focused compact layout - calculation method page only */
import './appearance/styles/calculation-method-v5-19-focused-compact.css';

/* SHIL V5.20 - identical sticky project rail on every engineering page */
import './appearance/styles/project-rail-unified-v5-20-final.css';

/* SHIL V5.28 - exact scroll viewport between safe header and footer; must stay last */
import './appearance/styles/shil-scroll-viewport-v5-28-final.css';

/* SHIL V5.29 - focused cleanup: Contact, Projects and Education only */
import './appearance/styles/contact-projects-education-v5-29.css';

/* SHIL V5.34 - environment persistence and header title unification */
import "./appearance/styles/shil-v5-34-environment-persistence-header.css";

/* SHIL V6.1 - compact installation dashboard */
import "./appearance/styles/shil-v6-1-environment-installation-dashboard.css";

import "./appearance/styles/shil-v6-2-environment-installation-flat-cards.css";

/* SHIL V6.3 - semantic data-role colors for environment installation */
import "./appearance/styles/shil-v6-3-environment-data-roles.css";

/* SHIL V6.4 - global semantic visual language across all engineering pages */
import "./appearance/styles/shil-v6-4-global-engineering-semantic-ui.css";

/* SHIL V6.6 - semantic colors and flat cards for Project Path only */
import "./appearance/styles/shil-v6-6-project-path-only.css";

/* SHIL V6.7 - final H2/title-card override; keep as the last stylesheet import */
import "./appearance/styles/shil-final-section-title-cards-v6-7.css";

/* SHIL V6.8 - one title-card law across all pages; must remain the final CSS import */
import "./appearance/styles/shil-global-title-cards-v6-8.css";

/* SHIL V7 - final unified engineering design system; must remain last */
import "./appearance/styles/shil-unified-engineering-design-system-v7.css";

/* Project Path = Calculation Inputs visual parity; keep last */
import "./appearance/styles/project-path-match-calculation-inputs-final.css";

/* Project Info = Calculation Inputs visual parity; keep last */
import "./appearance/styles/project-info-match-calculation-inputs-final.css";

/* Environment = Calculation Inputs visual parity; dedicated final page override */
import "./appearance/styles/environment-match-calculation-inputs-final.css";

/* Calculation Method = Calculation Inputs visual parity; dedicated final page override */
import "./appearance/styles/calculation-method-match-calculation-inputs-final.css";

import "./appearance/styles/calculation-inputs-unified-final.css";
import "./appearance/styles/equipment-traceability-v1-4-final.css";

/* Summary = Calculation Inputs visual parity; dedicated final page override */
import "./appearance/styles/summary-match-calculation-inputs-final.css";

/* Run Output = Calculation Inputs visual parity; keep last */
import "./appearance/styles/run-output-match-calculation-inputs-final.css";

/* Projects / Project Manager = Calculation Inputs visual parity; keep last */
import "./appearance/styles/projects-match-calculation-inputs-final.css";

/* Contact = Calculation Inputs visual parity; keep last */
import "./appearance/styles/contact-match-calculation-inputs-final.css";

/* Ready Scenarios and every nested scenario page = Calculation Inputs visual parity; keep last */
import "./appearance/styles/scenarios-match-calculation-inputs-final.css";

/* Education hub and all nested education pages = Calculation Inputs visual parity; keep last */
import "./appearance/styles/education-match-calculation-inputs-final.css";

/* Development page = Calculation Inputs visual parity; keep last */
import "./appearance/styles/development-match-calculation-inputs-final.css";

/* Smart Assistant = Calculation Inputs visual parity; keep last */
import "./appearance/styles/assistant-match-calculation-inputs-final.css";

/* Environment visibility rescue - must remain the absolute final CSS import */
import "./appearance/styles/environment-visibility-rescue-final.css";

/* Environment visual parity v2 - keep after visibility rescue */
import "./appearance/styles/environment-calculation-inputs-parity-v2.css";

/* Environment exact Calculation Inputs parity - absolute final visual layer */
import './appearance/styles/environment-calculation-inputs-exact-final.css';

/* Environment structural parity - absolute last import */
import "./appearance/styles/environment-calculation-structural-parity-final.css";

/* Environment compact responsive layout - absolute final override */
import "./appearance/styles/environment-compact-layout-final.css";

// Final focused alignment and typography fix for Environment installation block
import "./appearance/styles/environment-installation-alignment-final.css";

/* Emergency branch, Project Info through Execution = Calculation Inputs visual parity. */
import "./appearance/styles/emergency-flow-calculation-inputs-parity-final.css";

/* Emergency settings confirm button - absolute final isolated override. */
import "./appearance/styles/emergency-settings-confirm-final.css";

/* Project Info requested update - absolute final isolated override. */
import "./appearance/styles/project-info-requested-update-final.css";

/* Solar System Settings = Solar Calculation Inputs exact visual parity; absolute final isolated layer. */
import "./appearance/styles/system-settings-match-calculation-inputs-final.css";

/* Solar final output inverter subsystem accordion - absolute final isolated layer. */
import "./appearance/styles/run-solar-inverter-accordion-final.css";

/* Solar run output results accordion - absolute final isolated layer. */
import "./appearance/styles/run-solar-results-accordion-final.css";

// V6.9: final mobile shell contract; keep this import last.
import "./appearance/styles/shil-mobile-header-rail-order-v6-9-final.css";

/* V6.11: unified minimal mobile footer; absolute final stylesheet. */
import "./appearance/styles/shil-mobile-footer-minimal-v6-11-final.css";

/* V10: final execution delivery rendered as a true single-page A4 form. Keep absolute last. */
import "./appearance/styles/run-output-a4-final-form-v10.css";

import "./appearance/styles/run-output-final-a4-v11.css";

import "./appearance/styles/run-output-native-v12.css";
import "./appearance/styles/run-output-v14-export-fix.css";

/* V13: global number-before-unit bidi contract. Keep absolute last. */
import "./appearance/styles/engineering-value-order-v13.css";
import "./appearance/styles/run-output-v15-hard-final.css";

/* V12 HARD FIX: isolated Project Info three-card layout. Absolute final import. */
import "./appearance/styles/project-info-floating-cards-v12-hard-final.css";

/* V13 FINAL: Project Info title-card parity + exact centered date sizing. Keep absolute last. */
import "./appearance/styles/project-info-floating-cards-v13-final.css";


/* V13.1 HARD LAYOUT: Project Info independent two-row field layout; absolute final import. */
import "./appearance/styles/project-info-floating-cards-v13-1-hard-layout.css";

/* V13.2: requested method/projects/environment/header-footer update. Absolute final import. */
import "./appearance/styles/shil-v13-2-requested-ui-update.css";

/* PHASE 1 CORE UI: header/footer, design tokens, contrast and shell cleanup. Absolute final import. */
import "./appearance/styles/shil-phase1-core-ui-final.css";

/* PHASE 2: scalable project management + child pages; absolute final project override. */
import "./appearance/styles/projects-phase2-engineering-final.css";

/* PHASE 2.1: compact mobile project cards + engineering palette; absolute final project override. */
import "./appearance/styles/projects-phase2-1-mobile-compact-no-purple.css";
import "./appearance/styles/projects-phase2-2-mobile-ultra-compact.css";
import "./appearance/styles/projects-phase2-4-card-parity-transparent-parent.css";

/* ADMIN V8: parentless floating engineering command center; admin-only absolute final override. */
import "./appearance/styles/shil-admin-v8-floating-command-center.css";

/* ADMIN V9: true parentless mobile-first accordions; absolute final admin override. */
import "./appearance/styles/shil-admin-v9-ultra-compact-accordion.css";
import "./appearance/styles/shil-admin-v10-two-column-hub.css";

/* ADMIN V11: engineering Summary visual parity for root + every admin descendant. Absolute final admin override. */
import "./appearance/styles/shil-admin-summary-parity-v11-final.css";

/* ADMIN V12: unified engineering design system inherited by root, parents and all admin descendants. Absolute final import. */
import "./appearance/styles/shil-admin-engineering-design-system-v12-final.css";

/* ADMIN V13: structural cleanup — true parentless hub, compact titles/cards, end-of-page logout. ABSOLUTE FINAL import. */
import "./appearance/styles/shil-admin-v13-structural-cleanup-final.css";
