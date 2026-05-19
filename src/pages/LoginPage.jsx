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
    goByRole(createSession({ role: "guest", authType: "guest", displayName: "Ú©Ø§Ø±Ø¨Ø± Ù…Ù‡Ù…Ø§Ù†" }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!login.trim() || !password.trim()) {
      setError("Ø¨Ø±Ø§ÛŒ ÙˆØ±ÙˆØ¯ØŒ Ø§ÛŒÙ…ÛŒÙ„ ÛŒØ§ Ø´Ù…Ø§Ø±Ù‡ Ù…ÙˆØ¨Ø§ÛŒÙ„ Ùˆ Ø±Ù…Ø² Ø¹Ø¨ÙˆØ± Ø±Ø§ ÙˆØ§Ø±Ø¯ Ú©Ù†ÛŒØ¯.");
      return;
    }

    if (isAdminCredential(login, password)) {
      goByRole(createSession({ role: "admin", login, authType: "admin", displayName: "Ø§Ø¯Ù…ÛŒÙ† Ø§ØµÙ„ÛŒ SHIL" }));
      return;
    }

    goByRole(createSession({ role: "user", login, authType: login.includes("@") ? "email" : "mobile", displayName: login }));
  }

  return (
    <div className="shil-auth-page" dir="rtl">
      <section className="shil-auth-card">
        <div className="shil-auth-brand">
          <strong>SHIL</strong>
          <span>ÙˆØ±ÙˆØ¯ Ø§Ù…Ù† Ø¨Ù‡ ÙØ¶Ø§ÛŒ Ø§Ø®ØªØµØ§ØµÛŒ Ø·Ø±Ø§Ø­ÛŒ Ù¾Ø±ÙˆÚ˜Ù‡â€ŒÙ‡Ø§ÛŒ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ Ùˆ Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ</span>
        </div>

        <form className="shil-auth-form" onSubmit={handleSubmit}>
          <input value={login} onChange={(event) => setLogin(event.target.value)} placeholder="Ø§ÛŒÙ…ÛŒÙ„ ÛŒØ§ Ø´Ù…Ø§Ø±Ù‡ Ù…ÙˆØ¨Ø§ÛŒÙ„" autoComplete="username" />
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Ø±Ù…Ø² Ø¹Ø¨ÙˆØ±" autoComplete="current-password" />
          {error ? <p className="shil-auth-error">{error}</p> : null}
          <button type="submit">ÙˆØ±ÙˆØ¯ / Ø«Ø¨Øª Ù†Ø§Ù…</button>
        </form>

        <button type="button" className="shil-guest-btn" onClick={handleGuest}>ÙˆØ±ÙˆØ¯ Ø³Ø±ÛŒØ¹ Ø¨Ù‡ Ø¹Ù†ÙˆØ§Ù† Ù…Ù‡Ù…Ø§Ù†</button>
        <p className="shil-auth-note">Ù‡Ø± Ú©Ø§Ø±Ø¨Ø±ØŒ Ø­ØªÛŒ Ù…Ù‡Ù…Ø§Ù†ØŒ ÙØ¶Ø§ÛŒ Ù¾Ø±ÙˆÚ˜Ù‡â€ŒÙ‡Ø§ØŒ Ø³ÙˆØ§Ù„Ø§Øª Ùˆ Ù†Ø¸Ø±Ø§Øª Ø§Ø®ØªØµØ§ØµÛŒ Ø®ÙˆØ¯Ø´ Ø±Ø§ Ø¯Ø§Ø±Ø¯. Ø§Ø¯Ù…ÛŒÙ† ÙÙ‚Ø· Ø¨Ø§ Ø§Ø·Ù„Ø§Ø¹Ø§Øª Ø§ØµÙ„ÛŒ Ùˆ Ø¨Ø¯ÙˆÙ† Ø¯Ú©Ù…Ù‡ Ø¬Ø¯Ø§Ú¯Ø§Ù†Ù‡ ÙˆØ§Ø±Ø¯ Ú©Ø§Ø±ØªØ§Ø¨Ù„ Ù…Ø¯ÛŒØ±ÛŒØªÛŒ Ù…ÛŒâ€ŒØ´ÙˆØ¯.</p>
      </section>
    </div>
  );
}
