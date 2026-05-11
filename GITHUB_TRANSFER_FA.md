# انتقال پروژه به GitHub

## 1) ورود به پوشه پروژه

```bash
cd مسیر-پوشه-پروژه
```

## 2) فعال‌سازی Git

```bash
git init
```

## 3) اضافه کردن فایل‌ها

```bash
git add .
```

## 4) ثبت Commit

```bash
git commit -m "SHIL V7 Final UI Polish"
```

## 5) اتصال به Repository

در GitHub یک Repository بسازید و آدرس آن را جایگزین کنید:

```bash
git remote add origin https://github.com/USERNAME/REPOSITORY.git
```

## 6) تنظیم Branch اصلی

```bash
git branch -M main
```

## 7) ارسال به GitHub

```bash
git push -u origin main
```

## آپدیت‌های بعدی

```bash
git add .
git commit -m "update SHIL"
git push
```
