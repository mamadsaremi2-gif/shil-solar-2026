import React, { useEffect, useState } from "react";
import ShilPageShell from "../components/ShilPageShell.jsx";
import { appendUserRecord, readUserRecords } from "../auth/session.js";

const categories = ["UI/UX", "Ù…Ø­Ø§Ø³Ø¨Ø§Øª", "Ø®Ø·Ø§Ù‡Ø§", "Ø§Ù…Ú©Ø§Ù†Ø§Øª Ø¬Ø¯ÛŒØ¯", "Ø³Ù†Ø§Ø±ÛŒÙˆÙ‡Ø§", "Ø¹Ù…Ù„Ú©Ø±Ø¯ Ø§Ù¾"];

export default function Feedback() {
  const [category, setCategory] = useState(categories[0]);
  const [text, setText] = useState("");
  const [threads, setThreads] = useState([]);

  useEffect(() => {
    setThreads(readUserRecords("shil-feedback", []));
  }, []);

  function submit(event) {
    event.preventDefault();
    if (!text.trim()) return;
    const record = appendUserRecord("shil-feedback", { category, text: text.trim(), adminReply: "Ø¯Ø± Ø§Ù†ØªØ¸Ø§Ø± Ù¾Ø§Ø³Ø® Ø§Ø¯Ù…ÛŒÙ†" });
    setThreads([record, ...threads]);
    setText("");
  }

  return (
    <ShilPageShell title="Ù†Ø¸Ø±Ø§Øª Ú©Ø§Ø±Ø¨Ø±Ø§Ù†">
      <form className="shil-feedback-form" onSubmit={submit}>
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          {categories.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯ Ø®ÙˆØ¯ Ø±Ø§ Ø¯Ø± Ú†Ù‡Ø§Ø±Ú†ÙˆØ¨ Ø¹Ù†ÙˆØ§Ù† Ø§Ù†ØªØ®Ø§Ø¨ Ø´Ø¯Ù‡ ÙˆØ§Ø±Ø¯ Ú©Ù†ÛŒØ¯..." />
        <button type="submit">Ø«Ø¨Øª Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯</button>
      </form>
      <section className="shil-thread-list">
        {threads.map((item) => (
          <article className="shil-thread-card" key={item.id || `${item.category}-${item.text}`}>
            <h3>{item.category}</h3>
            <p>{item.text}</p>
            <div className="shil-admin-reply"><strong>Ù¾Ø§Ø³Ø® Ø§Ø¯Ù…ÛŒÙ†:</strong><span>{item.adminReply}</span></div>
          </article>
        ))}
      </section>
    </ShilPageShell>
  );
}
