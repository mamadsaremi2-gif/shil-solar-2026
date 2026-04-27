# Solar Design Suite - SHIL

اپلیکیشن مهندسی طراحی سیستم خورشیدی، سانورتر و باتری با React + Vite + PWA.

## اجرای محلی

```bash
npm ci
npm run dev
```

سپس باز کنید:

```text
http://localhost:5173/
```

## تست روی گوشی در شبکه داخلی

```bash
npm run dev:host
```

سپس آدرس Network که Vite نمایش می‌دهد را در مرورگر گوشی باز کنید.

## تست مهندسی موتور محاسبات

```bash
npm run test:engineering
```

این تست، محاسبات اصلی را برای سناریوی off-grid و backup کنترل می‌کند.

## ساخت نسخه نهایی

```bash
npm ci
npm run test:engineering
npm run build
npm run preview
```

خروجی production پس از اجرای build داخل پوشه `dist/` ساخته می‌شود. پوشه `dist/` داخل سورس نگهداری نمی‌شود و باید هنگام انتشار ساخته شود.

## انتشار روی Vercel

این پروژه فایل `vercel.json` دارد. در Vercel:

- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm ci`

## انتشار روی GitHub Pages

Workflow آماده است:

```text
.github/workflows/deploy-pages.yml
```

بعد از Push روی branch `main`، در GitHub:

```text
Settings -> Pages -> Source: GitHub Actions
```

## امکانات اصلی

- Off-Grid / Hybrid / Grid-Tie
- حالت اختصاصی سانورتر و باتری
- جدول سناریوهای باتری 12V / 24V / 48V
- پروفایل مصرف ساعتی
- شبیه‌سازی SOC
- خروجی PDF خلاصه یک‌صفحه‌ای
- بانک تجهیزات و تجهیزات سفارشی
- ارتباط با ما، QR و برندینگ SHIL
- PWA قابل نصب روی گوشی
