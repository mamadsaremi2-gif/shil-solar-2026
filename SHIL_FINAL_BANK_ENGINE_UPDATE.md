# SHIL Final Bank + Unified Engine Update

این نسخه، بانک فنی SHIL را برای موتور محاسبات نهایی‌سازی می‌کند. اصل معماری این نسخه این است که موتور بر اساس «دیتای مهندسی» تصمیم بگیرد، نه نام مدل یا سری تجاری.

## تغییرات اصلی

### 1. بانک پنل‌ها
مسیر اصلی:

```txt
src/data/shilSolarBanks.js
src/data/registry/panels/panels.registry.js
```

- مدل و سری تجاری از منطق محاسبات حذف شده است.
- هر پنل به صورت `engineeringClass` تعریف شده است.
- همه آیتم‌ها با برند نمایشی `SHIL` ثبت شده‌اند.
- داده‌های اصلی شامل توان، Voc، Vmp، Isc، Imp، ضریب دمایی، فیوز سری، ولتاژ سیستم، bifacial و ابعاد است.

### 2. بانک تجهیزات حفاظتی
مسیر اصلی:

```txt
src/data/shilSolarBanks.js
src/data/registry/protection/protection.registry.js
```

گروه‌های اضافه‌شده:

```txt
dcMcb
dcMccb
spd
fuse
isolator
loadDisconnector
ac
battery
```

- مدل تجاری در منطق موتور استفاده نمی‌شود.
- موتور بر اساس ولتاژ، جریان، پل، نوع تجهیز، کلاس SPD، نوع DC/AC و IP انتخاب می‌کند.

### 3. Protection Rule نسخه 2
مسیر:

```txt
src/engine/rules/electrical/protection.rules.js
```

این Rule حالا به Registry مرکزی متصل است و خروجی‌های زیر را تولید می‌کند:

- PV DC breaker
- PV fuse
- PV SPD
- PV isolator
- Battery fuse
- AC breaker

### 4. منابع دیتاشیت
برای نگهداری و ممیزی، دیتاشیت‌های مبنا در مسیر زیر قرار گرفته‌اند:

```txt
docs/datasheets/
```

این فایل‌ها فقط مرجع هستند؛ موتور مستقیماً PDF را نمی‌خواند، بلکه از Registry استاندارد استفاده می‌کند.

## تست‌های انجام‌شده در این بسته

```txt
npm run engine:smoke
npm run ops:check
```

هر دو تست با وضعیت موفق اجرا شدند.

## اجرای پروژه

```bash
npm install
npm run dev -- --force
```

## تست موتور

```bash
npm run engine:smoke
npm run ops:check
```

## نکته معماری

هر قانون جدید در آینده باید از مسیر Engine/Rules اضافه شود و صفحات UI نباید مستقیماً محاسبات مهندسی انجام دهند.
