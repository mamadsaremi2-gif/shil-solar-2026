# RELEASE PHASE V4 - Professional Report & Management Layer

## تغییرات اصلی

- اضافه شدن Financial Engine برای برآورد اولیه هزینه، تولید سالانه، صرفه‌جویی و بازگشت ساده سرمایه.
- اضافه شدن Professional Report Snapshot به عنوان لایه واحد گزارش‌دهی؛ گزارش نهایی فقط از Unified Engineering State می‌خواند.
- اضافه شدن Project Report Code، نسخه گزارش و لیست Sectionهای گزارش در خروجی نهایی.
- اضافه شدن Management Cartable محلی برای رخدادهای حیاتی مهندسی و خطا/هشدارهای قابل ارجاع به مدیریت.
- اضافه شدن نمایش کارتابل مهندسی در پنل مدیریت.
- اضافه شدن بخش برآورد مالی و رخدادهای مدیریتی در گزارش نهایی.

## اصل معماری

No Duplicate Calculation: گزارش، PDF، چکیده و کارتابل مدیریت هیچ محاسبه مستقل جدیدی انجام نمی‌دهند و فقط Snapshot خروجی موتور واحد را نمایش می‌دهند.

## تست

- npm run build
- npm run test:engineering:all
