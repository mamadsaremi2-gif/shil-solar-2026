# بازسازی ورود ترکیبی SHIL

## هدف
صفحه ورود به صورت Hybrid بازسازی شد تا ابتدا Credential محلی ادمین بررسی شود و در صورت عدم تطبیق، مسیر معمول Supabase برای کاربران و ادمین‌های Cloud ادامه پیدا کند.

## رفتار جدید
1. کاربر Login و Password را وارد می‌کند.
2. تابع `isAdminCredential` در `src/auth/session.js` ابتدا بررسی می‌شود.
3. در صورت تطبیق، Session با `role=admin` و `authType=local-admin` ساخته و کاربر به `/admin` هدایت می‌شود.
4. درگاه ادمین همچنان PIN لایه دوم را با `AdminGate` بررسی می‌کند.
5. اگر Credential محلی تطبیق نداشت، Login باید ایمیل باشد و احراز هویت Supabase اجرا می‌شود.
6. نقش Cloud Admin همچنان فقط در صورت `profile.role === admin` و `profile.status === approved` فعال می‌شود.

## Credentialهای پیش‌فرض محلی موجود در پروژه
- `admin` / `shil-admin`
- `admin@shil.app` / `shil-admin`
- `shil.admin` / `shil-admin`

این مقادیر از پنل ادمین در تب امنیت قابل تغییر هستند و در LocalStorage با کلید `shil:admin:login-credentials` ذخیره می‌شوند.

## PIN لایه دوم
PIN پیش‌فرض همچنان `1366` است و از `src/admin/adminStore.js` کنترل می‌شود.

## نکته امنیتی
این مسیر برای حالت Local/PWA و دسترسی آفلاین ادمین طراحی شده است. برای نسخه عمومی Production، احراز هویت Server-side و Supabase Auth/RLS همچنان توصیه می‌شود.
