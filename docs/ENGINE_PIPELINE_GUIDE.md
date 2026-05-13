# راهنمای Engine Pipeline

قانون اصلی:

```txt
UI → Mapper → Engineering Form → runEngineeringDesign → Pipeline → Validation → Result
```

برای اضافه‌کردن Engine جدید:

1. فایل Engine در `src/core/engineering/engines` ساخته شود.
2. خروجی آن مستقل از UI باشد.
3. در Pipeline با یک `key` مشخص ثبت شود.
4. خطاها با `AppError` برگردند.
5. Validation مربوط به آن در Validation Engine اضافه شود.

نمونه Stage:

```js
{
  key: "pv",
  optional: true,
  run: async (form, result) => calculatePvSystem(form, result)
}
```

هیچ Component نباید مستقیماً Engine را صدا بزند.
