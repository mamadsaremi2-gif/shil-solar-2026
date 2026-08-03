import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase/client.js";
import { createSession } from "../auth/session.js";
import loginBackground from "../assets/shil-login-solar-home.png";

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
      login: "guest",
    });

    navigate("/welcome", { replace: true });
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
        userId: data.user.id,
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
    <div
      className="shil-auth-page"
      dir="rtl"
      style={{ "--shil-login-bg": `url(${loginBackground})` }}
    >
      <style>{`
        .shil-auth-page,
        .shil-auth-page * {
          box-sizing: border-box;
        }

        .shil-auth-page {
          min-height: 100svh;
          min-height: 100dvh;
          width: 100%;
          position: relative;
          isolation: isolate;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding: max(24px, env(safe-area-inset-top)) clamp(22px, 5vw, 72px)
            max(24px, env(safe-area-inset-bottom));
          overflow: hidden;
          background-image: var(--shil-login-bg);
          background-size: cover;
          background-position: center 45%;
          background-repeat: no-repeat;
          color: #102a43 !important;
        }

        .shil-auth-page::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -2;
          background:
            linear-gradient(90deg, rgba(2, 14, 28, 0.01) 0%, rgba(2, 14, 28, 0.025) 50%, rgba(2, 14, 28, 0.08) 100%),
            linear-gradient(180deg, rgba(6, 30, 52, 0) 0%, rgba(3, 20, 36, 0.035) 100%);
        }

        .shil-auth-page::after {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          background: radial-gradient(circle at 20% 14%, rgba(255, 226, 151, 0.12), transparent 34%);
        }

        .shil-auth-card {
          width: min(390px, 33vw) !important;
          max-height: none;
          overflow: visible;
          overscroll-behavior: contain;
          padding: clamp(16px, 2.2vh, 22px) !important;
          border: 1px solid rgba(255, 255, 255, 0.68);
          border-radius: 22px !important;
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.46), rgba(245, 249, 255, 0.32)) !important;
          box-shadow:
            0 20px 56px rgba(0, 15, 32, 0.20),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(8px) saturate(112%) !important;
          -webkit-backdrop-filter: blur(8px) saturate(112%) !important;
          animation: shilLoginEnter 420ms cubic-bezier(.2,.8,.2,1) both;
          scrollbar-width: thin;
        }

        @keyframes shilLoginEnter {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .shil-auth-brand {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          margin-bottom: 12px !important;
          text-align: center;
        }

        .shil-auth-brand strong {
          display: block;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: clamp(32px, 3.4vw, 44px) !important;
          line-height: 1;
          letter-spacing: 0.14em;
          padding-inline-start: 0.14em;
          color: #09263d;
          text-shadow: 0 1px 0 rgba(255, 255, 255, 0.75);
        }

        .shil-auth-brand span {
          max-width: 360px;
          font-size: clamp(13px, 1.18vw, 16px);
          line-height: 1.62;
          font-weight: 800;
          color: #23445d;
        }

        .shil-auth-form {
          display: grid;
          gap: 10px;
        }

        .shil-auth-form input {
          width: 100%;
          height: 48px;
          padding: 0 15px;
          border: 1.5px solid rgba(64, 202, 244, 0.72);
          border-radius: 14px;
          outline: none;
          background: rgba(255, 255, 255, 0.58) !important;
          color: #102a43;
          font: inherit;
          font-size: 14px;
          font-weight: 700;
          box-shadow: 0 8px 24px rgba(22, 100, 135, 0.06);
          transition: border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease, background 180ms ease;
        }

        .shil-auth-form input::placeholder {
          color: #607d91;
          opacity: 1;
          text-align: right;
        }

        .shil-auth-form input:focus {
          border-color: #25b9f3;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(37, 185, 243, 0.15), 0 12px 28px rgba(30, 113, 156, 0.12);
          transform: translateY(-1px);
        }

        .shil-auth-form button,
        .shil-guest-btn {
          width: 100%;
          min-height: 40px;
          padding: 9px 15px;
          border-radius: 14px;
          font: inherit;
          font-size: 14px;
          font-weight: 900;
          cursor: pointer;
          transition: transform 180ms ease, box-shadow 180ms ease, opacity 180ms ease, background 180ms ease;
        }

        .shil-auth-form button {
          border: 0;
          color: #071b2d;
          background: linear-gradient(110deg, #41c4f3 0%, #66d9ff 48%, #7165f4 100%);
          box-shadow: 0 14px 30px rgba(61, 156, 232, 0.28);
        }

        .shil-auth-form button:hover:not(:disabled),
        .shil-guest-btn:hover {
          transform: translateY(-2px);
        }

        .shil-auth-form button:active:not(:disabled),
        .shil-guest-btn:active {
          transform: translateY(0);
        }

        .shil-auth-form button:disabled {
          cursor: wait;
          opacity: 0.66;
        }

        .shil-guest-btn {
          margin-top: 9px;
          border: 1.5px solid rgba(55, 194, 239, 0.9);
          color: #123b55;
          background: rgba(255, 255, 255, 0.20) !important;
          box-shadow: 0 8px 22px rgba(23, 90, 130, 0.08);
        }

        .shil-auth-error {
          margin: 0;
          padding: 10px 12px;
          border: 1px solid rgba(223, 67, 67, 0.22);
          border-radius: 12px;
          color: #8b1e1e;
          background: rgba(255, 233, 233, 0.86);
          font-size: 12px;
          font-weight: 800;
          text-align: center;
        }

        .shil-auth-note {
          margin: 10px 4px 0;
          color: #31556d;
          font-size: 11px;
          line-height: 1.55;
          font-weight: 700;
          text-align: center;
        }

        @media (max-width: 900px) {
          .shil-auth-page {
            align-items: flex-end;
            justify-content: center;
            padding: max(18px, env(safe-area-inset-top)) 16px max(20px, env(safe-area-inset-bottom));
            background-position: 50% center;
          }

          .shil-auth-page::before {
            background:
              linear-gradient(180deg, rgba(3, 18, 32, 0.01) 0%, rgba(3, 18, 32, 0.03) 40%, rgba(3, 18, 32, 0.16) 100%);
          }

          .shil-auth-card {
            width: min(78vw, 360px) !important;
            max-height: none;
            padding: 16px !important;
            border-radius: 20px !important;
            margin-bottom: clamp(14px, 3vh, 28px);
          }

          .shil-auth-brand {
            gap: 5px;
            margin-bottom: 10px;
          }

          .shil-auth-brand strong {
            font-size: clamp(30px, 8vw, 40px);
          }

          .shil-auth-brand span {
            max-width: 330px;
            font-size: 12px;
            line-height: 1.48;
          }

          .shil-auth-form input {
            height: 44px;
            border-radius: 13px;
          }

          .shil-auth-form button,
          .shil-guest-btn {
            min-height: 44px;
            border-radius: 13px;
            font-size: 11.5px;
          }

          .shil-auth-note {
            margin-top: 9px;
            font-size: 10.5px;
            line-height: 1.48;
          }
        }

        @media (max-width: 430px) {
          .shil-auth-page {
            padding-inline: 12px;
            background-position: 50% center;
          }

          .shil-auth-card {
            width: min(84vw, 330px) !important;
            max-height: none;
            padding: 14px 13px !important;
            border-radius: 18px !important;
            margin-bottom: 14px;
          }

          .shil-auth-brand {
            margin-bottom: 9px;
          }

          .shil-auth-brand span {
            font-size: 11.5px;
          }

          .shil-auth-form {
            gap: 8px;
          }

          .shil-auth-form input {
            height: 42px;
            font-size: 13px;
          }

          .shil-auth-form button,
          .shil-guest-btn {
            min-height: 42px;
            font-size: 12.5px;
          }
        }

        @media (max-height: 700px) {
          .shil-auth-page {
            align-items: center;
            overflow: hidden;
          }

          .shil-auth-card {
            max-height: none;
            padding-block: 12px;
          }

          .shil-auth-brand {
            margin-bottom: 8px;
          }

          .shil-auth-brand strong {
            font-size: 29px;
          }

          .shil-auth-brand span {
            font-size: 10.5px;
            line-height: 1.4;
          }

          .shil-auth-form input {
            height: 40px;
          }

          .shil-auth-form button,
          .shil-guest-btn {
            min-height: 40px;
          }

          .shil-auth-note {
            margin-top: 7px;
            line-height: 1.4;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .shil-auth-card {
            animation: none;
          }

          .shil-auth-page *,
          .shil-auth-page *::before,
          .shil-auth-page *::after {
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>

      <section className="shil-auth-card" aria-label="ورود به سامانه شیل">
        <div className="shil-auth-brand">
          <strong>SHIL</strong>
          <span>
            سامانه طراحی، پیکربندی و گزارش‌گیری
            <br />
            سیستم‌های خورشیدی و برق اضطراری
          </span>
        </div>

        <form className="shil-auth-form" onSubmit={handleSubmit}>
          <input
            type="email"
            value={login}
            onChange={(event) => setLogin(event.target.value)}
            placeholder="ایمیل"
            autoComplete="username"
            inputMode="email"
            dir="ltr"
            aria-label="ایمیل"
          />

          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="رمز عبور"
            autoComplete="current-password"
            dir="ltr"
            aria-label="رمز عبور"
          />

          {error ? (
            <p className="shil-auth-error" role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" disabled={loading}>
            {loading ? "در حال ورود..." : "ورود / ثبت نام"}
          </button>
        </form>

        <button type="button" className="shil-guest-btn" onClick={handleGuest}>
          ورود موقت به نسخه آزمایشی
        </button>

        <p className="shil-auth-note">
          اگر حساب کاربری فعال ندارید، از ورود موقت استفاده کنید.
          <br />
          دسترسی مدیر پس از تأیید حساب فعال می‌شود.
        </p>
      </section>
    </div>
  );
}
