import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createSession, isAdminCredential } from "../auth/session.js";

export default function LoginPage() {
  const navigate = useNavigate();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function goByRole(session) {
    navigate(session.role === "admin" ? "/admin" : "/welcome", { replace: true });
  }

  function handleGuest() {
    goByRole(createSession({ role: "guest", authType: "guest", displayName: "کاربر مهمان" }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!login.trim() || !password.trim()) {
      setError("برای ورود، ایمیل یا شماره موبایل و رمز عبور را وارد کنید.");
      return;
    }

    if (isAdminCredential(login, password)) {
      goByRole(createSession({
        role: "admin",
        login,
        authType: "admin",
        displayName: "ادمین اصلی SHIL"
      }));
      return;
    }

    goByRole(createSession({
      role: "user",
      login,
      authType: login.includes("@") ? "email" : "mobile",
      displayName: login
    }));
  }

  return (
    <div
      className="shil-auth-page shil-login-page"
      dir="rtl"
      style={{
        backgroundImage:
          "linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.45)), url('/assets/shil/background/login/shil-login-bg.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        minHeight: "100vh"
      }}
    >
      <section className="shil-auth-card">
        <div className="shil-auth-brand">
          <strong>SHIL</strong>
          <span>ورود امن به فضای اختصاصی طراحی پروژه‌های خورشیدی و برق اضطراری</span>
        </div>

        <form className="shil-auth-form" onSubmit={handleSubmit}>
          <input
            value={login}
            onChange={(event) => setLogin(event.target.value)}
            placeholder="ایمیل یا شماره موبایل"
            autoComplete="username"
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="رمز عبور"
            autoComplete="current-password"
          />
          {error ? <p className="shil-auth-error">{error}</p> : null}
          <button type="submit">ورود / ثبت نام</button>
        </form>

        <button type="button" className="shil-guest-btn" onClick={handleGuest}>ورود سریع به عنوان مهمان</button>
        <p className="shil-auth-note">هر کاربر، حتی مهمان، فضای پروژه‌ها، سوالات و نظرات اختصاصی خودش را دارد. ادمین فقط با اطلاعات اصلی و بدون دکمه جداگانه وارد کارتابل مدیریتی می‌شود.</p>
      </section>
    </div>
  );
}
