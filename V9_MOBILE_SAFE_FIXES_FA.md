# SHIL Mobile V9 Mobile-Safe Fixes

این نسخه برای رفع ایرادات مشاهده‌شده در Deploy موبایل آماده شده است.

## اصلاحات اصلی

- حذف اسکرول افقی در سطح `html`, `body`, `#root` و تمام Shellهای اصلی.
- اصلاح Header ثابت برای موبایل واقعی: بدون `translateX` و بدون عرض ثابت 520px در موبایل.
- اصلاح Footer ثابت و Safe Area برای iOS/Android.
- اصلاح Stepbar مسیر طراحی با اسکرول افقی مستقل و بدون بیرون‌زدگی صفحه.
- اصلاح Grid داشبورد و کارت‌های پروژه برای جلوگیری از شکست عرض.
- اصلاح Grid صفحه پروژه جدید و مسیر طراحی.
- اصلاح فرم‌ها، Inputها، Selectها و Textareaها برای عرض 100% و خوانایی بهتر.
- اصلاح بخش‌های سنگین صفحه شرایط محیطی، GPS، Tilt، نقشه و کارت‌های مهندسی برای جلوگیری از Overflow.
- اضافه شدن فایل `src/styles/shil-final-ui-v9-mobile-safe.css` و Import نهایی در `src/main.jsx`.

## تست‌ها

- `npm run build` موفق
- `npm run test:engineering` موفق
