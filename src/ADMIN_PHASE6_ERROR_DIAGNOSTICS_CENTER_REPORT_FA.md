# گزارش فاز ۶ درگاه ادمین SHIL — Error & Diagnostics Center

این نسخه مستقیماً روی فاز ۵ تحلیل و پایش اعمال شده و قابلیت‌های فازهای ۱ تا ۵ را حفظ می‌کند.

## بررسی فاز ۵ قبل از توسعه
- تب تحلیل و پایش، KPIها، Alert Center، Data Quality، Review Metrics و گزارش‌های مدیریتی حفظ شدند.
- Equipment CMS فاز ۳، Rule/Standards/Release فاز ۴ و Engineering Review فاز ۲ دست‌نخورده باقی ماندند.
- اصل «عدم تولید داده ساختگی» حفظ شد.

## امکانات جدید فاز ۶
- تب مستقل «خطا و Diagnostics» در پنل ادمین.
- ذخیره رخدادهای واقعی Runtime از window.error.
- ذخیره Unhandled Promise Rejection.
- ثبت خطاهای React Error Boundary همراه Component Stack.
- ثبت شکست‌های Cloud Mirror Sync.
- نگهداری حداکثر ۲۴۰ رخداد آخر برای کنترل حجم LocalStorage.
- KPI رخداد باز، Error/Critical، Warning، Runtime/UI، Cloud Sync و حل‌شده.
- جستجو بر اساس پیام، Source، Route، Project ID و User ID.
- فیلتر وضعیت باز/حل‌شده/همه و نوع رخداد.
- کارت آکاردئونی فشرده با Stack، Context، Device/Browser و Meta.
- Workflow ساده Incident: باز → یادداشت رفع → حل‌شده → بازگشایی.
- Export کامل Diagnostics به JSON همراه Active Release و Admin Version.
- پاک‌سازی رخدادهای حل‌شده یا کل رخدادها با ثبت Audit.
- ثبت عملیات Resolve/Reopen/Clear/Export در Audit Log.

## Instrumentation
فاز ۶ به Global Error Handler اصلی متصل شده و ثبت آن در main.jsx فعال شده است. همچنین GlobalErrorBoundary و شکست Sync پس‌زمینه Supabase به Diagnostic Store متصل شده‌اند.

## محدودیت شفاف
این نسخه APM ابری، Crash Rate چندکاربره، IP، Latency سرور یا Alerting مرکزی ساختگی تولید نمی‌کند. این موارد نیازمند Backend Telemetry و معماری امنیت/Production هستند.

## نسخه
ADMIN_SYSTEM_VERSION = SHIL_ADMIN_SYSTEM_160_PHASE6_ERROR_DIAGNOSTICS_CENTER
