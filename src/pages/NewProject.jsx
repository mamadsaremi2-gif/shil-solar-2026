import React from "react";
import MobileShell from "../components/MobileShell.jsx";

export default function NewProject() {
  return (
    <MobileShell title="پروژه جدید">
      <section className="page-card">
        <h1>شروع پروژه جدید</h1>
        <p>انتخاب مسیر طراحی پروژه.</p>

        <div className="list-card">
          <h3>پروژه برق خورشیدی با پنل</h3>
          <p>طراحی PV، انتخاب سناریو، محاسبات پنل، باتری و اینورتر.</p>
        </div>

        <div className="list-card">
          <h3>برق اضطراری</h3>
          <p>محاسبه توان اضطراری، باتری، UPS و ژنراتور.</p>
        </div>

        <button className="primary-btn">تأیید مرحله</button>
      </section>
    </MobileShell>
  );
}
