# SHIL Unified Final Engine Applied

این نسخه با هدف حذف دوباره کاری محاسباتی و حفظ کامل UI/لاینرهای فعلی اصلاح شد.

## قانون اصلی

- صفحات میانی فقط Preview / Surface / Informational هستند.
- محاسبات واقعی فقط در `src/runEngineeringDesign.js` و از طریق Gateway نهایی انجام می‌شود.

## مسیر رسمی محاسبات

```txt
src/runEngineeringDesign.js
  -> src/calculationGateway/unifiedFinalCalculationGateway.js
```

## ترتیب اجرای موتور نهایی

```txt
1. PV_String_Layout_Selection
2. SHIL_Inverter_MPPT_System
3. SHIL_Protection_Engine
4. SHIL_Efficiency_Model
5. Final_Report_Builder
```

## Ruleهای اعمال‌شده

- PV String Layout / Connection Policy
- Multi MPPT processing
- Protection + Cable + Panelboard engine
- Efficiency engine
- Remaining 10 selection rules
- Anti-duplication rules for cable loss, temperature and battery efficiency

## جلوگیری از دوباره‌کاری

- Protection فقط سایز کابل، تجهیزات حفاظتی و تابلو را انتخاب می‌کند.
- Efficiency فقط اثر تلفات کابل روی انرژی را محاسبه می‌کند.
- Layout فقط Voc/Vdc و محدوده MPPT را کنترل می‌کند.
- Efficiency فقط افت توان دمایی را اعمال می‌کند.
- باتری فقط در سناریوی دارای ذخیره‌ساز روی انرژی اعمال می‌شود.

## صفحات میانی

این صفحات از Preview Layer استفاده می‌کنند و خروجی آن‌ها قطعی نیست:

- `src/pages/project/CalculationInputs.jsx`
- `src/pages/project/SystemSettings.jsx`
- `src/modules/new-project/steps/06-system-settings/SystemSettingsStep.jsx`
- `src/pages/project/SummaryPage.jsx` برای چکیده/نمایش

## محدودیت تست

در محیط تحویل، `node_modules` داخل ZIP موجود نبود؛ بنابراین Build کامل Vite قابل اجرا نبود. تست مستقیم Gateway نهایی با Node انجام شد و خروجی معتبر تولید کرد.
