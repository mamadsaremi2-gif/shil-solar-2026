# SHIL UX Flow 100% Update

این پکیج برای رساندن UX Flow به سطح نهایی آماده شده است.

## تغییرات اصلی

- ذخیره خودکار پروژه در هر مرحله از سناریو داخل بخش پروژه‌های در حال اجرا.
- ادامه پروژه از آخرین Route واقعی بازدیدشده.
- ثبت پروژه در پروژه‌های نهایی بعد از تأیید نهایی خروجی.
- عبور صحیح مسیر برق اضطراری مستقیم به چکیده اطلاعات و اجرای محاسبات، بدون نمایش مراحل خورشیدی.
- فعال شدن Toastهای کوتاه برای تأیید ذخیره، ثبت پروژه نهایی و خروجی‌ها.
- فعال شدن عملکرد دکمه‌های خروجی: ذخیره JSON، چاپ/PDF، اشتراک، ذخیره تصویر در صورت وجود AI Preview.
- حفظ پشتیبانی ورودی فارسی/انگلیسی در فیلدها.
- اصلاح رفتار Guard برای مسیر برق اضطراری تا صفحه چکیده قفل نشود.

## فایل‌های مهم اضافه/اصلاح‌شده

- `src/workflow/uxFlowController.js`
- `src/components/UXFlowController.jsx`
- `src/app/App.jsx`
- `src/pages/project/ProjectPath.jsx`
- `src/components/ProjectStepGuard.jsx`
- `src/pages/project/RunCalculation.jsx`
- `src/styles/shil-ux-flow-100.css`
- `src/main.jsx`

## تست پیشنهادی

```powershell
npm install
npm run build
npm run dev -- --host 0.0.0.0 --port 5177
```

مسیرهای تست:

- `/new-project/path`
- `/new-project/summary/emergency`
- `/new-project/system/solar`
- `/new-project/run/solar`
- `/projects/running`
- `/projects/final`
