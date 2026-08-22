SHIL CLEAN CORE PROJECT
=======================
این پوشه نسخه تمیزِ سورس فعال SHIL است و برای ادامه توسعه، Build، Deploy و Android نگهداری شده است.

نگه داشته شده:
- src : سورس فعال اپ
- public : تصاویر، آیکون‌ها و PWA assets
- api : API های Vercel/Backend
- supabase : schema/migrations/functions مورد نیاز
- android + capacitor.config.json : زیرساخت Android/Capacitor
- tools : ابزارهای QA/Build که در package.json استفاده می‌شوند
- tests : تست‌های مهندسی/QA
- .github : workflowهای فعال
- package.json / package-lock.json / vite.config.js / index.html
- vercel.json / netlify.toml
- .env.local فعلی و env exampleها

حذف شده از نسخه تمیز:
- docs و صدها گزارش/README تاریخی سطح ریشه
- پوشه‌های backup/temp/payload/dev-dist/_v41_tmp
- Installer/Patchهای قدیمی
- audit logها، structure dumpها و فایل‌های حجیم گزارش
- CSS/JS backup snapshotها و *.bak داخل src
- node_modules و dist (باید دوباره ساخته شوند)
- .env قدیمی که به پروژه Supabase دیگری اشاره می‌کرد

شروع مجدد:
1) npm install
2) npm run build
3) npm run dev -- --host

Deploy:
- Vercel: همان vercel.json و Environment Variables فعلی پروژه استفاده شوند.
- VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY باید روی Hosting تنظیم باشند.

Android:
- npm run android:sync
- سپس Android Studio یا android:debug طبق نیاز.
