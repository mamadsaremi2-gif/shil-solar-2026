# گزارش آپدیت موتور حفاظت SHIL V4

تاریخ: 2026-08-08

## هدف
تکمیل موتور حفاظتی هوشمند بدون تغییر در ظاهر، فونت، زبان، ترتیب صفحات و ساختار UI.

## تغییرات اصلی
- برند تمام تجهیزات حفاظتی خروجی: SHIL
- ارتقای Protection Engine از V3 به V4
- محاسبه جداگانه حفاظت PV DC، Battery DC و AC
- انتخاب MCB/MCCB/Fuse/Isolator از بانک SHIL
- محاسبه تک‌فاز/سه‌فاز با ضریب توان
- اعمال ضریب طراحی 1.25
- کنترل Icu نسبت به Prospective Short-Circuit Current در صورت وجود داده پروژه
- عدم تأیید ساختگی Icu/Ics در صورت نبود داده اتصال کوتاه واقعی
- افزودن فیلد Ics و هشدار تکمیل کاتالوگ در صورت نبود مقدار بانک
- انتخاب SPD Type II یا Type I+II بر اساس ریسک صاعقه/LPS
- توسعه مشخصات SPD شامل Uc, Up, In, Imax و Iimp در خروجی در صورت وجود داده بانک
- افزودن تجهیزات SHIL RCD Type A/B و RCBO Type A/B به بانک مهندسی
- انتخاب محافظه‌کارانه RCD Type B در نبود تأیید 6mA DC residual monitoring اینورتر
- هماهنگی ریتینگ کلید با ampacity کابل در صورت وجود داده کابل
- تعداد تجهیزات PV بر اساس تعداد String/MPPT/Inverter
- عدم تولید حفاظت PV در مسیر Emergency بدون پنل
- ارتقای استانداردهای مرجع به IEC 62548-1:2023+AMD1:2025، IEC 60364-7-712:2025 و IEC 60947-2:2024
- حفظ ظاهر صفحه RunCalculation؛ فقط متن خروجی همان بلوک‌ها غنی‌تر شده است

## نکات ایمنی مهندسی
- قدرت قطع نهایی بدون Prospective Short Circuit Current واقعی/محاسبه‌شده پروژه تأیید نمی‌شود.
- Ics در بانک فعلی همه کلیدهای SHIL کامل نیست؛ موتور این مورد را با هشدار مشخص می‌کند و مقدار ساختگی تولید نمی‌کند.
- Up بعضی SPDهای بانک فعلی کامل نیست؛ Type/Uc/In/Imax انتخاب می‌شود و کمبود Up با هشدار گزارش می‌شود.

## فایل‌های اصلی تغییر یافته
- src/engine/rules/electrical/protection.rules.js
- src/engineering/bank/equipmentBank.js
- src/engineering/core/runEngineeringPipeline.js
- src/pages/project/RunCalculation.jsx

## تست‌های انجام شده
- Syntax check فایل‌های JS تغییر یافته
- تست خورشیدی سه‌فاز با PV + Battery + AC
- تست انتخاب SPD Type I+II در ریسک بالای صاعقه
- تست RCD Type B در نبود 6mA RCMU
- تست هماهنگی کابل و کلید
- تست مسیر Emergency بدون تولید حفاظت PV

## محدودیت بسته ورودی
بسته سورس شامل پوشه src است و فایل‌های کامل ریشه پروژه مانند package.json اصلی در اختیار نبود؛ بنابراین npm build کامل پروژه از همین بسته قابل اجرا نبود.
