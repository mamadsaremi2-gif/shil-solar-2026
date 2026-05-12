# گزارش نسخه V13 - Unified Industrial iOS System

این نسخه برای یکدست سازی ظاهر موبایل SHIL و باز کردن دسترسی اسکرول در صفحات سنگین ساخته شد.

## تغییرات اصلی

- کاهش Glow و Neon اضافی در کل اپ
- یکپارچه سازی رنگ، سطح کارت ها، Border، Radius و Shadow
- تبدیل Header به نوار ثابت، فشرده و نزدیک تر به رفتار Native iOS
- تبدیل Footer به Toolbar ثابت و فشرده تر
- اصلاح Stepbar به اسکرول افقی همیشه قابل دسترس
- باز شدن اسکرول عمودی صفحات پروژه، چکیده، شرایط محیطی، گزارش و محاسبات
- تک ستونه شدن چکیده ها و کارت های دیتاسنگین در موبایل برای خوانایی بهتر
- اصلاح فرم ها، Inputها و Selectها برای Contrast بهتر
- اصلاح نسبت تصویرهای اصلی:
  - dashboard-hero-main.webp: نسبت 16:9
  - contact-banner-main.webp: نسبت 4:5
  - project-solar-card.webp: نسبت 4:3
  - project-ups-card.webp: نسبت 4:3
  - iran-climate-map-main.webp: نسبت 16:10
- باز شدن اسکرول افقی در بخش هایی که نیاز دارند، مثل Stepbar، لیست بانک تجهیزات، بخش های Site Survey و پیش نمایش گزارش A4

## نکته اجرایی

ورودی اصلی CSS همچنان `src/styles/modular-appearance.css` است و فایل V13 به عنوان آخرین Override وارد شده:

`src/styles/shil-v13-unified-industrial-ios.css`
