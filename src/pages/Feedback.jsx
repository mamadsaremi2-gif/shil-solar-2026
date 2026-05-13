import React from "react";
import MobileShell from "../components/MobileShell.jsx";

export default function Feedback() {
  return (
    <MobileShell title="بازخورد کاربر">
      <section className="page-card">
        <h1>بازخورد کاربر</h1>
        <p>ثبت مشکل، پیشنهاد یا درخواست قابلیت جدید.</p>

        <input className="input" placeholder="عنوان بازخورد" />
        <textarea className="textarea" placeholder="توضیحات..." />
        <button className="primary-btn">ثبت بازخورد</button>
      </section>
    </MobileShell>
  );
}
