export const IOS26_THEME = {
  meta: {
    name: 'SHIL iOS 26 Liquid Glass Inspired Theme',
    version: '12.0.0',
    source: 'Inspired by Apple HIG principles: hierarchy, clarity, safe areas, simple glyph icons, legible system typography, and controlled translucency.',
  },
  colors: {
    canvas: '#050812',
    canvasRaised: '#09111f',
    glassBase: 'rgba(255,255,255,0.105)',
    glassStrong: 'rgba(255,255,255,0.16)',
    glassTint: 'rgba(13,32,54,0.62)',
    stroke: 'rgba(255,255,255,0.20)',
    strokeStrong: 'rgba(255,255,255,0.34)',
    text: '#f8fbff',
    textMuted: '#b8c7da',
    primary: '#0a84ff',
    cyan: '#64d2ff',
    green: '#30d158',
    orange: '#ff9f0a',
    red: '#ff453a',
    purple: '#bf5af2',
  },
  radii: {
    xs: '10px',
    sm: '14px',
    md: '18px',
    lg: '24px',
    xl: '30px',
    pill: '999px',
  },
  spacing: {
    pageX: 'clamp(12px, 4vw, 22px)',
    headerH: '64px',
    footerH: '72px',
    compactGap: '8px',
    cardGap: '12px',
  },
  typography: {
    family: 'Vazirmatn, IRANSans, -apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, Tahoma, Arial, sans-serif',
    title: 'clamp(16px, 4.8vw, 22px)',
    body: '14px',
    caption: '11.5px',
    lineHeight: '1.75',
  },
  effects: {
    blur: '22px',
    saturate: '1.45',
    shadow: '0 18px 54px rgba(0,0,0,0.34)',
    inner: 'inset 0 1px 0 rgba(255,255,255,0.20)',
  },
};

export const applyIOS26ThemeToRoot = () => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.shilTheme = 'ios26-liquid-glass';
  const flat = {
    '--ios26-canvas': IOS26_THEME.colors.canvas,
    '--ios26-canvas-raised': IOS26_THEME.colors.canvasRaised,
    '--ios26-glass-base': IOS26_THEME.colors.glassBase,
    '--ios26-glass-strong': IOS26_THEME.colors.glassStrong,
    '--ios26-glass-tint': IOS26_THEME.colors.glassTint,
    '--ios26-stroke': IOS26_THEME.colors.stroke,
    '--ios26-stroke-strong': IOS26_THEME.colors.strokeStrong,
    '--ios26-text': IOS26_THEME.colors.text,
    '--ios26-muted': IOS26_THEME.colors.textMuted,
    '--ios26-primary': IOS26_THEME.colors.primary,
    '--ios26-cyan': IOS26_THEME.colors.cyan,
    '--ios26-green': IOS26_THEME.colors.green,
    '--ios26-orange': IOS26_THEME.colors.orange,
    '--ios26-purple': IOS26_THEME.colors.purple,
    '--ios26-radius-sm': IOS26_THEME.radii.sm,
    '--ios26-radius-md': IOS26_THEME.radii.md,
    '--ios26-radius-lg': IOS26_THEME.radii.lg,
    '--ios26-radius-xl': IOS26_THEME.radii.xl,
    '--ios26-header-h': IOS26_THEME.spacing.headerH,
    '--ios26-footer-h': IOS26_THEME.spacing.footerH,
    '--ios26-page-x': IOS26_THEME.spacing.pageX,
    '--ios26-font': IOS26_THEME.typography.family,
    '--ios26-title': IOS26_THEME.typography.title,
    '--ios26-body': IOS26_THEME.typography.body,
    '--ios26-caption': IOS26_THEME.typography.caption,
    '--ios26-blur': IOS26_THEME.effects.blur,
    '--ios26-shadow': IOS26_THEME.effects.shadow,
    '--ios26-inner': IOS26_THEME.effects.inner,
  };
  Object.entries(flat).forEach(([key, value]) => root.style.setProperty(key, value));
};
