import { createContext, useContext, useMemo, useState } from "react";
import { DEFAULT_PROJECT_FORM } from "../../domain/models/project";
import { ProjectRepository } from "../../data/repositories/ProjectRepository";
import { getSupabaseClient, isSupabaseConfigured } from "../../shared/lib/supabaseLazy";
import { runEngineeringDesign } from "../../domain/engine/orchestrator/runEngineeringDesign";
import { useAuth } from "../../features/auth/AuthProvider";

const ProjectStoreContext = createContext(null);

async function trackEventSafe(eventName, payload = {}) {
  try {
    const { trackEvent } = await import("../../shared/lib/usageTracker");
    await trackEvent(eventName, payload);
  } catch (error) {
    console.warn("Usage tracking failed", error);
  }
}

function cloneForm(form) {
  return JSON.parse(JSON.stringify(form));
}

function createProjectSession(seed = {}) {
  const baseForm = cloneForm(seed.form ?? DEFAULT_PROJECT_FORM);

  return {
    projectId: seed.projectId ?? null,
    versionId: seed.versionId ?? null,
    createdAt: seed.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    form: baseForm,
    result: seed.result ?? null,
  };
}

export function ProjectStoreProvider({ children }) {
  const { user, isAdmin } = useAuth();

  const [route, setRoute] = useState({ name: "dashboard" });

  const [projects, setProjects] = useState(() =>
    ProjectRepository.list()
  );

  const [activeProject, setActiveProject] = useState(() =>
    createProjectSession()
  );

  const [stepIndex, setStepIndex] = useState(0);

  const steps = useMemo(
    () => [
      { key: "project", label: "اطلاعات پروژه" },
      { key: "system", label: "داشبورد / انتخاب مسیر" },
      { key: "method", label: "روش محاسبه" },
      { key: "loads", label: "ورودی محاسبات" },
      { key: "site", label: "شرایط محیطی" },
      { key: "systemConfig", label: "تنظیمات سیستم" },
      { key: "review", label: "مرور و اجرا" },
    ],
    []
  );

  function refreshProjects() {
    const items = ProjectRepository.list();
    setProjects(items);
    return items;
  }

  const actions = {
    goDashboard() {
      setRoute({ name: "dashboard" });
      trackEventSafe("open_dashboard");
    },

    openAdmin() {
      setRoute({ name: "admin" });
      trackEventSafe("open_admin");
    },

    openContact(origin = null) {
      setRoute({
        name: "contact",
        origin: origin ?? route.name,
      });

      trackEventSafe("open_contact");
    },

    startNewProject() {
      setActiveProject(
        createProjectSession({
          form: {
            ...DEFAULT_PROJECT_FORM,
            ownerId: user?.id || "local-dev",
          },
        })
      );

      setStepIndex(0);

      setRoute({ name: "workspace" });

      trackEventSafe("start_new_project");
    },

    updateForm(patch) {
      setActiveProject((prev) => ({
        ...prev,
        updatedAt: new Date().toISOString(),
        form: {
          ...prev.form,
          ...patch,
        },
      }));
    },

    nextStep() {
      setStepIndex((prev) =>
        Math.min(prev + 1, steps.length - 1)
      );
    },

    prevStep() {
      setStepIndex((prev) =>
        Math.max(prev - 1, 0)
      );
    },

    goToStep(index) {
      setStepIndex(index);
    },

    runCalculation() {
      const output = runEngineeringDesign(
        activeProject.form
      );

      setActiveProject((prev) => ({
        ...prev,
        updatedAt: new Date().toISOString(),
        result: output,
      }));

      if (output.ok) {
        setRoute({ name: "output" });
      }

      return output;
    },

    openAIPage() {
      setRoute({ name: "ai" });
    },

    saveProject() {
      const project = {
        id: crypto.randomUUID(),
        ownerId: user?.id || "local-dev",
        title: activeProject.form.projectTitle,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        draftForm: cloneForm(activeProject.form),
      };

      ProjectRepository.upsert(project);

      refreshProjects();

      return project;
    },
  };

  const visibleProjects = isAdmin
    ? projects
    : projects.filter(
        (project) =>
          !project.ownerId ||
          project.ownerId === (user?.id || "local-dev")
      );

  const value = {
    route,
    setRoute,
    projects: visibleProjects,
    allProjects: projects,
    activeProject,
    stepIndex,
    steps,
    ...actions,
  };

  return (
    <ProjectStoreContext.Provider value={value}>
      {children}
    </ProjectStoreContext.Provider>
  );
}

export function useProjectStore() {
  const context = useContext(ProjectStoreContext);

  if (!context) {
    throw new Error(
      "useProjectStore must be used within ProjectStoreProvider"
    );
  }

  return context;
}