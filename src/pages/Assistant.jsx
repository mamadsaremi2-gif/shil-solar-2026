import React, { useState } from "react";
import ShilPageShell from "../components/ShilPageShell.jsx";

const allowed = ["خورشیدی", "پنل", "باتری", "اینورتر", "برق", "اضطراری", "کابل", "شارژر", "مصرف", "انرژی", "سانورتر", "ژنراتور"];

export default function Assistant() {
  const [question, setQuestion] = useState("");
  const [items, setItems] = useState([]);

  function submit(event) {
    event.preventDefault();
    const text = question.trim();
    if (!text) return;
    const isAllowed = allowed.some((word) => text.includes(word));
    const answer = isAllowed
      ? "پاسخ تخصصی دستیار SHIL در این بخش براساس چارچوب انرژی خورشیدی، برق اضطراری، تجهیزات و طراحی سیستم نمایش داده می‌شود. در اتصال نهایی، این بخش به موتور هوش مصنوعی اپ متصل می‌شود."
      : "این دستیار فقط به پرسش‌های مرتبط با انرژی خورشیدی، برق اضطراری، تجهیزات و طراحی سیستم پاسخ می‌دهد.";
    setItems([{ title: text, answer }, ...items]);
    setQuestion("");
  }

  return (
    <ShilPageShell title="دستیار هوشمند SHIL">
      <form className="shil-assistant-form" onSubmit={submit}>
        <textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="سوال خود را درباره انرژی خورشیدی یا برق اضطراری وارد کنید..." />
        <button type="submit">ارسال سوال</button>
      </form>
      <section className="shil-thread-list">
        {items.map((item, index) => <article className="shil-thread-card" key={`${item.title}-${index}`}><h3>{item.title}</h3><p>{item.answer}</p></article>)}
      </section>
    </ShilPageShell>
  );
}
