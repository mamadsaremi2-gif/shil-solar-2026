# معماری SHIL Core Infrastructure v2

```txt
SHIL Mobile
├── app
├── modules
├── core
│   ├── errors
│   ├── state
│   ├── engineering
│   │   ├── contracts
│   │   ├── schema
│   │   ├── pipeline
│   │   ├── registry
│   │   ├── engines
│   │   ├── validation
│   │   └── orchestrator
│   ├── report
│   └── workflow
├── data
│   ├── repositories
│   ├── storage
│   ├── migrations
│   ├── sync
│   └── seed
├── shared
│   ├── components
│   ├── constants
│   ├── guards
│   ├── hooks
│   ├── services
│   └── utils
├── mobile-ui
├── assets
├── config
├── docs
└── tests
```

## مسیر پروژه جدید

```txt
1. اطلاعات پروژه
2. شرایط محیطی
3. انتخاب مسیر پروژه
4. روش محاسبات
5. ورودی محاسبات
6. تنظیمات سیستم
7. چکیده اطلاعات
8. اجرای محاسبات
9. توسعه
```

## Core Engineering Flow

```txt
Workflow State
→ newProject.mapper
→ Engineering Form Contract
→ Schema Validation
→ Engine Pipeline
→ Engineering Validation
→ Advisor Messages
→ Report / Save
```

## اصل توسعه

هیچ UI Component نباید مستقیماً محاسبه انجام دهد. همه ورودی‌ها باید از Mapper عبور کنند و فقط `runEngineeringDesign` نقطه ورود محاسبات باشد.
