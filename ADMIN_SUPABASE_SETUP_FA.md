# راه‌اندازی نسخه نهایی Cloud/Admin برنامه SHIL SOLAR

این نسخه برای تست نهایی و انتشار آماده شده و شامل لاگین، تأیید مدیر، ذخیره پروژه روی سرور، داشبورد مدیریتی و گزارش‌گیری کاربران است.

## 1) ساخت پروژه Supabase
1. وارد Supabase شوید و یک پروژه جدید بسازید.
2. از مسیر **Project Settings > API** این دو مقدار را بردارید:
   - Project URL
   - anon public key

## 2) تنظیم فایل محیطی
در ریشه پروژه، از روی `.env.example` یک فایل `.env` بسازید:

```bash
cp .env.example .env
```

سپس مقادیر را وارد کنید:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_PUBLIC_KEY
VITE_ADMIN_EMAIL=YOUR_ADMIN_EMAIL@example.com
```

## 3) اجرای دیتابیس و امنیت
فایل زیر را کامل در **Supabase SQL Editor** اجرا کنید:

```text
supabase/schema.sql
```

این فایل جدول‌ها، نقش‌ها، وضعیت کاربران، RLS، ذخیره پروژه، گزارش استفاده و تابع امن مدیریت کاربران را ایجاد می‌کند.

## 4) ساخت مدیر اصلی
1. برنامه را اجرا کنید.
2. با ایمیل مدیر اصلی ثبت‌نام کنید.
3. سپس در SQL Editor این دستور را با ایمیل واقعی مدیر اجرا کنید:

```sql
update public.profiles
set role='admin',
    status='approved',
    approved_at=now()
where email='YOUR_ADMIN_EMAIL@example.com';
```

## 5) تست قبل از انتشار
این سناریوها را تست کنید:

1. ثبت‌نام کاربر جدید باید او را در وضعیت `pending` قرار دهد.
2. کاربر pending نباید وارد محیط محاسبات شود.
3. مدیر باید بتواند کاربر را تأیید، رد، مسدود یا کارشناس کند.
4. کاربر approved باید بتواند پروژه ایجاد و ذخیره کند.
5. پروژه باید در جدول `app_projects` ثبت شود.
6. رویدادهای استفاده باید در جدول `usage_events` ذخیره شوند.
7. داشبورد مدیر باید آمار کاربران، پروژه‌ها و گزارش استفاده را نشان دهد.
8. خروجی CSV کاربران، پروژه‌ها و رویدادها باید دانلود شود.

## 6) انتشار روی Vercel
در Vercel این Environment Variables را اضافه کنید:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_ADMIN_EMAIL
```

سپس Build و Redeploy بزنید.

## قابلیت‌های نهایی این نسخه

- لاگین و ثبت‌نام کاربران با Supabase Auth
- وضعیت‌های کاربر: `pending`، `approved`، `rejected`، `blocked`
- نقش‌ها: `user`، `expert`، `admin`
- تأیید/رد/مسدودسازی کاربران توسط مدیر
- ذخیره و همگام‌سازی پروژه‌ها روی سرور
- حذف پروژه از لوکال و سرور
- داشبورد مدیریتی با آمار کاربران و پروژه‌ها
- گزارش‌گیری رفتار کاربران از `usage_events`
- خروجی CSV از کاربران، پروژه‌ها و گزارش استفاده
- حالت تست محلی در صورت نبودن Supabase

## نکته امنیتی مهم
در این نسخه تغییر نقش و وضعیت کاربران از طریق تابع امن `admin_update_profile` انجام می‌شود و کاربر عادی امکان self-approve یا self-promote ندارد.
