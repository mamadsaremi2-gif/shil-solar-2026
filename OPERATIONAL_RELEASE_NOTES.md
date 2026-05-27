# SHIL Operational Release Package

این نسخه برای رساندن اپ به نقطه بهره‌برداری آماده شده است. موتور محاسبات مهندسی فعال است، اجرای قوانین از UI جدا شده، و برای تست عملیاتی اسکریپت‌های مستقل اضافه شده‌اند.

## دستورهای اصلی

```bash
npm install
npm run ops:ready
npm run dev -- --force
```

برای خروجی نهایی:

```bash
npm run prod:build
```

## وضعیت معماری

```txt
UI Pages
  -> Store / Project State
  -> Engine Gateway
  -> Unified Engineering Engine
  -> Rules Registry
  -> Data Registry
  -> Operational Guard
  -> Summary / Report / PDF-ready output
```

## بخش‌های اضافه‌شده

- `src/engine/config/operationalProfiles.js`
- `src/engine/validation/operationalGuards.js`
- `tools/production-check.mjs`
- `tools/export-engine-report.mjs`
- `public/diagnostics/engine-health.json` بعد از اجرای `npm run ops:report`

## سطح بهره‌برداری

این پکیج برای تست عملیاتی، نمایش UI، اجرای موتور، و ادامه توسعه قوانین آماده است. قوانین مهندسی نسخه ۱ هستند و باید در مراحل بعدی با دیتای واقعی پروژه‌ها و استانداردهای نهایی دقیق‌تر شوند.
