# SHIL Infrastructure V12 - Engineering Calculation Max

## هدف نسخه

تمرکز V12 فقط روی ارتقای محاسبات مهندسی است. هدف این نسخه رساندن Calculation Core به سطح بسیار قوی‌تر و آماده توسعه آینده است، بدون تغییر ظاهر و UI.

## محورهای تکمیل‌شده

### 1. Engineering Standard Packs

```txt
src/engineering/standards/
```

اضافه شد:

- SHIL_BASIC_2026
- SHIL_CONSERVATIVE_2026
- Voltage Drop Rules
- Protection Factors
- Battery Rules
- Inverter Margins
- PV Limits

### 2. Hourly Load Profile

```txt
src/engineering/load/HourlyLoadProfileEngine.js
```

قابلیت‌ها:

- پروفایل 24 ساعته
- محاسبه انرژی روزانه
- محاسبه Peak Load
- Peak Hour
- Load Factor
- Schedule-based loads

### 3. PV Temperature Derating

```txt
src/engineering/pv/PVTemperatureDeratingEngine.js
```

قابلیت‌ها:

- تخمین Cell Temperature
- Temperature Derating
- Monthly PV Output با اثر دما
- Irradiance Factor

### 4. PV String Engineering

```txt
src/engineering/pv/PVStringEngineeringEngine.js
```

قابلیت‌ها:

- Cold Voc
- Hot Vmp
- MPPT Window
- Valid Series Range
- Stringing Issues

### 5. Energy Balance Simulation

```txt
src/engineering/simulation/
```

قابلیت‌ها:

- شبیه‌سازی 24 ساعته
- SOC Battery
- Charge / Discharge
- Unmet Load
- Curtailed PV
- Reliability
- Equivalent Battery Cycles

### 6. Protection Coordination

```txt
src/engineering/protection/
```

قابلیت‌ها:

- Breaker Coordination
- Cable Ampacity Check
- Source Current Margin
- PV String Fuse
- DC Main Coordination

### 7. Engineering Calculation Report

```txt
src/engineering/reporting/
```

گزارش تخصصی‌تر مهندسی شامل:

- Electrical Summary
- Battery Summary
- Protection
- Solar/Shading
- Trace
- Diagnostics

### 8. EngineeringCalculationCoreV12

```txt
src/engineering/EngineeringCalculationCoreV12.js
```

یک Facade کامل برای محاسبات مهندسی V12:

```txt
Pipeline
Hourly Load
Hourly PV
Energy Balance
Monthly Temperature PV
String Window
Protection Coordination
Rule Evaluation
Engineering Report
```

## تست‌های V12

```bash
npm run test:v12
```

پوشش:

- Hourly Load Profile
- PV Temperature Derating
- Energy Balance Simulation
- Protection Coordination
- Engineering Standard Packs
- Engineering Calculation Report
- App Kernel V12 Integration

## وضعیت محاسبات بعد از V12

محاسبات مهندسی از سطح حدود 6.5 به سطح بسیار بالاتری رسیده است:

- پایه محاسبات انرژی: قوی
- PV stringing: قوی
- دما و اقلیم: خوب
- شبیه‌سازی انرژی: خوب
- حفاظت: خوب
- کابل AC/DC: خوب
- باتری: خوب
- گزارش مهندسی: خوب
- استانداردپذیری: آماده توسعه
- توسعه آینده: بسیار باز

## مسیر توسعه آینده

برای توسعه‌های بعدی می‌توان اضافه کرد:

- دیتابیس واقعی تجهیزات
- Hourly climate / TMY
- Shadow geometry 3D
- Earthing / Grounding
- Short circuit calculation
- Protection selectivity curves
- Economic analysis / LCOE
- Battery degradation model دقیق‌تر
- Inverter clipping analysis
- Grid export simulation
