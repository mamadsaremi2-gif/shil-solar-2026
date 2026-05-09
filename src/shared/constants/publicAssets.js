export const PUBLIC_ASSETS = {
  branding: {
    logo: '/images/branding/shil-iran-logo-final.png',
    appLogo: '/images/branding/shil-iran-logo-final.png',
    productsFullCard: '/images/branding/shil-products-full-card-final.png',
  },
  backgrounds: {
    home: '/images/backgrounds/shil-final-dashboard.png',
    workspace: '/images/backgrounds/shil-final-dashboard.png',
    report: '/images/backgrounds/shil-final-dashboard.png',
    method: '/images/backgrounds/shil-final-dashboard.png',
    shilProductsHero: '/images/backgrounds/shil-products-hero-source.png',
  },
  qr: {
    instagram: '/images/qr/instagram-qr.jpg',
    instagramShil: '/images/qr/instagram-shil-qr.jpg',
    telegram: '/images/qr/telegram-qr.jpg',
    whatsapp: '/images/qr/whatsapp-qr.jpg',
  },
  icons: {
    icon192: '/icons/icon-192.png',
    icon512: '/icons/icon-512.png',
    iconMaskable512: '/icons/icon-maskable-512.png',
  },
};

export const PUBLIC_IMAGE_STATUS = [
  { key: 'branding.logo', path: PUBLIC_ASSETS.branding.logo, usage: 'لوگوی واحد همه صفحات و PDF', status: 'active' },
  { key: 'branding.productsFullCard', path: PUBLIC_ASSETS.branding.productsFullCard, usage: 'بنر محصولات و صفحه ارتباط با ما', status: 'active' },
  { key: 'backgrounds.home', path: PUBLIC_ASSETS.backgrounds.home, usage: 'عکس اصلی داشبورد و هدرها', status: 'active' },
  { key: 'backgrounds.workspace', path: PUBLIC_ASSETS.backgrounds.workspace, usage: 'پس زمینه workspace', status: 'active' },
  { key: 'backgrounds.report', path: PUBLIC_ASSETS.backgrounds.report, usage: 'پس زمینه خروجی و PDF', status: 'active' },
];
