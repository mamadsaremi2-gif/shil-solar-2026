# گزارش نسخه نهایی اصلاح‌شده SHIL

این نسخه شامل اصلاحات نهایی پیش از تست واقعی است:

- حفظ قانون حذف لوگوی بالا راست فقط در صفحه اول داشبورد.
- حفظ لوگوی صفحات داخلی در Header.
- اضافه شدن کارت چهارم «هوش مصنوعی SHIL / بزودی» در بلوک اطلاعات داشبورد.
- اضافه شدن ساختار `src/ai` شامل `aiPrompt.js`، `aiService.js` و `AIExpertSolar.jsx`.
- عنوان کامپوننت هوش مصنوعی به «هوش مصنوعی SHIL» تغییر داده شد.
- سرویس AI برای تست لوکال آماده است و کلید API را از `VITE_OPENAI_API_KEY` می‌خواند.
- اضافه شدن تصویر اختصاصی برای کارت «پروژه برق خورشیدی با پنل».
- اضافه شدن تصویر اختصاصی برای کارت «برق اضطراری».
- تصاویر کارت‌ها داخل `public/images/cards` قرار گرفتند و با `object-fit: contain` تعریف شدند تا داخل کارت بریده نشوند.
- تقویت افکت نئونی و کارت‌های تصویری مسیر پروژه.
- تقویت چیدمان خطی صفحه چکیده اطلاعات با override نهایی.
- حفظ قانون Mobile First و جلوگیری از overflow افقی.
- Build نهایی با موفقیت تست شد.

## مسیرهای مهم

```txt
public/images/cards/solar-project-card.png
public/images/cards/backup-power-card.png
src/ai/aiPrompt.js
src/ai/aiService.js
src/ai/AIExpertSolar.jsx
```

## نکته API

برای فعال‌سازی واقعی هوش مصنوعی در تست لوکال، فایل `.env.local` بسازید و مقدار زیر را قرار دهید:

```txt
VITE_OPENAI_API_KEY=YOUR_API_KEY
```

در نسخه Production بهتر است API از طریق Backend Proxy یا Vercel Serverless محافظت شود.
