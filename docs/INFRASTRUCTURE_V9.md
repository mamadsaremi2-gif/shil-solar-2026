# SHIL Infrastructure V9 - Complete Core

## هدف نسخه

V9 یک پکیج جامع زیرساختی قبل از ورود جدی به طراحی ظاهری است. در این نسخه تلاش شده اجزای اصلی اپ، محاسبات، داده، QA، تولید، فرم‌ها و آماده‌سازی UI زیر یک هسته کامل‌تر قرار بگیرند.

## اضافه‌شده‌های اصلی

### 1. Workflow Orchestration

```txt
src/workflow/
```

قابلیت‌ها:

- تعریف رسمی مسیر Workflow
- Progress
- Required step logic
- Step locking
- اجرای Calculation از Workflow
- Step map برای UI

### 2. Plugin System

```txt
src/plugins/
```

قابلیت‌ها:

- ثبت پلاگین
- حذف پلاگین
- Hook execution
- Built-in Performance Ratio Plugin
- Built-in Project Risk Plugin

### 3. Ruleset Versioning

```txt
src/rulesets/
```

قابلیت‌ها:

- انتخاب Ruleset
- Ruleset فعال
- Conservative Ruleset
- اعمال Ruleset روی فرم

### 4. Equipment Database

```txt
src/data/equipment/
```

قابلیت‌ها:

- دیتابیس داخلی تجهیزات
- Search
- Filter
- Validation
- Seed اولیه PV / Inverter / Battery

### 5. Backup / Restore

```txt
src/data/backup/
```

قابلیت‌ها:

- Backup کامل Storage
- Checksum
- Restore کامل

### 6. Telemetry داخلی

```txt
src/telemetry/
```

قابلیت‌ها:

- Track events
- Summarize
- Clear

### 7. Performance Benchmark

```txt
src/qa/performance/
```

برای تست سرعت سناریوهای محاسباتی.

### 8. UI Integration Manifest

```txt
src/uiIntegration/uiContractManifest.js
```

برای آماده‌سازی ورود به فاز طراحی UI بدون قاطی شدن طراحی با منطق.

### 9. App Kernel ارتقایافته

App Kernel حالا این موارد را یکپارچه می‌کند:

```txt
Project Service
Settings
Permissions
Readiness
AutoSave
Rulesets
Backup
Telemetry
Plugins
Equipment Database
```

## تست‌های V9

```bash
npm run test:v9
```

پوشش:

- Workflow Orchestrator
- Plugin System
- Ruleset Versioning
- Backup / Restore
- Telemetry
- Performance Benchmark
- Equipment Database
- App Kernel V9

## وضعیت فعلی پروژه

تا V9، SHIL از نظر زیرساخت شامل این بلوک‌هاست:

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
UI Integration Manifest
```

## هنوز کم دارد

قبل از طراحی ظاهری نهایی، این موارد هنوز پیشنهاد می‌شوند:

- TypeScript Migration واقعی
- IndexedDB / SQLite Adapter واقعی
- دیتابیس تجهیزات واقعی و گسترده
- موتور اقلیم ماهانه ایران
- Protection sizing: Fuse / Breaker / SPD
- Shadow analysis جدی
- تست E2E
- CI/CD
- Performance budget
