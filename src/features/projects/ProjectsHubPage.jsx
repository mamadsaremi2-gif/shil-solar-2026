import { useMemo, useState } from "react";
import { useProjectStore } from "../../app/store/projectStore";
import { SHIL_IMAGE_MANIFEST } from "../../design/assetManifest";

function ProjectList({ title, projects, emptyText, openWorkspace }) {
  return (
    <section className="mobile-project-list-card final-project-list-card">
      <div className="mobile-project-list-card__title"><strong>{title}</strong><span>{projects.length} مورد</span></div>
      {projects.length ? projects.map((project) => {
        const latest = project.versions?.at(-1);
        const status = latest?.summary?.status || project.status || "draft";
        return (
          <article className="mobile-project-row" key={project.id}>
            <div><strong>{project.title || "پروژه بدون نام"}</strong><small>{project.city || "—"} · {project.systemType || "—"} · {status}</small></div>
            <button className="btn btn--primary btn--sm" type="button" onClick={() => openWorkspace(project.id)}>ورود</button>
          </article>
        );
      }) : <p className="empty-state">{emptyText}</p>}
    </section>
  );
}

export function ProjectsHubPage() {
  const { projects, goDashboard, openWorkspace } = useProjectStore();
  const [view, setView] = useState(null);
  const activeProjects = useMemo(() => projects.filter((p) => p.status !== "calculated"), [projects]);
  const finishedProjects = useMemo(() => projects.filter((p) => p.status === "calculated"), [projects]);

  const title = view === "active" ? "در حال اجرا" : view === "done" ? "پروژه‌های نهایی" : "پروژه‌ها";
  const back = () => view ? setView(null) : goDashboard();

  return (
    <main className="mobile-page-shell mobile-projects-page shil-projects-final" dir="rtl">
      <header className="mobile-fixed-header unified-shil-header">
        <button className="mobile-back-btn" type="button" onClick={back} aria-label="بازگشت">‹</button>
        <img className="mobile-header-logo" src={SHIL_IMAGE_MANIFEST.branding.headerLogo.path} alt="SHIL" />
        <span className="mobile-title-pill">{title}</span>
      </header>

      <section className="mobile-scroll-content no-stepbar projects-final-scroll">
        {!view ? (
          <div className="projects-choice-grid final-projects-choice-grid">
            <button className="project-hub-icon final-hub-card" type="button" onClick={() => setView("active")}>
              <span className="final-hub-card__no">01</span><i>🛠️</i><strong>پروژه‌های در حال اجرا</strong>
            </button>
            <button className="project-hub-icon final-hub-card" type="button" onClick={() => setView("done")}>
              <span className="final-hub-card__no">02</span><i>✅</i><strong>پروژه‌های نهایی</strong>
            </button>
          </div>
        ) : view === "active" ? (
          <ProjectList title="پروژه‌های در حال اجرا" projects={activeProjects} emptyText="پروژه در حال اجرا ندارید." openWorkspace={openWorkspace} />
        ) : (
          <ProjectList title="پروژه‌های نهایی" projects={finishedProjects} emptyText="هنوز پروژه نهایی ثبت نشده است." openWorkspace={openWorkspace} />
        )}
      </section>

      <footer className="mobile-fixed-footer unified-shil-footer"><button className="btn btn--ghost" type="button" onClick={back}>برگشت</button></footer>
    </main>
  );
}
