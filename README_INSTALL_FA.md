# نصب و اجرای نسخه اصلاح‌شده SHIL Dashboard

1. فایل ZIP را Extract کنید.
2. وارد پوشه پروژه شوید.
3. دستورهای زیر را اجرا کنید:

```bash
npm install
npm run dev
```

سپس آدرس زیر را باز کنید:

```text
http://localhost:5173/
```

اگر قبلاً نسخه قدیمی را باز کرده‌اید، یک بار در مرورگر `Ctrl + Shift + R` بزنید. در این نسخه Service Worker قبلی غیرفعال شده تا داشبورد قدیمی از کش مرورگر نمایش داده نشود.

برای preview از فایل آماده داخل `dist`:

```bash
npm run preview
```

و سپس:

```text
http://localhost:4173/
```

## نسخه ماژولار

در این خروجی، فایل‌های ظاهری، Layout، تصاویر، موتور محاسبات، خروجی PDF/عکس و تنظیمات ادمین تفکیک شده‌اند. راهنمای کامل در فایل `MODULAR_ARCHITECTURE_FA.md` قرار دارد.

### نصب و اجرا

```bash
npm install
npm run dev
```

### گرفتن خروجی نهایی

```bash
npm run build
```
