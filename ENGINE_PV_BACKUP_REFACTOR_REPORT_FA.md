# گزارش اصلاح موتور محاسبات PV و برق اضطراری

## خلاصه اصلاحات انجام‌شده

این نسخه روی موتور محاسباتی سیستم خورشیدی و برق اضطراری تمرکز دارد و بدون شکستن حالت‌های قبلی، قابلیت‌های زیر را اضافه یا اصلاح می‌کند:

1. اضافه شدن حالت برق اضطراری خورشیدی با فلگ‌های `backupWithSolar`, `backupSolarMode: "with_solar"` یا `systemSubtype: "backup_with_solar"`.
2. اصلاح روش شارژ مجدد باتری در محاسبه PV با پارامتر `batteryRechargeDays`.
3. تفکیک ضرایب دمایی پنل به `panelPowerTempCoeffPercentPerC` و `panelVmpTempCoeffPercentPerC` در کنار `panelTempCoeffVoc`.
4. اصلاح منطق هشدار Oversizing بر اساس نوع سیستم: Grid-tie، Hybrid، Off-grid و Backup Solar.
5. توضیح‌پذیر شدن انتخاب آرایش MPPT با خروجی `mpptDesign.selectionExplanation`.
6. اضافه شدن اولویت‌بندی بارهای برق اضطراری با فیلد `backupPriority` برای هر بار.
7. افزودن خروجی `battery.backupPriorityCoverage` برای نمایش اینکه بارهای ضروری/مهم/اختیاری چند ساعت پشتیبانی می‌شوند.
8. سازگار شدن Controller، Installation، Simulation و Advisor با حالت Backup with Solar.

---

## فایل‌های تغییرکرده

```txt
src/domain/engine/pv/calculatePv.js
src/domain/engine/input/normalizeInput.js
src/domain/engine/load/calculateLoads.js
src/domain/engine/battery/calculateBattery.js
src/domain/engine/controller/calculateController.js
src/domain/engine/installation/calculateInstallation.js
src/domain/engine/simulation/simulateSystem.js
src/domain/engine/advisor/generateAdvisorMessages.js
src/domain/engine/decision/calculateDecisionEngine.js
```

---

## ورودی‌های جدید قابل استفاده

### حالت برق اضطراری خورشیدی

```js
{
  systemType: "backup",
  backupWithSolar: true,
  backupSolarMode: "with_solar"
}
```

حالت قدیمی برق اضطراری بدون پنل همچنان بدون تغییر کار می‌کند:

```js
{
  systemType: "backup",
  backupWithSolar: false
}
```

### زمان شارژ مجدد باتری

```js
batteryRechargeDays: 2
```

یعنی موتور PV تلاش می‌کند انرژی ذخیره‌شده باتری را طی ۲ روز دوباره جبران کند.

### ضرایب دمایی پنل

```js
panelTempCoeffVoc: 0.0024,
panelPowerTempCoeffPercentPerC: 0.35,
panelVmpTempCoeffPercentPerC: 0.29
```

- `panelTempCoeffVoc` برای Voc سرد است.
- `panelPowerTempCoeffPercentPerC` برای افت توان در گرماست.
- `panelVmpTempCoeffPercentPerC` برای افت Vmp گرم است.

### اولویت بار در برق اضطراری

```js
{
  name: "یخچال",
  power: 180,
  backupPriority: "important"
}
```

مقادیر قابل استفاده:

```txt
critical
important
optional
```

---

## نتایج تست سناریوها

| سناریو | وضعیت | مصرف روزانه | باتری | پنل | توان PV | تولید روزانه PV | نتیجه |
|---|---:|---:|---:|---:|---:|---:|---|
| PV سبک | warning | 1.5 kWh | 1 عدد | 3 عدد | 1.755 kW | 6.52 kWh | از نظر فنی سالم ولی بیش‌طراحی اقتصادی |
| PV متوسط | warning | 7 kWh | 5 عدد | 7 عدد | 4.095 kW | 15.21 kWh | متعادل برای آفگرید با ذخیره باتری |
| PV سنگین | warning | 35 kWh | 6 عدد | 28 عدد | 16.38 kW | 60.86 kWh | انرژی متعادل، MPPT مرزی |
| Backup سبک | success | 0.3 kWh | 2 عدد | 0 | 0 | 0 | برق اضطراری باتری‌محور سالم |
| Backup متوسط | success | 2.784 kWh | 4 عدد | 0 | 0 | 0 | پوشش بارهای ضروری و مهم سالم |
| Backup سنگین خورشیدی | warning | 19.8 kWh | 12 عدد | 14 عدد | 8.19 kW | 30.43 kWh | قابل اجرا با هشدار اقتصادی/ظرفیتی |

---

## خروجی جدید اولویت بار اضطراری

نمونه خروجی برای Backup متوسط:

```json
[
  { "level": "critical", "estimatedBackupHours": 28.14, "status": "pass" },
  { "level": "important", "estimatedBackupHours": 17.59, "status": "pass" },
  { "level": "optional", "estimatedBackupHours": 17.59, "status": "pass" }
]
```

این خروجی کمک می‌کند در UI نشان دهیم:

- فقط بارهای ضروری چند ساعت روشن می‌مانند.
- ضروری + مهم چند ساعت روشن می‌مانند.
- همه بارها چند ساعت روشن می‌مانند.

---

## تست‌های اجراشده

```bash
npm run test:engineering:all
npm run build
```

نتیجه:

```txt
All engineering test suites passed
vite build passed
```

در Build فقط هشدار موجود درباره chunk بزرگ و دو تصویر resolve نشده دیده شد. خطای کامپایل وجود ندارد.

---

## نکات باقی‌مانده برای مرحله بعد

1. UI باید گزینه «برق اضطراری خورشیدی» را نمایش دهد.
2. در فرم بارها باید انتخاب اولویت `critical / important / optional` اضافه شود.
3. در خروجی مهندسی باید `mpptDesign.selectionExplanation` و `battery.backupPriorityCoverage` نمایش داده شوند.
4. برای سناریوهای سنگین بهتر است پیشنهاد چند اینورتر/چند MPPT در UI نمایش داده شود.
5. مرحله بعدی پیشنهادی: مهاجرت همین مدل‌های موتور به TypeScript.
