import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase/client.js";
import { createSession } from "../auth/session.js";

const AUTH_TIMEOUT_MS = 12000;

function withTimeout(promise, message = "زمان پاسخ‌گویی سرور تمام شد.") {
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

    navigate('/welcome', { replace: true });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const email = login.trim().toLowerCase();

    if (!email || !password.trim()) {
      setError("لطفاً ایمیل و رمز عبور را وارد کنید.");
      return;
    }

    if (!email.includes("@")) {
      setError("فرمت ایمیل معتبر نیست.");
      return;
    }

    try {
      setLoading(true);

      const { data, error: authError } = await withTimeout(
        supabase.auth.signInWithPassword({
          email,
          password,
        }),
        "اتصال به Supabase انجام نشد."
      );

      if (authError || !data?.user?.id) {
        setError("ورود با این اطلاعات انجام نشد.");
        return;
      }

      const { data: profile, error: profileError } = await withTimeout(
        supabase
          .from("profiles")
          .select("id,email,role,status,full_name")
          .eq("id", data.user.id)
          .single(),
        "دریافت پروفایل کاربر از Supabase انجام نشد."
      );

      if (profileError || !profile) {
        setError("پروفایل کاربر پیدا نشد.");
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
      <style>{`
        .shil-auth-page {
          min-height: 100svh;
          min-height: 100dvh;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: clamp(20px, 7vh, 72px) 16px 24px;
          box-sizing: border-box;
          overflow-y: auto;
        }

        .shil-auth-card {
          margin-top: 0 !important;
          transform: translateY(-18px);
          max-height: calc(100dvh - 32px);
          overflow-y: auto;
          box-sizing: border-box;
        }

        @media (max-width: 768px) {
          .shil-auth-page {
            justify-content: flex-start;
            padding-top: max(14px, env(safe-area-inset-top));
            padding-bottom: max(16px, env(safe-area-inset-bottom));
          }

          .shil-auth-card {
            transform: translateY(-28px);
            width: min(92vw, 420px);
            max-height: calc(100dvh - 24px);
          }
        }

        @media (max-height: 720px) {
          .shil-auth-page {
            padding-top: 8px;
          }

          .shil-auth-card {
            transform: translateY(-38px);
          }
        }
      `}</style>
      <section className="shil-auth-card">
        <div className="shil-auth-brand">
          <strong>SHIL</strong>
          <span>سامانه طراحی، پیکربندی و گزارش‌گیری سیستم‌های خورشیدی و برق اضطراری</span>
        </div>

        <form className="shil-auth-form" onSubmit={handleSubmit}>
          <input
            value={login}
            onChange={(event) => setLogin(event.target.value)}
            placeholder="ایمیل"
            autoComplete="username"
            dir="ltr"
          />

          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="رمز عبور"
            autoComplete="current-password"
            dir="ltr"
          />

          {error ? <p className="shil-auth-error">{error}</p> : null}

          <button type="submit" disabled={loading}>
            {loading ? "در حال ورود..." : "ورود / ثبت نام"}
          </button>
        </form>

        <button type="button" className="shil-guest-btn" onClick={handleGuest}>
          ورود موقت به نسخه آزمایشی
        </button>

        <p className="shil-auth-note">
          اگر حساب کاربری فعال ندارید، از ورود موقت استفاده کنید. دسترسی مدیر پس از تأیید حساب فعال می‌شود.
        </p>
      </section>
    </div>
  );
}
