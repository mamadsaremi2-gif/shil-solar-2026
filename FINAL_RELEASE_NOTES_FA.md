# SHIL SOLAR MOBILE V5 FINAL UI

این نسخه برای انتقال به GitHub و نصب/اجرا آماده شده است.

## اجرای محلی

```bash
npm install
npm run dev
```

## ساخت نسخه Production

```bash
npm run build
```

خروجی آماده Deploy در پوشه زیر ساخته می‌شود:

```txt
dist/
```

## فایل‌های تصویری که باید جایگزین شوند

### داشبورد اصلی
```txt
/public/images/dashboard/dashboard-hero-bg-mobile.webp
/public/images/branding/dashboard-center-logo.webp
```

### لوگوی ثابت هدر همه صفحات
```txt
/public/images/branding/header-center-logo.webp
```

### صفحه انتخاب مسیر پروژه
```txt
/public/images/routes/solar-project-route-card.webp
/public/images/routes/backup-power-route-card.webp
```

### صفحه ارتباط با ما
```txt
/public/images/contact/contact-brand-equipment.webp
```

## موارد اعمال‌شده

- هدر یکپارچه کل اپ با لوگوی وسط، عنوان سمت راست و دکمه بازگشت/داشبورد سمت چپ
- فوتر ثابت پایین با ساختار یکپارچه
- داشبورد Hero fullscreen با جایگاه عکس و لوگو
- صفحه «پروژه جدید» با Grid سه در سه، ۸ آیکون فعال و خانه نهم توسعه آینده
- ساختار Workspace محاسباتی با Stepper افقی ثابت، Workspace اسکرول‌پذیر و Footer سه‌دکمه‌ای ثابت
- صفحه شرایط محیطی با نقشه ایران در بالای محتوا و اسکرول‌های کنترل‌شده
- صفحه انتخاب مسیر پروژه با دو کارت بزرگ تصویری
- صفحه پروژه‌ها و دو زیرصفحه آن با تم و هدر/فوتر یکپارچه
- صفحه ارتباط با ما با جایگاه عکس برند، لینک سایت، اطلاعات ارتباطی و QR Code ها
- کنتراست خوانایی متن‌ها، فیلدها، جدول‌ها و اعداد تقویت شد
- بلوک‌ها یک پرده تیره‌تر از بکگراند تعریف شدند

## انتقال به GitHub

```bash
git init
git add .
git commit -m "SHIL Mobile V5 final UI"
git branch -M main
git remote add origin YOUR_REPO_URL
git push -u origin main
```
