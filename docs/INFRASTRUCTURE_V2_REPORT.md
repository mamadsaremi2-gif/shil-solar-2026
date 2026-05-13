# گزارش نسخه زیرساختی SHIL Core v2

این نسخه عمداً وارد طراحی ظاهری نشده و فقط زیرساخت‌های لازم برای آپدیت بعدی UI را آماده می‌کند.

## موارد اضافه‌شده

### 1. State Management پایه
- `src/core/state/createStore.js`
- `src/core/state/workflowState.js`
- `src/core/state/workflowActions.js`

کاربرد: نگهداری مرحله‌ها، اطلاعات فرم، نتیجه محاسبات و وضعیت پیش‌نویس بدون وابستگی به ظاهر.

### 2. Error Architecture
- `src/core/errors/AppError.js`
- `src/core/errors/errorCodes.js`
- `src/core/errors/errorBoundaryModel.js`

کاربرد: استانداردسازی خطاهای Engine، Storage، Validation و Workflow.

### 3. Engineering Contracts
- `engineeringForm.contract.js`
- `engineeringResult.contract.js`

کاربرد: تثبیت شکل ورودی و خروجی موتور محاسبات پیش از طراحی UI.

### 4. Schema Validation
- `engineeringSchema.js`
- `schemaValidator.js`

کاربرد: جلوگیری از ورود داده ناقص یا ناسازگار به Engine.

### 5. Engine Pipeline
- `runEnginePipeline.js`
- بازنویسی `runEngineeringDesign.js`

کاربرد: اجرای مرحله‌ای Engineها، ثبت Warning/Error و حفظ امکان اضافه‌کردن Engine جدید.

### 6. Data Layer آماده‌تر
- Storage Adapter
- Project Repository async
- Migration Runner
- Sync Queue

کاربرد: آماده‌سازی برای ذخیره پروژه، مهاجرت دیتابیس و حالت Offline-first.

### 7. Shared Services
- Logger
- App Meta
- Non-visual change guard

کاربرد: استانداردسازی سرویس‌های مشترک و جداسازی تغییرات زیرساختی از تغییرات ظاهری.

## چیزهایی که عمداً انجام نشده

- تغییر ظاهر صفحات
- تغییر CSS و Theme
- ساخت UI نهایی موبایل
- پیاده‌سازی کامل فرمول‌های مهندسی
- اتصال واقعی به سرور یا دیتابیس خارجی

## اولویت مرحله بعد

1. نهایی‌سازی طراحی موبایل طبق نیازهای کاربر
2. اتصال UI مراحل به Workflow Store
3. تکمیل Validationهای مهندسی واقعی
4. پیاده‌سازی Engineهای PV، Battery، Inverter و Cable
5. اضافه کردن تست واحد برای هر Engine
