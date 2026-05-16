import React, { useState } from "react";
import ShilPageShell from "../components/ShilPageShell.jsx";

const categories = ["UI/UX", "محاسبات", "خطاها", "امکانات جدید", "سناریوها", "عملکرد اپ"];

export default function Feedback() {
  const [category, setCategory] = useState(categories[0]);
  const [text, setText] = useState("");
  const [threads, setThreads] = useState([
    { category: "امکانات جدید", text: "افزودن سناریوهای بیشتر برای پروژه های صنعتی", adminReply: "این پیشنهاد در مسیر توسعه سناریوهای آماده بررسی می‌شود." },
  ]);

  function submit(event) {
    event.preventDefault();
    if (!text.trim()) return;
    setThreads([{ category, text: text.trim(), adminReply: "در انتظار پاسخ ادمین" }, ...threads]);
    setText("");
  }

  return (
    <ShilPageShell title="نظرات کاربران">
      <form className="shil-feedback-form" onSubmit={submit}>
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          {categories.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="پیشنهاد خود را در چهارچوب عنوان انتخاب شده وارد کنید..." />
        <button type="submit">ثبت پیشنهاد</button>
      </form>
      <section className="shil-thread-list">
        {threads.map((item, index) => (
          <article className="shil-thread-card" key={`${item.category}-${index}`}>
            <h3>{item.category}</h3>
            <p>{item.text}</p>
            <div className="shil-admin-reply"><strong>پاسخ ادمین:</strong><span>{item.adminReply}</span></div>
          </article>
        ))}
      </section>
    </ShilPageShell>
  );
}
