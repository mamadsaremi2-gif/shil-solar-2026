import { useState } from "react";
import { supabase } from "../../shared/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email) return alert("ایمیل را وارد کن");

    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    setLoading(false);

    if (error) {
      alert("خطا در ارسال لینک");
      console.error(error);
    } else {
      alert("لینک ورود به ایمیلت ارسال شد");
    }
  }

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h2>ورود به سیستم</h2>

      <input
        type="email"
        placeholder="ایمیل"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ padding: 10, width: 250 }}
      />

      <br /><br />

      <button onClick={handleLogin} disabled={loading}>
        {loading ? "در حال ارسال..." : "ارسال لینک ورود"}
      </button>
    </div>
  );
}