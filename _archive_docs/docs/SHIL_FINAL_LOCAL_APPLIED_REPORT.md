# SHIL Final Local Applied Update

این نسخه برای رفع مشکل «وجود موتور بدون اتصال واقعی به UI» آماده شده است.

## اصلاحات قطعی

- موتور یکپارچه PV از حالت فایل جدا و غیرقابل مشاهده خارج شد و در صفحه فعال پیکربندی سیستم استفاده می‌شود.
- `SystemSettings.jsx` برای همه مسیرهای خورشیدی از `runUnifiedPvForUi` استفاده می‌کند، نه فقط مسیر توان پنل.
- خروجی `solarDesign` از `unifiedPvToLegacyDesign` ساخته می‌شود تا UI فعلی اپ همان خروجی موتور جدید را نمایش دهد.
- خروجی نهایی در `localStorage` با کلیدهای زیر ذخیره می‌شود:
  - `shil:unifiedPvEngineResult`
  - `shil:unifiedPvEngineResult:live`
  - `shil:systemSettingsDraft`
  - `shil:solarSystemDesign`
- مسیرهای محاسباتی به نام‌های نهایی موتور نگاشت شدند:
  - `equipment` → `equipment_list`
  - `profile` → `load_profile`
  - `power` → `total_power`
  - `current` → `total_current`
  - `energy` → `daily_energy`
  - `solar_panel_power` → `solar_panel_power`
- استفاده مستقیم صفحه ورودی از موتور قدیمی `solarPanelPowerEngine` حذف شد.
- جدول نتیجه پیکربندی برای همه مسیرهای خورشیدی خروجی موتور یکپارچه را نشان می‌دهد.
- ردیف «باتری مرجع» از نتیجه عمومی حذف شد.
- گزارش نتیجه شامل Pipeline و سیاست عدم دوباره‌کاری ضرایب است.

## فایل‌های اصلاح‌شده

- `src/engine/unifiedPvUiAdapter.js`
- `src/pages/project/CalculationInputs.jsx`
- `src/pages/project/SystemSettings.jsx`
- `src/engine/solarUnifiedCalculationEngine.js`

## نکته تست

بعد از جایگزینی فایل‌ها روی ریشه پروژه، حتماً کش Vite را پاک کنید:

```bash
rm -rf node_modules/.vite dist
npm install --legacy-peer-deps
npm run dev
```

در صفحه پیکربندی سیستم، عنوان «نتایج پیکربندی موتور یکپارچه» یا «نتایج پیکربندی با استفاده از توان پنل خورشیدی» باید دیده شود.
