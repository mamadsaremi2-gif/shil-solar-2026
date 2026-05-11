# SHIL Mobile V10 Real Mobile Lock

این نسخه برای رفع مشکل باقی‌مانده در موبایل واقعی و Safari/iPhone آماده شده است.

## اصلاحات اصلی

- قفل کامل عرض اپ روی viewport موبایل
- جلوگیری از RTL horizontal drift در iOS Safari
- حذف اسکرول افقی واقعی از `html`, `body`, `#root` و صفحات اصلی
- اصلاح Header با anchoring چپ/راست به جای width ثابت
- اصلاح Footer با flex mobile-safe به جای grid شکننده
- اصلاح Stepbar با اسکرول داخلی مستقل
- اصلاح Grid مسیر طراحی و داشبورد برای عرض موبایل
- اصلاح کارت‌ها، فرم‌ها، نقشه و بلوک‌های دیتاسنگین برای عدم خروج از عرض صفحه
- اضافه شدن فایل نهایی `src/styles/shil-final-ui-v10-real-mobile-lock.css` و import به عنوان آخرین CSS

## تست‌ها

- `npm ci` موفق
- `npm run build` موفق
- `npm run test:engineering` موفق
