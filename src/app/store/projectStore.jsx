import { createContext, useContext, useMemo, useState } from "react";
import { DEFAULT_PROJECT_FORM } from "../../domain/models/project";
import { ProjectRepository } from "../../data/repositories/ProjectRepository";
import { getSupabaseClient, isSupabaseConfigured } from "../../shared/lib/supabaseLazy";
import { runEngineeringDesign } from "../../domain/engine/orchestrator/runEngineeringDesign";

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


function normalizeScenarioPatch(preset, keepExistingTitle = false, currentTitle = "") {
  const patch = cloneForm({ ...DEFAULT_PROJECT_FORM, ...(preset?.patch ?? {}) });
  if (keepExistingTitle && currentTitle && currentTitle !== DEFAULT_PROJECT_FORM.projectTitle) {
    patch.projectTitle = currentTitle;
  } else if (preset?.patch?.projectTitle) {
    patch.projectTitle = preset.patch.projectTitle;
  }
  patch.loadItems = (preset?.patch?.loadItems ?? patch.loadItems ?? []).map((item) => ({
    id: item.id ?? crypto.randomUUID(),
    name: "بار جدید",
    qty: 1,
    power: 100,
    hours: 1,
    powerFactor: 0.95,
    coincidenceFactor: 1,
    loadType: "mixed",
    inverterSupply: "with_inverter",
    surgeFactor: 1,
    ...item,
  }));
  patch.selectedEquipment = {
    panel: null,
    battery: null,
    inverter: null,
    controller: null,
    ...(preset?.patch?.selectedEquipment ?? {}),
  };
  return patch;
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
    status: version.result?.ok ? (version.result?.advisor?.some((item) => item.severity === "error") ? "error" : version.result?.advisor?.some((item) => item.severity === "warning") ? "warning" : "success") : "draft",
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
  const targetVersion = project.versions.find((item) => item.id === versionId) ?? project.versions.at(-1) ?? null;
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
  const supabase = await getSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session?.user?.id || null;
}

async function persistProjectToCloud(project) {
  try {
    const ownerId = await getCloudOwnerId();
    if (!ownerId || !project) return;
    const { CloudProjectRepository } = await import("../../data/repositories/CloudProjectRepository");
    await CloudProjectRepository.upsert(project, ownerId);
    trackEventSafe("cloud_project_saved", { projectId: project.id, status: project.status });
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
      trackEventSafe("open_dashboard");
    },
    openAdmin() {
      setRoute({ name: "admin" });
      trackEventSafe("open_admin");
    },
    openEquipmentLibrary(origin = null) {
      setRoute({ name: "equipment", origin: origin ?? route.name });
      trackEventSafe("open_equipment_library", { origin: origin ?? route.name });
    },
    goBackFromEquipment() {
      const origin = route.origin === "workspace" ? "workspace" : "dashboard";
      setRoute({ name: origin });
    },
    openContact(origin = null) {
      setRoute({ name: "contact", origin: origin ?? route.name });
      trackEventSafe("open_contact", { origin: origin ?? route.name });
    },
    goBackFromContact() {
      const origin = route.origin === "workspace" ? "workspace" : route.origin === "output" ? "output" : "dashboard";
      setRoute({ name: origin });
    },
    startNewProject() {
      setActiveProject(createProjectSession());
      setStepIndex(0);
      setRoute({ name: "workspace" });
      trackEventSafe("start_new_project");
    },
    openScenarios(origin = null) {
      setRoute({ name: "scenarios", origin: origin ?? route.name });
      trackEventSafe("open_ready_scenarios", { origin: origin ?? route.name });
    },
    goBackFromScenarios() {
      const origin = route.origin === "workspace" ? "workspace" : "dashboard";
      setRoute({ name: origin });
    },
    startProjectFromScenario(preset) {
      const form = normalizeScenarioPatch(preset);
      if (form.systemType !== "backup") {
        form.daysAutonomy = form.daysAutonomy ?? "0";
        form.batteryType = "LFP";
      }
      setActiveProject(createProjectSession({ form }));
      // بعد از اعمال سناریوی آماده، مستقیم وارد بخش تجهیزات و تنظیمات می‌شویم تا کاربر بتواند پنل، باتری و اینورتر را کم/زیاد کند.
      setStepIndex(5);
      setRoute({ name: "workspace" });
      trackEventSafe("start_project_from_scenario", { scenarioId: preset?.id, systemType: form.systemType });
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
            loadItems: prev.form.loadItems.map((item) => (item.id === id ? { ...item, ...patch } : item)),
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
            loadProfile: (prev.form.loadProfile || []).map((slot) => (slot.id === id ? { ...slot, factor } : slot)),
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
      if (activeProject.form.systemType === "backup" && stepIndex === 5) {
        actions.runCalculation();
        return;
      }
      setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
    },
    prevStep() {
      setStepIndex((prev) => Math.max(prev - 1, 0));
    },
    goToStep(index) {
      setStepIndex(index);
    },
    editProjectStep(index) {
      setStepIndex(Math.max(0, Math.min(index, steps.length - 1)));
      setRoute({ name: "workspace" });
      trackEventSafe("edit_project_step_from_output", { stepIndex: index });
    },
    runCalculation() {
      const output = runEngineeringDesign(activeProject.form);
      setActiveProject((prev) => {
        const next = { ...prev, updatedAt: new Date().toISOString(), result: output };
        syncDraft(next);
        return next;
      });
      trackEventSafe("run_calculation", { ok: output.ok, systemType: activeProject.form.systemType, calculationMode: activeProject.form.calculationMode });
      if (output.ok) {
        setTimeout(() => actions.saveProjectVersion(), 0);
        setRoute({ name: "output" });
      }
      return output;
    },
    saveProjectVersion() {
      let savedProject;
      setActiveProject((prev) => {
        if (!prev.result?.ok) {
          savedProject = null;
          return prev;
        }
        if (!prev.projectId) {
          const created = buildProjectRecordFromSession(prev);
          ProjectRepository.upsert(created);
          savedProject = created;
          return {
            ...prev,
            projectId: created.id,
            versionId: created.currentVersionId,
            updatedAt: created.updatedAt,
          };
        }
        const record = ProjectRepository.getById(prev.projectId);
        if (!record) {
          savedProject = null;
          return prev;
        }
        const nextVersion = buildVersionSnapshot(prev, (record.versions?.length ?? 0) + 1);
        const updated = {
          ...record,
          title: prev.form.projectTitle,
          systemType: prev.form.systemType,
          clientName: prev.form.clientName,
          city: prev.form.city,
          status: "calculated",
          draftForm: cloneForm(prev.form),
          currentVersionId: nextVersion.id,
          updatedAt: new Date().toISOString(),
          versions: [...(record.versions ?? []), nextVersion],
        };
        ProjectRepository.upsert(updated);
        savedProject = updated;
        return { ...prev, versionId: nextVersion.id, updatedAt: updated.updatedAt };
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
          return { ...prev, projectId: created.id, updatedAt: created.updatedAt };
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
        return { ...prev, updatedAt: updated.updatedAt };
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
          form: found.draftForm ?? found.versions?.at(-1)?.form ?? DEFAULT_PROJECT_FORM,
          result: found.versions?.find((item) => item.id === found.currentVersionId)?.result ?? found.versions?.at(-1)?.result ?? null,
        })
      );
      setStepIndex(0);
      setRoute({ name: "workspace" });
    },
    async syncCloudProjects(userId) {
      if (!isSupabaseConfigured) return { ok: false, message: "Supabase تنظیم نشده است." };
      try {
        const { CloudProjectRepository } = await import("../../data/repositories/CloudProjectRepository");
        const cloudItems = await CloudProjectRepository.list();
        cloudItems.forEach((item) => ProjectRepository.upsert(item));
        const localItems = ProjectRepository.list();
        for (const item of localItems) {
          await CloudProjectRepository.upsert(item, userId);
        }
        refreshProjects();
        trackEventSafe("sync_cloud_projects", { count: localItems.length });
        return { ok: true };
      } catch (error) {
        console.error("Cloud sync failed", error);
        return { ok: false, message: error.message };
      }
    },
    copyProjectToScenario(projectId) {
      const found = ProjectRepository.getById(projectId);
      if (!found) return false;
      const customScenarios = JSON.parse(localStorage.getItem("shil_custom_scenarios") || "[]");
      const form = found.draftForm ?? found.versions?.at(-1)?.form;
      customScenarios.unshift({ id: `custom-${found.id}-${Date.now()}`, title: found.title || form?.projectTitle || "سناریوی ذخیره‌شده", createdAt: new Date().toISOString(), projectId: found.id, patch: form, systemType: form?.systemType, summary: found.versions?.at(-1)?.summary ?? null });
      localStorage.setItem("shil_custom_scenarios", JSON.stringify(customScenarios.slice(0, 100)));
      window.alert("پروژه به سناریوهای آماده مدیریتی منتقل شد.");
      return true;
    },
    deleteProject(projectId, force = false) {
      if (!force && !window.confirm("حذف پروژه فقط برای مدیریت مجاز است. آیا مطمئن هستید؟")) return;
      ProjectRepository.remove(projectId);
      if (isSupabaseConfigured) {
        void import("../../data/repositories/CloudProjectRepository")
          .then(({ CloudProjectRepository }) => CloudProjectRepository.remove(projectId))
          .catch((error) => console.warn("Cloud project delete failed", error));
      }
      const items = refreshProjects();
      if (activeProject.projectId === projectId) {
        setActiveProject(createProjectSession());
        setRoute({ name: items.length ? "dashboard" : "dashboard" });
      }
    },
  };

  const activeRecord = activeProject.projectId ? projects.find((item) => item.id === activeProject.projectId) ?? null : null;
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

  return <ProjectStoreContext.Provider value={value}>{children}</ProjectStoreContext.Provider>;
}

export function useProjectStore() {
  const context = useContext(ProjectStoreContext);
  if (!context) throw new Error("useProjectStore must be used within ProjectStoreProvider");
  return context;
}
