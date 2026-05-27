# SHIL Infrastructure V4 - Core Integrated

## هدف نسخه

این نسخه برای جهش زیرساختی ساخته شده و وارد طراحی ظاهری نشده است. تمرکز روی اتصال هسته‌های اصلی پروژه است:

- Workflow Store
- Mobile Step Bindings
- Central Engineering Validation
- PV / Battery / Inverter / Cable / Loss / Load Engines
- Engineering Pipeline
- Test Suite
- Package Scripts

## مسیر اصلی داده

```txt
Mobile Step -> Workflow Store -> Validation Engine -> Engineering Pipeline -> Result Contract
```

## تغییرات اصلی

### 1. ساختار پروژه یکپارچه شد

همه فایل‌های V4 داخل ریشه واحد قرار گرفتند:

```txt
SHIL_Infrastructure_v4_Core_Integrated/
```

### 2. Workflow Store جدی‌تر شد

Store حالا قابلیت‌های زیر را دارد:

- currentStep
- completedSteps
- form
- validation state
- engine result
- dirty flag
- subscribe
- reset
- updateSection

### 3. اتصال صفحات موبایل آماده شد

فایل `src/mobile-ui/bindings/stepBindings.js` برای اتصال هر Step به Store آماده شده است.

### 4. Validation Engine مرکزی اضافه شد

Validationها از حالت فایل‌های پراکنده خارج شدند و از طریق `validateEngineeringForm` اجرا می‌شوند.

Ruleهای فعلی:

- Project rules
- PV rules
- Battery rules
- Inverter rules
- Cable rules
- Loss rules

### 5. Engineها از Placeholder جلوتر رفتند

Engineهای محاسباتی اولیه اضافه شدند:

- Load Engine
- Loss Engine
- PV Engine
- Battery Engine
- Inverter Engine
- Cable Engine
- Controller Engine

### 6. تست‌ها کامل‌تر شدند

اسکریپت‌ها:

```bash
npm test
npm run test:engineering
npm run test:validation
npm run test:store
npm run test:pipeline
```

## هنوز کم دارد

- TypeScript migration
- محاسبات استانداردشده مطابق دیتاشیت تجهیزات واقعی
- Climate database
- Load profile builder
- Equipment database
- Repository و Offline Sync کامل
- Error Recovery UI
- تست‌های Snapshot برای فرم‌های موبایل
