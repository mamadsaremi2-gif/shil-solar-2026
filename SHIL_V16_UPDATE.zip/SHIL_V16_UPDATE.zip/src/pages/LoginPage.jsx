import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase/client.js";
import { createSession } from "../auth/session.js";

const AUTH_TIMEOUT_MS = 12000;

function withTimeout(promise, message = "زمان اتصال تمام شد.") {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(message)), AUTH_TIMEOUT_MS)
    ),
  ]);
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGuest() {
    createSession({
      role: "guest",
      authType: "guest",
      displayName: "کاربر مهمان",
      login: "guest"
    });

    navigate("/dashboard", { replace: true });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const email = login.trim().toLowerCase();

    if (!email || !password.trim()) {
      setError("برای ورود، ایمیل و رمز عبور را وارد کنید.");
      return;
    }

    if (!email.includes("@")) {
      setError("ورود آنلاین فقط با ایمیل معتبر انجام می‌شود.");
      return;
    }

    try {
      setLoading(true);

      const { data, error: authError } = await withTimeout(
        supabase.auth.signInWithPassword({
          email,
          password,
        }),
        "اتصال به Supabase برقرار نشد."
      );

      if (authError || !data?.user?.id) {
        setError("ایمیل یا رمز عبور اشتباه است.");
        return;
      }

      const { data: profile, error: profileError } = await withTimeout(
        supabase
          .from("profiles")
          .select("id,email,role,status,full_name")
          .eq("id", data.user.id)
          .single(),
        "خواندن نقش کاربر از Supabase انجام نشد."
      );

      if (profileError || !profile) {
        setError("پروفایل کاربر در Supabase پیدا نشد.");
        return;
      }

      const isAdmin = profile.role === "admin" && profile.status === "approved";

      createSession({
        role: isAdmin ? "admin" : "user",
        login: email,
        authType: "supabase",
        displayName: profile.full_name || email,
        userId: data.user.id
      });

      localStorage.setItem("shil_profile", JSON.stringify(profile));

      navigate(isAdmin ? "/admin" : "/dashboard", { replace: true });
    } catch (err) {
      console.error("SHIL login error:", err);
      setError(err?.message || "خطا در ورود.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="shil-auth-page" dir="rtl">
      <section className="shil-auth-card">
        <div className="shil-auth-brand">
          <strong>SHIL</strong>
          <span>ورود امن به فضای اختصاصی طراحی پروژه‌های خورشیدی و برق اضطراری</span>
        </div>

        <form className="shil-auth-form" onSubmit={handleSubmit}>
          <input
            value={login}
            onChange={(event) => setLogin(event.target.value)}
            placeholder="ایمیل"
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

          <button type="submit" disabled={loading}>
            {loading ? "در حال ورود..." : "ورود / ثبت نام"}
          </button>
        </form>

        <button type="button" className="shil-guest-btn" onClick={handleGuest}>
          ورود سریع به عنوان مهمان
        </button>

        <p className="shil-auth-note">
          هر کاربر، حتی مهمان، فضای پروژه‌ها، سوالات و نظرات اختصاصی خودش را دارد.
          ادمین با ایمیل و رمز عبور تایید شده وارد کارتابل مدیریتی می‌شود.
        </p>
      </section>
    </div>
  );
}
