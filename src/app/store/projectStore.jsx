import { createContext, useContext, useMemo, useState } from "react";
import { DEFAULT_PROJECT_FORM } from "../../domain/models/project";
import { ProjectRepository } from "../../data/repositories/ProjectRepository";
import { CloudProjectRepository } from "../../data/repositories/CloudProjectRepository";
import { isSupabaseConfigured, supabase } from "../../shared/lib/supabaseClient";
import { runEngineeringDesign } from "../../domain/engine/orchestrator/runEngineeringDesign";
import { trackEvent } from "../../shared/lib/usageTracker";

const ProjectStoreContext = createContext(null);

function cloneForm(form) {
  return JSON.parse(JSON.stringify(form));
}

function createProjectSession(seed = {}) {
  const baseForm = cloneForm(seed.form ?? DEFAULT_PROJECT_FORM);

  if (!baseForm.loadProfile || baseForm.loadProfile.length !== 24) {
    baseForm.loadProfile = cloneForm(DEFAULT_PROJECT_FORM.loadProfile);
  }

  return {
    projectId: seed.projectId ?? null,
    versionId: seed.versionId ?? null,
    createdAt: seed.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    form: baseForm,
    result: seed.result ?? null,
  };
}

function summarizeVersion(version) {
  const summary = version.result?.summary ?? {};

  return {
    demandPowerW: summary.demandPowerW ?? 0,
    totalDailyEnergyWh: summary.totalDailyEnergyWh ?? 0,
    batteryAh: summary.batteryAh ?? 0,
    panelCount: summary.panelCount ?? 0,
    inverterPowerW: summary.inverterPowerW ?? 0,
    status: version.result?.ok
      ? version.result?.advisor?.some((item) => item.severity === "error")
        ? "error"
        : version.result?.advisor?.some((item) => item.severity === "warning")
          ? "warning"
          : "success"
      : "draft",
  };
}

function buildVersionSnapshot(session, versionNumber) {
  return {
    id: crypto.randomUUID(),
    versionNumber,
    label: `نسخه ${versionNumber}`,
    createdAt: new Date().toISOString(),
    form: cloneForm(session.form),
    result: session.result,
    summary: summarizeVersion({ result: session.result }),
  };
}

function buildProjectRecordFromSession(session) {
  const now = new Date().toISOString();
  const version = buildVersionSnapshot(session, 1);

  return {
    id: crypto.randomUUID(),
    title: session.form.projectTitle,
    systemType: session.form.systemType,
    clientName: session.form.clientName,
    city: session.form.city,
    status: session.result?.ok ? "calculated" : "draft",
    createdAt: now,
    updatedAt: now,
    draftForm: cloneForm(session.form),
    currentVersionId: version.id,
    versions: [version],
  };
}

function hydrateSessionFromProject(project, versionId) {
  const targetVersion =
    project.versions.find((item) => item.id === versionId) ??
    project.versions.at(-1) ??
    null;

  return createProjectSession({
    projectId: project.id,
    versionId: targetVersion?.id ?? null,
    createdAt: project.createdAt,
    form: targetVersion?.form ?? project.draftForm ?? DEFAULT_PROJECT_FORM,
    result: targetVersion?.result ?? null,
  });
}

async function getCloudOwnerId() {
  if (!isSupabaseConfigured) return null;

  const { data } = await supabase.auth.getSession();
  return data?.session?.user?.id || null;
}

async function persistProjectToCloud(project) {
  try {
    const ownerId = await getCloudOwnerId();

    if (!ownerId || !project) return;

    await CloudProjectRepository.upsert(project, ownerId);

    trackEvent("cloud_project_saved", {
      projectId: project.id,
      status: project.status,
    });
  } catch (error) {
    console.warn("Cloud project save failed", error);
  }
}

export function ProjectStoreProvider({ children }) {
  const [route, setRoute] = useState({ name: "dashboard" });
  const [projects, setProjects] = useState(() => ProjectRepository.list());
  const [activeProject, setActiveProject] = useState(() => createProjectSession());
  const [stepIndex, setStepIndex] = useState(0);

  const steps = useMemo(
    () => [
      { key: "project", label: "اطلاعات پروژه" },
      { key: "system", label: "نوع سیستم" },
      { key: "method", label: "روش محاسبه" },
      { key: "loads", label: "بارها" },
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

  function syncDraft(nextSession) {
    if (!nextSession.projectId) return;

    const record = ProjectRepository.getById(nextSession.projectId);
    if (!record) return;

    ProjectRepository.upsert({
      ...record,
      title: nextSession.form.projectTitle,
      systemType: nextSession.form.systemType,
      clientName: nextSession.form.clientName,
      city: nextSession.form.city,
      draftForm: cloneForm(nextSession.form),
      updatedAt: new Date().toISOString(),
      status: record.versions?.length ? record.status : "draft",
    });

    refreshProjects();
  }

  const actions = {
    goDashboard() {
      setRoute({ name: "dashboard" });
      trackEvent("open_dashboard");
    },

    openAdmin() {
      setRoute({ name: "admin" });
      trackEvent("open_admin");
    },

    openEquipmentLibrary(origin = null) {
      setRoute({ name: "equipment", origin: origin ?? route.name });
      trackEvent("open_equipment_library", { origin: origin ?? route.name });
    },

    goBackFromEquipment() {
      const origin = route.origin === "workspace" ? "workspace" : "dashboard";
      setRoute({ name: origin });
    },

    openContact(origin = null) {
      setRoute({ name: "contact", origin: origin ?? route.name });
      trackEvent("open_contact", { origin: origin ?? route.name });
    },

    goBackFromContact() {
      const origin =
        route.origin === "workspace"
          ? "workspace"
          : route.origin === "output"
            ? "output"
            : "dashboard";

      setRoute({ name: origin });
    },

    async startNewProject() {
      const session = createProjectSession();

      const created = {
        id: crypto.randomUUID(),
        title: session.form.projectTitle || "پروژه جدید",
        systemType: session.form.systemType,
        clientName: session.form.clientName,
        city: session.form.city,
        status: "draft",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        draftForm: cloneForm(session.form),
        currentVersionId: null,
        versions: [],
      };

      ProjectRepository.upsert(created);

      setActiveProject({
        ...session,
        projectId: created.id,
        updatedAt: created.updatedAt,
      });

      refreshProjects();

      await persistProjectToCloud(created);

      setStepIndex(0);
      setRoute({ name: "workspace" });
      trackEvent("start_new_project");
    },

    updateForm(patch) {
      setActiveProject((prev) => {
        const next = {
          ...prev,
          updatedAt: new Date().toISOString(),
          form: { ...prev.form, ...patch },
        };

        syncDraft(next);
        return next;
      });
    },

    updateLoadItem(id, patch) {
      setActiveProject((prev) => {
        const next = {
          ...prev,
          updatedAt: new Date().toISOString(),
          form: {
            ...prev.form,
            loadItems: prev.form.loadItems.map((item) =>
              item.id === id ? { ...item, ...patch } : item
            ),
          },
        };

        syncDraft(next);
        return next;
      });
    },

    addLoadItem(payload = {}) {
      setActiveProject((prev) => {
        const item = {
          id: crypto.randomUUID(),
          name: "بار جدید",
          qty: 1,
          power: 100,
          hours: 1,
          powerFactor: 0.95,
          coincidenceFactor: 1,
          loadType: "mixed",
          surgeFactor: 1,
          ...payload,
        };

        const next = {
          ...prev,
          updatedAt: new Date().toISOString(),
          form: {
            ...prev.form,
            loadItems: [...prev.form.loadItems, item],
          },
        };

        syncDraft(next);
        return next;
      });
    },

    updateLoadProfileValue(id, factor) {
      setActiveProject((prev) => {
        const next = {
          ...prev,
          updatedAt: new Date().toISOString(),
          form: {
            ...prev.form,
            loadProfile: (prev.form.loadProfile || []).map((slot) =>
              slot.id === id ? { ...slot, factor } : slot
            ),
          },
        };

        syncDraft(next);
        return next;
      });
    },

    resetLoadProfile() {
      setActiveProject((prev) => {
        const next = {
          ...prev,
          updatedAt: new Date().toISOString(),
          form: {
            ...prev.form,
            loadProfile: cloneForm(DEFAULT_PROJECT_FORM.loadProfile),
          },
        };

        syncDraft(next);
        return next;
      });
    },

    removeLoadItem(id) {
      setActiveProject((prev) => {
        const next = {
          ...prev,
          updatedAt: new Date().toISOString(),
          form: {
            ...prev.form,
            loadItems: prev.form.loadItems.filter((item) => item.id !== id),
          },
        };

        syncDraft(next);
        return next;
      });
    },

    nextStep() {
      setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
    },

    prevStep() {
      setStepIndex((prev) => Math.max(prev - 1, 0));
    },

    goToStep(index) {
      setStepIndex(index);
    },

    runCalculation() {
      const output = runEngineeringDesign(activeProject.form);

      setActiveProject((prev) => {
        const next = {
          ...prev,
          updatedAt: new Date().toISOString(),
          result: output,
        };

        syncDraft(next);
        return next;
      });

      trackEvent("run_calculation", {
        ok: output.ok,
        systemType: activeProject.form.systemType,
        calculationMode: activeProject.form.calculationMode,
      });

      if (output.ok) {
        setRoute({ name: "output" });
      }

      return output;
    },

    saveProjectVersion() {
      let savedProject;

      setActiveProject((prev) => {
        const safeResult = prev.result?.ok
          ? prev.result
          : runEngineeringDesign(prev.form);

        if (!safeResult?.ok) {
          savedProject = null;
          alert("محاسبات هنوز معتبر نیست. لطفاً اطلاعات پروژه را بررسی کنید.");

          return {
            ...prev,
            result: safeResult,
            updatedAt: new Date().toISOString(),
          };
        }

        const safePrev = {
          ...prev,
          result: safeResult,
          updatedAt: new Date().toISOString(),
        };

        if (!safePrev.projectId) {
          const created = buildProjectRecordFromSession(safePrev);

          ProjectRepository.upsert(created);
          savedProject = created;

          return {
            ...safePrev,
            projectId: created.id,
            versionId: created.currentVersionId,
            updatedAt: created.updatedAt,
          };
        }

        const record = ProjectRepository.getById(safePrev.projectId);

        if (!record) {
          const created = buildProjectRecordFromSession(safePrev);

          ProjectRepository.upsert(created);
          savedProject = created;

          return {
            ...safePrev,
            projectId: created.id,
            versionId: created.currentVersionId,
            updatedAt: created.updatedAt,
          };
        }

        const nextVersion = buildVersionSnapshot(
          safePrev,
          (record.versions?.length ?? 0) + 1
        );

        const updated = {
          ...record,
          title: safePrev.form.projectTitle,
          systemType: safePrev.form.systemType,
          clientName: safePrev.form.clientName,
          city: safePrev.form.city,
          status: "calculated",
          draftForm: cloneForm(safePrev.form),
          currentVersionId: nextVersion.id,
          updatedAt: new Date().toISOString(),
          versions: [...(record.versions ?? []), nextVersion],
        };

        ProjectRepository.upsert(updated);
        savedProject = updated;

        return {
          ...safePrev,
          versionId: nextVersion.id,
          updatedAt: updated.updatedAt,
        };
      });

      if (savedProject) {
        refreshProjects();
        void persistProjectToCloud(savedProject);
      }

      return savedProject;
    },

    saveProject() {
      return actions.saveDraftProject();
    },

    saveDraftProject() {
      let savedProject;

      setActiveProject((prev) => {
        if (!prev.projectId) {
          const created = {
            id: crypto.randomUUID(),
            title: prev.form.projectTitle,
            systemType: prev.form.systemType,
            clientName: prev.form.clientName,
            city: prev.form.city,
            status: "draft",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            draftForm: cloneForm(prev.form),
            currentVersionId: null,
            versions: [],
          };

          ProjectRepository.upsert(created);
          savedProject = created;

          return {
            ...prev,
            projectId: created.id,
            updatedAt: created.updatedAt,
          };
        }

        const record = ProjectRepository.getById(prev.projectId);

        if (!record) {
          savedProject = null;
          return prev;
        }

        const updated = {
          ...record,
          title: prev.form.projectTitle,
          systemType: prev.form.systemType,
          clientName: prev.form.clientName,
          city: prev.form.city,
          status: record.versions?.length ? record.status : "draft",
          draftForm: cloneForm(prev.form),
          updatedAt: new Date().toISOString(),
        };

        ProjectRepository.upsert(updated);
        savedProject = updated;

        return {
          ...prev,
          updatedAt: updated.updatedAt,
        };
      });

      if (savedProject) {
        refreshProjects();
        void persistProjectToCloud(savedProject);
      }

      return savedProject;
    },

    openProject(projectId, versionId = null) {
      const found = ProjectRepository.getById(projectId);
      if (!found) return;

      setActiveProject(hydrateSessionFromProject(found, versionId));
      setStepIndex(0);
      setRoute({ name: versionId || found.currentVersionId ? "output" : "workspace" });
    },

    openWorkspace(projectId) {
      const found = ProjectRepository.getById(projectId);
      if (!found) return;

      setActiveProject(
        createProjectSession({
          projectId: found.id,
          versionId: found.currentVersionId,
          createdAt: found.createdAt,
          form:
            found.draftForm ??
            found.versions?.at(-1)?.form ??
            DEFAULT_PROJECT_FORM,
          result:
            found.versions?.find((item) => item.id === found.currentVersionId)
              ?.result ??
            found.versions?.at(-1)?.result ??
            null,
        })
      );

      setStepIndex(0);
      setRoute({ name: "workspace" });
    },

    async syncCloudProjects(userId) {
      if (!CloudProjectRepository.isEnabled()) {
        return {
          ok: false,
          message: "Supabase تنظیم نشده است.",
        };
      }

      try {
        const cloudItems = await CloudProjectRepository.list();

        cloudItems.forEach((item) => ProjectRepository.upsert(item));

        const localItems = ProjectRepository.list();

        for (const item of localItems) {
          await CloudProjectRepository.upsert(item, userId);
        }

        refreshProjects();

        trackEvent("sync_cloud_projects", {
          count: localItems.length,
        });

        return { ok: true };
      } catch (error) {
        console.error("Cloud sync failed", error);

        return {
          ok: false,
          message: error.message,
        };
      }
    },

    deleteProject(projectId) {
      ProjectRepository.remove(projectId);

      if (CloudProjectRepository.isEnabled()) {
        void CloudProjectRepository.remove(projectId).catch((error) =>
          console.warn("Cloud project delete failed", error)
        );
      }

      const items = refreshProjects();

      if (activeProject.projectId === projectId) {
        setActiveProject(createProjectSession());
        setRoute({ name: items.length ? "dashboard" : "dashboard" });
      }
    },
  };

  const activeRecord = activeProject.projectId
    ? projects.find((item) => item.id === activeProject.projectId) ?? null
    : null;

  const projectVersions = activeRecord?.versions ?? [];

  const value = {
    route,
    projects,
    activeProject,
    activeRecord,
    projectVersions,
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
    throw new Error("useProjectStore must be used within ProjectStoreProvider");
  }

  return context;
}