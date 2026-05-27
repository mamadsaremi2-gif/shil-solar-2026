# ساخت فایل نصبی Android برای SHIL

در این محیط APK ساخته نشد، چون Gradle باید فایل `gradle-8.14.3-all.zip` را از `services.gradle.org` دانلود کند و دسترسی اینترنتی محیط وجود ندارد.

روی سیستم خودت از ریشه پروژه این دستورات را بزن:

```bash
npm install
npm run build
npx cap sync android
cd android
gradlew assembleDebug
```

خروجی APK اینجاست:

```txt
android/app/build/outputs/apk/debug/app-debug.apk
```

برای نسخه Release:

```bash
cd android
gradlew assembleRelease
```

خروجی Release:

```txt
android/app/build/outputs/apk/release/app-release-unsigned.apk
```
