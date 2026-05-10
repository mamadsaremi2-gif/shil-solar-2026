# تغییرات V11 - آموزش و اعلام نظر کاربران

## کارت آموزش
- کارت جدید «آموزش» به داشبورد اضافه شد.
- محتوای آموزش از فایل `public/education-content.md` خوانده می‌شود.
- برای تغییر آموزش‌ها فقط همین فایل را ویرایش کنید و Build/Deploy بگیرید.

## کارت اعلام نظر کاربران اپ
- کارت جدید «اعلام نظر کاربران اپ» به داشبورد اضافه شد.
- کاربر می‌تواند نظر، پیشنهاد توسعه اپ، تجهیزات یا محصولات را ارسال کند.
- نظر کاربر وارد مسیر طراحی، گزارش پروژه یا کارتابل کاربر نمی‌شود.
- نظرها در `localStorage` با کلید `shil_admin_user_feedback` و در صورت وجود جدول Supabase، داخل `app_feedback` ثبت می‌شوند.

## پنل مدیریت
- بخش اختصاصی «نظرات و پیشنهادات کاربران» به پنل مدیریت اضافه شد.
- مدیر می‌تواند پیام‌ها را مشاهده و علامت بررسی‌شده بزند.

## جدول پیشنهادی Supabase اختیاری
```sql
create table if not exists app_feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  message text not null,
  category text,
  source text,
  page_context text,
  metadata jsonb
);

alter table app_feedback enable row level security;

create policy "allow feedback insert"
on app_feedback for insert
with check (true);
```
