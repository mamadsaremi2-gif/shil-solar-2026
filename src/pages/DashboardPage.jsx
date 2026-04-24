import { useProjectStore } from "../app/store/projectStore";
import { PUBLIC_ASSETS } from "../shared/constants/publicAssets";

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
  const { projects, startNewProject, openProject, openWorkspace, openEquipmentLibrary, openContact, deleteProject } = useProjectStore();
  const calculatedCount = projects.filter((project) => (project.versions?.length ?? 0) > 0).length;
  const draftCount = projects.length - calculatedCount;
  const versionCount = projects.reduce((sum, project) => sum + (project.versions?.length ?? 0), 0);

  return (
    <div className="shell shell--dashboard dashboard-product-shell">
      <header className="dashboard-nav">
        <div className="dashboard-nav__brand">
          <img src={PUBLIC_ASSETS.branding.logo} alt="SHIL IRAN" />
          <div>
            <strong>Solar Design Suite</strong>
            <span>طراحی هوشمند سیستم‌های خورشیدی</span>
          </div>
        </div>
        <nav className="dashboard-nav__links" aria-label="navigation">
          <button type="button" className="is-active">داشبورد</button>
          <button type="button" onClick={() => openEquipmentLibrary("dashboard")}>کتابخانه تجهیزات</button>
          <button type="button" onClick={() => openContact("dashboard")}>ارتباط با ما</button>
        </nav>
      </header>

      <section
        className="dashboard-hero-xl"
        style={{ backgroundImage: `linear-gradient(90deg, rgba(3,7,18,0.18), rgba(3,7,18,0.55) 52%, rgba(3,7,18,0.94)), url(${PUBLIC_ASSETS.backgrounds.method})` }}
      >
        <div className="dashboard-hero-xl__brand-mark">
          <img src={PUBLIC_ASSETS.branding.appLogo} alt="Solar Design Suite" />
        </div>
        <div className="dashboard-hero-xl__content">
          <span className="eyebrow">Solar Design Suite</span>
          <h1>طراحی مهندسی<br /><span>سیستم‌های خورشیدی</span></h1>
          <p>
            پروژه‌ها را هوشمند طراحی کنید، دقیق محاسبه کنید و نسخه‌های مهندسی را حرفه‌ای مدیریت کنید.
          </p>
          <div className="dashboard-hero-xl__actions">
            <button className="btn btn--primary" onClick={startNewProject}>+ پروژه جدید</button>
            <button className="btn btn--ghost" onClick={() => openEquipmentLibrary("dashboard")}>کتابخانه تجهیزات</button>
          </div>
        </div>
      </section>

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
                    <button className="btn btn--ghost btn--sm" onClick={() => deleteProject(project.id)}>حذف</button>
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
            <QuickAction title="انتخاب اینورتر" icon="▣" onClick={() => openEquipmentLibrary("dashboard")} />
            <QuickAction title="کتابخانه تجهیزات" icon="📦" onClick={() => openEquipmentLibrary("dashboard")} />
            <QuickAction title="گزارش مهندسی" icon="📄" onClick={startNewProject} />
          </div>
        </section>

        <section
          className="panel dashboard-contact-card"
          style={{ backgroundImage: `linear-gradient(135deg, rgba(8,17,31,0.28), rgba(8,17,31,0.88)), url(${PUBLIC_ASSETS.backgrounds.report})` }}
        >
          <div className="dashboard-contact-card__content">
            <img src={PUBLIC_ASSETS.branding.logo} alt="SHIL IRAN" />
            <span>وبسایت رسمی</span>
            <strong>SHIL.IR</strong>
            <p>راهکارهای هوشمند انرژی خورشیدی و مسیرهای ارتباطی رسمی.</p>
            <button className="btn btn--primary" type="button" onClick={() => openContact("dashboard")}>ارتباط با ما</button>
          </div>
          <div className="dashboard-contact-card__qr-list">
            <img src={PUBLIC_ASSETS.qr.instagramShil} alt="SHIL Instagram QR" />
            <img src={PUBLIC_ASSETS.qr.telegram} alt="Telegram QR" />
            <img src={PUBLIC_ASSETS.qr.whatsapp} alt="WhatsApp QR" />
          </div>
        </section>
      </section>

      <footer className="dashboard-footer">© 2024 SHILIRAN GROUP. All rights reserved.</footer>
    </div>
  );
}
