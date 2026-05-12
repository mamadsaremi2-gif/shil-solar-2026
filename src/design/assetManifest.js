export const SHIL_IMAGE_MANIFEST = {
  dashboard: {
    fullscreenDesktop: {
      fileName: 'dashboard-bg-desktop.jpg',
      path: '/images/branding/dashboard-bg-desktop.jpg',
      size: '1920x1080 px',
      ratio: '16:9',
      objectFit: 'cover',
      usage: 'عکس فول اسکرین داشبورد برای دسکتاپ و PWA بزرگ',
    },
    fullscreenMobile: {
      fileName: 'dashboard-bg-mobile.jpg',
      path: '/images/branding/dashboard-bg-mobile.jpg',
      size: '1290x2796 px',
      ratio: 'iPhone portrait ~9:19.5',
      objectFit: 'cover',
      usage: 'عکس فول اسکرین داشبورد موبایل',
    },
    centerLogo: {
      fileName: 'dashboard-center-logo.webp',
      path: '/images/branding/dashboard-center-logo.webp',
      size: '512x512 px',
      ratio: '1:1',
      objectFit: 'contain',
      usage: 'لوگوی مرکزی داشبورد',
    },
  },
  contact: {
    heroEquipment: {
      fileName: 'contact-brand-equipment.webp',
      path: '/images/contact/contact-brand-equipment.webp',
      size: '1200x760 px',
      ratio: 'حدود 1.58:1',
      objectFit: 'cover',
      usage: 'عکس اصلی صفحه ارتباط با ما / تجهیزات برند',
    },
  },
  projectRoutes: {
    solar: {
      fileName: 'solar-project-route-card.webp',
      path: '/images/routes/solar-project-route-card.webp',
      size: '900x620 px',
      ratio: 'حدود 1.45:1',
      objectFit: 'cover',
      usage: 'کارت انتخاب پروژه برق خورشیدی با پنل',
    },
    backup: {
      fileName: 'backup-power-route-card.webp',
      path: '/images/routes/backup-power-route-card.webp',
      size: '900x620 px',
      ratio: 'حدود 1.45:1',
      objectFit: 'cover',
      usage: 'کارت انتخاب برق اضطراری',
    },
  },
  environment: {
    iranMap: {
      fileName: 'environment-map.jpg',
      path: '/images/branding/environment-map.jpg',
      size: '1400x1100 px',
      ratio: 'حدود 1.27:1',
      objectFit: 'contain',
      usage: 'نقشه ایران در صفحه شرایط محیطی، بدون برش',
    },
  },
  branding: {
    headerLogo: {
      fileName: 'header-center-logo.webp',
      path: '/images/branding/header-center-logo.webp',
      size: '512x512 px',
      ratio: '1:1',
      objectFit: 'contain',
      usage: 'لوگوی هدر ثابت تمام صفحات',
    },
    appLogo: {
      fileName: 'shil-iran-logo-final.png',
      path: '/images/branding/shil-iran-logo-final.png',
      size: '1024x1024 px',
      ratio: '1:1',
      objectFit: 'contain',
      usage: 'لوگوی اصلی اپ، گزارش و احراز هویت',
    },
  },
};

export const SHIL_REQUIRED_IMAGE_FILES = Object.values(SHIL_IMAGE_MANIFEST).flatMap((group) => Object.values(group));
