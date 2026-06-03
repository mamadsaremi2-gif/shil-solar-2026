# SHIL Mobile Bar + Rail Update Report

## انجام‌شده

- Header و Footer مینیمال‌تر شدند و به حالت شیشه‌ای شفاف با blur و saturate تغییر کردند.
- ارتفاع Header و Footer کاهش داده شد تا فضای مفید موبایل بیشتر شود.
- اسکرول افقی مراحل/مسیر پروژه با `position: fixed` دقیقاً مماس به زیر Header چسبانده شد.
- فاصله اضافه بین Header و Rail حذف شد و Rail دیگر زیر Header نمی‌رود.
- برای صفحات پروژه، padding بالای محتوای اصلی با ارتفاع Header + Rail هماهنگ شد تا محتوای صفحه هنگام اسکرول زیر Rail حرکت کند.
- آیکون مرحله/صفحه فعال در Rail با کلاس‌های active و `is-active-step` بولد، بزرگ‌تر، پررنگ‌تر و دارای ring مشخص شد.
- padding پایین محتوای اصلی و آخرین آیتم‌ها تنظیم شد تا آخرین دیتای صفحه چند میلی‌متر بالاتر از بالاترین نقطه Footer بایستد و هم‌پوشانی اتفاق نیفتد.

## فایل مرجع تغییرات

`src/appearance/styles/shil-mobile-design-system.css`

## بخش اضافه‌شده

`SHIL MOBILE BAR + STEP RAIL FINAL TUNING - 2026-06-04`

## نکته اجرایی

از این به بعد برای تغییرات Header، Footer، Step Rail، active state آیکون‌ها، فاصله بالای محتوا و فاصله ایمن پایین صفحه فقط همین بخش در فایل مرکزی تغییر کند.
