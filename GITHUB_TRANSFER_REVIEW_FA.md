# گزارش آماده‌سازی برای انتقال به GitHub

## وضعیت کلی
پروژه یک اپ React + Vite + PWA با Supabase است و ساختار کلی آن برای GitHub مناسب است.

## موارد بررسی‌شده
- فایل‌های اصلی پروژه، workflowهای GitHub Actions، Supabase schema و مستندات وجود دارند.
- فایل `.env` واقعی داخل بسته نیست و فقط `.env.example` وجود دارد.
- `node_modules` و `dist` داخل بسته نیستند و در `.gitignore` قرار دارند.
- تست‌های مهندسی با دستور زیر موفق شدند:

```bash
node scripts/run-engineering-tests.mjs
```

خروجی:

```text
Engineering smoke tests passed
Real engineering calculation tests passed
Engineering validation tests passed
All engineering test suites passed
```

## اصلاحات اعمال‌شده در نسخه GitHub-ready
1. در `package-lock.json` لینک‌های registry داخلی به registry عمومی npm تغییر داده شد تا `npm ci` در GitHub Actions/Vercel گیر نکند.
2. در `vite.config.js` مسیر iconهای PWA و `offline.html` با مقدار `base` هماهنگ شد تا روی GitHub Pages، مخصوصا مسیر `/repo-name/`، دچار 404 نشود.
3. آیکون maskable به فایل درست `icon-maskable-512.png` اشاره داده شد.

## نکته مهم
در محیط فعلی نتوانستم `npm ci` و `npm run build` را کامل اجرا کنم، چون نصب dependencyها در این محیط time out شد. اما علت احتمالی مشکل اصلی شناسایی و اصلاح شد: وجود آدرس‌های internal registry در lockfile.

## پیشنهاد قبل از push نهایی
روی سیستم خودتان یا داخل GitHub Actions این دستورها را اجرا کنید:

```bash
npm ci
npm run test:engineering:all
npm run build
```

اگر مقصد GitHub Pages است، workflow آماده است و باید در GitHub این گزینه فعال شود:

```text
Settings -> Pages -> Source: GitHub Actions
```
