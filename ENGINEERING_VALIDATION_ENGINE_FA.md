# گزارش افزودن Validation / Error Detection Engine

این نسخه یک موتور اعتبارسنجی مهندسی هوشمند به مسیر اصلی محاسبات اضافه می‌کند.

## فایل‌های اضافه‌شده

- `src/domain/engine/validation/evaluateDesignValidation.js`
- `scripts/engineering-validation-tests.mjs`

## اسکریپت‌های تست

- `npm run test:engineering:validation`
- `npm run test:engineering:all`

## کنترل‌های اضافه‌شده

موتور جدید موارد زیر را به صورت دینامیک بررسی می‌کند:

1. پوشش زمان پشتیبانی باتری نسبت به هدف طراحی
2. نرخ دشارژ باتری نسبت به C-rate پیشنهادی شیمی باتری
3. نرخ شارژ باتری نسبت به ظرفیت بانک
4. پوشش انرژی آرایه PV نسبت به هدف سیستم
5. پوشش PV در بدترین ماه سال برای سیستم Off-Grid
6. ریسک Voc سرد پنل نسبت به حد کنترلر
7. قرار گرفتن Vmp رشته در پنجره MPPT
8. جریان کنترلر نسبت به ظرفیت انتخاب‌شده
9. استفاده دائم و Surge اینورتر
10. افت ولتاژ کابل DC، باتری و AC
11. بزرگی غیرمعمول فیوز باتری
12. انرژی تأمین‌نشده در شبیه‌سازی

## خروجی جدید در نتیجه محاسبات

در `runEngineeringDesign` مقدار زیر اضافه شد:

```js
result.validation = {
  summary: {
    status,
    grade,
    score,
    counts,
    label
  },
  checks: []
}
```

همچنین در `result.summary` این فیلدها اضافه شد:

- `validationScore`
- `validationGrade`
- `validationLabel`
- `validationErrors`
- `validationWarnings`

## اثر روی وضعیت طراحی

اگر Validation Engine خطای مهندسی پیدا کند، `designStatus` به `error` تبدیل می‌شود.
اگر فقط هشدار پیدا کند، `designStatus` به `warning` تبدیل می‌شود.

## تست‌های اضافه‌شده

تست جدید سه سطح را کنترل می‌کند:

1. طراحی سالم ویلایی: وجود خروجی validation و امتیاز قابل استفاده
2. سناریوی مرزی MPPT/Voc: ایجاد هشدار مهندسی
3. سناریوی C-rate خطرناک باتری: ایجاد خطای مهندسی و درجه Risky

## نتیجه تست در این نسخه

```text
Engineering smoke tests passed
Real engineering calculation tests passed
Engineering validation tests passed
All engineering test suites passed
```

## نکته اجرایی

در این محیط، `npm ci` به علت محدودیت زمان اجرا کامل نشد؛ بنابراین Build وابسته به نصب پکیج‌ها دوباره اجرا نشد. اما تست‌های Node-based موتور مهندسی با موفقیت اجرا شد. روی سیستم مقصد پس از `npm ci` دستورهای زیر باید اجرا شوند:

```bash
npm run test:engineering:all
npm run build
```
