# SHIL Infrastructure V5 - Data & Offline Core

## هدف نسخه

این نسخه وارد طراحی ظاهری نشده و تمرکز آن روی زیرساخت‌های سنگین‌تر بعد از V4 است:

- Data Layer
- Project Repository
- Storage Adapter
- Offline Sync Queue
- Migration Runner
- Equipment Catalog اولیه
- Climate Catalog اولیه
- Error Recovery Service
- Project Service Facade
- تست‌های Data / Offline / Migration / Catalog / Error

## معماری V5

```txt
Mobile Step
  -> Workflow Store
  -> Project Service
  -> Project Repository
  -> Storage Adapter
  -> Validation Engine
  -> Engineering Pipeline
  -> Result
  -> Offline Sync Queue
```

## اضافه‌شده‌های اصلی

### 1. Storage Adapters

```txt
src/data/storage/MemoryStorageAdapter.js
src/data/storage/JsonFileStorageAdapter.js
```

### 2. Project Repository

```txt
src/data/repositories/ProjectRepository.js
```

قابلیت‌ها:

- ساخت پروژه
- دریافت پروژه
- آپدیت پروژه
- ذخیره نتیجه محاسبات
- لیست پروژه‌ها
- آرشیو
- حذف نرم
- Snapshot

### 3. Offline Sync

```txt
src/data/sync/SyncQueue.js
src/data/sync/syncProcessor.js
```

قابلیت‌ها:

- صف عملیات آفلاین
- retry operation
- failed/done status
- compact queue

### 4. Migration Runner

```txt
src/data/migrations/MigrationRunner.js
src/data/migrations/migrationRegistry.js
```

برای نسخه‌بندی دیتای محلی و اصلاح ساختارهای قدیمی.

### 5. Catalogهای اولیه

```txt
src/data/catalogs/pvModuleCatalog.js
src/data/catalogs/inverterCatalog.js
src/data/catalogs/batteryCatalog.js
src/data/catalogs/climateCityCatalog.js
```

این‌ها دیتابیس نهایی تجهیزات نیستند، اما ساختار لازم برای دیتابیس تجهیزات واقعی را آماده می‌کنند.

### 6. Error Recovery

```txt
src/errors/ErrorRecoveryService.js
```

قابلیت‌ها:

- ذخیره خطا
- لیست خطاها
- Resolve کردن خطا
- پیشنهاد Recovery Hint

### 7. Service Facade

```txt
src/services/ShilProjectService.js
```

یک نقطه ورود تمیز برای عملیات اصلی پروژه:

- initialize
- createProject
- updateProject
- calculateProject
- processSync

## اسکریپت‌های تست

```bash
npm test
npm run test:engineering
npm run test:data
npm run test:offline
npm run test:migration
npm run test:catalog
npm run test:error
```

## هنوز کم دارد

- TypeScript Migration
- دیتابیس واقعی تجهیزات با دیتاشیت‌های معتبر
- Climate API یا دیتابیس اقلیمی کامل ایران
- Conflict resolution برای Sync چنددستگاهی
- Authentication / User Account
- Encryption برای Storage
- IndexedDB / SQLite adapter برای PWA یا موبایل واقعی
- تست فشار و تست سناریوهای بزرگ
