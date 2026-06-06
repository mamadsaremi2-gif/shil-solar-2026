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
    <ShilPageShell title="آموزش">
      <section className="shil-info-panel">
        <h3>مرکز آموزش SHIL</h3>
        <p>این صفحه توسط ادمین تکمیل و به‌روزرسانی می‌شود و محل نمایش نکات آموزشی محصولات، تجهیزات انرژی خورشیدی و برق اضطراری است.</p>
      </section>
      <section className="shil-list-panel">
        {modules.map((item) => <article className="shil-mini-project-card" key={item}><strong>{item}</strong><span>قابل مدیریت و بروزرسانی توسط ادمین</span></article>)}
      </section>
    </ShilPageShell>
  );
}
