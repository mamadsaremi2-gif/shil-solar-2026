import { useState } from "react";
import { useProjectStore } from "../app/store/projectStore";
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
  const { goDashboard } = useProjectStore();
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
    <main className="project-flow-shell ai-page-v15" dir="rtl">
      <section className="flow-top-card compact-page-header">
        <button className="btn btn--ghost" type="button" onClick={goDashboard}>بازگشت به داشبورد</button>
        <div className="flow-top-title">
          <strong>هوش مصنوعی SHIL</strong>
          <small>دستیار تخصصی سیستم‌های خورشیدی و برق اضطراری</small>
        </div>
        <span />
      </section>
      <section className="shil-ai-panel" aria-label="هوش مصنوعی SHIL">
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

        <div className="ai-actions-v15">
          <button className="shil-ai-panel__button" type="button" onClick={sendQuestion} disabled={loading}>
            {loading ? "در حال پردازش..." : "ارسال سوال"}
          </button>
          <button className="btn btn--ghost" type="button" onClick={goDashboard}>بازگشت به داشبورد</button>
        </div>

        {answer ? (
          <article className="shil-ai-panel__answer">
            <strong>پاسخ:</strong>
            <p>{answer}</p>
          </article>
        ) : null}
      </section>
    </main>
  );
}
