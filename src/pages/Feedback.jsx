import * as React from "react";
import ShilPageShell from "../components/ShilPageShell.jsx";
import { appendUserRecord, readUserRecords } from "../auth/session.js";

const categories = ["UI/UX", "محاسبات", "خطاها", "امکانات جدید", "سناریوها", "عملکرد اپ"];

export default function Feedback() {
  const [category, setCategory] = React.useState(categories[0]);
  const [text, setText] = React.useState("");
  const [threads, setThreads] = React.useState([]);

  React.useEffect(() => {
    setThreads(readUserRecords("shil-feedback", []));
  }, []);

  function submit(event) {
    event.preventDefault();
    if (!text.trim()) return;
    const record = appendUserRecord("shil-feedback", { category, text: text.trim(), adminReply: "در انتظار پاسخ ادمین" });
    setThreads([record, ...threads]);
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
        {threads.map((item) => (
          <article className="shil-thread-card" key={item.id || `${item.category}-${item.text}`}>
            <h3>{item.category}</h3>
            <p>{item.text}</p>
            <div className="shil-admin-reply"><strong>پاسخ ادمین:</strong><span>{item.adminReply}</span></div>
          </article>
        ))}
      </section>
    </ShilPageShell>
  );
}
