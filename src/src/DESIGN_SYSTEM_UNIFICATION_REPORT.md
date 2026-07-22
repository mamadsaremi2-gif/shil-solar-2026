# گزارش یکپارچه‌سازی طراحی رابط کاربری شیل

## هدف
ایجاد یک منبع واحد برای ظاهر همه صفحات و جلوگیری از بازگشت کارت‌ها، پس‌زمینه‌ها و overrideهای پراکنده.

## موارد اجراشده
- ایجاد `components/ShilDesignSystem.jsx` شامل PageStack، DataSection، DataGrid، StatusMessage و ActionBar.
- ایجاد `appearance/styles/shil-design-system.css` به عنوان آخرین stylesheet پروژه.
- تعریف توکن‌های مشترک رنگ، فاصله، شعاع، عرض محتوا و تایپوگرافی.
- یکسان‌سازی عرض و padding محتوای صفحات در موبایل و دسکتاپ.
- حذف پس‌زمینه، gradient، shadow، blur و pseudo-element از کانتینرهای اصلی صفحات.
- استانداردسازی عنوان صفحه، عنوان بخش، متن راهنما و متادیتا.
- استانداردسازی کارت‌های داده، جدول‌ها، ورودی‌ها، دکمه‌ها و پیام‌های وضعیت.
- حذف position/transform از دکمه اصلی و بازگرداندن آن به جریان طبیعی صفحه.
- انتقال صفحات Summary، RunCalculation و FinalOutput به کامپوننت‌های مشترک طراحی.
- افزودن کلاس ریشه طراحی به ShilPageShell و EngineeringPageShell.

## قوانین نگهداری
- فایل `shil-design-system.css` باید آخرین stylesheet واردشده در `main.jsx` باقی بماند.
- صفحات جدید باید از کامپوننت‌های `ShilDesignSystem.jsx` استفاده کنند.
- از ایجاد Card/Panel/Glass جدید برای چیدمان صرف خودداری شود.
- داده واقعی در DataGrid یا جدول و عملیات در ActionBar قرار گیرد.
