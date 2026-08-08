# SHIL Run/Final Output V15 Hard Fix

این نسخه پس از مشخص شدن عدم اعمال واقعی اصلاحات V14 ساخته شد.

## اصلاحات قطعی
- هندسه لوگوی A4 داخل خود JSX به صورت inline اعمال شد؛ وابستگی به ترتیب CSS حذف شد.
- شماره‌های 01 تا 04 داخل خود Header هر Section با position/overflow inline تثبیت شدند.
- Labelهای A4 کوچک‌تر/کم‌رنگ و Answerها تیره/Bold به صورت inline اعمال شدند.
- ترتیب مهندسی `عدد سپس واحد` با `formatMetric` و Bidi isolate حفظ شد.
- Mapping حفاظت Solar هم ساختار nested موتور و هم خروجی flat آداپتر (`dcBreakerA`, `acBreakerA`, `pvCable`, `batteryCable`, `acCable`) را می‌خواند.
- کابل‌ها از `protection` flat نیز fallback می‌گیرند تا «ثبت نشده» صرفاً به علت تفاوت schema نمایش داده نشود.
- marker نسخه `data-shil-run-output-version="15"` به root صفحه اضافه شد تا در DevTools قابل تایید باشد.
- CSS تکمیلی V15 آخرین import است، ولی Critical Fixهای A4 دیگر به CSS وابسته نیستند.
