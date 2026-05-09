# گزارش تفکیک کامپوننت‌ها و معماری پروژه SHIL

این نسخه روی پایه‌ی `cleaned-safe` ساخته شده و هدف آن جدا کردن صفحه‌ها، ظاهر، منطق محاسباتی و لایه‌های داده است.

## وضعیت جدید ساختار

```txt
src/
  app/
    App.jsx
    providers/
    store/

  features/
    project-workspace/
      ProjectWorkspacePage.jsx
      components/
        ProjectWorkspaceSections.jsx
      model/
        designModel.js

    dashboard/
      DashboardPage.jsx

    engineering-output/
      pages/
        OutputPage.jsx
      components/
        AdvisorList.jsx

    equipment-library/
      EquipmentLibraryPage.jsx

    ready-scenarios/
      ReadyScenariosPage.jsx

    contact/
      ContactPage.jsx

    admin/
      pages/
        AdminPage.jsx

  domain/
    engine/
      orchestrator/
      battery/
      pv/
      inverter/
      controller/
      cable/
      protection/
      simulation/
      validation/

  data/
    repositories/
    adapters/
    seed/

  shared/
    components/
    constants/
    lib/
    utils/

  pages/
    فقط wrapper/export برای سازگاری importهای قبلی
```

## تفکیک انجام‌شده

### 1. صفحه Project Workspace

فایل قدیمی `src/pages/ProjectWorkspacePage.jsx` حدود ۷۴۸ خط بود و همه چیز را با هم داشت:

- UI مراحل
- اعتبارسنجی فرم
- محاسبه demand
- انتخاب تجهیزات پیشنهادی
- محاسبات باتری و پنل
- مدیریت گردش صفحه

در نسخه جدید به این ساختار تبدیل شد:

```txt
src/features/project-workspace/
  ProjectWorkspacePage.jsx
  components/ProjectWorkspaceSections.jsx
  model/designModel.js
```

#### `model/designModel.js`
شامل منطق غیرظاهری:

- `DESIGN_STEPS`
- `STEP_META`
- `PV_TYPES`
- `METHOD_LABELS`
- `BATTERY_DOD`
- `SEASON_OPTIONS`
- `demandFromForm`
- `recommendation`
- `validate`
- `batteryArrangementText`
- `applyCityPatch`
- helperهای عددی و شهری

#### `components/ProjectWorkspaceSections.jsx`
شامل ظاهر مراحل:

- `FlowHeader`
- `FlowStepper`
- `DesignOverview`
- `ProjectInfo`
- `SiteConditions`
- `PathSelect`
- `MethodSelect`
- `CalculationInputs`
- `SystemConfig`
- `Review`
- `FinalResult`

#### `ProjectWorkspacePage.jsx`
فقط orchestration صفحه را نگه می‌دارد:

- اتصال به store
- کنترل stepها
- next/back
- save draft
- انتخاب component هر مرحله

## 2. تفکیک صفحه‌ها به feature

صفحه‌های اصلی از حالت متمرکز در `src/pages` خارج شدند و هرکدام به feature خودش منتقل شد:

| صفحه | مسیر جدید |
|---|---|
| Dashboard | `src/features/dashboard/DashboardPage.jsx` |
| Project Workspace | `src/features/project-workspace/ProjectWorkspacePage.jsx` |
| Output / Report | `src/features/engineering-output/pages/OutputPage.jsx` |
| Equipment Library | `src/features/equipment-library/EquipmentLibraryPage.jsx` |
| Ready Scenarios | `src/features/ready-scenarios/ReadyScenariosPage.jsx` |
| Contact | `src/features/contact/ContactPage.jsx` |
| Admin | `src/features/admin/pages/AdminPage.jsx` |

پوشه `src/pages` هنوز باقی مانده اما فقط برای export سازگار استفاده می‌شود تا importهای قبلی خراب نشود.

## 3. مرزبندی معماری پیشنهادی اکنون

| نوع کد | محل درست |
|---|---|
| ظاهر صفحه و UI اختصاصی | `src/features/*/components` یا فایل feature page |
| منطق محاسباتی | `src/domain/engine` |
| منطق فرم و مدل feature | `src/features/*/model` |
| داده seed | `src/data/seed` |
| repository و adapter | `src/data/repositories` و `src/data/adapters` |
| کامپوننت عمومی | `src/shared/components` |
| utility عمومی | `src/shared/utils` |
| state سراسری | `src/app/store` |

## 4. نتیجه تست

بعد از تفکیک، دستور زیر اجرا شد و موفق بود:

```bash
npm run build
```

خروجی build سالم است. فقط warning قبلی bundle بزرگ همچنان وجود دارد که مربوط به `jspdf`، `html2canvas` و chunk اصلی است و ربطی به تفکیک فعلی ندارد.

## 5. مرحله بعد پیشنهادی

برای کامل‌تر شدن معماری، مرحله بعد بهتر است این موارد انجام شود:

1. شکستن `OutputPage` به `model/outputFormatters.js` و `components/ReportSections.jsx`
2. شکستن `EquipmentLibraryPage` به بخش‌های form، table، filter و editor
3. lazy-load کردن صفحات سنگین مثل خروجی PDF و پنل ادمین
4. جدا کردن CSS هر feature از فایل global بزرگ
5. حذف تدریجی wrapperهای `src/pages` بعد از آپدیت importهای اصلی
