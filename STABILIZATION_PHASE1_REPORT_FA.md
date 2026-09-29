# SHIL Solar 2026 - Stabilization Phase 1

تاریخ: 2026-09-27

## اصلاحات انجام شده

- بازسازی `src/data/offline/OfflineBackupManager.js` با ایجاد، فهرست، اعتبارسنجی checksum، بازیابی و حذف Backup.
- حذف import و instance مرده‌ی `BackupService` از `ShilAppKernel` چون فایل متناظر در بسته وجود نداشت و هیچ مصرف فعالی نداشت.
- حذف PIN پیش‌فرض `1366` از API؛ در نبود `SHIL_ADMIN_PIN` دسترسی ادمین Fail-Closed می‌شود.
- جایگزینی مقدار نمونه PIN در `.env.example` با placeholder امن.
- حذف مسیر استفاده از `VITE_OPENAI_API_KEY` و کلید OpenAI از Browser Bundle؛ دستیار فعلی در کلاینت به موتور Local fallback می‌کند تا endpoint سروری اختصاصی متصل شود.
- اصلاح Test Runnerهای قدیمی که به فایل‌های حذف‌شده اشاره می‌کردند.
- همگام‌سازی تست‌های V25.4 و V25.4.1 با UI فعلی (۸ مرحله خورشیدی و ۷ مرحله برق اضطراری).
- افزودن Legacy Compatibility Adapter برای pipeline قدیمی بدون تغییر موتور unified جدید.
- بازسازی System Sizing adapter برای قرارداد فرم Legacy.
- بازگرداندن خروجی‌های سازگار V12 در `EngineeringCalculationCoreV12` شامل hourly load، energy balance، monthly temperature PV و string window.
- به‌روزرسانی catalog compatibility برای فیلدهای بانک تجهیزات جدید و تست شناسه‌های canonical.
- اصلاح تست Workflow قدیمی مطابق جریان ۸ مرحله‌ای فعلی.
- همگام‌سازی تست permission با رفتار least-privilege فعلی (viewer پیش‌فرض).
- اضافه‌کردن اسکریپت‌های واقعی تست به `package.json` به‌جای smoke-test صوری.

## وضعیت تست‌ها

موفق:
- `node tests/run-all-tests.js`
- `node tests/run-v15-ui-tests.js`
- `node tools/v25-2-stage1-check.mjs`
- `node tools/v25-2-stage2-check.mjs`
- `node tools/v25-3-emergency-backup-check.mjs`
- `node tools/v25-4-admin-defaults-check.mjs`
- `node tools/v25-4-1-admin-ui-check.mjs`

## Build

`npm ci` در محیط بررسی به محدودیت زمانی شبکه/محیط برخورد کرد و نصب کامل وابستگی‌ها انجام نشد؛ در نتیجه Build نهایی Vite در این محیط قابل تأیید نبود. تلاش Build فقط به علت موجود نبودن `node_modules/vite/bin/vite.js` پس از نصب ناقص متوقف شد و خطای کامپایل کد گزارش نشد.

برای تأیید روی سیستم توسعه:

```bash
npm ci
npm test
npm run build
```

## مواردی که عمداً به فاز بعد موکول شد

- Consolidation حدود 119 import مستقیم CSS در `src/main.jsx`.
- حذف/آرشیو recovered/patch/reportهای قدیمی.
- بهینه‌سازی تصاویر و bundle size.
- یکپارچه‌سازی LocalStorage / Supabase / Store.
- اتصال دوباره Cloud AI از طریق endpoint سروری امن (بدون API key در مرورگر).
