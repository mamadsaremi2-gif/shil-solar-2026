import React, { useState } from "react";
import { signIn } from "../backend/auth/authService.js";
import { useAuthStore } from "../backend/auth/authStore.js";

export default function LoginPage() {
  const setUser = useAuthStore((state) => state.setUser);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    const data = await signIn(email, password);

    setUser(data.user);
  }

  return (
    <div className="dashboard-shell-v15" dir="rtl">
      <main className="dashboard-main-v15">
        <section className="hero-card-v15">
          <div className="hero-row-v15">
            <span>AUTH</span>
            <span>SHIL ACCOUNT</span>
          </div>

          <div className="hero-content-v15">
            <h1>ورود به SHIL</h1>
            <h2>ورود کاربر برای ذخیره، همگام‌سازی و مدیریت پروژه‌ها.</h2>
          </div>
        </section>

        <form className="auth-form-v15" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="ایمیل"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <input
            type="password"
            placeholder="رمز عبور"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <button type="submit">
            ورود
          </button>
        </form>
      </main>
    </div>
  );
}

