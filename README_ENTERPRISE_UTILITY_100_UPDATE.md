# SHIL Enterprise Utility Engineering 100 Update

این پکیج لایه نیروگاهی پیشرفته را به آخرین نسخه SHIL اضافه می‌کند. تمام خروجی‌ها فقط مهندسی هستند و هیچ منطق قیمت، خرید، فروش، برندینگ یا مارکت‌پلیس در این آپدیت اضافه نشده است.

## موتورهای اضافه‌شده

- `src/core/calculation/enterpriseUtilityEngineeringEngine.js`
  - Protection Engineering اولیه
  - Grid Study مقدماتی
  - Tracker / GCR / Row Shading
  - Terrain / GIS اولیه
  - SCADA Architecture
  - Advanced Yield Simulation شامل P50/P90 و افت ۲۵ ساله

## اتصال‌های انجام‌شده

- اتصال به `solarAutoDesignEngine.js`
- اتصال به `solarDiagnosticEngine.js`
- اضافه شدن خروجی‌ها به صفحه پیکربندی سیستم
- اضافه شدن خروجی‌ها به صفحه چکیده پروژه

## محدوده طراحی

- پشتیبانی طراحی تا ۳۰MW
- تشخیص خودکار مقیاس پروژه
- طراحی Block-Based برای نیروگاه‌های بزرگ
- کنترل MV، ترانس، فیدر، Grid Export، حفاظت، زمین، Tracker و SCADA

## نکته مهندسی

این لایه جایگزین مطالعه اجرایی نهایی با داده واقعی شبکه، نقشه زمین، مدل ارتفاعی، Load Flow، اتصال کوتاه و هماهنگی حفاظتی نمی‌شود؛ اما برای تصمیم‌یار مهندسی و کنترل طراحی مقدماتی/پیشرفته در SHIL طراحی شده است.
