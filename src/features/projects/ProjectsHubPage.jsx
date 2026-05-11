import { useMemo, useState } from "react";
import { useProjectStore } from "../../app/store/projectStore";

function ProjectList({ title, projects, emptyText, openWorkspace }) {
  return <section className="mobile-project-list-card"><div className="mobile-project-list-card__title"><strong>{title}</strong><span>{projects.length} مورد</span></div>{projects.length ? projects.map((project) => { const latest = project.versions?.at(-1); const status = latest?.summary?.status || project.status || "draft"; return <article className="mobile-project-row" key={project.id}><div><strong>{project.title || "پروژه بدون نام"}</strong><small>{project.city || "—"} · {project.systemType || "—"} · {status}</small></div><button className="btn btn--primary btn--sm" type="button" onClick={() => openWorkspace(project.id)}>ورود</button></article>; }) : <p className="empty-state">{emptyText}</p>}</section>;
}

export function ProjectsHubPage() {
  const { projects, goDashboard, openWorkspace } = useProjectStore();
  const [view, setView] = useState(null);
  const activeProjects = useMemo(() => projects.filter((p) => p.status !== "calculated"), [projects]);
  const finishedProjects = useMemo(() => projects.filter((p) => p.status === "calculated"), [projects]);
  return <main className="mobile-page-shell mobile-projects-page" dir="rtl"><header className="mobile-fixed-header"><button className="mobile-back-btn" type="button" onClick={() => view ? setView(null) : goDashboard()}>‹</button><img className="mobile-header-logo" src="/images/branding/shil-logo.png" alt="SHIL" /><span className="mobile-title-pill">{view === "active" ? "در حال اجرا" : view === "done" ? "پروژه‌های نهایی" : "پروژه‌ها"}</span></header><section className="mobile-scroll-content no-stepbar">{!view ? <div className="projects-choice-grid"><button className="dashboard-floating-icon project-hub-icon" type="button" onClick={() => setView("active")}><span>🛠️</span><strong>پروژه‌های در حال اجرا</strong></button><button className="dashboard-floating-icon project-hub-icon" type="button" onClick={() => setView("done")}><span>✅</span><strong>پروژه‌های نهایی</strong></button></div> : view === "active" ? <ProjectList title="پروژه‌های در حال اجرا" projects={activeProjects} emptyText="پروژه در حال اجرا ندارید." openWorkspace={openWorkspace} /> : <ProjectList title="پروژه‌های نهایی" projects={finishedProjects} emptyText="هنوز پروژه نهایی ثبت نشده است." openWorkspace={openWorkspace} />}</section><footer className="mobile-fixed-footer"><button className="btn btn--ghost" type="button" onClick={() => view ? setView(null) : goDashboard()}>بازگشت</button></footer></main>;
}
