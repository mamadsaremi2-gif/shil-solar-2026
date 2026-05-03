import { useState } from "react";
import { useProjectStore } from "../app/store/projectStore";
import { PUBLIC_ASSETS } from "../shared/constants/publicAssets";
import { useAuth } from "../features/auth/AuthProvider";

function statusLabel(status) {
  switch (status) {
    case "calculated": return "محاسبه شده";
    case "reviewed": return "بازبینی شده";
    case "archived": return "آرشیو";
    default: return "پیش نویس";
  }
}

function systemTypeLabel(value) {
  const map = {
    offgrid: "Off-Grid",
    hybrid: "Hybrid",
    gridtie: "Grid-Tie",
    backup: "سانورتر و باطری",
  };
  return map[value] ?? value ?? "—";
}

function DashboardStat({ label, value, icon, tone }) {
  return (
    <div className={`metric-card dashboard-stat dashboard-stat--${tone}`}>
      <div>
        <div className="metric-card__label">{label}</div>
        <div className="metric-card__value">{value}</div>
      </div>
      <span className="dashboard-stat__icon">{icon}</span>
    </div>
  );
}

function QuickAction({ title, icon, onClick }) {
  return (
    <button className="quick-action-card" type="button" onClick={onClick}>
      <span>{icon}</span>
      <strong>{title}</strong>
    </button>
  );
}

export function DashboardPage() {
  const { projects, startNewProject, openProject, openWorkspace, openScenarios, openContact, openAdmin, deleteProject, copyProjectToScenario, syncCloudProjects } = useProjectStore();
  const { profile, isAdmin, user, signOut, isConfigured } = useAuth();
  const [syncMessage, setSyncMessage] = useState("");
  const calculatedCount = projects.filter((project) => (project.versions?.length ?? 0) > 0).length;
  const draftCount = projects.length - calculatedCount;
  const draftProjects = projects.filter((project) => (project.versions?.length ?? 0) === 0);
  const versionCount = projects.reduce((sum, project) => sum + (project.versions?.length ?? 0), 0);

  return (
    <div className="shell shell--dashboard dashboard-product-shell">
      <header className="dashboard-nav">
        <div className="dashboard-nav__brand">
          <img src={PUBLIC_ASSETS.branding.logo} alt="SHIL IRAN" />
          <div>
            <strong>SHIL SOLAR</strong>
            <span>طراحی هوشمند سیستم‌های خورشیدی</span>
          </div>
        </div>
        <nav className="dashboard-nav__links" aria-label="navigation">
          <button type="button" className="is-active">داشبورد</button>
          <button type="button" onClick={startNewProject}>+ پروژه جدید</button>
          <button type="button" onClick={() => openScenarios("dashboard")}>سناریوهای آماده</button>
          <button type="button" onClick={() => openContact("dashboard")}>ارتباط با ما</button>
          <button type="button" onClick={openAdmin}>{isAdmin ? 'مدیریت' : 'ورود مدیریت'}</button>
          {user ? <button type="button" onClick={signOut}>خروج</button> : null}
        </nav>
      </header>

      <section
        className="dashboard-hero-xl"
        style={{ backgroundImage: `linear-gradient(90deg, rgba(3,7,18,0.06), rgba(3,7,18,0.22) 42%, rgba(3,7,18,0.58) 100%), url(${PUBLIC_ASSETS.backgrounds.shilProductsHero})` }}
      >
        <div className="dashboard-hero-xl__content dashboard-hero-xl__content--minimal" />
      </section>

      <section className="panel user-access-panel">
        <div>
          <span className="eyebrow">SHIL SOLAR Account</span>
          <h2>{profile?.full_name || profile?.email || "کاربر برنامه"}</h2>
          <p>{isConfigured ? "دسترسی شما توسط مدیر تأیید شده است و پروژه‌ها می‌توانند با سرور همگام شوند." : "حالت تست محلی فعال است؛ برای نسخه عمومی، Supabase را تنظیم کنید."}</p>
        </div>
        <div className="user-access-panel__actions">
          <button className="btn btn--secondary" type="button" onClick={async () => {
            setSyncMessage("در حال همگام‌سازی...");
            const result = await syncCloudProjects(user?.id);
            setSyncMessage(result.ok ? "همگام‌سازی انجام شد." : result.message || "همگام‌سازی انجام نشد.");
          }}>همگام‌سازی پروژه‌ها با سرور</button>
          <button className="btn btn--primary" type="button" onClick={openAdmin}>{isAdmin ? 'پنل مدیریت' : 'ورود به پنل مدیریت'}</button>
          {syncMessage ? <span className="badge">{syncMessage}</span> : null}
        </div>
      </section>

      {draftProjects.length ? (
        <section className="panel continue-project-panel">
          <div className="panel__header"><h2>ادامه مسیر پروژه نیمه‌کاره</h2><span className="badge">{draftProjects.length} پیش‌نویس</span></div>
          <div className="project-grid">
            {draftProjects.map((project) => (
              <article key={project.id} className="project-card project-card--rich">
                <strong>{project.title || project.draftForm?.projectTitle}</strong>
                <span>آخرین مرحله ذخیره‌شده برای ادامه طراحی آماده است.</span>
                <div className="project-card__actions">
                  <button className="btn btn--primary btn--sm" onClick={() => openWorkspace(project.id)}>ادامه مسیر</button>
                  {isAdmin ? <button className="btn btn--ghost btn--sm" onClick={() => deleteProject(project.id, true)}>دیگر نیاز ندارم / حذف</button> : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="metric-grid dashboard-kpi-grid">
        <DashboardStat label="کل پروژه‌ها" value={projects.length} icon="📁" tone="blue" />
        <DashboardStat label="پروژه‌های محاسبه‌شده" value={calculatedCount} icon="🧮" tone="green" />
        <DashboardStat label="پیش‌نویس‌ها" value={draftCount} icon="✎" tone="amber" />
        <DashboardStat label="نسخه‌های ذخیره‌شده" value={versionCount} icon="↺" tone="purple" />
      </section>

      <section className="dashboard-bottom-grid">
        <section className="panel dashboard-project-panel">
          <div className="panel__header">
            <h2>پروژه‌های اخیر</h2>
            <span className="badge">{projects.length} پروژه</span>
          </div>
          <div className="project-grid">
            {projects.length === 0 ? (
              <div className="empty-state dashboard-empty-state">
                <div className="dashboard-empty-state__icon">☀️</div>
                <strong>هنوز پروژه‌ای ایجاد نکرده‌اید!</strong>
                <span>برای شروع، یک پروژه جدید بسازید و سیستم دلخواهتان را طراحی نمایید.</span>
                <button className="btn btn--primary" type="button" onClick={startNewProject}>+ ایجاد پروژه جدید</button>
              </div>
            ) : (
              projects.map((project) => (
                <article key={project.id} className="project-card project-card--rich">
                  <strong>{project.title || project.draftForm?.projectTitle}</strong>
                  <span>نوع سیستم: {systemTypeLabel(project.systemType || project.draftForm?.systemType)}</span>
                  <span>شهر: {project.city || project.draftForm?.city || "—"}</span>
                  <span>وضعیت: {statusLabel(project.status)}</span>
                  <span>نسخه‌ها: {project.versions?.length ?? 0}</span>
                  <span>آخرین بروزرسانی: {new Date(project.updatedAt).toLocaleDateString("fa-IR")}</span>
                  <div className="project-card__actions">
                    <button className="btn btn--secondary btn--sm" onClick={() => openWorkspace(project.id)}>ادامه طراحی</button>
                    <button className="btn btn--primary btn--sm" onClick={() => openProject(project.id, project.currentVersionId)}>آخرین خروجی</button>
                    {isAdmin ? <button className="btn btn--secondary btn--sm" onClick={() => copyProjectToScenario(project.id)}>انتقال به سناریو</button> : null}
                    {isAdmin ? <button className="btn btn--ghost btn--sm" onClick={() => deleteProject(project.id, true)}>حذف</button> : null}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="panel quick-panel">
          <div className="panel__header">
            <h2>دسترسی سریع</h2>
          </div>
          <div className="quick-action-grid">
            <QuickAction title="محاسبه بار" icon="⚡" onClick={startNewProject} />
            <QuickAction title="سناریوهای آماده" icon="📋" onClick={() => openScenarios("dashboard")} />
            <QuickAction title="گزارش مهندسی" icon="📄" onClick={startNewProject} />
          </div>
        </section>

        <section
          className="panel dashboard-contact-card"
          style={{ backgroundImage: `linear-gradient(135deg, rgba(8,17,31,0.28), rgba(8,17,31,0.88)), url(${PUBLIC_ASSETS.backgrounds.report})` }}
        >
          <div className="dashboard-contact-card__content dashboard-contact-card__content--simple">
            <img src={PUBLIC_ASSETS.branding.logo} alt="SHIL IRAN" />
            <strong>ارتباط با ما</strong>
            <span>اطلاعات تماس و مسیرهای ارتباطی SHIL</span>
            <button className="btn btn--primary" type="button" onClick={() => openContact("dashboard")}>مشاهده صفحه ارتباط</button>
          </div>
        </section>
      </section>

      <footer className="dashboard-footer">© 2024 SHILIRAN GROUP. All rights reserved.</footer>
    </div>
  );
}
