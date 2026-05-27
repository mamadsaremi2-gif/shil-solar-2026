# SHIL Data Registry + Central Store Update

## هدف
این آپدیت زیرساخت مرکزی برای مدیریت دیتا و وضعیت برنامه را اضافه می‌کند، بدون اینکه UI فعلی یا موتور محاسباتی دوباره به صفحه تنظیمات سیستم وصل شود.

## Data Registry
مسیر اصلی:

```txt
src/data/registry/
```

ساختار:

```txt
src/data/registry/
├── panels/panels.registry.js
├── inverters/inverters.registry.js
├── batteries/batteries.registry.js
├── protection/protection.registry.js
├── cables/cables.registry.js
├── environments/environments.registry.js
├── selectors/equipmentSelectors.js
├── utils/normalizeEquipment.js
├── equipmentRegistry.js
└── index.js
```

مصرف استاندارد دیتا:

```js
import { getEquipmentBank, getEquipmentById, findEquipment } from './src/data/registry';
```

از این به بعد صفحه‌ها نباید مستقیم از بانک‌های پراکنده مثل `shilSolarBanks.js` دیتا بخوانند. دیتای قدیمی فعلاً منبع خام باقی مانده، اما خروجی استاندارد فقط از Registry گرفته می‌شود.

## Central Store
مسیر اصلی:

```txt
src/store/
```

ساختار:

```txt
src/store/
├── shilStore.js
├── index.js
├── slices/
│   ├── createProjectSlice.js
│   ├── createEquipmentSlice.js
│   ├── createUiSlice.js
│   └── createAuthSlice.js
├── selectors/shilSelectors.js
└── persistence/storePersistence.js
```

مصرف استاندارد Store:

```js
import { useShilStore, selectProject, selectSelectedEquipment } from './src/store';
```

## قانون نگهداری
- UI فقط از `src/store` و `src/data/registry` استفاده کند.
- قوانین محاسبات فقط از `src/engine/rules` اضافه شوند.
- هیچ صفحه‌ای نباید Rule Engine را مستقیم پیاده‌سازی کند.
- هر دیتای جدید ابتدا وارد Registry شود، بعد در UI مصرف شود.

## وضعیت محاسبات
موتور محاسبات همچنان در حالت ایزوله/Passive باقی مانده تا قوانین جدید مرحله‌ای و امن اضافه شوند.
