# ساختار ماژولار جدید SHIL

این نسخه برای مدیریت ساده تغییرات ظاهری، محاسباتی، تصاویر، خروجی‌ها و تنظیمات مدیریتی تفکیک شده است.

## فایل‌های مرکزی جدید

| بخش | فایل |
|---|---|
| تم اصلی برنامه | `src/config/theme.config.js` |
| رنگ‌ها، فاصله‌ها، Radius و Motion | `src/config/designTokens.js` |
| نقشه کل معماری ماژولار | `src/config/modularArchitecture.js` |
| هدر، فوتر و قوانین Layout | `src/layout/layout.config.js` |
| کامپوننت هدر مشترک | `src/layout/AppHeader.jsx` |
| کامپوننت فوتر مشترک | `src/layout/AppFooter.jsx` |
| CSS مشترک هدر/فوتر/Shell | `src/layout/layout-system.css` |
| قوانین آیکون‌ها | `src/ui/icons.config.js` |
| قوانین کارت، دکمه و فیلد | `src/ui/ui.config.js` |
| CSS مشترک UI | `src/ui/ui-system.css` |
| تصاویر و مسیر Assetها | `src/assets/assets.config.js` |
| ورودی یکپارچه موتور محاسبات | `src/engine/solarEngine.index.js` |
| تنظیمات خروجی PDF و عکس | `src/reports/report.config.js` |
| CSS خروجی گزارش | `src/reports/report-output.css` |
| تنظیمات ادمین | `src/admin/admin.config.js` |
| CSS پنل ادمین | `src/admin/admin-system.css` |
| ورودی واحد تمام CSSها | `src/styles/modular-appearance.css` |

## نکته مهم

در این نسخه منطق اصلی اپ تغییر نکرده است. فایل‌های جدید مثل لایه کنترل مرکزی عمل می‌کنند تا تغییرات آینده از مسیرهای مشخص و قابل نگهداری انجام شود.

برای تغییر ظاهر کلی، ابتدا از این فایل‌ها شروع کنید:

1. `src/config/theme.config.js`
2. `src/config/designTokens.js`
3. `src/layout/layout.config.js`
4. `src/ui/icons.config.js`
5. `src/styles/modular-appearance.css`

برای تغییر موتور محاسبات:

- ورودی مرکزی: `src/engine/solarEngine.index.js`
- پیاده‌سازی اصلی: `src/domain/engine/`

برای تغییر تصاویر:

- فایل کنترل مسیرها: `src/assets/assets.config.js`
- فایل‌های واقعی: `public/images/`
