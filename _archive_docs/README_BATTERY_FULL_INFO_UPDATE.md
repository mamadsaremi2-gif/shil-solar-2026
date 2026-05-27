# SHIL Battery Full Info Update

این پکیج تمام خروجی‌هایی را که قبلاً فقط تعداد باتری را نمایش می‌دادند، به نمایش کامل بانک باتری ارتقا می‌دهد.

## خروجی‌های جدید باتری

در صفحات و خروجی‌های مرتبط، اطلاعات زیر نمایش داده می‌شود:

- تعداد باتری
- ولتاژ هر باتری
- ظرفیت جریان/آمپرساعت هر باتری
- ظرفیت انرژی هر باتری بر حسب kWh
- ظرفیت کل بانک باتری بر حسب kWh
- آرایش سری و موازی
- ولتاژ بانک باتری
- ظرفیت جریان کل بانک بر حسب Ah
- جریان شاخه باتری در صورت وجود محاسبات حفاظتی

## فایل‌های به‌روزرسانی‌شده

- `src/core/calculation/solarAutoDesignEngine.js`
- `src/core/calculation/emergencyPowerEngine.js`
- `src/core/calculation/solarSizingEngine.js`
- `src/calculation/sizing/batterySizer.js`
- `src/pages/project/SystemSettings.jsx`
- `src/pages/project/SummaryPage.jsx`
- `src/pages/project/RunCalculation.jsx`
- `src/export/shilExportSystem.js`
- `src/ai/installation/aiInstallationPreviewEngine.js`
- `src/components/project/EngineeringResultPanel.jsx`
- `src/components/project/FinalProjectSummary.jsx`

## اصل طراحی

هیچ بخش قیمت، خرید، فروش یا مارکت‌پلیس اضافه نشده است. همه خروجی‌ها صرفاً مهندسی هستند.
