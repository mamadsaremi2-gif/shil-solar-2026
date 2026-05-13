# SHIL Infrastructure V10 - Pre-UI Final Core

## هدف نسخه

V10 به‌عنوان پکیج جامع قبل از ورود به طراحی ظاهری ساخته شده است. این نسخه هنوز UI را تغییر نمی‌دهد، اما زیرساخت لازم برای ورود امن و سریع به فاز طراحی را کامل‌تر می‌کند.

## اضافه‌شده‌های اصلی

### 1. TypeScript Migration Scaffold

```txt
src/types/contracts.d.ts
tsconfig.migration.json
```

برای آماده‌سازی مهاجرت تدریجی به TypeScript.

### 2. Monthly Climate Core

```txt
src/climate/
```

قابلیت‌ها:

- دیتای ماهانه اقلیمی اولیه برای تهران، شیراز، تبریز
- خلاصه اقلیم
- تولید ماهانه PV
- پیدا کردن بدترین ماه

### 3. Protection Sizing

```txt
src/protection/
```

محاسبات اولیه:

- PV string fuse
- DC breaker
- AC breaker
- SPD

### 4. Equipment Compatibility Engine

```txt
src/data/equipment/EquipmentCompatibilityEngine.js
```

بررسی:

- سازگاری PV و Inverter
- محدوده MPPT
- Cold Voc
- سازگاری Battery/Inverter پایه

### 5. Data Integrity Service

```txt
src/data/integrity/
```

قابلیت‌ها:

- Manifest
- Checksum verification
- تشخیص Snapshot orphan

### 6. CI Readiness

```txt
.github/workflows/ci.yml
src/qa/ci/CIReadinessChecker.js
```

برای آماده‌سازی اجرای تست‌ها در CI.

### 7. Pipeline ارتقایافته

Pipeline حالا می‌تواند خروجی‌های زیر را نیز تولید کند:

```txt
Protection Sizing
Monthly Climate Output
```

### 8. App Kernel V10

App Kernel حالا این موارد را هم دارد:

```txt
Climate Engine
Compatibility Engine
Data Integrity Service
```

## وضعیت کل زیرساخت تا V10

```txt
Engineering Core
Validation Engine
Calculation Core
Scenario Strategies
Sizing Core
Diagnostics
Report Builder
Data Layer
Repository
Offline Sync
Migration
Security Base
Import / Export
Conflict Resolution
Form Registry
Settings
Permissions
Mobile/PWA Adapters
Workflow Orchestration
Plugin System
Rulesets
Equipment DB
Backup/Restore
Telemetry
Benchmark
Climate Monthly Core
Protection Sizing
Equipment Compatibility
Data Integrity
CI Readiness
UI Integration Manifest
```

## پیشنهاد مرحله بعد

بعد از V10 می‌توان وارد یکی از دو مسیر شد:

1. شروع طراحی ظاهری موبایل طبق قوانین شما
2. یا یک V11 مخصوص TypeScript Migration و IndexedDB/SQLite قبل از UI
