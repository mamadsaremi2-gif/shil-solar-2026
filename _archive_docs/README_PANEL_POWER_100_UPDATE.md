# SHIL - Panel Power 100% Engineering Update

این آپدیت بخش «توان پنل خورشیدی» را از یک ورودی ساده به یک ماژول کامل مهندسی تبدیل می‌کند.

## محدوده پیاده‌سازی

- محاسبه توان هر پنل، تعداد پنل، توان پیک DC آرایه و تولید روزانه
- محاسبه درصد پوشش مصرف روزانه و تعداد پنل لازم برای پوشش 100% و 120%
- کنترل آرایش سری/موازی پنل‌ها
- کنترل Vmp گرم، Voc سرد، جریان رشته و جریان آرایه
- کنترل سازگاری با بازه MPPT و سقف DC اینورتر
- کنترل نسبت توان آرایه به سقف ورودی PV اینورتر
- محاسبه مساحت آرایه، فضای سرویس و چگالی توان پنل
- تولید امتیاز مهندسی از 100 و وضعیت OK / Warning / Error
- اتصال به Diagnostic Engine حرفه‌ای، صفحه پیکربندی، چکیده و خروجی محاسبات

## فایل‌های اصلی تغییر کرده

- `src/core/calculation/solarPanelPowerEngine.js`
- `src/core/calculation/solarAutoDesignEngine.js`
- `src/core/calculation/solarDiagnosticEngine.js`
- `src/pages/project/SystemSettings.jsx`
- `src/pages/project/SummaryPage.jsx`
- `src/pages/project/RunCalculation.jsx`

## سیاست محصول

هیچ منطق قیمت، خرید، فروش، پیشنهاد برند تجاری یا بازار در این آپدیت اضافه نشده است. تمام خروجی‌ها صرفاً مهندسی هستند.
