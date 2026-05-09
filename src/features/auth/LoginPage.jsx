import { useState } from "react";
import { PUBLIC_ASSETS } from "../../shared/constants/publicAssets";
import { useAuth } from "./AuthProvider";

export default function LoginPage() {
  const { signIn, signUp, enterOfflineMode, isConfigured } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleAuth = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!email || !password) {
      setMessage("ایمیل و رمز را وارد کنید.");
      return;
    }

    setSubmitting(true);
    const result = isSignup
      ? await signUp({ email, password, fullName })
      : await signIn(email, password);
    setSubmitting(false);

    if (!result.ok) {
      setMessage(result.error || "خطا در ورود");
      return;
    }

    if (isSignup) {
      setMessage("ثبت‌نام انجام شد. در صورت نیاز، منتظر تأیید مدیر بمانید.");
      setIsSignup(false);
    }
  };

  return (
    <main className="auth-screen" dir="rtl">
      <form className="auth-card panel" onSubmit={handleAuth}>
        <div className="auth-brand">
          <img src={PUBLIC_ASSETS.branding.logo} alt="SHIL" />
          <div>
            <strong>SHIL SOLAR</strong>
            <span>{isConfigured ? "ورود به اپلیکیشن تحت وب" : "حالت محلی / تست فعال است"}</span>
          </div>
        </div>

        <h1>{isSignup ? "ثبت‌نام" : "ورود"}</h1>

        {isSignup ? (
          <label>
            نام و نام خانوادگی
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="نام کاربر" />
          </label>
        ) : null}

        <label>
          ایمیل
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" autoComplete="email" />
        </label>

        <label>
          رمز عبور
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="رمز عبور" autoComplete={isSignup ? "new-password" : "current-password"} />
        </label>

        {message ? <p className="auth-message">{message}</p> : null}

        <button className="btn btn--primary" type="submit" disabled={submitting}>
          {submitting ? "در حال بررسی..." : isSignup ? "ثبت‌نام" : "ورود"}
        </button>

        <button className="btn btn--ghost" type="button" onClick={enterOfflineMode}>
          ورود آفلاین به اپ
        </button>

        <button className="auth-link" type="button" onClick={() => setIsSignup((prev) => !prev)}>
          {isSignup ? "حساب داری؟ ورود" : "ثبت‌نام نکردی؟"}
        </button>
      </form>
    </main>
  );
}
