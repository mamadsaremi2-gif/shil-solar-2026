# SHIL Final Architecture Release

این نسخه، معماری SHIL را از حالت لوکال/PWA به حالت آماده اتصال امن به Supabase ارتقا می‌دهد.

## وضعیت نهایی این پکیج

- پنل ادمین لوکال همچنان کار می‌کند.
- همگام‌سازی Supabase آماده است.
- دو SQL جدا اضافه شده است:
  - `supabase/schema.production.sql` برای نسخه امن نهایی با RLS و Supabase Auth
  - `supabase/schema.development.sql` برای تست سریع و موقت بدون Auth واقعی
- `supabase/schema.sql` روی نسخه Production تنظیم شده است.
- فایل `.env.example` کامل شده است.
- سرویس جدید `src/services/shilSupabaseAuth.js` برای Auth واقعی اضافه شده است.
- سرویس Cloud Sync حالا `owner_auth_id` را پشتیبانی می‌کند و در حالت Production بدون Auth واقعی از نوشتن ناامن جلوگیری می‌کند.

## معماری داده

### جدول‌های اصلی Production

| جدول | کاربرد |
|---|---|
| `shil_profiles` | پروفایل کاربر متصل به `auth.users` |
| `shil_admin_roles` | تعیین ادمین‌های واقعی |
| `shil_records` | پروژه‌ها، سیوها، نظرات و پرسش‌ها |
| `shil_admin_settings` | تنظیمات پنل ادمین |
| `shil_admin_audit_log` | ثبت رویدادهای مدیریتی |

## روش راه‌اندازی Production

1. در Supabase یک پروژه بسازید.
2. Authentication را فعال کنید.
3. فایل زیر را در SQL Editor اجرا کنید:

```text
supabase/schema.production.sql
```

4. یک کاربر ادمین در Supabase Auth بسازید.
5. UUID آن کاربر را در جدول ادمین ثبت کنید:

```sql
insert into public.shil_admin_roles(auth_id, note)
values ('ADMIN_AUTH_UUID_HERE', 'first SHIL admin')
on conflict (auth_id) do update set enabled = true;
```

6. فایل `.env` پروژه را بر اساس `.env.example` بسازید:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_SHIL_CLOUD_SECURITY_MODE=production
```

7. پروژه را build کنید:

```bash
npm install --legacy-peer-deps
npm run build
```

## روش تست سریع Development

برای تست سریع بدون درگیری Auth، می‌توانید موقتاً این فایل را اجرا کنید:

```text
supabase/schema.development.sql
```

و در `.env` بگذارید:

```env
VITE_SHIL_CLOUD_SECURITY_MODE=development
```

این حالت فقط برای تست است، چون اجازه read/write عمومی می‌دهد.

## نکته امنیتی مهم

کلید `SUPABASE_SERVICE_ROLE_KEY` نباید داخل کد Frontend یا فایل‌های Vite قرار بگیرد. فقط `VITE_SUPABASE_ANON_KEY` در کلاینت مجاز است.

## وضعیت تکمیل معماری

این پکیج از نظر معماری آماده مرحله نهایی Deploy است، اما تست عملی Supabase باید روی پروژه واقعی شما انجام شود چون URL، anon key و Auth UUID مخصوص حساب شماست.
