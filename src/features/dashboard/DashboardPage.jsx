import { useMemo } from "react";
import { useProjectStore } from "../../app/store/projectStore";
import { useAuth } from "../auth/AuthProvider";
import { DashboardActionGrid } from "./components/DashboardActionGrid";
import { DashboardHeroPanel } from "./components/DashboardHeroPanel";
import { useSystemStatus } from "./hooks/useSystemStatus";
import { buildDashboardCards } from "./model/dashboardCards";

export function DashboardPage() {
  const { projects, startNewProject, openScenarios, openEducation, openFeedback, openContact, openAdmin, openProject, openWorkspace, duplicateProject, exportProject, deleteProject } = useProjectStore();
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
      openContact,
      openScenarios,
      openEducation,
      openFeedback,
      openAdmin,
      signOut: handleSignOut,
    }),
    [isAdmin, openAdmin, openContact, openEducation, openFeedback, openScenarios, handleSignOut, startNewProject],
  );

  return (
    <main className="shil-dashboard" dir="rtl">
      <DashboardHeroPanel
        isAdmin={isAdmin}
        profile={profile}
        projectCount={projects.length}
        systemStatus={systemStatus}
      />
      <DashboardActionGrid cards={dashboardCards} />
      <section className="project-management-center-v10 my-projects-center" aria-label="پروژه‌های من">
        <div className="project-management-center-v10__head">
          <div>
            <h2>پروژه‌های من</h2>
            <p>پروژه‌های در حال انجام و پروژه‌های نهایی شما در همین بخش تفکیک می‌شوند.</p>
          </div>
          <button className="btn btn--primary" type="button" onClick={startNewProject}>پروژه جدید</button>
        </div>
        {projects.length ? (
          <>
          <div className="project-bucket-title"><strong>پروژه‌های در حال انجام</strong><span>{projects.filter((p)=>p.status !== 'calculated').length} مورد</span></div>
          <div className="project-management-grid-v10">
            {projects.filter((p)=>p.status !== 'calculated').slice(0, 6).map((project) => {
              const latest = project.versions?.at(-1);
              const status = latest?.summary?.status || project.status || 'draft';
              return (
                <article key={project.id} className="project-management-card-v10">
                  <div className="project-management-card-v10__title">
                    <strong>{project.title || 'پروژه بدون نام'}</strong>
                    <span>{project.systemType || '—'}</span>
                  </div>
                  <div className="project-management-card-v10__meta">
                    <span>کارفرما: {project.clientName || '—'}</span>
                    <span>شهر: {project.city || '—'}</span>
                    <span>نسخه‌ها: {project.versions?.length || 0}</span>
                    <span>وضعیت: {status}</span>
                  </div>
                  <div className="project-management-card-v10__actions">
                    <button type="button" className="btn btn--primary" onClick={() => openProject(project.id)}>گزارش</button>
                    <button type="button" className="btn btn--secondary" onClick={() => openWorkspace(project.id)}>ویرایش</button>
                    <button type="button" className="btn btn--ghost" onClick={() => duplicateProject(project.id)}>Duplicate</button>
                    <button type="button" className="btn btn--ghost" onClick={() => exportProject(project.id)}>Export</button>
                    {isAdmin ? <button type="button" className="btn btn--danger" onClick={() => deleteProject(project.id, true)}>حذف</button> : null}
                  </div>
                </article>
              );
            })}
          </div>
          <div className="project-bucket-title"><strong>پروژه‌های نهایی</strong><span>{projects.filter((p)=>p.status === 'calculated').length} مورد</span></div>
          <div className="project-management-grid-v10">
            {projects.filter((p)=>p.status === 'calculated').slice(0, 6).map((project) => {
              const latest = project.versions?.at(-1);
              const status = latest?.summary?.status || project.status || 'calculated';
              return (
                <article key={project.id} className="project-management-card-v10">
                  <div className="project-management-card-v10__title">
                    <strong>{project.title || 'پروژه بدون نام'}</strong>
                    <span>{project.systemType || '—'}</span>
                  </div>
                  <div className="project-management-card-v10__meta">
                    <span>کارفرما: {project.clientName || '—'}</span>
                    <span>شهر: {project.city || '—'}</span>
                    <span>نسخه‌ها: {project.versions?.length || 0}</span>
                    <span>وضعیت: {status}</span>
                  </div>
                  <div className="project-management-card-v10__actions">
                    <button type="button" className="btn btn--primary" onClick={() => openProject(project.id)}>گزارش</button>
                    <button type="button" className="btn btn--secondary" onClick={() => openWorkspace(project.id)}>ویرایش</button>
                    <button type="button" className="btn btn--ghost" onClick={() => duplicateProject(project.id)}>Duplicate</button>
                    <button type="button" className="btn btn--ghost" onClick={() => exportProject(project.id)}>Export</button>
                    {isAdmin ? <button type="button" className="btn btn--danger" onClick={() => deleteProject(project.id, true)}>حذف</button> : null}
                  </div>
                </article>
              );
            })}
          </div>
          </>
        ) : <p className="project-management-empty-v10">هنوز پروژه‌ای ذخیره نشده است. با ساخت پروژه جدید، Versioning و Export فعال می‌شود.</p>}
      </section>
    </main>
  );
}
