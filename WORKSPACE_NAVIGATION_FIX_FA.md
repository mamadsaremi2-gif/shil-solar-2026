# گزارش اصلاح مسیر کارت‌های صفحه پروژه

## مشکل
در صفحه «مسیر طراحی»، بعضی کارت‌ها مثل:

- انتخاب مسیر پروژه
- تنظیمات سیستم
- اجرای محاسبات

بعد از کلیک وارد محتوای مربوطه نمی‌شدند یا صفحه دچار خطای runtime می‌شد.

## علت
در فایل زیر چند Hook ری‌اکت استفاده شده بود، ولی import نشده بود:

```txt
src/features/project-workspace/components/ProjectWorkspaceSections.jsx
```

Hookهای جاافتاده:

```js
useState
useMemo
useRef
```

این باعث می‌شد بعضی مراحل فقط هنگام باز شدن همان صفحه خطا بدهند؛ چون مثلاً مرحله «انتخاب مسیر» از `useState` استفاده می‌کرد و مرحله «اجرای محاسبات» از `useRef` و `useMemo`.

## اصلاح انجام‌شده
این import به ابتدای فایل اضافه شد:

```js
import { useMemo, useRef, useState } from "react";
```

## نتیجه تست
Build پروژه با موفقیت انجام شد:

```bash
npm run build
```

و خروجی Vite بدون خطای build تولید شد.
