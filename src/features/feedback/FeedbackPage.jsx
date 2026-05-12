import { useEffect, useMemo, useState } from "react";
import { useProjectStore } from "../../app/store/projectStore";
import { useAuth } from "../auth/AuthProvider";
import { getSupabaseClient, isSupabaseConfigured } from "../../shared/lib/supabaseLazy";

const ADMIN_FEEDBACK_STORAGE_KEY = "shil_admin_user_feedback";
const USER_FEEDBACK_STORAGE_PREFIX = "shil_user_feedback_";

function safeParse(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function userFeedbackKey(userId) {
  return `${USER_FEEDBACK_STORAGE_PREFIX}${userId || "local-dev"}`;
}

async function submitFeedbackToCloud(payload) {
  if (!isSupabaseConfigured) return { ok: false, skipped: true };
  try {
    const supabase = await getSupabaseClient();
    if (!supabase) return { ok: false, skipped: true };
    const { error } = await supabase.from("app_feedback").insert({
      user_id: payload.userId,
      message: payload.message,
      category: payload.category,
      source: payload.source,
      page_context: payload.pageContext,
      metadata: payload,
    });
    if (error) return { ok: false, error };
    return { ok: true };
  } catch (error) {
    console.warn("Feedback cloud submit failed", error);
    return { ok: false, error };
  }
}

export function FeedbackPage() {
  const { goDashboard } = useProjectStore();
  const { user, profile } = useAuth();
  const userId = user?.id || profile?.id || "local-dev";
  const storageKey = useMemo(() => userFeedbackKey(userId), [userId]);
  const [form, setForm] = useState({ category: "app-development", message: "" });
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [myFeedback, setMyFeedback] = useState([]);

  useEffect(() => {
    setMyFeedback(safeParse(storageKey).filter((item) => !item.deletedForUser));
  }, [storageKey]);

  function writeUserFeedback(items) {
    const visible = items.filter((item) => !item.deletedForUser);
    setMyFeedback(visible);
    localStorage.setItem(storageKey, JSON.stringify(items.slice(0, 300)));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const message = form.message.trim();
    if (message.length < 5) {
      setStatus("لطفاً نظر یا پیشنهاد را کامل‌تر وارد کنید.");
      return;
    }
    setSaving(true);
    const payload = {
      id: crypto.randomUUID(),
      userId,
      userEmail: user?.email || profile?.email || "local",
      createdAt: new Date().toISOString(),
      category: form.category,
      message,
      source: "dashboard-feedback-card",
      pageContext: "user-feedback-private-to-admin",
      status: "new",
      visibility: "admin-only",
      deletedForUser: false,
    };

    const userQueue = safeParse(storageKey);
    writeUserFeedback([payload, ...userQueue]);

    const adminQueue = safeParse(ADMIN_FEEDBACK_STORAGE_KEY);
    localStorage.setItem(ADMIN_FEEDBACK_STORAGE_KEY, JSON.stringify([payload, ...adminQueue].slice(0, 1000)));

    await submitFeedbackToCloud(payload);
    setSaving(false);
    setForm({ category: "app-development", message: "" });
    setStatus("نظر شما ثبت شد؛ در کارتابل شخصی شما باقی می‌ماند و فقط مدیریت نسخه کامل آن را می‌بیند.");
  }

  function hideForUser(id) {
    const nextUserItems = safeParse(storageKey).map((item) => item.id === id ? { ...item, deletedForUser: true, userDeletedAt: new Date().toISOString() } : item);
    writeUserFeedback(nextUserItems);
    const adminItems = safeParse(ADMIN_FEEDBACK_STORAGE_KEY).map((item) => item.id === id ? { ...item, deletedForUser: true, userDeletedAt: new Date().toISOString() } : item);
    localStorage.setItem(ADMIN_FEEDBACK_STORAGE_KEY, JSON.stringify(adminItems));
    setStatus("نظر از کارتابل شما حذف شد؛ نسخه مدیریتی برای پیگیری باقی می‌ماند.");
  }

  return (
    <main className="mobile-page-shell feedback-page-v11" dir="rtl">
      <header className="mobile-fixed-header"><button className="mobile-back-btn" type="button" onClick={goDashboard}>‹</button><img className="mobile-header-logo" src="/images/branding/shil-logo.png" alt="SHIL" /><span className="mobile-title-pill">اعلام نظر کاربران</span></header>
      <section className="mobile-scroll-content no-footer-space">
        <section className="focus-content-card feedback-card-v11 feedback-card-final">
          <h2>نظرات و پیشنهادات شما موجب توسعه اپ و کیفیت محصولات و اضافه کردن تجهیزات جدید مطابق با نیازهای شما می‌گردد. لطفاً نظرات خود را برای ما ارسال کنید.</h2>
          <form className="feedback-form-v11" onSubmit={handleSubmit}>
            <label>موضوع نظر<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option value="app-development">توسعه اپ</option><option value="engineering-flow">فرآیند مهندسی</option><option value="equipment-bank">بانک تجهیزات</option><option value="products">محصولات و تجهیزات</option><option value="bug-report">گزارش خطا</option><option value="other">سایر</option></select></label>
            <label>متن نظر یا پیشنهاد<textarea value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder="نظر، پیشنهاد، نیاز تجهیزاتی یا ایراد مشاهده‌شده را اینجا بنویسید..." rows={5} /></label>
            <div className="feedback-actions-v11"><button className="btn btn--primary" type="submit" disabled={saving}>{saving ? "در حال ارسال..." : "ارسال برای مدیریت"}</button></div>
            {status ? <p className="section-note">{status}</p> : null}
          </form>
          <section className="user-feedback-inbox"><div className="project-bucket-title"><strong>کارتابل نظرات من</strong><span>{myFeedback.length} مورد</span></div>{myFeedback.length ? <div className="user-feedback-list">{myFeedback.map((item) => <article key={item.id} className="user-feedback-item"><div><strong>{item.category}</strong><small>{new Date(item.createdAt).toLocaleString("fa-IR")}</small></div><p>{item.message}</p><button type="button" className="btn btn--ghost btn--sm" onClick={() => hideForUser(item.id)}>حذف از کارتابل من</button></article>)}</div> : <p className="empty-state">هنوز نظری ثبت نکرده‌اید.</p>}</section>
        </section>
      </section>
    </main>
  );
}

export default FeedbackPage;
