# SHIL Final Optimized Update

این بسته نسخه نهایی بهینه‌شده برای تست، Deploy، GitHub و ساخت APK است.

## تغییرات اصلی

- اضافه شدن بانک پنل خورشیدی SHIL با سه خانواده 400-460W، 530-560W و 600-715W TOPCon.
- اضافه شدن بانک اینورترهای SI / HI / HI2 / Utility.
- اصلاح قطعی SI 1.6KW به سیستم باتری 12V با بازه 11 تا 13V.
- اضافه شدن بانک باتری LiFePO4 شامل 12V، 25.6V و 51.2V.
- اضافه شدن قانون Multi-Inverter: اگر توان/تعداد اینورتر به صورت دستی وارد شود، پنل، باتری، کابل، فضا، حفاظت AC و حفاظت DC برای هر اینورتر جداگانه محاسبه و در Summary ثبت می‌شود.
- افزودن Assetهای نهایی SHIL، QRهای ارتباطی، PWA icons و Android resources.
- پاک‌سازی فایل‌های خراب mipmap و کوچک‌سازی آیکون‌های Android برای رفع خطای mergeDebugResources.
- بهینه‌سازی حجم تصاویر public.

## نصب و تست لوکال

```powershell
npm install --legacy-peer-deps
npm run dev
```

اگر پورت 5173 اشغال بود، Vite پورت بعدی را نشان می‌دهد.

## Build وب

```powershell
npm run build
```

## Sync اندروید

```powershell
npx cap sync android
```

## ساخت APK در لوکال

```powershell
cd android
./gradlew assembleDebug
```

خروجی:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## انتقال به GitHub

```powershell
git add -A
git commit -m "final optimized shil multi inverter update"
git push origin main
```

بعد از Push، GitHub Actions فایل APK را به عنوان artifact می‌سازد.
