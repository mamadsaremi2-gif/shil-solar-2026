import React, { useEffect, useState } from "react";
import ShilPageShell from "../components/ShilPageShell.jsx";
import { appendUserRecord, readUserRecords } from "../auth/session.js";

const allowed = ["Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ", "Ù¾Ù†Ù„", "Ø¨Ø§ØªØ±ÛŒ", "Ø§ÛŒÙ†ÙˆØ±ØªØ±", "Ø¨Ø±Ù‚", "Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ", "Ú©Ø§Ø¨Ù„", "Ø´Ø§Ø±Ú˜Ø±", "Ù…ØµØ±Ù", "Ø§Ù†Ø±Ú˜ÛŒ", "Ø³Ø§Ù†ÙˆØ±ØªØ±", "Ú˜Ù†Ø±Ø§ØªÙˆØ±"];

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
      ? "Ù¾Ø§Ø³Ø® ØªØ®ØµØµÛŒ Ø¯Ø³ØªÛŒØ§Ø± SHIL Ø¯Ø± Ø§ÛŒÙ† Ø¨Ø®Ø´ Ø¨Ø±Ø§Ø³Ø§Ø³ Ú†Ø§Ø±Ú†ÙˆØ¨ Ø§Ù†Ø±Ú˜ÛŒ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒØŒ Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒØŒ ØªØ¬Ù‡ÛŒØ²Ø§Øª Ùˆ Ø·Ø±Ø§Ø­ÛŒ Ø³ÛŒØ³ØªÙ… Ù†Ù…Ø§ÛŒØ´ Ø¯Ø§Ø¯Ù‡ Ù…ÛŒâ€ŒØ´ÙˆØ¯. Ø¯Ø± Ø§ØªØµØ§Ù„ Ù†Ù‡Ø§ÛŒÛŒØŒ Ø§ÛŒÙ† Ø¨Ø®Ø´ Ø¨Ù‡ Ù…ÙˆØªÙˆØ± Ù‡ÙˆØ´ Ù…ØµÙ†ÙˆØ¹ÛŒ Ø§Ù¾ Ù…ØªØµÙ„ Ù…ÛŒâ€ŒØ´ÙˆØ¯."
      : "Ø§ÛŒÙ† Ø¯Ø³ØªÛŒØ§Ø± ÙÙ‚Ø· Ø¨Ù‡ Ù¾Ø±Ø³Ø´â€ŒÙ‡Ø§ÛŒ Ù…Ø±ØªØ¨Ø· Ø¨Ø§ Ø§Ù†Ø±Ú˜ÛŒ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒØŒ Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒØŒ ØªØ¬Ù‡ÛŒØ²Ø§Øª Ùˆ Ø·Ø±Ø§Ø­ÛŒ Ø³ÛŒØ³ØªÙ… Ù¾Ø§Ø³Ø® Ù…ÛŒâ€ŒØ¯Ù‡Ø¯.";
    const record = appendUserRecord("shil-assistant-questions", { title: text, answer, status: "answered" });
    setItems([record, ...items]);
    setQuestion("");
  }

  return (
    <ShilPageShell title="Ø¯Ø³ØªÛŒØ§Ø± Ù‡ÙˆØ´Ù…Ù†Ø¯ SHIL">
      <form className="shil-assistant-form" onSubmit={submit}>
        <textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ø³ÙˆØ§Ù„ Ø®ÙˆØ¯ Ø±Ø§ Ø¯Ø±Ø¨Ø§Ø±Ù‡ Ø§Ù†Ø±Ú˜ÛŒ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ ÛŒØ§ Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ ÙˆØ§Ø±Ø¯ Ú©Ù†ÛŒØ¯..." />
        <button type="submit">Ø§Ø±Ø³Ø§Ù„ Ø³ÙˆØ§Ù„</button>
      </form>
      <section className="shil-thread-list">
        {items.map((item) => <article className="shil-thread-card" key={item.id || item.title}><h3>{item.title}</h3><p>{item.answer}</p></article>)}
      </section>
    </ShilPageShell>
  );
}
