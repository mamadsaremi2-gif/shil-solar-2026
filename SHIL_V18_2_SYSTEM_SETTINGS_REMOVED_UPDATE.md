# SHIL V18.2 - System Settings Removed for Redesign

## هدف
صفحه پیکربندی سیستم به دلیل خطای مکرر Context و وابستگی‌های شکننده از مسیر اصلی حذف شد تا در مرحله بعد از صفر و با معماری مستقل بازطراحی شود.

## تغییرات
- مسیر اصلی ورودی محاسبات دیگر به `/new-project/system/:domain` نمی‌رود و مستقیم به اجرای محاسبات هدایت می‌شود.
- صفحه `/new-project/system/:domain` حذف منطقی شده و فقط یک صفحه امن و مستقل برای اطلاع‌رسانی نمایش می‌دهد.
- هیچ useNavigate/useParams/useLocation/useContext شکننده‌ای در صفحه پیکربندی باقی نمانده است.
- Step Rail دیگر تنظیمات سیستم را به عنوان مرحله فعال اصلی نمایش نمی‌دهد.
- موتور V18 و تست‌های QA بدون خطا پاس شدند.

## تست‌های پاس‌شده
```bash
node tools/v18-route-provider-guard.mjs
node tools/smoke-engine.mjs
node tools/v18-final-qa.mjs
node tools/production-check.mjs
```

## مسیر تست پیشنهادی
```txt
Login -> Dashboard -> New Project -> Info -> Environment -> Path -> Method -> Inputs -> Run -> Summary
```

## نکته
در نسخه بعد، صفحه پیکربندی سیستم باید از صفر با ساختار جدید طراحی شود و فقط از خروجی استاندارد Engine/Registry استفاده کند.
