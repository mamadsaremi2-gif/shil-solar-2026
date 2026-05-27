# README Backend/Infra Update

این پکیج Backend/Infra اپ SHIL را از حالت Frontend-only به ساختار آماده اتصال واقعی تبدیل می‌کند.

## نصب

```powershell
npm install
npm run build
```

## Deploy پیشنهادی

- Vercel برای Frontend + API Routes
- Supabase برای Database
- OpenAI برای تولید تصویر محل نصب

## مراحل راه‌اندازی Supabase

1. یک پروژه Supabase بسازید.
2. فایل `supabase/migrations/001_shil_backend_schema.sql` را در SQL Editor اجرا کنید.
3. مقادیر `SUPABASE_URL` و `SUPABASE_SERVICE_ROLE_KEY` را در Vercel Environment Variables وارد کنید.
4. کلید `OPENAI_API_KEY` را برای AI Image Service اضافه کنید.
5. Deploy را دوباره اجرا کنید.

## تست

```text
/api/health
```

اگر خروجی `database: connected` بود، Backend آماده است.
