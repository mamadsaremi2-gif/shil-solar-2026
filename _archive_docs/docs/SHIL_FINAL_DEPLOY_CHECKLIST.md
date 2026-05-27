# SHIL Final Deploy Checklist

## 1. فایل‌ها

- `.env` ساخته شده باشد.
- `VITE_SUPABASE_URL` درست باشد.
- `VITE_SUPABASE_ANON_KEY` درست باشد.
- `VITE_SHIL_CLOUD_SECURITY_MODE=production` برای نسخه نهایی باشد.

## 2. Supabase

- `supabase/schema.production.sql` اجرا شده باشد.
- حداقل یک کاربر در Supabase Auth ساخته شده باشد.
- UUID ادمین داخل `shil_admin_roles` ثبت شده باشد.
- RLS برای جدول‌ها فعال باشد.

## 3. تست عملکرد

- ورود کاربر عادی
- ساخت پروژه
- ذخیره پروژه
- ثبت نظر کاربر
- ورود ادمین
- مشاهده پروژه‌ها در پنل ادمین
- پاسخ ادمین به نظر کاربر
- حذف/آرشیو رکورد از پنل ادمین

## 4. Build

```bash
npm install --legacy-peer-deps
npm run build
```

## 5. Deploy

پوشه خروجی `dist` روی Vercel، Netlify یا هاست PWA قرار بگیرد.

## 6. تست بعد از Deploy

- باز شدن صفحه Login
- جدا بودن بکگراند Login و Main
- باز شدن Dashboard
- دسترسی به `/admin`
- اتصال Supabase در تب ابر/Supabase پنل ادمین
