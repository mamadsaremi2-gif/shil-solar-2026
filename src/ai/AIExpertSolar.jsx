import { useState } from "react";
import { askSolarAI } from "./aiService";

const allowedKeywords = [
  "پنل",
  "باتری",
  "اینورتر",
  "شارژر",
  "mppt",
  "ups",
  "خورشیدی",
  "سولار",
  "کابل",
  "فیوز",
  "ژنراتور",
  "برق اضطراری",
  "طراحی",
  "محاسبه",
  "توان",
  "آمپراژ",
];

function isRelated(text) {
  const value = String(text || "").toLowerCase();
  return allowedKeywords.some((key) => value.includes(key.toLowerCase()));
}

export default function AIExpertSolar() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendQuestion() {
    if (!question.trim()) return;

    if (!isRelated(question)) {
      setAnswer("❗ لطفاً فقط درباره سیستم‌های خورشیدی و برق اضطراری سؤال بپرسید.");
      return;
    }

    setLoading(true);
    const aiAnswer = await askSolarAI(question);
    setAnswer(aiAnswer);
    setLoading(false);
  }

  return (
    <section className="shil-ai-panel" dir="rtl" aria-label="هوش مصنوعی SHIL">
      <div className="shil-ai-panel__header">
        <span>✦</span>
        <h2>هوش مصنوعی SHIL</h2>
        <p>پرسش تخصصی درباره سیستم‌های خورشیدی، UPS، باتری، اینورتر، کابل‌کشی و برق اضطراری.</p>
      </div>

      <textarea
        className="shil-ai-panel__textarea"
        placeholder="سوال خود را درباره سیستم‌های خورشیدی یا برق اضطراری وارد کنید..."
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
      />

      <button className="shil-ai-panel__button" type="button" onClick={sendQuestion} disabled={loading}>
        {loading ? "در حال پردازش..." : "ارسال سوال"}
      </button>

      {answer ? (
        <article className="shil-ai-panel__answer">
          <strong>پاسخ:</strong>
          <p>{answer}</p>
        </article>
      ) : null}
    </section>
  );
}
