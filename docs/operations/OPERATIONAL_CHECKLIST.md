# چک‌لیست بهره‌برداری SHIL

## 1. نصب

```bash
npm install
```

## 2. تست موتور

```bash
npm run engine:smoke
npm run ops:check
```

خروجی موفق باید شامل `ACTIVE_ENGINE` و `READY_FOR_OPERATION` باشد.

## 3. گزارش سلامت موتور

```bash
npm run ops:report
```

فایل خروجی:

```txt
public/diagnostics/engine-health.json
```

## 4. اجرای UI

```bash
npm run dev -- --force
```

آدرس پیش‌فرض:

```txt
http://localhost:5173
```

## 5. مسیر تست دستی

- ورود به اپ
- داشبورد
- پروژه جدید
- تنظیمات سیستم
- تأیید و رفتن به چکیده
- بررسی عدم وجود صفحه سفید یا خطای Console

## 6. Build نهایی

```bash
npm run prod:build
```
