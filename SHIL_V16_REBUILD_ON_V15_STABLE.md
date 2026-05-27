# SHIL v16 Rebuild on v15 Stable Base

این بسته از پایه پایدار `v15.3.0` بازسازی شده و تغییرات v16 بدون جایگزینی پرریسک هسته پروژه روی همان پایه اعمال شده است.

## تغییرات اصلی

- اضافه شدن `Dependency Engine` به Rule Sequence رسمی موتور.
- اتصال عمیق‌تر پنل، اینورتر، باتری، MPPT، حفاظت، کابل و فضای نصب.
- ارتقای `Cable Rule` از انتخاب ساده کابل به ارزیابی جریان، طول مسیر و افت ولتاژ.
- ارتقای `Result Summary` به خروجی تفکیکی v16 شامل KPI، بانک تجهیزات، کابل، حفاظت، MPPT و زیرسیستم هر اینورتر.
- اضافه شدن CSS تثبیتی v16 برای UI گلاسه روشن، متن مشکی/بولد، Density بهتر و آیکون‌های نئونی کنترل‌شده.
- حفظ مسیرهای پایدار v15 و جلوگیری از Regression.

## تست پیشنهادی

```bash
npm install
npm run engine:smoke
npm run ops:check
npm run dev -- --force
```

## Flow تست دستی

Login → Dashboard → New Project → Scenario Search → Environment → Inputs → System Settings → Run → Summary

