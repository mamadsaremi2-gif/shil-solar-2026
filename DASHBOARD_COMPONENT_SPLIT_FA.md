# گزارش تفکیک کامپوننت‌های داشبورد

## هدف
داشبورد از یک فایل بزرگ و چندمسئولیتی به چند فایل مستقل با وظیفه مشخص تبدیل شد، بدون تغییر در رفتار کاربر.

## ساختار جدید

```txt
src/features/dashboard/
  DashboardPage.jsx
  components/
    DashboardActionCard.jsx
    DashboardActionGrid.jsx
    DashboardHeader.jsx
    DashboardHero.jsx
    DashboardHeroPanel.jsx
    DashboardStats.jsx
  hooks/
    useSystemStatus.js
  model/
    dashboardCards.js
    systemStatus.js
```

## مسئولیت‌ها

- `DashboardPage.jsx`: اتصال store/auth و چیدن بخش‌های اصلی صفحه
- `DashboardHeader.jsx`: برند، لوگو، نام کاربر و سطح دسترسی
- `DashboardHero.jsx`: متن معرفی و badge اصلی داشبورد
- `DashboardStats.jsx`: تعداد پروژه‌ها، وضعیت سامانه و نقش کاربر
- `DashboardActionGrid.jsx`: لیست کارت‌های عملیاتی
- `DashboardActionCard.jsx`: ظاهر هر کارت عملیاتی
- `useSystemStatus.js`: بررسی آنلاین/آفلاین، localStorage و Supabase
- `dashboardCards.js`: تعریف مدل کارت‌های داشبورد
- `systemStatus.js`: منطق ساخت وضعیت قابل نمایش سامانه

## نتیجه

داشبورد اکنون برای توسعه‌های بعدی مثل آخرین پروژه‌ها، کتابخانه تجهیزات، نمودارها و کنترل‌های ادمین آماده‌تر است.
