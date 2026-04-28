import { useState } from 'react';
import { useAuth } from './AuthProvider';

function AuthForm() {
  const { signIn, signUp, isConfigured } = useAuth();
  const [mode, setMode] = useState('signin');
  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    company: '',
    requestNote: '',
  });
  const [status, setStatus] = useState('');

  function patch(next) {
    setForm((prev) => ({ ...prev, ...next }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus('');

    if (mode === 'signin') {
      const result = await signIn(form.email, form.password);
      setStatus(result.ok ? 'ورود انجام شد.' : result.error || 'ورود ناموفق بود.');
      return;
    }

    const result = await signUp({
      email: form.email,
      password: form.password,
      fullName: form.fullName,
      phone: form.phone,
      company: form.company,
      requestNote: form.requestNote,
    });
    setStatus(result.ok ? 'درخواست ثبت شد. پس از تأیید مدیر، دسترسی فعال می‌شود.' : result.error || 'ثبت‌نام ناموفق بود.');
  }

  return (
    <div className="auth-shell">
      <section className="auth-card">
        <div className="auth-brand">
          <strong>SHIL SOLAR</strong>
          <span>پلتفرم مهندسی طراحی سیستم‌های خورشیدی</span>
        </div>

        {!isConfigured ? (
          <div className="auth-warning">
            اتصال Supabase تنظیم نشده است. برنامه در حالت تست محلی اجرا می‌شود.
          </div>
        ) : null}

        <div className="auth-tabs">
          <button type="button" className={mode === 'signin' ? 'is-active' : ''} onClick={() => setMode('signin')}>ورود</button>
          <button type="button" className={mode === 'signup' ? 'is-active' : ''} onClick={() => setMode('signup')}>درخواست دسترسی</button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'signup' ? (
            <>
              <label>نام و نام خانوادگی<input value={form.fullName} onChange={(e) => patch({ fullName: e.target.value })} required /></label>
              <label>شماره تماس<input value={form.phone} onChange={(e) => patch({ phone: e.target.value })} required /></label>
              <label>شرکت / سمت<input value={form.company} onChange={(e) => patch({ company: e.target.value })} /></label>
            </>
          ) : null}

          <label>ایمیل<input type="email" value={form.email} onChange={(e) => patch({ email: e.target.value })} required /></label>
          <label>رمز عبور<input type="password" value={form.password} onChange={(e) => patch({ password: e.target.value })} required minLength={6} /></label>

          {mode === 'signup' ? (
            <label>توضیح درخواست<textarea value={form.requestNote} onChange={(e) => patch({ requestNote: e.target.value })} placeholder="برای چه پروژه‌ای نیاز به دسترسی دارید؟" /></label>
          ) : null}

          <button className="btn btn--primary" type="submit">{mode === 'signin' ? 'ورود به برنامه' : 'ثبت درخواست دسترسی'}</button>
          {status ? <p className="auth-status">{status}</p> : null}
        </form>
      </section>
    </div>
  );
}

function WaitingApproval() {
  const { profile, signOut, reloadProfile } = useAuth();

  return (
    <div className="auth-shell">
      <section className="auth-card auth-card--center">
        <strong>در انتظار تأیید مدیر</strong>
        <p>درخواست شما ثبت شده است. پس از تأیید مدیر SHIL SOLAR، دسترسی به محاسبات فعال می‌شود.</p>
        <div className="summary-list">
          <div><span>ایمیل</span><strong>{profile?.email || '—'}</strong></div>
          <div><span>وضعیت</span><strong>{profile?.status || 'pending'}</strong></div>
        </div>
        <div className="auth-actions">
          <button className="btn btn--secondary" type="button" onClick={reloadProfile}>بررسی مجدد وضعیت</button>
          <button className="btn btn--ghost" type="button" onClick={signOut}>خروج</button>
        </div>
      </section>
    </div>
  );
}

export function AuthGate({ children }) {
  const { loading, user, profile, isApproved, isConfigured } = useAuth();

  if (loading) return null;

  // Public visitor mode: visitors can use the app without login.
  // Admin/user authentication still works when the user chooses to sign in elsewhere.
  if (!isConfigured) return children;

  if (!user) return children;

  if (!profile || !isApproved) return children;

  return children;
}
