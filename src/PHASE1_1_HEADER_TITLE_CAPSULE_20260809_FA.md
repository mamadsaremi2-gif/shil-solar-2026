# SHIL - Phase 1.1 Header Title Capsule Fix

تاریخ: ۱۴۰۵/۰۵/۱۸ - 2026-08-09

## دامنه تغییر
فقط Capsule عنوان اصلی وسط Header سراسری اصلاح شد و منطق صفحات، Header actionها، Footer و محتوای صفحات تغییر نکرد.

## تغییرات
- پس زمینه تمام عنوان های اصلی Header به گرادیان سفید یکپارچه تبدیل شد.
- رنگ متن عنوان به `#0f172a` تغییر کرد.
- `-webkit-text-fill-color` نیز صریحا تنظیم شد تا Ruleهای قدیمی متن نتوانند عنوان را ناخوانا کنند.
- Text shadow تیره حذف شد.
- Border و Shadow روشن و مینیمال برای خوانایی روی بک گراند تصویری Header اعمال شد.
- Rule برای تمام فرزندان احتمالی داخل `.shil-header-title` نیز اعمال شد تا span یا wrapper قدیمی استایل را Override نکند.

## قانون نهایی
این Override در انتهای `shil-phase1-core-ui-final.css` قرار دارد و چون همان فایل آخرین import در `main.jsx` است، به تمام صفحات دارای Header مشترک اعمال می شود.
