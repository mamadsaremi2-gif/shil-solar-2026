# SHIL Architecture Optimization Report

## هدف
بهینه‌سازی امن معماری بدون حذف قابلیت‌های اپ، بدون تغییر مسیرها، صفحات، UI اصلی یا منطق محاسبات.

## تغییرات انجام‌شده

### 1. Lazy Loading صفحات
فایل `src/app/App.jsx` بازنویسی شد تا صفحات اصلی و صفحات مرحله‌ای پروژه با `React.lazy` و `Suspense` بارگذاری شوند. نتیجه: حجم اولیه JavaScript کمتر می‌شود و صفحه‌های سنگین فقط هنگام ورود کاربر دانلود/اجرا می‌شوند.

### 2. Chunk Splitting در Vite
در `vite.config.js`، تقسیم دستی vendor chunk اضافه شد:
- React core
- Charts
- Reports / PDF / Excel
- Maps
- Editors
- Backend SDKs
- Core vendor

این کار باعث کاهش فشار initial bundle و مدیریت بهتر cache در Android/PWA می‌شود.

### 3. پاکسازی فایل‌های Backup از مسیر Runtime
فایل‌های backup که مستقیماً در مسیر `src` بودند و import نمی‌شدند، به `docs/archive/source-backups` منتقل شدند. این فایل‌ها حذف کامل نشده‌اند و برای برگشت‌پذیری در آرشیو باقی مانده‌اند.

### 4. کاهش Dependencyهای مستقیم بلااستفاده
بر اساس اسکن importهای سورس و فایل‌های کانفیگ، 82 dependency مستقیم که ارجاعی در پروژه نداشتند از `package.json` حذف شدند. لیست کامل در `docs/removed-dependencies.json` ذخیره شده است.

## مواردی که عمداً حذف نشدند
- Capacitor packages، چون برای Android build و sync لازم‌اند حتی اگر import مستقیم در سورس نداشته باشند.
- `three` و `monaco-editor`، چون peer/runtime dependency پکیج‌های استفاده‌شده هستند.
- ابزارهای اصلی build مثل Vite، Terser، PostCSS، ESLint و Prettier.
- فایل‌های واقعی backup/data مثل `src/data/backup` و `src/data-layer/backup`، چون در کد import شده‌اند و بخشی از قابلیت اپ هستند.

## اصل حفظ‌شده
هیچ Route، صفحه، فرم، موتور محاسبات، AI layer، آفلاین/PWA یا قابلیت Android حذف نشده است.
