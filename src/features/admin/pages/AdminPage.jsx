import { useMemo, useState } from "react";
import { useAuth } from "../../../features/auth/AuthProvider";
import { useProjectStore } from "../../../app/store/projectStore";

function statusLabel(status) {
  if (status === "calculated") return "محاسبه‌شده";
  if (status === "draft") return "پیش‌نویس";
  return status || "نامشخص";
}

function projectSummary(project) {
  const version = project.versions?.at(-1);
  const summary = version?.summary || {};
  return {
    power: summary.demandPowerW ? `${Math.round(summary.demandPowerW)} W` : "—",
    panel: summary.panelCount || "—",
    battery: summary.batteryAh ? `${Math.round(summary.batteryAh)} Ah` : "—",
    status: summary.status || project.status,
  };
}

export function AdminPage() {
  const { signIn, isAdmin, switchRole } = useAuth();
  const { projects, goDashboard, openWorkspace, openProject, copyProjectToScenario, deleteProject, syncCloudProjects } = useProjectStore();
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return projects;
    return projects.filter((project) => `${project.title} ${project.clientName} ${project.city} ${project.systemType}`.includes(q));
  }, [projects, query]);

  async function handleSubmit(event) {
    event.preventDefault();
    const result = await signIn(form.email, form.password);
    if (!result.ok) {
      setMessage(result.error || "ورود ناموفق بود.");
      return;
    }
    switchRole?.("admin");
    setMessage("ورود مدیریت انجام شد.");
  }

  async function handleSync() {
    const result = await syncCloudProjects("local-dev");
    setMessage(result.ok ? "همگام‌سازی انجام شد." : result.message || "همگام‌سازی در حالت آفلاین ذخیره شد.");
  }

  if (!isAdmin) {
    return (
      <main className="project-flow-shell" dir="rtl">
        <section className="flow-top-card"><button className="btn btn--ghost" type="button" onClick={goDashboard}>بازگشت</button><div className="flow-top-title"><strong>پنل مدیریت</strong></div><span /></section>
        <section className="focus-content-card admin-modern-card">
          <h2>ورود به پنل مدیریت SHIL</h2>
          <p>برای مشاهده همه پروژه‌های کاربران و مدیریت سناریوها، نقش مدیر را فعال کنید یا با حساب مدیر وارد شوید.</p>
          <form onSubmit={handleSubmit} className="focus-form-table">
            <label>ایمیل<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
            <label>رمز عبور<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
            <button className="btn btn--primary" type="submit">ورود مدیریت</button>
            <button className="btn btn--secondary" type="button" onClick={() => switchRole?.("admin")}>فعال‌سازی مدیر محلی</button>
          </form>
          {message ? <p className="section-note">{message}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="project-flow-shell" dir="rtl">
      <section className="flow-top-card"><button className="btn btn--ghost" type="button" onClick={goDashboard}>بازگشت</button><div className="flow-top-title"><strong>پنل مدیریت پروژه‌ها</strong></div><button className="btn btn--secondary" type="button" onClick={handleSync}>همگام‌سازی</button></section>
      <section className="focus-content-card admin-modern-card">
        <div className="admin-dashboard-head">
          <div><h2>همه پروژه‌های کاربران</h2><p>ادمین می‌تواند پروژه‌ها را بررسی، اصلاح، حذف یا به سناریوهای آماده منتقل کند.</p></div>
          <input className="search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="جستجو در پروژه‌ها..." />
        </div>
        <div className="admin-metric-row">
          <div><span>کل پروژه‌ها</span><strong>{projects.length}</strong></div>
          <div><span>محاسبه‌شده</span><strong>{projects.filter((p) => p.status === "calculated").length}</strong></div>
          <div><span>پیش‌نویس</span><strong>{projects.filter((p) => p.status === "draft").length}</strong></div>
        </div>
        <div className="admin-project-grid">
          {filtered.map((project) => {
            const summary = projectSummary(project);
            return (
              <article key={project.id} className="admin-project-card">
                <div className="admin-project-card__head"><strong>{project.title || "پروژه بدون عنوان"}</strong><span>{statusLabel(project.status)}</span></div>
                <div className="summary-list"><div><span>کارفرما</span><strong>{project.clientName || "—"}</strong></div><div><span>شهر</span><strong>{project.city || "—"}</strong></div><div><span>توان</span><strong>{summary.power}</strong></div><div><span>پنل</span><strong>{summary.panel}</strong></div><div><span>باتری</span><strong>{summary.battery}</strong></div></div>
                <div className="admin-project-actions">
                  <button className="btn btn--secondary btn--sm" type="button" onClick={() => openWorkspace(project.id)}>اصلاح</button>
                  {project.currentVersionId ? <button className="btn btn--primary btn--sm" type="button" onClick={() => openProject(project.id, project.currentVersionId)}>خروجی</button> : null}
                  <button className="btn btn--ghost btn--sm" type="button" onClick={() => copyProjectToScenario(project.id)}>انتقال به سناریو</button>
                  <button className="btn btn--danger btn--sm" type="button" onClick={() => deleteProject(project.id)}>حذف</button>
                </div>
              </article>
            );
          })}
        </div>
        {!filtered.length ? <p className="empty-state">پروژه‌ای پیدا نشد.</p> : null}
        {message ? <p className="section-note">{message}</p> : null}
      </section>
    </main>
  );
}

export default AdminPage;
