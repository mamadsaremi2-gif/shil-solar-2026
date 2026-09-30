# SHIL v16.10 - Native Export Fix

## مشکل
در نسخه Android/Capacitor، ذخیره تصویر و PDF بر مبنای لینک دانلود مرورگر (`a.download`) و `jsPDF.save()` بود. این روش داخل Android WebView قابل اتکا نیست. اشتراک فایل نیز به Web Share API وابسته بود که در WebView ممکن است موجود نباشد یا فایل را پشتیبانی نکند.

## اصلاح
- یک Capacitor Plugin بومی با نام `ShilExport` به پروژه Android اضافه شد.
- ذخیره PNG و PDF در Android 10+ مستقیماً با MediaStore در `Downloads/SHIL` انجام می‌شود.
- اشتراک PDF با Android Sharesheet و `FileProvider` انجام می‌شود.
- نسخه وب/PWA همچنان fallback دانلود مرورگر و Web Share را حفظ می‌کند.
- مسیرهای خروجی یک‌صفحه‌ای و چندصفحه‌ای هر دو به مسیر native متصل شدند.
- اصلاح جستجوی تجهیزات v16.9 حفظ شده است.

## فایل‌های اصلی تغییرکرده
- `src/export/nativeExportBridge.js`
- `src/export/shilExportSystem.js`
- `android/app/src/main/java/com/shil/engineering/ShilExportPlugin.java`
- `android/app/src/main/java/com/shil/engineering/MainActivity.java`

## تست مورد انتظار روی APK
1. ذخیره تصویر -> فایل PNG در Downloads/SHIL
2. ذخیره PDF -> فایل PDF در Downloads/SHIL
3. اشتراک PDF -> باز شدن Android Sharesheet و نمایش برنامه‌های قابل اشتراک
