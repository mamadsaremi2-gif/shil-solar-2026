# SHIL Infrastructure V7 - Production Readiness

## هدف نسخه

این نسخه همچنان وارد طراحی ظاهری نشده و تمرکز آن روی آماده‌سازی زیرساخت برای فازهای جدی‌تر توسعه است.

## اضافه‌شده‌های اصلی

### 1. Health Check

```txt
src/qa/health/HealthCheckService.js
```

بررسی می‌کند:

- Storage
- Migration Runner
- Sync Queue

### 2. Audit Log

```txt
src/qa/audit/ProjectAuditService.js
```

برای ثبت تغییرات مهم پروژه:

- actor
- action
- before
- after
- meta

### 3. Security پایه

```txt
src/security/
```

شامل:

- SHA-256 hash
- SecureStorageAdapter با AES-256-GCM
- DataSanitizer برای حذف ایمیل و شماره تماس از متن‌های حساس

### 4. Import / Export

```txt
src/data/portable/
```

قابلیت‌ها:

- Export پروژه با checksum
- Import پروژه با checksum verification
- Export همه پروژه‌ها به Bundle

### 5. Conflict Resolution

```txt
src/data/sync/ConflictResolver.js
```

استراتژی‌ها:

- latest-write-wins
- local-wins
- remote-wins
- merge-form

### 6. Production Readiness Service

```txt
src/qa/ProductionReadinessService.js
```

گزارش آمادگی زیرساخت:

- health status
- تعداد پروژه‌ها
- تعداد sync pending
- تعداد خطاهای حل‌نشده

### 7. Stress Scenario Matrix

```txt
src/qa/scenarios/scenarioFactory.js
```

برای تست سناریوهای مختلف:

- Small Offgrid
- Medium Offgrid
- Hybrid Commercial
- Ongrid Rooftop
- Cable Stress

## تست‌های جدید

```txt
tests/qa/
```

شامل:

- Security
- Import/Export
- Conflict Resolution
- Health Check
- Stress Scenarios
- Audit

## اسکریپت‌ها

```bash
npm test
npm run test:qa
npm run test:security
npm run test:import-export
npm run test:conflict
npm run test:health
npm run test:stress
```

## وضعیت

V7 پروژه را از حالت صرفاً محاسباتی به حالت آماده‌تر برای تولید رسانده است:

```txt
Calculation Core + Data Layer + Offline + QA + Security + Import/Export + Health Check
```

## هنوز کم دارد

- TypeScript Migration
- IndexedDB / SQLite adapter واقعی
- Authentication و User Management
- Role-based access
- Encryption key management واقعی
- E2E tests
- CI/CD pipeline
- Performance benchmark جدی
- دیتابیس تجهیزات واقعی و بزرگ
- استانداردهای IEC/NEC کامل
