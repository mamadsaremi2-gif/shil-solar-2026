# گزارش بازسازی فاز ۴ ادمین SHIL

این نسخه مستقیماً روی فاز ۳ بازسازی‌شده Equipment Engineering CMS اعمال شده است.

## بررسی فاز ۳ پیش از ادغام
- Equipment CMS، اعتبارسنجی تجهیز، Revision و History حفظ شد.
- فاز ۱ Command Center و فاز ۲ Engineering Review حفظ شدند.
- برخلاف نسخه قدیمی فاز ۴، UI و منطق ساده بانک تجهیزات جایگزین CMS فاز ۳ نشده است.

## افزوده‌های فاز ۴
- Rule Engine نسخه‌پذیر برای Solar، Battery، Emergency، Protection و Cable.
- Standards Center با استانداردهای پایه IEC و کنترل تکراری بودن کد استاندارد.
- Release Center با Draft، Validation، Snapshot، Publish و History.
- Release Validation اکنون علاوه بر سلامت سیستم، اعتبارسنجی کامل Equipment CMS فاز ۳ را نیز بررسی می‌کند.
- هر Release شماره Rule، مهر نسخه بانک تجهیزات، استانداردهای فعال، منتشرکننده و زمان انتشار را ثبت می‌کند.
- Export / Import / Reset و Snapshot شامل Rules، Standards و Releases شده‌اند.
- Runtime Config برای اتصال بعدی موتورهای محاسباتی به Release فعال فراهم شده است.

## نکته معماری
فاز ۴ در این نسخه تنظیمات Rule را مدیریت و Release می‌کند، اما عمداً موتورهای محاسبات موجود را به‌صورت ناگهانی به Ruleهای ادمین Bind نکرده است. اتصال Runtime باید در فاز اتصال Engine با تست Regression انجام شود.
