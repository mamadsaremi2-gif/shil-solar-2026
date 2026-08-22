import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  signUpWithSupabaseEmail,
  signOutSupabase,
} from "../services/shilSupabaseAuth.js";
import loginBackground from "../assets/shil-login-solar-home.png";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    company: "",
    requestNote: "",
    password: "",
    passwordConfirm: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const fullName = form.fullName.trim();
    const email = form.email.trim().toLowerCase();
    const password = form.password;

    if (!fullName) return setError("نام و نام خانوادگی را وارد کنید.");
    if (!email || !email.includes("@")) return setError("ایمیل معتبر وارد کنید.");
    if (password.length < 8) return setError("رمز عبور باید حداقل ۸ کاراکتر باشد.");
    if (password !== form.passwordConfirm) return setError("تکرار رمز عبور یکسان نیست.");

    try {
      setLoading(true);
      await signUpWithSupabaseEmail(email, password, {
        full_name: fullName,
        phone: form.phone.trim(),
        company: form.company.trim(),
        request_note: form.requestNote.trim(),
      });

      await signOutSupabase().catch(() => {});
      setSuccess("درخواست عضویت ثبت شد. پس از تأیید مدیر می‌توانید وارد SHIL شوید.");
      window.setTimeout(() => navigate("/login", { replace: true }), 2200);
    } catch (err) {
      const message = String(err?.message || "");
      if (/already|registered|exists/i.test(message)) {
        setError("این ایمیل قبلاً ثبت شده است.");
      } else {
        setError(message || "ثبت‌نام انجام نشد. دوباره تلاش کنید.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="shil-register-page"
      dir="rtl"
      style={{ "--shil-register-bg": `url(${loginBackground})` }}
    >
      <style>{`
        .shil-register-page,.shil-register-page *{box-sizing:border-box}
        .shil-register-page{min-height:100svh;width:100%;display:flex;align-items:center;justify-content:flex-end;padding:max(24px,env(safe-area-inset-top)) clamp(18px,6vw,90px) max(24px,env(safe-area-inset-bottom));position:relative;isolation:isolate;overflow:hidden;background-image:var(--shil-register-bg);background-size:cover;background-position:center 45%;color:#102a43}
        .shil-register-page:before{content:"";position:absolute;inset:0;z-index:-2;background:linear-gradient(90deg,rgba(2,14,28,.01),rgba(2,14,28,.04) 50%,rgba(2,14,28,.12))}
        .shil-register-page:after{content:"";position:absolute;inset:0;z-index:-1;background:radial-gradient(circle at 20% 14%,rgba(255,226,151,.12),transparent 34%)}
        .shil-register-card{width:min(410px,92vw);padding:clamp(16px,2.2vh,22px);border:1px solid rgba(255,255,255,.72);border-radius:18px;background:rgba(255,255,255,.84);box-shadow:0 18px 55px rgba(4,20,35,.16);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}
        .shil-register-brand{text-align:center;margin-bottom:14px}.shil-register-brand strong{display:block;font-size:clamp(30px,8vw,40px);letter-spacing:1px}.shil-register-brand span{display:block;margin-top:4px;font-size:12px;line-height:1.7;color:#486581}
        .shil-register-form{display:grid;gap:9px}.shil-register-form input,.shil-register-form textarea{width:100%;border:1px solid rgba(72,101,129,.25);border-radius:13px;background:rgba(255,255,255,.92);padding:10px 13px;font:inherit;font-size:13px;outline:none}.shil-register-form input{height:44px}.shil-register-form textarea{min-height:70px;resize:vertical}.shil-register-form input:focus,.shil-register-form textarea:focus{border-color:#526d82;box-shadow:0 0 0 3px rgba(82,109,130,.10)}
        .shil-register-form button{min-height:44px;border:0;border-radius:13px;background:#102a43;color:white;font:inherit;font-weight:700;cursor:pointer}.shil-register-form button:disabled{opacity:.58;cursor:wait}
        .shil-register-msg{margin:0;padding:9px 11px;border-radius:11px;font-size:12px;line-height:1.7}.shil-register-error{background:rgba(176,42,55,.10);color:#8a1c28}.shil-register-success{background:rgba(32,122,74,.10);color:#176b3c}
        .shil-register-login{display:block;text-align:center;margin-top:12px;color:#243b53;text-decoration:none;font-size:12px;font-weight:700}.shil-register-note{margin:10px 0 0;text-align:center;font-size:10.5px;line-height:1.65;color:#627d98}
        @media(max-width:430px){.shil-register-page{justify-content:center;padding-inline:12px;background-position:50% center}.shil-register-card{width:min(90vw,350px);padding:14px 13px}.shil-register-form{gap:8px}.shil-register-form input,.shil-register-form button{height:42px;min-height:42px}}
        @media(max-height:700px){.shil-register-card{padding-block:12px}.shil-register-brand{margin-bottom:8px}.shil-register-brand strong{font-size:29px}.shil-register-form input,.shil-register-form button{height:40px;min-height:40px}.shil-register-form textarea{min-height:58px}}
      `}</style>

      <section className="shil-register-card" aria-label="ثبت نام SHIL">
        <div className="shil-register-brand">
          <strong>SHIL</strong>
          <span>درخواست عضویت در سامانه مهندسی</span>
        </div>

        <form className="shil-register-form" onSubmit={handleSubmit}>
          <input value={form.fullName} onChange={(e) => updateField("fullName", e.target.value)} placeholder="نام و نام خانوادگی" autoComplete="name" />
          <input type="email" dir="ltr" value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="Email" autoComplete="email" />
          <input type="tel" dir="ltr" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="شماره تماس - اختیاری" autoComplete="tel" />
          <input value={form.company} onChange={(e) => updateField("company", e.target.value)} placeholder="شرکت / مجموعه - اختیاری" autoComplete="organization" />
          <textarea value={form.requestNote} onChange={(e) => updateField("requestNote", e.target.value)} placeholder="توضیح کوتاه درباره درخواست عضویت - اختیاری" rows={3} />
          <input type="password" dir="ltr" value={form.password} onChange={(e) => updateField("password", e.target.value)} placeholder="رمز عبور - حداقل ۸ کاراکتر" autoComplete="new-password" />
          <input type="password" dir="ltr" value={form.passwordConfirm} onChange={(e) => updateField("passwordConfirm", e.target.value)} placeholder="تکرار رمز عبور" autoComplete="new-password" />

          {error ? <p className="shil-register-msg shil-register-error" role="alert">{error}</p> : null}
          {success ? <p className="shil-register-msg shil-register-success" role="status">{success}</p> : null}

          <button type="submit" disabled={loading}>{loading ? "در حال ثبت..." : "ارسال درخواست عضویت"}</button>
        </form>

        <Link className="shil-register-login" to="/login">حساب دارید؟ ورود به SHIL</Link>
        <p className="shil-register-note">حساب جدید با نقش کاربر عادی و وضعیت انتظار ساخته می‌شود و پس از تأیید مدیر فعال خواهد شد.</p>
      </section>
    </main>
  );
}
