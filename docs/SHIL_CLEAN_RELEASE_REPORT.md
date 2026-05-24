# SHIL Clean Test Release

## مبنای بسته
این بسته از آخرین نسخه موجود `SHIL_PROJECT_PATH_PNG_UPDATE` ساخته شده و برای تست لوکال پاکسازی شده است.

## موارد پاکسازی‌شده
- حذف فایل‌های backup صفحات با پسوند `before-ui-fix`.
- حذف پوشه آیکون‌های قدیمی و بدون ارجاع `src/assets/icons/shil-modern`.
- حذف دیتابانک تکراری و بدون ارجاع `src/data/equipmentBanks/shilSolarEquipmentBanks.js`.
- حذف آیکون ریشه‌ای تکراری `public/assets/shil/icon/future.png`؛ نسخه‌های اصلی dashboard/project حفظ شدند.
- حذف فایل preview استاتیک و غیرضروری `public/assets-preview.html`.
- حذف گزارش‌های موقت dependency usage.

## مواردی که عمداً حفظ شده‌اند
- تمام فایل‌های `src` موثر در UI، مسیر پروژه، شرایط محیطی، موتور محاسبات و بانک‌ها.
- مسیرهای اصلی آیکون‌های داشبورد و پروژه:
  - `public/assets/shil/icon/dashboard/`
  - `public/assets/shil/icon/project/`
- مسیر PNG قابل جایگزینی کارت‌های اجرای پروژه:
  - `public/assets/shil/execution/solar-execution.png`
  - `public/assets/shil/execution/emergency-inverter-battery.png`
  - `public/assets/shil/execution/utility-execution.png`
- فایل‌های PWA، Capacitor، Android، Supabase، API و تنظیمات Deploy.

## تست سریع
```bash
npm install
npm run dev
npm run build
```
