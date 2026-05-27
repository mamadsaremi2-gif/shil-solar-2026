# SHIL Admin Cloud / Supabase Update

این آپدیت پنل ادمین را از حالت صرفاً `localStorage` به حالت دوگانه تبدیل می‌کند:

- بدون `.env`: همان حالت لوکال/PWA قبلی کار می‌کند.
- با `.env` و جدول‌های Supabase: کاربران، پروژه‌ها، نظرات، پرسش‌ها و پاسخ ادمین روی Supabase همگام می‌شوند.

## فایل‌های مهم

```text
src/services/shilCloudSync.js
src/backend/db/supabaseClient.js
src/pages/AdminDashboard.jsx
src/auth/session.js
supabase/schema.sql
.env.example
```

## راه‌اندازی

1. در Supabase یک پروژه بسازید.
2. فایل `supabase/schema.sql` را در SQL Editor اجرا کنید.
3. از روی `.env.example` یک فایل `.env` بسازید و مقدارها را وارد کنید:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

4. پروژه را اجرا کنید:

```bash
npm run dev
```

5. وارد پنل ادمین شوید و در تب «ابر/Supabase» دکمه «ارسال داده‌های لوکال به Supabase» را بزنید.

## نکته امنیتی

Policy فعلی برای توسعه/PWA باز است. برای انتشار عمومی، باید Supabase Auth و Row Level Security اختصاصی ادمین فعال شود.
