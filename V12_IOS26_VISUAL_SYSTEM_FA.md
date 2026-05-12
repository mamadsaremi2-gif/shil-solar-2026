# گزارش نسخه V12 - سیستم ظاهری iOS 26 Inspired برای SHIL

این نسخه ظاهر اپ را به یک سیستم یکپارچه، قابل نگهداری و آماده توسعه محاسبات متصل می‌کند.

## فایل‌های جدید اضافه‌شده

- `src/design/ios26Theme.tokens.js`
  - تعریف توکن‌های تم: رنگ‌ها، شعاع‌ها، فاصله‌ها، فونت، Blur، سایه و Safe Area.
- `src/design/ios26Icons.config.js`
  - تعریف آیکون‌های مفهومی و گلیف‌های ساده برای ساختار اپ.
- `src/design/assetManifest.js`
  - تعریف رسمی مسیر، نام فایل، اندازه پیشنهادی، نسبت تصویر و محل استفاده عکس‌ها.
- `src/design/ios26-liquid-glass.css`
  - لایه نهایی ظاهر اپ با الهام از iOS 26 / Liquid Glass، شامل Header، Footer، کارت‌ها، فرم‌ها، تصاویر و نقشه.

## اتصال به سامانه یکپارچه اپ

- `src/main.jsx` اکنون تابع `applyIOS26ThemeToRoot()` را اجرا می‌کند.
- `src/styles/modular-appearance.css` فایل `ios26-liquid-glass.css` را به عنوان آخرین لایه ظاهری وارد می‌کند.
- `src/assets/assets.config.js` و `src/shared/constants/publicAssets.js` به `assetManifest.js` متصل شدند.
- تصاویر مهم داشبورد، ارتباط با ما، انتخاب پروژه و نقشه شرایط محیطی از Manifest واحد خوانده می‌شوند.

## نام و اندازه عکس‌هایی که باید بارگذاری کنی

### 1. عکس فول‌اسکرین داشبورد دسکتاپ

- نام فایل: `dashboard-bg-desktop.jpg`
- مسیر بارگذاری: `public/images/branding/dashboard-bg-desktop.jpg`
- اندازه پیشنهادی: `1920x1080 px`
- نسبت تصویر: `16:9`
- نحوه نمایش در کد: `object-fit: cover`

### 2. عکس فول‌اسکرین داشبورد موبایل

- نام فایل: `dashboard-bg-mobile.jpg`
- مسیر بارگذاری: `public/images/branding/dashboard-bg-mobile.jpg`
- اندازه پیشنهادی: `1290x2796 px`
- نسبت تصویر: نزدیک به iPhone Portrait / `9:19.5`
- نحوه نمایش در کد: `object-fit: cover`

### 3. لوگوی مرکزی داشبورد

- نام فایل: `dashboard-center-logo.webp`
- مسیر بارگذاری: `public/images/branding/dashboard-center-logo.webp`
- اندازه پیشنهادی: `512x512 px`
- نسبت تصویر: `1:1`
- نحوه نمایش در کد: `object-fit: contain`

### 4. لوگوی هدر تمام صفحات

- نام فایل: `header-center-logo.webp`
- مسیر بارگذاری: `public/images/branding/header-center-logo.webp`
- اندازه پیشنهادی: `512x512 px`
- نسبت تصویر: `1:1`
- نحوه نمایش در کد: `object-fit: contain`

### 5. عکس صفحه ارتباط با ما

- نام فایل: `contact-brand-equipment.webp`
- مسیر بارگذاری: `public/images/contact/contact-brand-equipment.webp`
- اندازه پیشنهادی: `1200x760 px`
- نسبت تصویر: حدود `1.58:1`
- نحوه نمایش در کد: `object-fit: cover`

### 6. عکس کارت پروژه برق خورشیدی با پنل

- نام فایل: `solar-project-route-card.webp`
- مسیر بارگذاری: `public/images/routes/solar-project-route-card.webp`
- اندازه پیشنهادی: `900x620 px`
- نسبت تصویر: حدود `1.45:1`
- نحوه نمایش در کد: `object-fit: cover`

### 7. عکس کارت برق اضطراری

- نام فایل: `backup-power-route-card.webp`
- مسیر بارگذاری: `public/images/routes/backup-power-route-card.webp`
- اندازه پیشنهادی: `900x620 px`
- نسبت تصویر: حدود `1.45:1`
- نحوه نمایش در کد: `object-fit: cover`

### 8. نقشه ایران / شرایط محیطی

- نام فایل: `environment-map.jpg`
- مسیر بارگذاری: `public/images/branding/environment-map.jpg`
- اندازه پیشنهادی: `1400x1100 px`
- نسبت تصویر: حدود `1.27:1`
- نحوه نمایش در کد: `object-fit: contain`
- نکته: این عکس عمداً بدون برش نمایش داده می‌شود.

## نتیجه

ظاهر اپ اکنون یک لایه نهایی منظم، تفکیک‌شده و قابل توسعه دارد. بعد از جایگزینی تصاویر با همین نام‌ها، نیازی به تغییر کد نیست.
