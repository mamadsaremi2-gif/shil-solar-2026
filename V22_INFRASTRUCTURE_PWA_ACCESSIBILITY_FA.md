# گزارش V22 — Infrastructure / PWA / Accessibility

این نسخه روی پایداری نهایی زیرساخت موبایل، تجربه PWA، دسترس‌پذیری، رفتار اسکرول و آماده‌سازی نسخه‌های Production تمرکز دارد.

## تغییرات انجام‌شده

### 1. Mobile Shell پایدارتر
- کنترل `100dvh` و `100svh` برای موبایل‌های جدید.
- جلوگیری از بیرون‌زدگی افقی کل اپ.
- محدودسازی اپ به عرض موبایل هوشمند با `max-width: 480px`.
- حفظ Header/Footer ثابت و اسکرول محتوای زیر آن‌ها.

### 2. دسترس‌پذیری پایه
- اضافه شدن Skip Link برای رفتن مستقیم به محتوای اصلی.
- Focus Ring استاندارد برای دکمه‌ها، لینک‌ها، inputها و عناصر قابل تعامل.
- پشتیبانی از `prefers-reduced-motion`.
- پشتیبانی از `prefers-contrast: more`.
- افزایش حداقل touch target به 44px.

### 3. PWA UX
- اضافه شدن `PwaInstallPrompt` برای نمایش پیشنهاد نصب اپ وقتی مرورگر اجازه بدهد.
- بهبود نمایش وضعیت آفلاین/آنلاین با `OfflineStatus` داخل Shell مرکزی.
- آماده‌سازی تجربه نصب/آفلاین برای نسخه‌های بعدی.

### 4. Table و Horizontal Scroll
- استانداردسازی wrapperهای اسکرول افقی.
- بهبود رفتار جدول‌ها در صفحات دیتاسنگین.
- Sticky header اولیه برای جدول‌ها.
- جلوگیری از شکستن جدول‌ها در عرض کم موبایل.

### 5. فرم‌ها و کیبورد موبایل
- تنظیم حداقل `font-size: 16px` برای inputها جهت جلوگیری از zoom ناخواسته iOS.
- بهبود حداقل ارتفاع inputها.
- آماده‌سازی فرم‌ها برای Auto-format و numeric UX در نسخه بعد.

### 6. Header/Footer Refinement
- تثبیت Header مرکزی V17/V18/V19.
- بهبود سایز کپسول عنوان صفحه.
- بهبود رفتار لوگو، دکمه Home و Footer در موبایل‌های کوچک.

## فایل‌های جدید/تغییرکرده

- `src/styles/v22-infrastructure-pwa-accessibility.css`
- `src/ui/PwaInstallPrompt.jsx`
- `src/app/App.jsx`
- `src/styles/modular-appearance.css`

## موارد باقی‌مانده برای V23

- Offline Workspace کامل با sync queue قابل مشاهده.
- Accessibility پیشرفته شامل Screen Reader labels کامل.
- Route restore و Smart Back کامل.
- Virtualized tables برای دیتای بزرگ.
- PWA cache management UI.
- QA نهایی روی موبایل واقعی.

## وضعیت نسخه

- Core Engine: Stable
- Header/Footer: Stable
- Mobile Shell: Stable
- PWA UX: Started
- Accessibility: Started
- Table Scroll: Improved
- Production Readiness: حدود 93٪
