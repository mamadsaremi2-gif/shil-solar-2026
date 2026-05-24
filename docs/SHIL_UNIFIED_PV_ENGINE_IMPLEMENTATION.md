# SHIL Unified PV Engine Implementation

این آپدیت فایل خالی `src/engine/solarUnifiedCalculationEngine.js` را به موتور واقعی و قابل اجرا تبدیل می‌کند.

## API اصلی

```js
import { runUnifiedSolarCalculation } from './src/engine/solarUnifiedCalculationEngine.js';

const result = runUnifiedSolarCalculation(input);
```

## ترتیب اجرای قطعی

1. INPUT_NORMALIZATION
2. PV_STRING_MPPT_LAYOUT
3. SMART_BANK_SELECTION
4. PROTECTION_SELECTION_ONLY
5. EFFICIENCY_ENERGY_ONCE
6. SUMMARY_ENGINE

## قانون جلوگیری از دوبار محاسبه شدن

- حفاظت فقط کابل، فیوز، SPD و تابلو را انتخاب می‌کند.
- راندمان فقط تلفات توان/انرژی را اعمال می‌کند.
- تلفات کابل DC/AC فقط در مرحله راندمان اعمال می‌شود.
- دما در چیدمان فقط برای کنترل ولتاژ استفاده می‌شود.
- دما در راندمان فقط برای افت توان استفاده می‌شود.
- راندمان اینورتر و باتری فقط یک‌بار در `EfficiencyEngine` اعمال می‌شوند.

## خروجی‌های مهم

- layout.per_MPPT
- banks.inverter / banks.battery / banks.panel
- protection.per_MPPT_protection
- efficiency.outputs
- summary.important_results
- summary.canContinue
- summary.warnings
- summary.effect_ledger

## فایل اضطراری

`src/engine/emergencyPowerUnifiedCalculationEngine.js` هم از حالت خالی خارج شده و یک Adapter پایدار برای مسیر برق اضطراری دارد.
