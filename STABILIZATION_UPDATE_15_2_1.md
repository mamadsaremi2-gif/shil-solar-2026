# SHIL Stabilization Update 15.2.1

این آپدیت برای رفع ایرادات تست یکپارچه ساخته شد.

## اصلاحات اصلی

- اضافه شدن `GlobalErrorBoundary` برای جلوگیری از سفید شدن کامل صفحه در خطاهای نمایشی.
- اضافه شدن `safeRender` برای تبدیل خروجی‌های object/array موتور به متن قابل نمایش در React.
- اصلاح صفحه اجرای محاسبات برای جلوگیری از خطای `Objects are not valid as a React child`.
- استانداردسازی نمایش Warning/Explanation/Protection/Cable/MPPT در خروجی نهایی.
- روشن‌تر شدن کارت‌های Summary و Result و افزایش کنتراست متن‌ها.
- کاهش Cache PWA و تغییر نام cacheها به نسخه جدید برای جلوگیری از لود شدن build قدیمی.
- حفظ مسیرهای سالم پروژه و پایداری Store/Registry/Engine.

## تست پیشنهادی

```bash
npm install
npm run engine:smoke
npm run dev -- --force
```

سپس مسیر زیر را تست کنید:

```txt
Dashboard → New Project → Info → Environment → Path → Method → Inputs → System → Summary → Run
```

## نکته مهم PWA

بعد از اجرای نسخه جدید، یک بار از DevTools گزینه Clear site data را بزنید تا service worker قبلی و cache قدیمی حذف شود.
