import React from "react";
import ShilPageShell from "../components/ShilPageShell.jsx";

const modules = [
  "آموزش تجهیزات انرژی خورشیدی",
  "آموزش تجهیزات برق اضطراری",
  "نکات نصب و بهره برداری",
  "محصولات و تجهیزات برند SHIL",
];

export default function Education() {
  return (
    <ShilPageShell title="آموزش" className="shil-education-page-v529">
      <section className="shil-education-intro-v529">
        <h3>مرکز آموزش SHIL</h3>
        <p>این صفحه توسط ادمین تکمیل و به‌روزرسانی می‌شود و محل نمایش نکات آموزشی محصولات، تجهیزات انرژی خورشیدی و برق اضطراری است.</p>
      </section>
      <section className="shil-education-list-v529">
        {modules.map((item) => <article className="shil-education-card-v529" key={item}><strong>{item}</strong><span>قابل مدیریت و بروزرسانی توسط ادمین</span></article>)}
      </section>
    </ShilPageShell>
  );
}
