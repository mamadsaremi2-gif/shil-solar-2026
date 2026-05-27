# SHIL Infrastructure V6 - Calculation Core

## هدف نسخه

این نسخه روی کامل‌تر کردن هسته محاسباتی تمرکز دارد و وارد طراحی ظاهری نمی‌شود.

## اضافه‌شده‌های اصلی

### 1. Load Profile Builder

```txt
src/calculation/load/LoadProfileBuilder.js
```

قابلیت‌ها:

- محاسبه انرژی روزانه
- توان متصل
- بار پیک با ضریب همزمانی
- بار Surge
- گروه‌بندی مصرف بر اساس دسته‌بندی

### 2. Scenario Strategies

```txt
src/calculation/scenarios/
```

سناریوها:

- Offgrid
- Hybrid
- Ongrid

هر سناریو خروجی و منطق ارزیابی مخصوص خود را دارد.

### 3. Sizing Core

```txt
src/calculation/sizing/
```

موتورهای سایزینگ:

- PV String Sizer
- Battery Bank Sizer
- Inverter Sizer
- Cable Sizer
- System Sizing Engine

### 4. Diagnostics Engine

```txt
src/calculation/diagnostics/
```

قابلیت‌ها:

- تشخیص کمبود انرژی
- تشخیص بار زیاد اینورتر
- تشخیص عدم تأمین Autonomy
- تشخیص افت ولتاژ کابل
- Health Score

### 5. Engineering Report Builder

```txt
src/reporting/engineeringReportBuilder.js
```

خروجی‌ها:

- Object Report
- Markdown Report

### 6. Pipeline ارتقایافته

Pipeline حالا علاوه بر Engineهای قبلی، این موارد را اضافه می‌کند:

```txt
Validation -> Engines -> Scenario Evaluation -> Sizing -> Diagnostics -> Result
```

### 7. تست‌های جدید

```txt
tests/calculation/
```

پوشش تست:

- Load Profile
- Sizing Strategies
- Scenario Strategies
- Diagnostics
- Report Builder
- Project Service Report

## اسکریپت‌ها

```bash
npm test
npm run test:calculation
npm run test:load
npm run test:sizing
npm run test:diagnostics
npm run test:report
```

## هنوز کم دارد

- محاسبات دقیق‌تر بر اساس استانداردهای IEC/NEC
- موتور دیتاشیت واقعی تجهیزات
- پروفایل بار 24 ساعته و فصلی
- موتور اقلیم ماهانه و زاویه تابش
- موتور سایه‌اندازی واقعی
- محاسبات کابل AC/DC تفکیک‌شده
- Protection sizing: fuse, breaker, SPD
- TypeScript Migration
