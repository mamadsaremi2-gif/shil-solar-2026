# SHIL Solar - Phase 2: Data Flow & Engineering Integrity

تاریخ: 2026-09-28

## هدف
یکپارچه سازی داده بین Calculation Inputs -> System Settings -> Summary -> Run/PDF و جلوگیری از خروجی مهندسی نادرست یا نهایی سازی داده ناقص.

## اصلاحات انجام شده

1. مصرف روزانه دیگر از PSH ساخته نمی شود.
   - PSH فقط برای سایزبندی تولید خورشیدی استفاده می شود.
   - در مسیر توان/جریان، انرژی روزانه از داده واقعی ثبت شده یا Power x Usage Hours می آید.
   - اگر هیچ زمان مصرف/انرژی ثبت نشده باشد، طراحی معتبر اعلام نمی شود.

2. توان اینورتر نمی تواند به علت Design Adjustment پایین تر از توان بار/پیک انتخاب شود.
   - Inverter sizing = max(load power, surge power, adjusted PV sizing basis).

3. Battery sizing با انرژی قابل استفاده انجام می شود.
   - DoD و efficiency در gross requirement اعمال می شوند.
   - usableEnergyKWh و requiredGrossEnergyKWh به خروجی اضافه شد.

4. کنترل MPPT/String سخت گیرانه تر شد.
   - عبور جریان MPPT از warning به error تبدیل شد.
   - String نامعتبر مثل 1S x 9P برای اینورتر 6kW/MPPT 60V دیگر معتبر نیست.

5. Summary از Project Design State مرکزی می خواند.
   - Installed PV Power و Required PV Power جدا نمایش داده می شوند.
   - String configuration و usable battery energy نمایش داده می شود.
   - اگر طراحی معتبر نباشد، تایید چکیده غیرفعال است.

6. Run/Final Output از Canonical Solar Form ساخته می شود.
   - داده 5000W/25kWh دیگر با fallback 0W یا تجهیزات پیش فرض جایگزین نمی شود.
   - مقادیر canonical load/panel/inverter/battery روی خروجی final اعمال می شوند.

7. ضریب کاهش اینورتر دیگر به عنوان Safety Factor گزارش نمی شود.
   - Safety factor خروجی از adjustment factor جدا شد.

8. Finalization Guard اضافه شد.
   - در صورت نبود حفاظت یا کابل نهایی، خروجی Run پیش نویس مهندسی باقی می ماند.
   - پروژه Final ثبت نمی شود.
   - PDF/PNG/Share نهایی تا تکمیل داده اجرایی غیرفعال است.

## تست مرجع 5000W / 220V / 25kWh/day / Isfahan

ورودی تست:
- Load power: 5000 W
- Daily energy: 25 kWh
- Voltage: 220 V
- PSH: 5.7 h
- Environment efficiency: 92%
- Autonomy: 1 day
- Panel: SHIL 620 W

خروجی موتور اصلاح شده:
- Daily energy remains: 25 kWh/day
- Required PV power: 4.768 kW
- Panel count: 8 x 620 W
- Installed PV array: 4.96 kWp
- Estimated daily generation: ~26.01 kWh/day
- Inverter: SHIL SI 6 kW / 48 V
- PV string: 8S x 1P
- String Vmp: 308.8 V
- Cold Voc: 394.4 V
- PV input current: 16.06 A
- MPPT compatibility: PASS
- Battery: 6 x 51.2 V / 100 Ah
- Gross battery energy: 30.72 kWh
- Usable battery energy (DoD x efficiency): 25.99 kWh
- Required usable energy: 25 kWh
- Design validity: PASS

## تست ها
- tests/phase2-solar-integrity.test.js: PASS
- tests/run-all-tests.js: PASS (Exit Code 0)

## نکته Build
این بسته node_modules ندارد. Build را پس از جایگزینی روی سیستم توسعه با:

npm ci
npm test
npm run build

اجرا کنید. فایل .env محلی شما در این ZIP قرار داده نشده و باید همان فایل فعلی سیستم شما حفظ شود.

## فایل های اصلی تغییر یافته
- src/engineering/solar/solarDesignEngine.js
- src/engineering/solar/solarBankRules.js
- src/pages/project/SummaryPage.jsx
- src/pages/project/RunCalculation.jsx
- tests/phase2-solar-integrity.test.js
