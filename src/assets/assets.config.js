import { SHIL_IMAGE_MANIFEST } from '../design/assetManifest';
export const SHIL_ASSETS = {
  logos: {
    header: SHIL_IMAGE_MANIFEST.branding.headerLogo.path,
    main: SHIL_IMAGE_MANIFEST.branding.appLogo.path,
    shil: '/images/branding/shil-logo.png',
    dashboardCenter: SHIL_IMAGE_MANIFEST.dashboard.centerLogo.path,
  },
  backgrounds: {
    dashboardDesktop: SHIL_IMAGE_MANIFEST.dashboard.fullscreenDesktop.path,
    dashboardMobile: SHIL_IMAGE_MANIFEST.dashboard.fullscreenMobile.path,
    dashboardHeroMobile: '/images/dashboard/dashboard-hero-bg-mobile.webp',
  },
  maps: {
    environmentIran: SHIL_IMAGE_MANIFEST.environment.iranMap.path,
  },
  routeCards: {
    solar: SHIL_IMAGE_MANIFEST.projectRoutes.solar.path,
    backup: SHIL_IMAGE_MANIFEST.projectRoutes.backup.path,
  },
  contact: {
    equipment: SHIL_IMAGE_MANIFEST.contact.heroEquipment.path,
  },
  qr: {
    instagram: '/images/qr/instagram-qr.jpg',
    instagramShil: '/images/qr/instagram-shil-qr.jpg',
    telegram: '/images/qr/telegram-qr.jpg',
    whatsapp: '/images/qr/whatsapp-qr.jpg',
  },
  pwaIcons: {
    icon192: '/icons/icon-192.png',
    icon512: '/icons/icon-512.png',
    maskable512: '/icons/icon-maskable-512.png',
  },
};

export const ASSET_USAGE_MAP = [
  { key: 'logos.header', title: 'لوگوی هدر ثابت تمام صفحات' },
  { key: 'routeCards.solar', title: 'کارت مسیر پروژه خورشیدی' },
  { key: 'routeCards.backup', title: 'کارت مسیر برق اضطراری' },
  { key: 'maps.environmentIran', title: 'نقشه شرایط محیطی ایران' },
  { key: 'contact.equipment', title: 'تصویر تجهیزات صفحه ارتباط با ما' },
];
