# SHIL v17 Rebuild on v16 Stable

این نسخه مستقیماً از `SHIL_v16_REBUILD_ON_V15_STABLE_FIXED.zip` ساخته شده و تغییرات v17 روی همان پایه پایدار اعمال شده است.

## اصلاح بحرانی
در v16، `disabledCalculationRules` بعد از Ruleهای فعال در `ruleRegistry` اضافه شده بود و چند Rule واقعی را overwrite می‌کرد:

- voltage
- protection
- cable
- environment

به همین دلیل بانک‌ها در UI وجود داشتند ولی موتور در بعضی مسیرها هنوز به Placeholder/Disabled Rule می‌رسید. در v17 ترتیب Registry اصلاح شد تا Ruleهای فعال همیشه اولویت نهایی داشته باشند.

## موارد اضافه‌شده
- تست `npm run engine:v17`
- QA اتصال بانک‌ها به موتور
- کنترل تولید BOM کابل و حفاظت
- کنترل تولید خروجی چنداینورتری/زیرسیستمی
- نسخه پروژه به `17.0.0` ارتقا یافت

## دستورات تست
```bash
npm install
npm run engine:smoke
npm run engine:v17
npm run ops:check
npm run dev -- --force
```

## مسیر تست UI
```text
Login → Dashboard → New Project → Scenario Search → Environment → Inputs → System Settings → Run → Summary
```
