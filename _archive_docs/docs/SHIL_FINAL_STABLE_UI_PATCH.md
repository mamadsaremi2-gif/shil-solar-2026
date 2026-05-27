# SHIL Final Stable UI Patch

این نسخه بر اساس آخرین پکیج نهایی معماری ساخته شده و اصلاحات دستی خراب‌کننده‌ی صفحات Dashboard / New Project / Welcome را وارد نکرده است.

## اصلاحات اصلی

- حفظ معماری اصلی صفحات و کامپوننت‌ها
- حفظ Assetهای اصلی داشبورد و پروژه جدید از مسیرهای درست:
  - `/assets/shil/icon/dashboard/`
  - `/assets/shil/icon/project/`
- اضافه شدن فایل CSS نهایی:
  - `src/styles/shil-final-stable-ui.css`
- ایمپورت فایل CSS نهایی در انتهای `src/main.jsx`
- مستقل ماندن بکگراند Login از Main/Dashboard
- کنترل Grid آیکون‌ها برای موبایل و دسکتاپ
- کنترل صفحه Welcome و جلوگیری از بزرگ‌شدن بیش‌ازحد تصویر
- غیرفعال شدن ثبت Service Worker در حالت Development برای جلوگیری از کش قدیمی و صفحه سیاه/مشکی هنگام تست لوکال

## روش تست

```powershell
npm install --legacy-peer-deps
npm run dev
```

سپس تست کنید:

```text
/login
/welcome
/dashboard
/new-project
```

اگر پورت 5173 اشغال بود، Vite پورت 5174 یا بالاتر می‌دهد. همان پورتی که در ترمینال نمایش داده می‌شود را باز کنید.

## قبل از GitHub

```powershell
npm run build
```

اگر Build موفق بود:

```powershell
git add .
git commit -m "SHIL final stable UI patch"
git push
```
