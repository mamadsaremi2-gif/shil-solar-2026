# SHIL Final Update Report

## مبنا
این نسخه بر پایه فایل اصلی کاربر و نسخه قبلی آپدیت‌شده ساخته شده است. هسته اصلی، `package.json`، `package-lock.json`، دیتای اپ، موتورهای محاسباتی و ساختار اصلی پروژه حفظ شده‌اند.

## تغییرات متصل به هسته اپ
- Routeهای فعال پروژه روی مسیر واحد `src/pages/project/*` متمرکز شدند.
- صفحات تکراری سطح `src/pages` که نسخه قدیمی همین مراحل بودند حذف شدند تا دوباره‌کاری و باگ مسیریابی ایجاد نشود.
- مسیرهای Solar و Emergency به جریان اصلی پروژه جدید متصل شدند.
- مسیر برق اضطراری در UI از عنوان Emergency Core استفاده نمی‌کند، اما در لایه محاسبات با منطق اختصاصی برق اضطراری/Emergency-core طراحی شده است.
- صفحه خروجی نهایی به `runEngineeringDesign` متصل شده است تا در Runtime به هسته اصلی محاسبات وصل بماند.

## مسیرهای اصلی جدید
- `/new-project/info`
- `/new-project/environment`
- `/new-project/path`
- `/new-project/solar/select`
- `/new-project/solar/offgrid`
- `/new-project/solar/hybrid`
- `/new-project/solar/ongrid`
- `/new-project/emergency`
- `/new-project/input/:domain/:method`
- `/new-project/system/:domain`
- `/new-project/summary/:domain`
- `/new-project/run/:domain`

## حذف‌های کم‌ریسک برای جلوگیری از تکرار
- `src/pages/ProjectInfo.jsx`
- `src/pages/Environment.jsx`
- `src/pages/ProjectPath.jsx`
- `src/pages/CalculationMethod.jsx`
- `src/pages/CalculationInputs.jsx`
- `src/pages/SystemSettings.jsx`
- `src/pages/Summary.jsx`
- `dist/` خروجی build قدیمی
- `temp_dashboard_imports.txt`

## مواردی که حذف نشدند
- `package.json`
- `package-lock.json`
- `src/data/*`
- `src/calculation/*`
- `src/engines/*`
- `src/core/*`
- `public/*`
- فایل‌ها و دیتاهای اصلی اپ

## قوانین UI اعمال‌شده
- Header و Footer ثابت
- نوار ۹ آیکون پروژه جدید به صورت اسکرول افقی مستقل در صفحات دیتاسنگین
- اسکرول عمودی مجاز در صفحات دیتاسنگین
- اسکرول افقی فقط داخل بلوک‌های مشخص
- Scrollbar افقی با رنگ مخالف برای رفاه کاربر
- مخفی شدن هوشمند دیتا زیر Header/Footer هنگام اسکرول
- آیکون‌ها با fallback داخلی در صورت نبود فایل تصویر
