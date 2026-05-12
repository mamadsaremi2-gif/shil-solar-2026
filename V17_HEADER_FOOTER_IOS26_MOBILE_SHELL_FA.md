# گزارش نسخه V17 - Header/Footer Consolidation + iOS26 Mobile Shell

## هدف نسخه
این نسخه برای حل مشکل چندلایه شدن Headerها و ناهماهنگی UI ساخته شد. منطق اپ، موتور محاسبات، مسیرها، State و Repositoryها حفظ شده‌اند؛ فقط پوسته موبایل و هدر/فوتر صفحات داخلی بازسازی شده‌اند.

## تغییرات اصلی

### 1. حذف اثر هدرهای اضافه در صفحات داخلی
در نسخه‌های قبلی چند هدر همزمان وجود داشتند:
- mobile-fixed-header
- unified-shil-header
- workspace-fixed-header
- scenario-flow-header
- topbar
- topbar--report
- v15-flow-header

در V17 همه این هدرهای Legacy داخل صفحات داخلی مخفی شدند و فقط Header مرکزی V17 نمایش داده می‌شود.

### 2. Header مرکزی ثابت
فایل اصلی:
- src/layout/AppHeader.jsx

ویژگی‌ها:
- ثابت در بالای صفحات داخلی
- لوگو دقیقاً وسط کادر Header
- کپسول عنوان صفحه با رنگ بنفش نیونی
- متن سفید داخل کپسول
- کاهش خودکار اندازه متن برای عنوان‌های طولانی
- دکمه Home در سمت مقابل برای بازگشت مستقیم به داشبورد
- Safe Area برای موبایل‌های آیفون

### 3. Footer مرکزی ثابت
فایل اصلی:
- src/layout/AppFooter.jsx

ویژگی‌ها:
- ثابت پایین صفحه
- هماهنگ با Safe Area موبایل
- در صفحات معمولی دکمه داشبورد دارد
- در Workspace دکمه‌های مرحله قبل، ذخیره و مرحله بعد دارد

### 4. Mobile Shell جدید
فایل اصلی:
- src/styles/v17-ios26-mobile-shell.css

ویژگی‌ها:
- عرض موبایلی کنترل‌شده با max-width: 480px
- جلوگیری از بیرون‌زدگی از چپ/راست
- ارتفاع بر اساس 100dvh
- اسکرول عمودی مرکزی برای تمام صفحات داخلی
- مخفی شدن محتوا زیر Header و Footer هنگام اسکرول
- اسکرول افقی فقط برای بلوک‌ها، جدول‌ها، Stepperها، Tabs و Chartها

### 5. حفظ داشبورد به‌عنوان صفحه مستقل
صفحه داشبورد عمداً داخل Shell داخلی قرار نگرفته است تا بعداً به‌صورت اختصاصی بازطراحی شود.

### 6. تم iOS26-inspired
ظاهر کلی صفحات داخلی به سمت:
- سطح روشن
- کنتراست تمیز
- Blur کنترل‌شده
- Capsuleهای نرم
- کارت‌های سبک
- دکمه‌های لمسی
- رفتار موبایل‌محور

حرکت کرده است. این طراحی الهام‌گرفته از سبک iOS 26 است، نه کپی مستقیم.

## مسیرهای مهم فایل‌ها

### Header
src/layout/AppHeader.jsx

### Footer
src/layout/AppFooter.jsx

### CSS اصلی نسخه V17
src/styles/v17-ios26-mobile-shell.css

### Entry استایل‌ها
src/styles/modular-appearance.css

## محل قرارگیری تصاویر پیشنهادی

### لوگوی وسط Header
مسیر فعلی تعریف‌شده:
public/images/branding/header-center-logo.webp

### تصویر فول‌اسکرین داشبورد موبایل
public/images/branding/dashboard-bg-mobile.jpg
یا
public/images/dashboard/dashboard-hero-bg-mobile.webp

### کارت مسیر پروژه خورشیدی
public/images/routes/solar-project-route-card.webp

### کارت مسیر برق اضطراری
public/images/routes/backup-power-route-card.webp

### نقشه شرایط محیطی ایران
public/images/branding/environment-map.jpg

## تست‌ها
- npm run build: موفق
- npm run test:engineering:all: موفق

## باقی‌مانده برای نسخه بعد

### V18 Dashboard Redesign
داشبورد هنوز مستقل است و باید جداگانه طراحی شود، چون صفحه اصلی اپ است و کاربران اول آن را می‌بینند.

### V18 Visual QA
نیاز است روی موبایل واقعی بررسی شود:
- فاصله Header/Footer
- رفتار عنوان‌های خیلی طولانی
- عملکرد دکمه‌های Footer در Workspace
- جدول‌های سنگین
- نمودارها
- صفحات PDF/Report

### V18 Component Cleanup
بعد از تأیید ظاهر V17، می‌توان CSSهای قدیمی Header را از سورس حذف فیزیکی کرد. در V17 فعلاً به‌صورت امن فقط مخفی/خنثی شده‌اند تا ساختار اپ نشکند.
