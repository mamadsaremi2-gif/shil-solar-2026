# SHIL Phase 2.3 — PWA / Add to Home Screen Icon

## تغییرات
- استفاده از لوگوی رسمی ارسال‌شده SHIL Iran برای آیکون نصب اپ.
- افزودن `public/apple-touch-icon.png` با اندازه 180×180 برای iOS/iPadOS.
- افزودن `public/icons/icon-192.png` و `public/icons/icon-512.png` برای Android/PWA.
- افزودن `public/icons/maskable-512.png` با safe-zone مناسب برای لانچرهای Android.
- افزودن `public/favicon.ico` و `public/favicon-64.png`.
- افزودن `public/manifest.webmanifest` با نام SHIL، حالت standalone و تم سرمه‌ای اپ.
- افزودن bootstrap در `src/pwa/shilPwaHead.js` و import آن در `src/main.jsx` تا manifest، apple-touch-icon و metaهای نصب روی موبایل در `<head>` ثبت شوند.

## تست بعد از Deploy
1. نسخه قبلی SHIL را از Home Screen حذف کنید.
2. Deploy جدید را باز کنید و یک Refresh کامل انجام دهید.
3. در iPhone/iPad از Safari گزینه Add to Home Screen را دوباره اجرا کنید.
4. در Android از Chrome/Edge گزینه Install app یا Add to Home screen را دوباره اجرا کنید.
5. اگر آیکون قدیمی دیده شد، داده/کش سایت و میانبر قبلی را حذف و دوباره نصب کنید؛ لانچر موبایل ممکن است آیکون قبلی را cache کرده باشد.
