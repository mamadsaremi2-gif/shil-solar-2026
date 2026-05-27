# SHIL Utility Electrical 100 Update

این نسخه لایه مهندسی نیروگاهی را به موتور محاسبات اضافه می‌کند. تمرکز فقط روی تحلیل فنی است و هیچ داده قیمت، فروش، خرید یا مارکت‌پلیس وارد اپ نشده است.

## Added
- Utility Electrical Design Layer
- MV collection system preliminary sizing
- Transformer sizing and reserve margin
- Block station and inverter-per-block calculation
- DC/AC ratio and clipping risk diagnostics
- Land/GCR preliminary estimation
- Annual and monthly yield simulation
- Grid interconnection / export limit engineering check
- Utility electrical diagnostics integrated with Solar Professional Diagnostics
- Utility fields and results in System Settings and Summary

## Main file changes
- src/core/calculation/utilityElectricalEngine.js
- src/core/calculation/solarAutoDesignEngine.js
- src/core/calculation/solarDiagnosticEngine.js
- src/pages/project/SystemSettings.jsx
- src/modules/new-project/steps/07-summary/SummaryStep.jsx

## Capacity policy
- The project remains capped at 30MW in this release.
- Above 30kW the app switches away from single-inverter logic.
- Above 500kW the app activates block-based utility mode.

## No commercial logic
This update contains no pricing, selling, purchasing, cart, marketplace, brand recommendation or vendor-selection logic.
