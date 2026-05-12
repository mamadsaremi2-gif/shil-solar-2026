export const MODULAR_ARCHITECTURE = {
  appearance: {
    theme: 'src/config/theme.config.js',
    layout: 'src/layout/layout.config.js',
    icons: 'src/ui/icons.config.js',
    ui: 'src/ui/ui.config.js',
    cssEntry: 'src/styles/modular-appearance.css',
  },
  logic: {
    engineEntry: 'src/engine/solarEngine.index.js',
    originalEngineFolder: 'src/domain/engine',
  },
  assets: {
    images: 'src/assets/assets.config.js',
    originalPublicFolder: 'public/images',
  },
  output: {
    reports: 'src/reports/report.config.js',
    css: 'src/reports/report-output.css',
  },
  admin: {
    config: 'src/admin/admin.config.js',
    css: 'src/admin/admin-system.css',
  },
};
