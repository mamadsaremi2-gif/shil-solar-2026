# نسخه موبایل ریسپانسیو SHIL

این نسخه شامل پچ کامل موبایل برای داشبورد و صفحات اصلی است:

- داشبورد روی موبایل تک‌ستونه شده است.
- کارت‌ها Touch-friendly شده‌اند.
- Hero و متن‌ها برای عرض موبایل تنظیم شده‌اند.
- فرم‌ها، جدول‌ها و گریدها روی موبایل از کادر بیرون نمی‌زنند.
- Safe-area موبایل و رفتار لمس رعایت شده است.
- `node_modules` از بسته حذف شده تا روی GitHub/Vercel مشکل Permission ایجاد نکند.

## نصب

```bash
npm install
npm run dev
```

## خروجی نهایی

```bash
npm run build
npm run preview
```

## Vercel

Framework: Vite  
Build Command: `npm run build`  
Output Directory: `dist`  
Install Command: `npm install`
