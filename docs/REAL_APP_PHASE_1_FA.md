# فاز ۱ تبدیل SHIL SOLAR به اپ واقعی

این فاز، پایه اپ واقعی را فعال می‌کند: ورود کاربر، تأیید مدیر، ذخیره پروژه روی Supabase، جدول تجهیزات سروری و تنظیمات مرکزی.

## 1) تنظیم Supabase

در Supabase یک پروژه بسازید و فایل `supabase/schema.sql` را کامل در SQL Editor اجرا کنید.

بعد از اجرای SQL، این جدول‌ها ساخته می‌شوند:

- `profiles` برای کاربران، نقش و وضعیت تأیید
- `app_projects` برای ذخیره پروژه‌ها
- `usage_events` برای گزارش استفاده
- `equipment_items` برای بانک تجهیزات سروری
- `app_settings` برای ضرایب و تنظیمات مرکزی برنامه

## 2) تنظیم فایل محیطی

از `.env.example` یک فایل `.env` بسازید:

```bash
cp .env.example .env
```

مقادیر زیر را وارد کنید:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
VITE_ADMIN_EMAIL=YOUR_EMAIL@example.com
VITE_REQUIRE_LOGIN=true
```

## 3) ساخت مدیر اصلی

1. برنامه را اجرا کنید.
2. با ایمیل مدیر ثبت‌نام کنید.
3. در Supabase SQL Editor این دستور را اجرا کنید:

```sql
update public.profiles
set role='admin', status='approved', approved_at=now()
where email='YOUR_EMAIL@example.com';
```

## 4) تست ورود واقعی

- اگر `VITE_REQUIRE_LOGIN=true` باشد، کاربر بدون ورود وارد اپ نمی‌شود.
- کاربر تازه ثبت‌نام‌شده در وضعیت `pending` می‌ماند.
- فقط مدیر می‌تواند کاربر را `approved` کند.
- پروژه‌ها بعد از محاسبه در Supabase ذخیره می‌شوند.

## 5) فاز بعدی

بعد از تأیید این فاز، فاز ۲ باید انجام شود:

- اتصال کامل صفحه بانک تجهیزات به جدول `equipment_items`
- ویرایش تجهیزات از پنل مدیریت
- تنظیم ضرایب محاسبات از `app_settings`
- ذخیره PDF و فایل‌های خروجی پروژه
