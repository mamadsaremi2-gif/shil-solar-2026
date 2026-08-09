# SHIL Project Info Floating V11

- علت عدم اعمال V10: استایل در `src/index.css` قرار داشت، اما لایه‌های Appearance که بعدتر در `main.jsx` وارد می‌شوند آن را Override می‌کردند.
- کلاس والد `shil-project-info-calc-card` از بخش مشخصات اولیه پروژه حذف شد تا Card والد واقعاً از DOM styling فعال خارج شود.
- استایل نهایی مستقل `project-info-floating-cards-v11-final.css` به انتهای `main.jsx` اضافه شد.
- نام پروژه و نام کارفرما در ردیف اول باقی می‌مانند.
- تاریخ ثبت در ردیف دوم، دقیقاً وسط و با عرض یک کارت قرار می‌گیرد.
- Grid و والد پشت سه فیلد transparent و بدون border/shadow/backdrop هستند تا سه کارت مستقیماً روی Background صفحه قرار گیرند.
- تغییر برای هر دو مسیر Solar و Emergency مشترک است، چون هر دو از `ProjectInfo.jsx` استفاده می‌کنند.
- پیش‌فرض‌ها حفظ شدند: نام پروژه `کاربر` و نام کارفرما `SHIL CO`.
