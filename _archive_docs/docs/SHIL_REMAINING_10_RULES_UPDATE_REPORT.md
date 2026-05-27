# SHIL Remaining 10 Rules Integration Report

## نسخه
`2026.05.24-unified-pv-10-rules-complete`

## فایل اصلی اصلاح‌شده
`src/engine/solarUnifiedCalculationEngine.js`

## قوانین اضافه‌شده به موتور یکپارچه

1. `DC_Voltage_Level_Selection`
   - انتخاب خودکار 600VDC / 1000VDC / 1500VDC بر اساس ولتاژ استرینگ.

2. `Breaker_Type_Selection`
   - انتخاب MCB/MCCB و کلیدهای DC بر اساس جریان و نوع مدار.

3. `Pole_Count_Selection`
   - انتخاب پل مناسب برای DC، AC، SPD و ایزولاتور.

4. `Panelboard_Size_Selection`
   - انتخاب 12M / 24M / 36M / 54M / Industrial Panel بر اساس تعداد ماژول.

5. `Panelboard_IP_Selection`
   - انتخاب IP40 / IP54 / IP65 / ضدخوردگی بر اساس محیط نصب.

6. `Cable_Voltage_Drop_Rule`
   - تعیین محدوده افت ولتاژ PV DC، باتری DC و AC و انتخاب سایز کابل بر اساس آن.

7. `SPD_Type_Selection`
   - انتخاب Type I، Type I+II یا Type II بر اساس محل نصب و ریسک صاعقه.

8. `Battery_Fuse_Type_Selection`
   - انتخاب NH، MEGA/ANL، NH gPV یا DC cartridge fuse بر اساس ولتاژ و کاربرد.

9. `Multi_MPPT_Management`
   - کنترل MPPTهای خالی، عدم‌تعادل توان، جهت‌های متفاوت و سایه متفاوت.

10. `Panel_Layout_Space_Constraint`
   - اعمال ترجیح چیدمان بر اساس محدودیت فضا و فاصله آرایه.

## نکته مهم یکپارچگی
این قوانین تکرار قوانین قبلی نیستند؛ به لایه‌های موجود وصل شده‌اند:

- `panel_string_design`
- `mppt_validation`
- `protection_DC_PV`
- `protection_DC_BAT`
- `protection_AC`
- `cable_selection`
- `panelboard_selection`
- `environment_rules`

## تست انجام‌شده
- تست Syntax با Node انجام شد.
- تست اجرای مستقیم موتور انجام شد.
- خروجی شامل ۱۰ قانون تکمیلی، انتخاب SPD، انتخاب سطح ولتاژ DC، انتخاب سایز تابلو و هشدارهای MPPT/سایه تولید شد.

## محدودیت تست
Build کامل پروژه در این محیط اجرا نشد؛ روی سیستم اصلی بعد از نصب وابستگی‌ها اجرا شود:

```bash
npm install --legacy-peer-deps
npm run build
npm run dev
```
