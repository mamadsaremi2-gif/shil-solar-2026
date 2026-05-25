# SHIL Final PWA Update Report

## هدف آپدیت
این نسخه برای رفع کمبودهای آخرین تست UI/Asset آماده شده است.

## اصلاحات انجام‌شده

### 1. آیکون‌ها
- پس‌زمینه سفید/چکر آیکون‌های داشبورد و پروژه حذف شد.
- آیکون‌ها به PNG شفاف 512x512 برای موبایل تبدیل شدند.
- فایل‌های PNG به عنوان اولویت اصلی نگه داشته شدند.
- فایل `output.png` برای جلوگیری از Broken Image در مسیرهای قدیمی اضافه شد.

### 2. قاب شیشه‌ای نئونی
- قاب Glass برای همه آیکون‌های داشبورد، پروژه جدید و نوار مسیر پروژه اعمال شد.
- نور نئونی آبی و بنفش به صورت CSS نهایی و بدون سنگین کردن Assetها اضافه شد.
- قاب‌ها از طریق `src/styles/shil-final-hotfix.css` کنترل می‌شوند.

### 3. بک‌گراندها و مسیر Asset
- ارجاع‌های SVG قدیمی بک‌گراند به WEBP اصلاح شدند.
- مسیرهای Login/Main به فایل‌های زیر متصل شدند:
  - `/assets/shil/background/login/shil-login-bg.webp`
  - `/assets/shil/background/main/shil-main-bg.webp`

### 4. کارت‌های انتخاب مسیر پروژه
- مسیر تصاویر کارت‌های Project Path روی PNG تثبیت شد:
  - `/assets/shil/execution/solar-execution.png`
  - `/assets/shil/execution/emergency-inverter-battery.png`
  - `/assets/shil/execution/utility-execution.png`

### 5. اتصال صفحه تنظیمات سیستم
- صفحه `SystemSettings` دوباره به مسیر قبل و بعد وصل شد.
- دکمه‌های پایین صفحه اضافه شد:
  - مرحله قبل
  - ذخیره پیش‌نویس
  - تأیید مرحله
- مسیر خروجی Summary برای پروژه نیروگاهی اصلاح شد تا به `/new-project/summary/utility` برود.
- مسیر برگشت برای Solar/Emergency/Utility جداگانه مدیریت شد.

### 6. پاکسازی
- فایل‌های بکاپ مزاحم از `src` حذف شدند.
- `public/icons` و `src/mobile-ui/icons` حذف شدند تا تداخل Neon قدیمی برنگردد.

## تست انجام‌شده
- Smoke test پروژه اجرا شد و موفق بود.
- Build کامل داخل محیط فعلی به دلیل ناقص بودن `node_modules` و نبود پکیج `@supabase/supabase-js` در محیط تست قابل تکمیل نبود. این پکیج داخل `package.json` و `package-lock.json` وجود دارد و بعد از `npm install` روی سیستم کاربر نصب می‌شود.

## دستور تست محلی
```powershell
npm install
Remove-Item dist -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item node_modules\.vite -Recurse -Force -ErrorAction SilentlyContinue
npm run dev
```
