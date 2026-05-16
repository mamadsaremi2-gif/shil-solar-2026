import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ADMIN_USER = "admin";
const ADMIN_PASS = "shil-admin";

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("user");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function persistSession(role) {
    localStorage.setItem("shil-session", JSON.stringify({ role, online: navigator.onLine, createdAt: new Date().toISOString() }));
    navigate("/welcome");
  }

  function handleGuest() {
    persistSession("guest");
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (mode === "admin") {
      if (username.trim() === ADMIN_USER && password === ADMIN_PASS) {
        persistSession("admin");
        return;
      }
      setError("نام کاربری یا رمز عبور ادمین صحیح نیست.");
      return;
    }

    if (!username.trim() || !password.trim()) {
      setError("برای ورود یا ثبت نام، نام کاربری و رمز عبور را وارد کنید.");
      return;
    }

    persistSession("user");
  }

  return (
    <div className="shil-auth-page" dir="rtl">
      <section className="shil-auth-card">
        <div className="shil-auth-brand">
          <strong>SHIL</strong>
          <span>طراحی هوشمند انرژی های خورشیدی / برق اضطراری</span>
        </div>

        <div className="shil-auth-tabs" role="tablist" aria-label="مسیر ورود">
          <button type="button" className={mode === "user" ? "active" : ""} onClick={() => setMode("user")}>ورود / ثبت نام</button>
          <button type="button" className={mode === "admin" ? "active" : ""} onClick={() => setMode("admin")}>درگاه ادمین</button>
        </div>

        <form className="shil-auth-form" onSubmit={handleSubmit}>
          <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder={mode === "admin" ? "نام کاربری ادمین" : "ایمیل یا شماره موبایل"} />
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="رمز عبور" />
          {error ? <p className="shil-auth-error">{error}</p> : null}
          <button type="submit">{mode === "admin" ? "ورود ادمین" : "ورود به حساب"}</button>
        </form>

        <button type="button" className="shil-guest-btn" onClick={handleGuest}>ورود به عنوان مهمان</button>
      </section>
    </div>
  );
}
