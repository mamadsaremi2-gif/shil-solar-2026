# گزارش اصلاح نسخه نهایی SHIL Solar Design Suite

این نسخه پس از بررسی فایل ZIP اولیه، برای جایگزینی آماده شده است.

## اصلاحات انجام‌شده

1. اصلاح خطای رهگیری رویدادها در `src/app/store/projectStore.jsx`
   - فراخوانی بازگشتی اشتباه `trackEventSafe` حذف شد.
   - اکنون تابع واقعی `trackEvent` فراخوانی می‌شود.

2. اصلاح ناسازگاری Supabase در `src/shared/lib/usageTracker.js`
   - کلید `payload` به `metadata` تغییر کرد تا با ستون `metadata jsonb` در `supabase/schema.sql` هماهنگ باشد.

3. اصلاح تنظیم PWA در `vite.config.js`
   - محدودیت `maximumFileSizeToCacheInBytes` از 3MB به 5MB افزایش یافت تا تصاویر بزرگ موجود در پروژه از precache حذف نشوند.

4. حذف فایل `.env` از بسته نهایی
   - فقط `.env.example` باقی مانده است.
   - مقادیر واقعی محیطی باید در Vercel، GitHub Secrets یا محیط اجرای محلی تنظیم شوند.

## تست انجام‌شده

دستور زیر با موفقیت اجرا شد:

```bash
npm run test:engineering:all
```

نتیجه:

```text
Engineering smoke tests passed
Real engineering calculation tests passed
Engineering validation tests passed
All engineering test suites passed
```

## نکته build

در محیط بررسی، نصب کامل وابستگی‌ها با `npm ci` به دلیل محدودیت/کندی محیط اجرا کامل نشد؛ بنابراین build نهایی در همین محیط تأیید نشده است. روی سیستم مقصد یا CI اجرا کنید:

```bash
npm ci
npm run build
```
