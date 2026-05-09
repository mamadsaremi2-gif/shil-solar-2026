# اصلاح مشکل دکمه خروج

## مشکل
در حالت محلی یا زمانی که Supabase تنظیم نشده بود، بعد از اجرای `signOut` مقدار `session` خالی می‌شد، اما مقدار `user` در `AuthProvider` دوباره به کاربر پیش‌فرض محلی برمی‌گشت:

```js
user: session?.user || (isSupabaseConfigured ? null : { id: DEV_PROFILE.id, email: DEV_PROFILE.email })
```

به همین دلیل اپ همچنان کاربر را لاگین‌شده تشخیص می‌داد و صفحه داشبورد باقی می‌ماند.

## اصلاح انجام‌شده
منطق خروج در `src/features/auth/AuthProvider.jsx` اصلاح شد:

- بعد از خروج، `user` دیگر به‌صورت خودکار به کاربر محلی پیش‌فرض برنمی‌گردد.
- پاک‌سازی localStorage کامل‌تر شد.
- `signOut` داخل `try/catch/finally` قرار گرفت تا حتی اگر Supabase خطا داد، خروج محلی انجام شود.
- `loading` بعد از خروج false می‌شود.

## فایل اصلاح‌شده

```txt
src/features/auth/AuthProvider.jsx
```

## تست

```txt
npm run build
```

Build موفق بود. فقط همان هشدارهای قبلی مربوط به مسیر دو تصویر و chunk بزرگ باقی مانده‌اند و خطای کامپایل وجود ندارد.
