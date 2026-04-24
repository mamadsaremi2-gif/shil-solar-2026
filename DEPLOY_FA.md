# راهنمای سریع انتشار Solar Design Suite

## 1) آماده‌سازی GitHub

در پوشه پروژه:

```bash
git init
git add .
git commit -m "Initial SHIL Solar Design Suite release"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## 2) انتشار روی Vercel

1. وارد Vercel شوید.
2. New Project را بزنید.
3. ریپوی GitHub را انتخاب کنید.
4. تنظیمات:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Deploy را بزنید.

## 3) انتشار روی GitHub Pages

1. پروژه را روی GitHub push کنید.
2. وارد Settings -> Pages شوید.
3. Source را روی GitHub Actions بگذارید.
4. workflow `Deploy to GitHub Pages` اجرا می‌شود.

## 4) اجرای موبایل به عنوان PWA

بعد از باز شدن سایت روی گوشی:

- Chrome Android: منو -> Add to Home Screen
- iPhone Safari: Share -> Add to Home Screen

## 5) چک‌لیست قبل از انتشار

- PDF یک‌صفحه‌ای را تست کنید.
- حالت سانورتر و باطری را برای چند ظرفیت مختلف تست کنید.
- ارتباط با ما و QRها را در موبایل بررسی کنید.
- مسیرهای Off-Grid / Hybrid / Grid-Tie را حداقل یک بار محاسبه کنید.
