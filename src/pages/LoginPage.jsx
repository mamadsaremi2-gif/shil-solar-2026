import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase/client.js";
import { createSession, getCurrentSession } from "../auth/session.js";
import { recordUserLogin } from "../services/shilUserAccessService.js";
import { safeLocalRemoveItem, safeLocalSetItem } from "../services/storageQuotaGuard.js";
import loginBackground from "../assets/shil-login-solar-home.png";
import shilLogo from "../assets/logos/shil-main-logo.png";

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
        .shil-auth-page,.shil-auth-page *{box-sizing:border-box}
        html:has(.shil-auth-page),body:has(.shil-auth-page),#root:has(.shil-auth-page){height:100%!important;overflow:hidden!important}
        .shil-auth-page.shil-auth-page{
          position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;min-height:0!important;
          display:flex!important;align-items:center!important;justify-content:center!important;
          padding:max(14px,env(safe-area-inset-top)) max(14px,env(safe-area-inset-right)) max(14px,env(safe-area-inset-bottom)) max(14px,env(safe-area-inset-left))!important;
          overflow:hidden!important;overscroll-behavior:none!important;isolation:isolate!important;
          background-image:var(--shil-login-bg)!important;background-size:cover!important;background-position:center 45%!important;background-repeat:no-repeat!important;
          color:#102a43!important;
        }
        .shil-auth-page.shil-auth-page:before{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(180deg,rgba(255,255,255,.02),rgba(4,17,34,.10))}
        .shil-auth-page .shil-auth-card{
          position:relative!important;inset:auto!important;top:auto!important;right:auto!important;bottom:auto!important;left:auto!important;
          width:min(360px,calc(100vw - 32px))!important;max-width:360px!important;
          max-height:calc(100dvh - max(32px,env(safe-area-inset-top)) - max(32px,env(safe-area-inset-bottom)))!important;
          margin:0!important;transform:none!important;padding:clamp(10px,1.55dvh,14px) clamp(12px,3.2vw,15px)!important;
          border:1px solid rgba(255,255,255,.62)!important;border-radius:clamp(20px,5vw,26px)!important;
          background:linear-gradient(145deg,rgba(255,255,255,.34),rgba(220,236,255,.20))!important;
          box-shadow:0 14px 44px rgba(7,24,45,.20),inset 0 1px 0 rgba(255,255,255,.48)!important;
          backdrop-filter:blur(18px) saturate(138%)!important;-webkit-backdrop-filter:blur(18px) saturate(138%)!important;color:#102a43!important;
          overflow:hidden!important;
        }
        .shil-auth-brand{display:flex!important;flex-direction:column!important;align-items:center!important;text-align:center!important;margin:0 0 clamp(6px,1.1dvh,9px)!important;gap:clamp(3px,.65dvh,5px)!important}
        .shil-auth-logo{width:clamp(54px,8.2dvh,70px)!important;height:clamp(54px,8.2dvh,70px)!important;object-fit:contain!important;border-radius:20px!important;filter:drop-shadow(0 6px 14px rgba(19,46,78,.16))}
        .shil-auth-brand span{display:block!important;margin:0!important;font-size:clamp(10px,1.45dvh,12px)!important;font-weight:800!important;line-height:1.42!important;color:#173b55!important;text-shadow:0 1px 10px rgba(255,255,255,.55)!important}
        .shil-auth-form{display:grid!important;gap:clamp(5px,.8dvh,7px)!important}
        .shil-auth-form input{width:100%!important;height:clamp(36px,5dvh,42px)!important;padding:0 13px!important;border:1px solid rgba(255,255,255,.76)!important;border-radius:14px!important;background:rgba(255,255,255,.56)!important;color:#102a43!important;font:700 clamp(12px,1.8dvh,14px) inherit!important;outline:none!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.5)!important}
        .shil-auth-form input:focus{border-color:rgba(73,190,239,.9)!important;box-shadow:0 0 0 3px rgba(73,190,239,.14)!important}
        .shil-auth-form button,.shil-guest-btn{width:100%!important;min-height:clamp(36px,4.9dvh,42px)!important;padding:6px 10px!important;border-radius:14px!important;font:900 clamp(12px,1.8dvh,14px) inherit!important;cursor:pointer!important}
        .shil-auth-form button{border:0!important;background:linear-gradient(110deg,#8f3dff,#566dff,#2d9bff)!important;color:#fff!important;box-shadow:0 8px 20px rgba(71,87,255,.21)!important}
        .shil-guest-btn{margin-top:clamp(5px,.8dvh,7px)!important;border:1px solid rgba(255,255,255,.74)!important;background:rgba(255,255,255,.27)!important;color:#123b55!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.38)!important}
        .shil-auth-password-wrap{position:relative;width:100%;display:block}.shil-auth-password-wrap>input{padding-right:13px!important;padding-left:48px!important}
        .shil-auth-password-toggle{position:absolute!important;left:5px!important;top:50%!important;transform:translateY(-50%)!important;width:34px!important;min-width:34px!important;max-width:34px!important;height:32px!important;min-height:32px!important;max-height:32px!important;margin:0!important;padding:0!important;display:grid!important;place-items:center!important;border:1px solid rgba(255,255,255,.55)!important;border-radius:10px!important;background:rgba(225,242,252,.66)!important;background-image:none!important;box-shadow:none!important;color:#123b55!important;font-size:16px!important;line-height:1!important;cursor:pointer!important}
        .shil-auth-password-toggle:focus-visible{outline:2px solid #46bfe8!important;outline-offset:1px!important}
        .shil-auth-remember{display:flex!important;align-items:center!important;justify-content:center!important;gap:6px!important;min-height:clamp(20px,3dvh,24px)!important;font-size:clamp(10.5px,1.55dvh,12px)!important;font-weight:800!important;color:#244a65!important;cursor:pointer!important}
        .shil-auth-remember input{width:15px!important;height:15px!important;min-height:0!important;padding:0!important;accent-color:#4a7fff!important}
        .shil-auth-error{margin:0!important;padding:7px!important;border-radius:10px!important;background:rgba(255,233,233,.85)!important;color:#8b1e1e!important;font-size:11px!important;font-weight:800!important;text-align:center!important}
        .shil-auth-note{margin:clamp(5px,.8dvh,7px) 2px 0!important;padding-top:clamp(5px,.8dvh,7px)!important;border-top:1px solid rgba(255,255,255,.34)!important;font-size:clamp(9.5px,1.45dvh,11px)!important;line-height:1.55!important;font-weight:800!important;text-align:center!important;color:#244a65!important}
        .shil-guest-form{margin-top:clamp(7px,1.2dvh,9px)!important;padding-top:clamp(7px,1.2dvh,9px)!important;border-top:1px solid rgba(255,255,255,.3)!important}
        .shil-auth-card.shil-auth-card--guest .shil-auth-brand{margin-bottom:8px!important}.shil-auth-card.shil-auth-card--guest .shil-auth-logo{width:58px!important;height:58px!important}.shil-auth-card.shil-auth-card--guest .shil-auth-brand span{font-size:10.5px!important;line-height:1.4!important}
        @media(max-width:430px){
          .shil-auth-page.shil-auth-page{padding:max(12px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left))!important}
          .shil-auth-page .shil-auth-card{width:min(348px,calc(100vw - 28px))!important;max-width:348px!important}
        }
        @media(max-height:760px){
          .shil-auth-page .shil-auth-card{position:relative!important;inset:auto!important;top:auto!important;transform:none!important;padding:8px 11px!important;border-radius:19px!important;max-height:calc(100dvh - 24px)!important}
          .shil-auth-logo{width:50px!important;height:50px!important}.shil-auth-brand{margin-bottom:5px!important;gap:3px!important}.shil-auth-brand span{font-size:9.8px!important;line-height:1.35!important}
          .shil-auth-form{gap:5px!important}.shil-auth-form input{height:35px!important;font-size:11px!important}.shil-auth-form button,.shil-guest-btn{min-height:35px!important;font-size:11.5px!important;padding:5px 9px!important}
          .shil-auth-remember{min-height:19px!important;font-size:9.5px!important}.shil-auth-note{margin-top:4px!important;padding-top:4px!important;font-size:8.7px!important;line-height:1.35!important}
        }
        @media(max-height:640px){
          .shil-auth-page.shil-auth-page{padding:max(8px,env(safe-area-inset-top)) max(10px,env(safe-area-inset-right)) max(8px,env(safe-area-inset-bottom)) max(10px,env(safe-area-inset-left))!important}
          .shil-auth-brand span{display:none!important}.shil-auth-logo{width:44px!important;height:44px!important}.shil-auth-brand{margin-bottom:4px!important}
          .shil-auth-note{font-size:8px!important;line-height:1.3!important}.shil-auth-form input{height:32px!important}.shil-auth-form button,.shil-guest-btn{min-height:32px!important}.shil-auth-remember{min-height:17px!important}
        }
      `}</style>
      <section className={`shil-auth-card${guestMode ? " shil-auth-card--guest" : ""}`}>
        <div className="shil-auth-brand"><img className="shil-auth-logo" src={shilLogo} alt="SHIL IRAN"/><span>سامانه طراحی، پیکربندی و گزارش‌گیری<br/>سیستم‌های خورشیدی و برق اضطراری</span></div>
        {!guestMode ? <form className="shil-auth-form" onSubmit={handleSubmit}>
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
        </form> : null}
        <button type="button" className="shil-guest-btn" onClick={()=>{setError("");setGuestMode(v=>!v)}}>{guestMode ? "بستن ورود آزمایشی" : "ورود آزمایشی"}</button>
        {guestMode ? <form className="shil-auth-form shil-guest-form" onSubmit={handleGuestSubmit}>
          <input className="shil-guest-field" value={guest.fullName} onChange={(e)=>setGuest({...guest,fullName:e.target.value})} placeholder="نام و نام خانوادگی" dir="rtl"/>
          <input className="shil-guest-field" type="email" inputMode="email" value={guest.email} onChange={(e)=>setGuest({...guest,email:e.target.value})} placeholder="ایمیل - اختیاری" dir="rtl"/>
          <input className="shil-guest-field" inputMode="tel" value={guest.phone} onChange={(e)=>setGuest({...guest,phone:e.target.value})} placeholder="شماره تماس - اختیاری" dir="rtl"/>
          <input className="shil-guest-field" value={guest.company} onChange={(e)=>setGuest({...guest,company:e.target.value})} placeholder="شرکت / مجموعه - اختیاری" dir="rtl"/>
          {error ? <p className="shil-auth-error">{error}</p> : null}
          <button type="submit" disabled={loading}>{loading ? "در حال ثبت..." : "ثبت اطلاعات و ورود آزمایشی"}</button>
        </form> : null}
        {!guestMode ? <p className="shil-auth-note">جهت ارتباط با پشتیبانی از بخش آزمایشی وارد شوید و اطلاعات خود را ثبت کنید.</p> : null}
      </section>
    </div>
  );
}
