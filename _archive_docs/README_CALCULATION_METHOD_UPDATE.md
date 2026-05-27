# SHIL Calculation Method Update

این پکیج مرحله بعد از صفحه شرایط محیطی را کامل می‌کند.

## مسیر جدید

سناریوهای آماده یا پروژه جدید → شرایط محیطی → روش محاسبات → موتور بار → تنظیمات سیستم → چکیده → اجرای محاسبات

## موارد اضافه‌شده

- صفحه روش محاسبات با ۵ کارت:
  - لیست تجهیزات
  - پروفایل مصرف
  - انرژی مورد نیاز
  - توان کل
  - جریان کل
- بانک ۲۵۰ تجهیز مصرفی سبک، متوسط و سنگین
- توان، ساعت مصرف منطقی، ضریب همزمانی، kWh روزانه و Surge Factor برای هر تجهیز
- موتور محاسبات بار در `src/core/calculation/loadEngine.js`
- ذخیره خروجی استاندارد در localStorage:
  - `shil:loadCalculationDraft`
  - `shil:loadEngineResult`
  - `shil:equipmentDraft`
- اتصال ادامه مسیر به `SystemSettings`

## دستور تست

```powershell
npm install
npm run build
npm run dev
```
