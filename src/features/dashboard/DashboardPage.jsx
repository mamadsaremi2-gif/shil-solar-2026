import { useMemo } from "react";
import { useProjectStore } from "../../app/store/projectStore";
import { useAuth } from "../auth/AuthProvider";
import { DashboardActionGrid } from "./components/DashboardActionGrid";
import { DashboardHeroPanel } from "./components/DashboardHeroPanel";
import { useSystemStatus } from "./hooks/useSystemStatus";
import { buildDashboardCards } from "./model/dashboardCards";

function ProjectMiniRow({ project, openProject, openWorkspace, duplicateProject, exportProject, deleteProject, isAdmin }) {
  const latest = project.versions?.at(-1);
  const status = latest?.summary?.status || project.status || "draft";
  return (
    <article className="project-mini-row-v15">
      <div className="project-mini-row-v15__main">
        <strong>{project.title || "پروژه بدون نام"}</strong>
        <small>{project.systemType || "—"} · {project.city || "—"} · {status}</small>
      </div>
      <div className="project-mini-row-v15__actions">
        <button type="button" className="btn btn--primary" onClick={() => openProject(project.id)}>گزارش</button>
        <button type="button" className="btn btn--secondary" onClick={() => openWorkspace(project.id)}>ویرایش</button>
        <button type="button" className="btn btn--ghost" onClick={() => duplicateProject(project.id)}>کپی</button>
        <button type="button" className="btn btn--ghost" onClick={() => exportProject(project.id)}>خروجی</button>
        {isAdmin ? <button type="button" className="btn btn--danger" onClick={() => deleteProject(project.id, true)}>حذف</button> : null}
      </div>
    </article>
  );
}

function ProjectBucket({ title, projects, emptyText, actions }) {
  return (
    <details className="dashboard-project-bucket-v15" open={projects.length > 0}>
      <summary>
        <strong>{title}</strong>
        <span>{projects.length} مورد</span>
      </summary>
      {projects.length ? (
        <div className="dashboard-project-bucket-v15__list">
          {projects.slice(0, 8).map((project) => <ProjectMiniRow key={project.id} project={project} {...actions} />)}
        </div>
      ) : <p className="project-management-empty-v10">{emptyText}</p>}
    </details>
  );
}

export function DashboardPage() {
  const { projects, startNewProject, openScenarios, openEducation, openFeedback, openContact, openAdmin, openProjectsHub, openAIPage, openProject, openWorkspace, duplicateProject, exportProject, deleteProject } = useProjectStore();
  const { signOut, profile, isAdmin, isOfflineMode } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    window.location.reload();
  };
  const systemStatus = useSystemStatus(isOfflineMode);

  const dashboardCards = useMemo(
    () => buildDashboardCards({
      isAdmin,
      startNewProject,
      openProjectsHub,
      openAIPage,
      openContact,
      openScenarios,
      openEducation,
      openFeedback,
      openAdmin,
      signOut: handleSignOut,
    }),
    [isAdmin, openAdmin, openProjectsHub, openAIPage, openContact, openEducation, openFeedback, openScenarios, handleSignOut, startNewProject],
  );

  const activeProjects = projects.filter((p) => p.status !== "calculated");
  const finishedProjects = projects.filter((p) => p.status === "calculated");
  const projectActions = { openProject, openWorkspace, duplicateProject, exportProject, deleteProject, isAdmin };

  return (
    <main className="shil-dashboard" dir="rtl">
      <DashboardHeroPanel
        isAdmin={isAdmin}
        profile={profile}
        projectCount={projects.length}
        systemStatus={systemStatus}
      />
      <div className={`network-status-pill is-${systemStatus?.tone === "success" ? "online" : "offline"}`} title={systemStatus?.detail || ""}>
        <i aria-hidden="true" />
        <span>{systemStatus?.tone === "success" ? "آنلاین" : "آفلاین"}</span>
      </div>
      <DashboardActionGrid cards={dashboardCards} />
      <section className="dashboard-projects-master-card-v15" aria-label="پروژه‌ها">
        <div className="dashboard-projects-master-card-v15__head">
          <div>
            <h2>پروژه‌ها</h2>
            <p>پروژه‌های شما به‌صورت خصوصی نمایش داده می‌شوند و نسخه مدیریتی برای پیگیری در پنل مدیریت ثبت می‌شود.</p>
          </div>
          <button className="btn btn--primary" type="button" onClick={startNewProject}>پروژه جدید</button>
        </div>
        <div className="dashboard-projects-master-card-v15__summary">
          <span>در حال انجام: <strong>{activeProjects.length}</strong></span>
          <span>نهایی: <strong>{finishedProjects.length}</strong></span>
          <span>کل پروژه‌های من: <strong>{projects.length}</strong></span>
        </div>
        <ProjectBucket title="پروژه‌های در حال انجام" projects={activeProjects} emptyText="پروژه در حال انجام ندارید." actions={projectActions} />
        <ProjectBucket title="پروژه‌های نهایی" projects={finishedProjects} emptyText="هنوز پروژه نهایی ثبت نشده است." actions={projectActions} />
      </section>
    </main>
  );
}
