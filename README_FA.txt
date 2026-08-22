SHIL ADMIN SUMMARY PARITY V22
============================

هدف:
یکسان‌سازی تمام زیرشاخه‌ها و فرزندان کارتابل مدیریت با زبان بصری صفحه «چکیده» صفحات مهندسی.

اصلاحات سراسری در تمام صفحات فرزند ادمین:
- حذف والدهای خاکستری و سطوح بزرگ بی‌استفاده
- حذف shadow و borderهای چندلایه
- والدها کاملاً transparent
- کارت واقعی تک‌لایه سفید/آبی بسیار روشن مثل SummaryPage
- border نازک و بدون glow
- دو ستونه شدن KPI، Readiness، Quick Action و داده‌های کم‌حجم
- آکاردئون‌های AdminPanel: بسته دو ستونه، باز تمام‌عرض
- فرم‌ها دو ستونه و فشرده
- متن کوچک، RTL و فارسی-safe
- حذف توضیحات/گپ بصری اضافی
- Back فقط دکمه کوچک در انتهای داده‌ها و بدون والد
- Logout در صفحات فرزند مخفی؛ Hub اصلی دست‌نخورده
- Overview / Review / Users / Projects / Feedback / Equipment / Rules / Analytics / Diagnostics / Security / Cloud تحت یک استاندارد واحد

این Patch منطق Supabase، موتور محاسبات، بانک تجهیزات و Authentication را تغییر نمی‌دهد.

نصب:
1) پوشه Patch را داخل یا کنار ریشه پروژه Extract کنید.
2) PowerShell را در ریشه پروژه باز کنید.
3) اجرا:
   powershell -ExecutionPolicy Bypass -File "<PATCH_PATH>\INSTALL.ps1"
4) سپس:
   npm run build
   npm run dev -- --host

Installer قبل از تغییر AdminDashboard.jsx بکاپ می‌گیرد.
