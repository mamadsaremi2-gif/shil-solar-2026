# SHIL Mobile CSS Centralization - Final Audit

## نتیجه

فایل مرکزی کنترل ظاهر موبایل ایجاد و به ورودی اصلی پروژه وصل شد:

```txt
src/appearance/styles/shil-mobile-design-system.css
```

## تغییرات انجام‌شده

- محتوای CSSهای فعال و مهم پروژه در فایل مرکزی ادغام شد.
- `src/main.jsx` به یک import مرکزی برای استایل موبایل متصل شد.
- importهای پراکنده CSS داخلی از `main.jsx` حذف شدند.
- import مستقیم CSS در `src/app/App.jsx` حذف شد تا تم از فایل مرکزی کنترل شود.
- import مستقیم `src/components/ShilFrame.css` از کامپوننت حذف شد.
- فایل `src/components/ShilFrame.css` به فایل redirect/guard تبدیل شد.
- `styleRegistry.js`ها به import مرکزی اشاره می‌کنند.

## فایل‌های منبعی که در مرکزی ادغام شدند

- `src/appearance/styles/shil-mobile-fixed-layout.css`
- `src/appearance/styles/shil-global-black-text.css`
- `src/appearance/styles/shil-ui.css`
- `src/appearance/styles/app.css`
- `src/appearance/styles/shil-ui-final-100.css`
- `src/appearance/styles/shil-ux-flow-100.css`
- `src/appearance/styles/shil-project-management-100.css`
- `src/appearance/styles/shil-final-user-update.css`
- `src/appearance/styles/shil-v16-rebuild-stabilization.css`
- `src/appearance/styles/shil-neon-round-icons.css`
- `src/appearance/styles/shil-global-background-except-auth.css`
- `src/appearance/styles/shil-map-pin.css`
- `src/appearance/styles/shil-final-light-engineering-ui.css`
- `src/appearance/styles/shil-project-rail-horizontal-fix.css`
- `src/appearance/styles/shil-contrast-borders-nav-buttons.css`
- `src/appearance/styles/shil-unified-color-system.css`
- `src/appearance/styles/shil-background-image-final.css`
- `src/appearance/styles/shil-dashboard-newproject-icons-direct.css`
- `src/appearance/styles/shil-matte-glass-no-lines.css`
- `src/appearance/styles/shil-dashboard-project-fix.css`
- `src/appearance/styles/shil-dashboard-icons-match-project-final.css`
- `src/appearance/styles/shil-final-mobile-engineering-skin.css`
- `src/appearance/styles/shil-dashboard-icon-text-fix.css`
- `src/appearance/styles/shil-dashboard-icon-text-final.css`
- `src/appearance/styles/shil-color-theme-v2.css`
- `src/appearance/styles/shil-color-theme-v2-final.css`
- `src/appearance/styles/shil-blue-purple-green-theme.css`
- `src/appearance/styles/shil-engineering-color-theme.css`
- `src/appearance/styles/shil-blue-purple-energy-theme.css`
- `src/appearance/styles/shil-final-text-number-rules.css`
- `src/appearance/styles/shil-real-class-final-theme.css`
- `src/appearance/styles/shil-emergency-readability-fix.css`
- `src/appearance/styles/shil-engineering-theme-v2.css`
- `src/components/ShilFrame.css`
- `src/appearance/mobile-ui/styles/globals.css`
- `src/appearance/styles/shil-foundation-recovery.css`
- `src/mobile-ui/styles/globals.css`
- `src/styles/app.css`
- `src/styles/shil-foundation-recovery.css`
- `src/styles/shil-ui.css`
- `src/appearance/styles/dashboard-ios-icons.css`
- `src/appearance/styles/final-production-overrides.css`
- `src/appearance/styles/index.css`
- `src/appearance/styles/shil-dashboard-cleanup-final.css`
- `src/appearance/styles/shil-final-background-visible-glass-inner.css`
- `src/appearance/styles/shil-final-fix.css`
- `src/appearance/styles/shil-final-hotfix.css`
- `src/appearance/styles/shil-final-stable-ui.css`
- `src/appearance/styles/shil-force-icon-grid-transparent.css`
- `src/appearance/styles/shil-hard-remove-icon-panels.css`
- `src/appearance/styles/shil-no-dashboard-newproject-parent-glass.css`
- `src/appearance/styles/shil-unified-mobile-recovery.css`

## تعداد CSSهای موجود در پروژه

- تعداد کل فایل‌های CSS باقی‌مانده در سورس: **99**
- دلیل حذف نشدن کامل: جلوگیری از شکستن fallbackها، فایل‌های مرجع قدیمی و CSSهای کتابخانه‌ای.
- کنترل اصلی موبایل اکنون از فایل مرکزی انجام می‌شود.

## importهای CSS باقی‌مانده در JS/JSX

- `src/main.jsx` -> `./appearance/styles/shil-mobile-design-system.css`
- `src/calendar/SHILCalendar.jsx` -> `react-calendar/dist/Calendar.css`
- `src/datepicker/SHILDatePicker.jsx` -> `react-datepicker/dist/react-datepicker.css`
- `src/maps/SHILMap.jsx` -> `maplibre-gl/dist/maplibre-gl.css`
- `src/markdown/MarkdownViewer.jsx` -> `highlight.js/styles/github-dark.css`
- `src/math/FormulaView.jsx` -> `katex/dist/katex.min.css`
- `src/scheduler/Scheduler.jsx` -> `react-big-calendar/lib/css/react-big-calendar.css`
- `src/styles/styleRegistry.js` -> `../appearance/styles/shil-mobile-design-system.css`
- `src/tables/AGEngineeringGrid.jsx` -> `ag-grid-community/styles/ag-grid.css`
- `src/tables/AGEngineeringGrid.jsx` -> `ag-grid-community/styles/ag-theme-alpine.css`
- `src/tables/EngineeringSheet.jsx` -> `react-datasheet-grid/dist/style.css`
- `src/workspace/flow/WorkspaceFlow.jsx` -> `reactflow/dist/style.css`
- `src/components/analytics/ProductionHeatmap.jsx` -> `react-calendar-heatmap/dist/styles.css`
- `src/appearance/styles/styleRegistry.js` -> `./shil-mobile-design-system.css`

## قانون توسعه از این به بعد

هر تغییر ظاهری موبایل SHIL باید فقط در این فایل انجام شود:

```txt
src/appearance/styles/shil-mobile-design-system.css
```

از اضافه کردن CSS جدید در کامپوننت‌ها، inline style، یا فایل‌های hotfix جداگانه خودداری شود.

## نکته مهم

Vendor CSSهای کتابخانه‌ها مثل تقویم، نقشه، KaTeX، AG Grid و React Flow دست‌نخورده‌اند چون مربوط به پکیج‌های خارجی هستند و نباید وارد Design System اختصاصی SHIL شوند.
