# چک‌لیست تست و انتشار SHIL SOLAR

## نصب و اجرا
```bash
npm install
npm run dev
```

## ساخت نسخه Production
```bash
npm run build
npm run preview
```

## چک‌لیست عملکرد
- ثبت‌نام کاربر جدید
- نمایش صفحه انتظار تأیید برای کاربر جدید
- ورود مدیر و باز شدن پنل مدیریت
- تأیید کاربر توسط مدیر
- ساخت پروژه توسط کاربر تأییدشده
- ذخیره پروژه و مشاهده در Supabase > app_projects
- اجرای محاسبه و ذخیره نسخه پروژه
- مشاهده گزارش رویدادها در Supabase > usage_events
- خروجی CSV از داشبورد مدیریت
- تست نصب PWA روی موبایل

## فایل‌های مهم
- `.env.example`: نمونه تنظیمات محیطی
- `supabase/schema.sql`: اسکیما و امنیت دیتابیس
- `ADMIN_SUPABASE_SETUP_FA.md`: راهنمای اتصال Supabase و ساخت مدیر
- `FINAL_RELEASE_CHECKLIST_FA.md`: همین چک‌لیست تست و انتشار
