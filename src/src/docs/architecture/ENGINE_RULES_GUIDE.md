# SHIL Engine Rules Guide

## ممنوع

- نوشتن محاسبه داخل JSX
- استفاده مستقیم از Rule داخل صفحه
- تغییر State از داخل Rule
- استفاده از localStorage داخل Rule
- import کردن UI داخل Engine

## مجاز

- Rule خالص با ورودی و خروجی مشخص
- Validation قبل از محاسبه
- خروجی شامل warnings / explanations / values
- فعال سازی مرحله ای Ruleها از `ruleGroups`

## خروجی استاندارد Rule

```js
{
  ok: true,
  values: {},
  equipment: {},
  warnings: [],
  explanations: []
}
```
