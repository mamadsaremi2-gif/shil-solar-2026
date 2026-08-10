# گزارش SHIL Admin V12 — Engineering Design System

## هدف
کل زیرساخت ظاهری ادمین بر اساس زبان بصری صفحه «چکیده طراحی مهندسی» یکپارچه شد؛ نه به صورت اصلاح جداگانه هر صفحه، بلکه با یک لایه Design System نهایی و ایزوله برای `.shil-page--admin`.

## قراردادهای اصلی
- فاصله از دیواره موبایل: 3px
- Gap پایه: 5px
- Padding بلوک: 5 تا 6px
- سطح عنوان: `#EAF4FF`
- سطح کارت: `#FFFFFF / #F9FCFF`
- Border: `#C8DCEB`
- Border قوی کنترل‌ها: `#BFD5E5`
- Radius سکشن: 14px
- Radius کارت: 13px
- حداقل ارتفاع کارت داده در موبایل: 62px
- حداقل ارتفاع Header/Title: 40px
- Grid اصلی: دو ستون مساوی

## تغییرات زیرساختی
- حذف Glass، Gradient، Purple Surface و Gray Slab از Parentهای ادمین.
- حذف لایه‌های بصری اضافی از Command Center، Diagnostics، CMS، Rule Engine، Analytics، Review Center و سایر زیرشاخه‌ها.
- یکسان‌سازی Hero، Module Hub، Section Navigation، Accordion/Panel، KPI Card، فرم‌ها، دکمه‌ها، Search، Diagnostics و Nested Cardها.
- حالت Active تب‌ها دیگر بنفش نیست و فقط از White/Engineering Border استفاده می‌کند.
- همه کارت‌های داده به Grid دو ستونه و Rhythm مشابه Summary نزدیک شده‌اند.
- Typography، Radius، Border، Gap و Padding به Tokenهای مرکزی منتقل شدند.
- تمام تغییرات فقط در محدوده `.shil-page--admin` اعمال می‌شوند و صفحات مهندسی کاربر دست‌نخورده‌اند.

## فایل نهایی
`src/appearance/styles/shil-admin-engineering-design-system-v12-final.css`

این فایل به عنوان آخرین import در `src/main.jsx` قرار گرفته تا بر تمام CSSهای قدیمی ادمین تقدم داشته باشد.
