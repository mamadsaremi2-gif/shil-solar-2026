import { useState } from "react";
import { useAuth } from "../features/auth/AuthProvider";
import { useProjectStore } from "../app/store/projectStore";

export function AdminPage() {
  const { signIn } = useAuth();
  const { goDashboard } = useProjectStore();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    const result = await signIn(form.email, form.password);

    if (!result.ok) {
      setMessage(result.error || "ورود ناموفق بود.");
      return;
    }

    setMessage("ورود مدیریت انجام شد.");

    setTimeout(() => {
      goDashboard();
    }, 300);
  }

  return (
    <div className="shell">
      <section className="panel">
        <h2>ورود به پنل مدیریت SHIL</h2>
        <p>با حساب تأییدشده مدیر وارد شوید.</p>

        <form onSubmit={handleSubmit} className="form-grid">
          <label>
            ایمیل
            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
            />
          </label>

          <label>
            رمز عبور
            <input
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm({ ...form, password: event.target.value })
              }
            />
          </label>

          <button className="btn btn--primary" type="submit">
            ورود به پنل مدیریت
          </button>

          <button
            className="btn btn--secondary"
            type="button"
            onClick={goDashboard}
          >
            بازگشت به داشبورد
          </button>
        </form>

        {message ? <p>{message}</p> : null}
      </section>
    </div>
  );
}

export default AdminPage;