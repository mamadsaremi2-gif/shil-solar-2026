# SHIL SOLAR Phase Engineering v3

این نسخه توسعه‌های جدید مهندسی را به نسخه Phase Engineering اضافه می‌کند:

## Site Survey
- ثبت GPS واقعی از مرورگر
- ورود دستی Latitude/Longitude
- ثبت Azimuth و Tilt
- آپلود عکس محل نصب
- آپلود اسکرین‌شات قطب‌نما

## Shadow Analysis
- ثبت ارتفاع مانع
- ثبت فاصله مانع تا پنل
- ثبت جهت مانع و ساعات بحرانی
- محاسبه زاویه افق مانع و تلفات سایه تخمینی
- انتقال وضعیت سایه به Unified Engineering State و گزارش نهایی

## Climate Intelligence
- لایه Climate Intelligence با کش آفلاین ایران
- آماده اتصال به NASA POWER و Solcast
- محاسبه PSH اصلاح‌شده و بدترین ماه تولید
- امکان انتخاب حالت فقط گزارش یا اعمال مستقیم اصلاح اقلیمی در موتور

## IEC Cable and Protection
- استفاده از Cable Engine موجود با Derating، افت ولتاژ و انتخاب سایز
- نمایش خروجی کابل و حفاظت در گزارش نهایی
- ثبت اطلاعات کابل DC/Battery/AC، افت ولتاژ و Derating در PDF/PNG

## Final Report Sync
- گزارش نهایی همچنان فقط از Unified Engineering State تغذیه می‌شود
- Site/Shadow/Climate، کابل IEC و معماری صنعتی وارد خروجی نهایی شدند

## Tests
- npm run test:engineering:all ✅
- npm run build ✅
