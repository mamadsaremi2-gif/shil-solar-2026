# نصب و اجرای پروژه SHIL در ترمینال

## 1) ورود به پوشه پروژه

```bash
cd مسیر-پوشه-پروژه
```

مثال:

```bash
cd Desktop/SMART_SHIL_SOLAR_MOBILE_V7_FINAL_FULL_INSTALL
```

## 2) نصب پکیج‌ها

```bash
npm install
```

## 3) اجرای لوکال

```bash
npm run dev
```

سپس آدرس زیر را باز کنید:

```txt
http://localhost:5173
```

## 4) اجرای قابل مشاهده روی موبایل در همان WiFi

```bash
npm run dev -- --host
```

بعد IP سیستم را روی موبایل باز کنید، مثل:

```txt
http://192.168.1.5:5173
```

## 5) گرفتن خروجی Production

```bash
npm run build
```

خروجی در پوشه زیر ساخته می‌شود:

```txt
dist/
```
