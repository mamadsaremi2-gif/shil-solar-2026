import { useState } from "react";
import { useProjectStore } from "../app/store/projectStore";
import { askSolarAI } from "./aiService";
import { SHIL_IMAGE_MANIFEST } from "../design/assetManifest";
const allowedKeywords = ["پنل", "باتری", "اینورتر", "شارژر", "mppt", "ups", "خورشیدی", "سولار", "کابل", "فیوز", "ژنراتور", "برق اضطراری", "طراحی", "محاسبه", "توان", "آمپراژ"];
function isRelated(text) { const value = String(text || "").toLowerCase(); return allowedKeywords.some((key) => value.includes(key.toLowerCase())); }
export default function AIExpertSolar() {
  const { goDashboard } = useProjectStore(); const [question, setQuestion] = useState(""); const [answer, setAnswer] = useState(""); const [loading, setLoading] = useState(false);
  async function sendQuestion() { if (!question.trim()) return; if (!isRelated(question)) { setAnswer("❗ لطفاً فقط درباره سیستم‌های خورشیدی و برق اضطراری سؤال بپرسید."); return; } setLoading(true); const aiAnswer = await askSolarAI(question); setAnswer(aiAnswer); setLoading(false); }
  return <main className="mobile-page-shell ai-page-v15" dir="rtl"><header className="mobile-fixed-header"><button className="mobile-back-btn" type="button" onClick={goDashboard}>‹</button><img className="mobile-header-logo" src={SHIL_IMAGE_MANIFEST.branding.headerLogo.path} alt="SHIL" /><span className="mobile-title-pill">هوش مصنوعی SHIL</span></header><section className="mobile-scroll-content no-footer-space"><section className="shil-ai-panel"><div className="shil-ai-panel__header"><span>✦</span><h2>هوش مصنوعی SHIL</h2><p>پرسش تخصصی درباره خورشیدی، UPS، باتری و اینورتر.</p></div><textarea className="shil-ai-panel__textarea" placeholder="سوال خود را وارد کنید..." value={question} onChange={(e) => setQuestion(e.target.value)} /><div className="ai-actions-v15"><button className="shil-ai-panel__button" type="button" onClick={sendQuestion} disabled={loading}>{loading ? "در حال پردازش..." : "ارسال سوال"}</button></div>{answer ? <article className="shil-ai-panel__answer"><strong>پاسخ:</strong><p>{answer}</p></article> : null}</section></section></main>;
}
