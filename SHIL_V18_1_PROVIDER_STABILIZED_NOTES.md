# SHIL V18.1 Provider Stabilized Final

این نسخه روی پایه واقعی V18 ساخته شد و ایراد مسیر `/new-project/system/solar` که باعث خطای `Cannot read properties of null (reading 'useContext')` می‌شد، با حذف وابستگی‌های شکننده Router Context از مسیر بحرانی تنظیمات سیستم و Shell پروژه برطرف شد.

## اصلاحات کلیدی
- تثبیت مسیر `/new-project/system/:domain`
- حذف وابستگی مستقیم مسیر بحرانی تنظیمات سیستم به `useParams/useNavigate`
- حذف وابستگی Shellهای ثابت پروژه به Hookهای Router برای جلوگیری از Context Crash
- حفظ BrowserRouter و Routeهای اصلی برنامه
- افزودن تست `route:guard`
- اجرای کامل تست‌های موتور، QA و Production Check

## تست‌های پاس‌شده
- `node tools/smoke-engine.mjs`
- `node tools/v17-engine-qa.mjs`
- `node tools/v18-final-qa.mjs`
- `node tools/v18-route-provider-guard.mjs`
- `node tools/production-check.mjs`

## اجرا
```bash
npm install
npm run engine:v18
npm run route:guard
npm run dev -- --force
```
