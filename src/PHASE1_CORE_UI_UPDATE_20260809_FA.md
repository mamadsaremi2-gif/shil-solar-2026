# گزارش مرحله اول اصلاح رابط SHIL - 1405/05/18

در این مرحله فقط لایه Core UI اصلاح شده است و بازطراحی اختصاصی صفحه «مدیریت پروژه‌ها» و صفحات فرزند آن به مرحله بعد واگذار شده است.

## تغییرات اعمال‌شده

- حذف `shil-global-black-text.css` از زنجیره فعال Import تا قانون قدیمی `color:#000 !important` دیگر روی کل اپ تحمیل نشود.
- ایجاد لایه نهایی `shil-phase1-core-ui-final.css` و قرارگیری آن به عنوان آخرین Import در `main.jsx`.
- تعریف Design Token های جدید برای متن، سطوح، Border، Cyan، Mint و Gold.
- بازطراحی Header مشترک با حفظ تصویر جرقه، Overlay تیره کنترل‌شده و متن سفید/یخی با کنتراست بالا.
- بازطراحی Footer مشترک با حفظ تصویر پلتفرم و دکمه‌های لوبیایی روشن و خوانا، بدون متن مشکی.
- یکسان‌سازی رنگ آیکون‌های Header/Footer با `currentColor` تا آیکون‌ها نیز از رنگ مشکی قدیمی خارج شوند.
- تعریف Hover / Focus خوانا با Accent فیروزه‌ای.
- تثبیت قرارداد ارتفاع Header و Footer همراه با Safe Area موبایل.
- تثبیت یک Scroll Viewport اصلی بین Header و Footer و جلوگیری از Scroll افقی سراسری.
- خنثی‌سازی ظاهر کارت/Glass روی Wrapper های ساختاری `shil-page-content` و `shil-engineering-content` تا لایه‌های والد اضافی روی بک‌گراند دیده نشوند.
- حفظ رنگ متن تیره و خوانا برای Input/Select/Textarea روی سطوح روشن، بدون تحمیل یک رنگ ثابت به کل محتوای اپ.

## فایل‌های تغییر یافته

- `src/main.jsx`
- `src/appearance/styles/shil-phase1-core-ui-final.css` (جدید)
- `src/PHASE1_CORE_UI_UPDATE_20260809_FA.md` (جدید)

## محدوده این مرحله

در این مرحله عمداً ساختار کارت‌های صفحه مدیریت پروژه‌ها، پروژه‌های در حال اجرا، پروژه‌های نهایی و آرشیو بازطراحی نشده است تا تغییرات مرحله اول فقط روی Foundation / Header / Footer / Design Tokens / Containers متمرکز بماند.
