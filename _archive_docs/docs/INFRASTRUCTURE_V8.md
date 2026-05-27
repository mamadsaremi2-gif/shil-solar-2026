# SHIL Infrastructure V8 - App Foundation

## هدف نسخه

V8 همچنان وارد طراحی ظاهری نشده است. هدف این نسخه آماده‌سازی اپ برای ورود کنترل‌شده به فاز UI/UX و توسعه محصول است.

## اضافه‌شده‌های اصلی

### 1. TypeScript-ready Foundation

```txt
src/types/engineeringTypes.js
tsconfig.future.json
```

پروژه هنوز JS است، اما مسیر مهاجرت TypeScript آماده‌تر شده است.

### 2. Form Registry

```txt
src/forms/
```

فرم‌ها از حالت پراکنده به Registry قابل کنترل تبدیل شدند:

- step id
- section
- fields
- type
- min/max
- required
- options

این قسمت برای اتصال دقیق UI موبایل بعدی مهم است.

### 3. Permission / Role Base

```txt
src/auth/
```

نقش‌ها:

- owner
- engineer
- reviewer
- viewer

مجوزها:

- create/read/update/delete project
- run calculation
- export report
- update settings

### 4. Settings Service

```txt
src/settings/
```

تنظیمات پایه اپ:

- locale
- unit system
- default scenario
- auto save
- report format
- calculation settings
- sync settings

### 5. Mobile / PWA Adapters

```txt
src/mobile/adapters/
```

زیرساخت‌های بدون طراحی ظاهری:

- Viewport Service
- PWA Install State
- AutoSave Controller

### 6. Report Exporters

```txt
src/reporting/reportExporters.js
```

خروجی‌ها:

- JSON
- Markdown
- CSV

### 7. App Kernel

```txt
src/app/ShilAppKernel.js
```

یک نقطه ورود مرکزی برای اپ:

```txt
Storage
Project Service
Settings
Permissions
Production Readiness
AutoSave
```

## وضعیت V8

تا این نسخه، زیرساخت‌های اصلی زیر آماده شده‌اند:

```txt
Engineering Core
Data Layer
Offline Sync
Calculation Core
QA / Security
Import / Export
Conflict Resolution
App Foundation
Form Registry
Settings
Permissions
Mobile/PWA Adapters
```

## هنوز کم دارد

- شروع طراحی ظاهری واقعی موبایل
- تبدیل Store به Zustand/React Context واقعی
- TypeScript Migration کامل
- دیتابیس تجهیزات واقعی
- IndexedDB/SQLite Adapter واقعی
- Auth واقعی
- CI/CD
- تست‌های E2E
