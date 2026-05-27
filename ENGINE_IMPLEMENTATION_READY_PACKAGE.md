# SHIL - Engine Implementation Ready Package

این نسخه برای مرحله قبل از پیاده سازی موتور محاسبات ساخته شده است.
هدف این است که UI، Store و Data Registry پایدار بمانند و قوانین آینده فقط از یک نقطه مرکزی اضافه شوند.

## وضعیت این نسخه

- موتور محاسبات سنگین هنوز غیرفعال است.
- اجرای قوانین فقط از مسیر `src/engine/core/runEngine.js` انجام می شود.
- قوانین فعال فعلاً خالی هستند.
- تمام Ruleهای قدیمی به عنوان Disabled Rule مستند شده اند.
- UI نباید مستقیماً وارد محاسبات شود.

## مسیرهای اصلی

```txt
src/engine/core/runEngine.js
src/engine/core/runRules.js
src/engine/rules/index.js
src/engine/contracts/ruleContract.js
src/data/registry/
src/store/
src/debug/
```

## قانون اضافه کردن Rule جدید

1. یک فایل جدید در `src/engine/rules/` بساز.
2. از `src/engine/rules/_templates/rule.template.js` الگو بگیر.
3. Rule را در `src/engine/rules/index.js` import کن.
4. فقط در `ruleGroups` فعالش کن.
5. UI را دست نزن.

## فاز بعدی پیشنهادی

ترتیب پیاده سازی موتور محاسبات:

1. validation.rules.js
2. voltage.rules.js
3. inverter.rules.js
4. battery.rules.js
5. cable.rules.js
6. protection.rules.js
7. mppt.rules.js
8. layout.rules.js
9. finalCalculation.rules.js
10. report.rules.js

## تست اجرا

```bash
npm install
npm run dev -- --force
```

اگر پورت 5173 داده شد، پکیج سالم بالا آمده است.
