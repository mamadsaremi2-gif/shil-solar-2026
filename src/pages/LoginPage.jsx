import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase/client.js";
import { createSession, getCurrentSession } from "../auth/session.js";
import { recordUserLogin } from "../services/shilUserAccessService.js";
import { safeLocalRemoveItem, safeLocalSetItem } from "../services/storageQuotaGuard.js";
import loginBackground from "../assets/shil-login-solar-home.png";

const AUTH_TIMEOUT_MS = 12000;
function withTimeout(promise, message = "زمان پاسخ‌گویی سرور تمام شد.") {
  return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error(message)), AUTH_TIMEOUT_MS))]);
}

export default function LoginPage() {
  const navigate = useNavigate();
  const rememberedLogin = typeof window !== "undefined" && localStorage.getItem("shil:remember-login") === "1" ? (localStorage.getItem("shil:last-login-email") || "") : "";
  const [login, setLogin] = useState(rememberedLogin);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberLogin, setRememberLogin] = useState(() => typeof window !== "undefined" && localStorage.getItem("shil:remember-login") === "1");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [guestMode, setGuestMode] = useState(false);
  const [guest, setGuest] = useState({ fullName: "", email: "", phone: "", company: "" });

  async function handleGuestSubmit(event) {
    event.preventDefault(); setError("");
    const fullName = guest.fullName.trim();
    const email = guest.email.trim().toLowerCase();
    const phone = guest.phone.trim();
    if (!fullName) return setError("نام و نام خانوادگی را وارد کنید.");
    if (!email && !phone) return setError("حداقل ایمیل یا شماره تماس را وارد کنید.");
    setLoading(true);
    try {
      createSession({ role: "guest", authType: "guest", displayName: fullName, login: email || phone });
      const session = getCurrentSession();
      await recordUserLogin({ userId: session?.userId, email, fullName, phone, company: guest.company, authType: "guest", role: "guest", status: "active" });
      navigate("/welcome", { replace: true });
    } finally { setLoading(false); }
  }

  async function handleSubmit(event) {
    event.preventDefault(); setError("");
    const email = login.trim().toLowerCase();
    if (!email || !password.trim()) return setError("لطفاً ایمیل و رمز عبور را وارد کنید.");
    if (!email.includes("@")) return setError("فرمت ایمیل معتبر نیست.");
    try {
      setLoading(true);
      const { data, error: authError } = await withTimeout(supabase.auth.signInWithPassword({ email, password }), "اتصال به Supabase انجام نشد.");
      if (authError || !data?.user?.id) { console.error("SHIL AUTH ERROR:", authError); return setError(authError?.message || "Login failed"); }
      const { data: profile, error: profileError } = await withTimeout(
        supabase.from("profiles").select("id,email,role,status,full_name,phone,company").eq("id", data.user.id).single(),
        "دریافت پروفایل کاربر از Supabase انجام نشد."
      );
      if (profileError || !profile) return setError("پروفایل کاربر پیدا نشد.");
      const isAdmin = profile.role === "admin" && profile.status === "approved";
      if (rememberLogin) {
        safeLocalSetItem("shil:remember-login", "1");
        safeLocalSetItem("shil:last-login-email", email);
      } else {
        safeLocalRemoveItem("shil:remember-login");
        safeLocalRemoveItem("shil:last-login-email");
      }
      createSession({ role: isAdmin ? "admin" : "user", login: email, authType: "supabase", displayName: profile.full_name || email, userId: data.user.id });
      safeLocalSetItem("shil_profile", JSON.stringify(profile));
      if (!isAdmin) await recordUserLogin({ userId: data.user.id, email: profile.email || email, fullName: profile.full_name || "", phone: profile.phone || "", company: profile.company || "", authType: "email", role: "user", status: profile.status || "active" });
      navigate(isAdmin ? "/admin" : "/dashboard", { replace: true });
    } catch (err) { console.error("SHIL login error:", err); setError(err?.message || "خطا در ورود."); }
    finally { setLoading(false); }
  }

  return (
    <div className="shil-auth-page" dir="rtl" style={{ "--shil-login-bg": `url(${loginBackground})` }}>
      <style>{`
        .shil-auth-page,.shil-auth-page *{box-sizing:border-box}.shil-auth-page{min-height:100svh;min-height:100dvh;width:100%;position:relative;isolation:isolate;display:flex;align-items:center;justify-content:flex-end;padding:max(24px,env(safe-area-inset-top)) clamp(22px,5vw,72px) max(24px,env(safe-area-inset-bottom));overflow:auto;background-image:var(--shil-login-bg);background-size:cover;background-position:center 45%;background-repeat:no-repeat;color:#102a43}.shil-auth-page:before{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(90deg,rgba(2,14,28,.01),rgba(2,14,28,.08))}.shil-auth-card{width:min(390px,88vw);padding:18px;border:1px solid rgba(255,255,255,.72);border-radius:22px;background:linear-gradient(145deg,rgba(255,255,255,.62),rgba(235,247,255,.42));box-shadow:0 20px 56px rgba(0,15,32,.2);backdrop-filter:blur(8px)}.shil-auth-brand{text-align:center;margin-bottom:12px}.shil-auth-brand strong{display:block;font:900 40px/1 ui-monospace,monospace;letter-spacing:.12em;color:#09263d}.shil-auth-brand span{display:block;margin-top:8px;font-weight:800;line-height:1.55;color:#23445d}.shil-auth-form{display:grid;gap:9px}.shil-auth-form input{width:100%;height:46px;padding:0 14px;border:1.5px solid rgba(64,202,244,.72);border-radius:14px;background:rgba(255,255,255,.72);color:#102a43;font:700 14px inherit;outline:none}.shil-auth-form button,.shil-guest-btn{width:100%;min-height:44px;padding:10px 14px;border-radius:14px;font:900 14px inherit;cursor:pointer}.shil-auth-form button{border:0;background:linear-gradient(110deg,#8edcff,#b8eaff,#d8e8ff);color:#071b2d}.shil-guest-btn{margin-top:9px;border:1.5px solid rgba(55,194,239,.9);background:rgba(255,255,255,.42);color:#123b55}.shil-auth-password-wrap{position:relative;width:100%;display:block}.shil-auth-password-wrap>input{padding-right:14px;padding-left:52px}.shil-auth-password-toggle{position:absolute!important;left:5px!important;top:50%!important;transform:translateY(-50%)!important;width:38px!important;min-width:38px!important;max-width:38px!important;height:36px!important;min-height:36px!important;max-height:36px!important;margin:0!important;padding:0!important;display:grid!important;place-items:center!important;border:0!important;border-radius:10px!important;background:rgba(220,241,252,.92)!important;background-image:none!important;box-shadow:none!important;color:#123b55!important;font-size:18px!important;line-height:1!important;cursor:pointer!important}.shil-auth-password-toggle:focus-visible{outline:2px solid #46bfe8!important;outline-offset:1px!important}.shil-auth-remember{display:flex;align-items:center;justify-content:center;gap:8px;min-height:30px;font-size:12px;font-weight:800;color:#244a65;cursor:pointer}.shil-auth-remember input{width:16px;height:16px;min-height:0;padding:0;accent-color:#46bfe8}.shil-auth-error{margin:0;padding:9px;border-radius:12px;background:rgba(255,233,233,.9);color:#8b1e1e;font-size:12px;font-weight:800;text-align:center}.shil-auth-note{margin:10px 4px 0;font-size:11px;line-height:1.55;font-weight:700;text-align:center;color:#31556d}.shil-guest-form{margin-top:10px;padding-top:10px;border-top:1px solid rgba(79,160,205,.28)}@media(max-width:900px){.shil-auth-page{justify-content:center;align-items:flex-end;padding:16px}.shil-auth-card{margin-bottom:16px}}@media(max-width:430px){.shil-auth-card{width:min(88vw,340px);padding:14px}.shil-auth-form input{height:42px}}
      `}</style>
      <section className="shil-auth-card">
        <div className="shil-auth-brand"><strong>SHIL</strong><span>سامانه طراحی، پیکربندی و گزارش‌گیری<br/>سیستم‌های خورشیدی و برق اضطراری</span></div>
        <form className="shil-auth-form" onSubmit={handleSubmit}>
          <input id="shil-login-email" name="username" type="email" value={login} onChange={(e)=>setLogin(e.target.value)} placeholder="ایمیل" autoComplete="username" dir="ltr"/>
          <div className="shil-auth-password-wrap" dir="ltr">
            <input id="shil-login-password" name="password" type={showPassword ? "text" : "password"} value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="رمز عبور" autoComplete="current-password" dir="ltr"/>
            <button
              type="button"
              className="shil-auth-password-toggle"
              onClick={()=>setShowPassword((value)=>!value)}
              aria-label={showPassword ? "مخفی کردن رمز عبور" : "نمایش رمز عبور"}
              aria-pressed={showPassword}
              title={showPassword ? "مخفی کردن رمز عبور" : "نمایش رمز عبور"}
            >
              <span aria-hidden="true">{showPassword ? "🙈" : "👁"}</span>
            </button>
          </div>
          <label className="shil-auth-remember"><input type="checkbox" checked={rememberLogin} onChange={(e)=>setRememberLogin(e.target.checked)} /><span>مرا به خاطر بسپار</span></label>
          {error && !guestMode ? <p className="shil-auth-error">{error}</p> : null}
          <button type="submit" disabled={loading}>{loading ? "در حال ورود..." : "ورود"}</button>
        </form>
        <button type="button" className="shil-guest-btn" onClick={()=>{setError("");setGuestMode(v=>!v)}}>{guestMode ? "بستن ورود آزمایشی" : "ورود آزمایشی"}</button>
        {guestMode ? <form className="shil-auth-form shil-guest-form" onSubmit={handleGuestSubmit}>
          <input value={guest.fullName} onChange={(e)=>setGuest({...guest,fullName:e.target.value})} placeholder="نام و نام خانوادگی"/>
          <input type="email" value={guest.email} onChange={(e)=>setGuest({...guest,email:e.target.value})} placeholder="ایمیل - اختیاری" dir="ltr"/>
          <input value={guest.phone} onChange={(e)=>setGuest({...guest,phone:e.target.value})} placeholder="شماره تماس - اختیاری" dir="ltr"/>
          <input value={guest.company} onChange={(e)=>setGuest({...guest,company:e.target.value})} placeholder="شرکت / مجموعه - اختیاری"/>
          {error ? <p className="shil-auth-error">{error}</p> : null}
          <button type="submit" disabled={loading}>{loading ? "در حال ثبت..." : "ثبت اطلاعات و ورود آزمایشی"}</button>
        </form> : null}
        <p className="shil-auth-note">حساب مدیریت تأییدشده مستقیماً وارد کارتابل ادمین می‌شود.<br/>ورود کاربران عادی و آزمایشی برای ارتباط و پشتیبانی ثبت می‌شود.</p>
      </section>
    </div>
  );
}
