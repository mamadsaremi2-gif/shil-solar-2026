# قوانین تغییرات آینده SHIL

## اگر آیکون داشبورد اضافه/حذف شد

```txt
src/modules/dashboard/dashboard.icons.js
src/modules/dashboard/dashboard.config.js
```

## اگر مرحله جدید به پروژه جدید اضافه شد

```txt
src/modules/new-project/newProject.steps.js
src/modules/new-project/steps/XX-new-step/
```

## اگر روش محاسبه اضافه شد

```txt
src/modules/new-project/steps/04-calculation-method/calculationMethods.config.js
src/modules/new-project/steps/05-calculation-inputs/modes/
src/core/engineering/engines/
src/core/engineering/pipeline/
```

## اگر Field یا ورودی مهندسی اضافه شد

```txt
src/core/engineering/schema/engineeringSchema.js
src/modules/new-project/steps/[step]/[step].fields.js
src/modules/new-project/newProject.mapper.js
```

## اگر قرارداد Engine تغییر کرد

```txt
src/core/engineering/contracts/
src/core/engineering/orchestrator/runEngineeringDesign.js
docs/ENGINE_PIPELINE_GUIDE.md
```

## اگر ذخیره‌سازی یا دیتابیس تغییر کرد

```txt
src/data/storage/
src/data/repositories/
src/data/migrations/
src/data/sync/
```

## اگر ظاهر، رنگ، آیکون، Header، Footer یا Layout تغییر کرد

```txt
src/mobile-ui/
src/shared/components/
```

## ممنوع

- نوشتن محاسبات داخل UI
- تکرار Stepها در چند فایل
- تکرار Routeها
- تکرار Validation
- وابسته کردن Engine به Component
- حذف قراردادهای `engineeringForm` و `engineeringResult`
- دور زدن `runEngineeringDesign`
