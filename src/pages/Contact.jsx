import React from "react";
import MobileShell from "../components/MobileShell.jsx";

export default function Contact() {
  return (
    <MobileShell title="ارتباط با ما">
      <section className="page-card">
        <h1>ارتباط با ما</h1>
        <p>برای پشتیبانی، توسعه پروژه یا گزارش خطا با تیم SHIL در ارتباط باشید.</p>

        <div className="list-card">
          <h3>تماس</h3>
          <p>شماره تماس / واتساپ / ایمیل در نسخه نهایی متصل می‌شود.</p>
        </div>

        <div className="list-card">
          <h3>پشتیبانی فنی</h3>
          <p>ارسال فایل پروژه، گزارش خطا و درخواست بررسی محاسبات.</p>
        </div>
      </section>
    </MobileShell>
  );
}
