import React, { useEffect, useState } from "react";
import ShilPageShell from "../components/ShilPageShell.jsx";
import { appendUserRecord, readUserRecords } from "../auth/session.js";

const allowed = ["خورشیدی", "پنل", "باتری", "اینورتر", "برق", "اضطراری", "کابل", "شارژر", "مصرف", "انرژی", "سانورتر", "ژنراتور"];

export default function Assistant() {
  const [question, setQuestion] = useState("");
  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems(readUserRecords("shil-assistant-questions", []));
  }, []);

  function submit(event) {
    event.preventDefault();
    const text = question.trim();
    if (!text) return;
    const isAllowed = allowed.some((word) => text.includes(word));
    const answer = isAllowed
      ? "پاسخ تخصصی دستیار SHIL در این بخش براساس چارچوب انرژی خورشیدی، برق اضطراری، تجهیزات و طراحی سیستم نمایش داده می‌شود. در اتصال نهایی، این بخش به موتور هوش مصنوعی اپ متصل می‌شود."
      : "این دستیار فقط به پرسش‌های مرتبط با انرژی خورشیدی، برق اضطراری، تجهیزات و طراحی سیستم پاسخ می‌دهد.";
    const record = appendUserRecord("shil-assistant-questions", { title: text, answer, status: "answered" });
    setItems([record, ...items]);
    setQuestion("");
  }

  return (
    <ShilPageShell title="دستیار هوشمند SHIL">
      <div id="shil-assistant-root" className="shil-assistant-page shil-assistant-unified">
        <section className="shil-assistant-intro shil-section-card">
          <div className="shil-section-title">پرسش از دستیار هوشمند</div>
          <p className="shil-assistant-hint">
            سؤال‌های مرتبط با انرژی خورشیدی، برق اضطراری، تجهیزات و طراحی سیستم را وارد کنید.
          </p>

          <form className="shil-assistant-form" onSubmit={submit}>
            <label className="shil-assistant-field-label" htmlFor="shil-assistant-question">متن سؤال</label>
            <textarea
              id="shil-assistant-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="سؤال خود را درباره انرژی خورشیدی یا برق اضطراری وارد کنید..."
            />
            <button type="submit" disabled={!question.trim()}>ارسال سؤال</button>
          </form>
        </section>

        <section className="shil-assistant-history shil-section-card">
          <div className="shil-section-title">پرسش‌ها و پاسخ‌ها</div>
          <div className="shil-thread-list">
            {items.length === 0 ? (
              <div className="shil-assistant-empty">هنوز سؤالی ثبت نشده است.</div>
            ) : (
              items.map((item) => (
                <article className="shil-thread-card" key={item.id || item.title}>
                  <div className="shil-thread-question">
                    <span>سؤال</span>
                    <h3>{item.title}</h3>
                  </div>
                  <div className="shil-thread-answer">
                    <span>پاسخ دستیار</span>
                    <p>{item.answer}</p>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </ShilPageShell>
  );
}
