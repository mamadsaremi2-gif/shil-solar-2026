import { SHIL_ASSETS } from '../assets/assets.config';

export const APP_LAYOUT = {
  header: {
    className: 'mobile-fixed-header unified-shil-header',
    workspaceClassName: 'mobile-fixed-header workspace-fixed-header unified-shil-header',
    logo: SHIL_ASSETS.logos.header,
    logoAlt: 'SHIL IRAN',
    backIcon: '‹',
    dashboardIcon: '⌂',
  },
  footer: {
    className: 'mobile-fixed-footer unified-shil-footer',
    workspaceClassName: 'mobile-fixed-footer unified-shil-footer workspace-action-footer',
    sticky: true,
  },
  scroll: {
    className: 'mobile-scroll-content',
    hideUnderBars: true,
    preventGlobalHorizontalScroll: true,
  },
  pageShell: {
    className: 'mobile-page-shell',
    mobileFirst: true,
  },
};
