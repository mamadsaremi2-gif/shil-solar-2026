# Validation Notes

## انجام‌شده
- `package.json` با Node خوانده و اعتبار JSON آن تأیید شد.
- `package-lock.json` با `npm install --package-lock-only --legacy-peer-deps` بعد از تغییر dependencyها به‌روزرسانی شد.
- اسکن importهای سورس انجام شد و هیچ dependency گمشده‌ای برای importهای مستقیم باقی نماند.

## نکته Build
در محیط فعلی، نصب کامل `node_modules` به‌دلیل محدودیت زمان اجرای کانتینر کامل نشد؛ بنابراین build نهایی داخل همین محیط کامل اجرا نشد. خطایی که دیده شد ناشی از نصب ناقص `node_modules` بود، نه الزاماً خطای کد پروژه. برای تست نهایی در سیستم توسعه:

```bash
npm ci --legacy-peer-deps
npm run build
npx cap sync android
```
