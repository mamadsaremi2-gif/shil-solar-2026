import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";

export default function AdminPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    const result = await signIn(form.email, form.password);

    if (!result.ok) {
      setMessage(result.error || "خطا در ورود");
      return;
    }

    // ✅ اگر ادمین بود → برو داشبورد
    if (result.profile?.role === "admin") {
      setMessage("ورود مدیریت انجام شد.");
      
      // ⛔ مهم‌ترین خط (مشکل تو همین بود)
      navigate("/dashboard");

      return;
    }

    setMessage("دسترسی مدیریت ندارید.");
  }

  return (
    <div style={{ padding: 40 }}>
      <h2>ورود به پنل مدیریت SHIL</h2>

      <input
        placeholder="ایمیل"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />

      <input
        type="password"
        placeholder="رمز عبور"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />

      <button onClick={handleSubmit}>
        ورود به پنل مدیریت
      </button>

      <p>{message}</p>
    </div>
  );
}