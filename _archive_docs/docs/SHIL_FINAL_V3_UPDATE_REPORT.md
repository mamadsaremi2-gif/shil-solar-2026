# SHIL Final V3 Update Report

## تغییرات اعمال‌شده

- اتصال مسیرهای نهایی تصاویر به کد React/Vite و CSS.
- اصلاح مسیر Assetها به ساختار پایدار `public/assets/shil/...`.
- اضافه شدن استایل واحد `SHIL Neo Industrial UI` برای هدر، فوتر، بلوک‌ها، فیلدها و آیکون‌ها.
- ثابت‌سازی Footer در همه صفحات و جداسازی Scroll Container از Layout اصلی.
- اعمال قانون فاصله یکسان از کناره موبایل برای تمام بلوک‌ها، حتی بلوک‌های دارای اسکرول افقی.
- فعال شدن Scrollbar افقی قابل‌مشاهده برای بلوک‌های دیتاسنگین.
- اضافه شدن Project Workflow Guard: صفحات بعدی قبل از تأیید مرحله قبل فقط حالت مشاهده دارند.
- اضافه شدن StepConfirmLink با اعتبارسنجی فیلدهای ضروری، هشدار فارسی و محوشدن خودکار.
- انتقال بانک هوشمند شهر/استان به صفحه شرایط محیطی با پیشنهاد هنگام تایپ.
- اضافه شدن دیتای اولیه شهرهای ایران برای کارکرد آنلاین/آفلاین شرایط محیطی.
- اضافه شدن دیتابیس اولیه تجهیزات مصرفی.
- حفظ و توسعه کاتالوگ‌های پنل خورشیدی، باتری و اینورتر.
- تبدیل سناریوهای آماده به ساختار Data-Driven با ۱۰۰ سناریو در هر دسته.
- اضافه شدن آیکون‌های SVG نئونی هماهنگ با زبان بصری جدید، قابل جایگزینی با PNG نهایی.

## مسیرهای Asset نهایی

```txt
public/assets/shil/background/login/shil-login-bg.webp
public/assets/shil/background/main/shil-main-bg.webp
public/assets/shil/logo/welcome/shil-welcome-logo.webp
public/assets/shil/map/iran-heatmap.webp
public/assets/shil/contact/shil-products-banner.webp
public/assets/shil/icon/dashboard/*.svg
public/assets/shil/icon/project/*.svg
```

## نکته اجرایی

بعد از جایگزینی فایل‌های تصویری نهایی، فقط کافی است فایل‌ها با همین نام و مسیر حفظ شوند. نیازی به تغییر کد نیست.
