# SHIL Calculation Engine Unification Report

## هدف
موتور محاسبات پروژه به یک نقطه ورود رسمی و پایدار منتقل شد تا صفحات UI، سرویس پروژه، Workflow و facadeهای قدیمی همگی از یک Gateway واحد استفاده کنند.

## نقطه ورود رسمی

```text
src/runEngineeringDesign.js
```

این فایل فقط به Gateway نهایی وصل است:

```text
src/calculationGateway/unifiedFinalCalculationGateway.js
```

## Gateway رسمی

```text
src/calculationGateway/
```

زنجیره اجرایی رسمی:

1. PV String Layout Rule Engine
2. Multi MPPT System Engine
3. Protection Engine
4. Efficiency Engine
5. Final Report / Summary Builder

## facadeهای سازگار با نسخه‌های قبلی
برای جلوگیری از شکست UIهای قدیمی، مسیرهای زیر دیگر محاسبه مستقل انجام نمی‌دهند و فقط به Gateway نهایی وصل شده‌اند:

```text
src/engineering/engine/runEngineeringEngine.js
src/engineering/EngineeringCalculationCoreV12.js
src/core/engineering/orchestrator/runEngineeringDesign.js
```

## Adapter سازگاری Legacy UI

```text
src/calculationGateway/legacyEngineeringAdapter.js
```

این Adapter خروجی Gateway نهایی را به ساختار قدیمی مورد انتظار بعضی کامپوننت‌ها تبدیل می‌کند، بدون اینکه محاسبه جدیدی انجام دهد.

## قوانین معماری از این نسخه به بعد

- هیچ صفحه‌ای نباید مستقیم از `src/engine`, `src/engines`, `src/engineering` یا `src/core/calculation` محاسبه اصلی بگیرد.
- همه محاسبات نهایی باید از `src/runEngineeringDesign.js` عبور کنند.
- فایل‌های قدیمی فقط در صورت نیاز به عنوان Utility یا facade مجازند.
- محاسبه تلفات، حفاظت، باتری و MPPT نباید در چند نقطه مستقل تکرار شود.

## پاکسازی انجام‌شده

- فایل‌های backup داخل `src` حذف شدند.
- `dev-dist` حذف شد.
- مسیر قدیمی `public/icons` حذف شد.
- facadeهای قدیمی به Gateway نهایی متصل شدند.

## نتیجه

موتور محاسبات اکنون Gateway محور است و ریسک اجرای موازی موتورهای قدیمی برای مسیرهای اصلی UI کاهش یافته است.
