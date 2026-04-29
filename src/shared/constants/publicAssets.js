export const PUBLIC_ASSETS = {
  branding: {
    logo: '/images/branding/logo.png',
    appLogo: '/images/branding/app-logo.png',
    productsFullCard: '/images/branding/shil-products-full-card.png',
  },
  backgrounds: {
    home: '/images/backgrounds/home-main-bg.jpg',
    workspace: '/images/backgrounds/app-workspace-bg.jpg',
    report: '/images/backgrounds/final-bg.jpg',
    method: '/images/backgrounds/method-bg.jpg',
    shilProductsHero: '/images/backgrounds/shil-products-solar-hero.png',
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
  { key: 'branding.logo', path: PUBLIC_ASSETS.branding.logo, usage: 'dashboard, output, pdf brand header', status: 'active' },
  { key: 'branding.appLogo', path: PUBLIC_ASSETS.branding.appLogo, usage: 'app badge, splash style usage later', status: 'ready' },
  { key: 'backgrounds.home', path: PUBLIC_ASSETS.backgrounds.home, usage: 'dashboard hero background', status: 'active' },
  { key: 'backgrounds.workspace', path: PUBLIC_ASSETS.backgrounds.workspace, usage: 'workspace hero background', status: 'active' },
  { key: 'backgrounds.report', path: PUBLIC_ASSETS.backgrounds.report, usage: 'output/report cover background', status: 'active' },
  { key: 'backgrounds.method', path: PUBLIC_ASSETS.backgrounds.method, usage: 'method/calculation mode section background', status: 'ready' },
  { key: 'qr.instagram', path: PUBLIC_ASSETS.qr.instagram, usage: 'optional about/contact page', status: 'ready' },
  { key: 'qr.instagramShil', path: PUBLIC_ASSETS.qr.instagramShil, usage: 'optional about/contact page', status: 'ready' },
  { key: 'qr.telegram', path: PUBLIC_ASSETS.qr.telegram, usage: 'optional about/contact page', status: 'ready' },
  { key: 'qr.whatsapp', path: PUBLIC_ASSETS.qr.whatsapp, usage: 'optional about/contact page', status: 'ready' },
];
