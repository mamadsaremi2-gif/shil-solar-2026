# SHIL Engineering Brain Injection Update

این پکیج، مغز محاسبات مهندسی را به موتور یکپارچه SHIL اضافه می‌کند؛ بدون اینکه UI مستقیماً با قوانین درگیر شود.

## مسیرهای اصلی

```txt
src/engine/core/runEngine.js
src/engine/core/engineGateway.js
src/engine/core/runRules.js
src/engine/rules/index.js
src/engine/rules/core/validation.rules.js
src/engine/rules/electrical/*.rules.js
src/engine/rules/selection/*.rules.js
src/engine/rules/summary/resultSummary.rules.js
src/engine/utils/
```

## قوانین فعال‌شده

1. `validation`
2. `loadEstimation`
3. `panelSelection`
4. `inverterSelection`
5. `batterySelection`
6. `stringDesign`
7. `voltage`
8. `environment`
9. `protection`
10. `cable`
11. `resultSummary`

## اصل معماری

صفحه‌ها نباید Rule را مستقیم import کنند. مسیر درست:

```txt
UI -> Store -> engineGateway -> runEngine -> runRules -> rules/index.js -> result
```

## تست سریع

```bash
npm install
npm run engine:smoke
npm run dev -- --force
```

## خروجی استاندارد موتور

موتور خروجی زیر را برمی‌گرداند:

```js
{
  ok,
  mode,
  calculationsEnabled,
  values,
  equipment,
  summary,
  warnings,
  errors,
  explanations,
  appliedRules,
  skippedRules,
  trace
}
```

## نکته مهم

قوانین فعلی نسخه پایه مهندسی هستند و برای پایدارسازی مسیر محاسبات، چکیده و PDF طراحی شده‌اند. در مرحله بعد می‌توان قوانین دقیق‌تر را فقط در همین مسیر اضافه/اصلاح کرد.
