# گزارش فاز ۵ درگاه ادمین SHIL — Engineering Analytics & Monitoring

این نسخه مستقیماً روی فاز ۴ بازسازی‌شده (Rule Engine + Standards + Version/Release Center) اعمال شده است و قابلیت‌های فازهای ۱ تا ۴ را حفظ می‌کند.

## امکانات افزوده‌شده
- تب مستقل «تحلیل و پایش» در کارتابل ادمین.
- KPI واقعی پروژه‌ها: کل، ۳۰ روز اخیر، خورشیدی، برق اضطراری، نهایی، صف Review، Warning و Error.
- شاخص فعالیت کاربران در بازه‌های ۱، ۷ و ۳۰ روز بر اساس timestamp رکوردها.
- میانگین توان و انرژی فقط در صورت وجود فیلد عددی قابل استخراج از رکوردهای واقعی پروژه.
- Data Quality بانک تجهیزات: برند، Datasheet، وضعیت انتشار، تجهیزات غیرفعال و Validation فاز ۳.
- Alert Center با لینک مستقیم به Review، Equipment CMS، Release و Cloud Sync.
- Version & Performance Monitor شامل Admin Version، Active Release، Rule Version، Audit، Snapshot و اندازه تقریبی LocalStorage.
- گزارش‌های JSON برای Projects، Users، Equipment، Reviews و Diagnostics.
- ثبت Exportهای Analytics در Audit Log.

## اصل صحت داده
این فاز عمداً metric ساختگی مثل «کاربران آنلاین واقعی»، latency سرور یا APM جعلی تولید نمی‌کند. داده‌های نمایشی فقط از Local/Cloud records موجود، Equipment CMS، Audit، Review و Release State محاسبه می‌شوند. برای Online Presence، API Latency، Error Telemetry و APM واقعی به Backend instrumentation نیاز است.

## سازگاری
- Engineering Review فاز ۲ حفظ شده است.
- Equipment Engineering CMS فاز ۳ و Validation آن حفظ شده است.
- Rule Engine، Standards Center و Release Center فاز ۴ حفظ شده‌اند.
- UI مطابق Design System مهندسی SHIL، بدون بنفش و Mobile-first است.
