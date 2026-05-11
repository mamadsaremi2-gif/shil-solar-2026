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


function pushManagementAudit(session, output) {
  try {
    const audit = output?.result?.engineeringAudit;
    if (!audit?.shouldSendToManagement) return;
    const queue = JSON.parse(localStorage.getItem("shil_management_cartable") || "[]");
    queue.unshift({
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      projectId: session.projectId || null,
      projectTitle: session.form?.projectTitle || audit.projectTitle,
      clientName: session.form?.clientName || "",
      city: session.form?.city || "",
      systemType: session.form?.systemType || audit.systemType,
      status: audit.status,
      eventCount: audit.eventCount,
      decisionTitle: session.form?.engineeringDecisionTitle || "مسیر عادی",
      reportProjectCode: output?.result?.reportSnapshot?.projectCode || null,
      events: audit.events || [],
    });
    localStorage.setItem("shil_management_cartable", JSON.stringify(queue.slice(0, 200)));
  } catch (error) {
    console.warn("Management cartable write failed", error);
  }
}

function buildProjectRecordFromSession(session) {
  const now = new Date().toISOString();
  const version = buildVersionSnapshot(session, 1);
  return {
    id: crypto.randomUUID(),
    ownerId: session.form.ownerId || "local-dev",
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


function cloneProjectRecordForDuplicate(project) {
  const now = new Date().toISOString();
  const duplicateId = crypto.randomUUID();
  const clonedVersions = (project.versions || []).map((version, index) => ({
    ...cloneForm(version),
    id: crypto.randomUUID(),
    versionNumber: index + 1,
    label: `${version.label || `نسخه ${index + 1}`} - کپی`,
    createdAt: now,
  }));
  return {
    ...cloneForm(project),
    id: duplicateId,
    title: `${project.title || 'پروژه'} - کپی`,
    status: project.status || 'draft',
    createdAt: now,
    updatedAt: now,
    draftForm: { ...(project.draftForm || {}), projectTitle: `${project.title || project.draftForm?.projectTitle || 'پروژه'} - کپی` },
    versions: clonedVersions,
    currentVersionId: clonedVersions.at(-1)?.id || null,
  };
}

function downloadProjectJson(project) {
  const payload = {
    exportType: 'SHIL_SOLAR_PROJECT_EXPORT',
    exportVersion: 'Project Workspace v10',
    exportedAt: new Date().toISOString(),
    project,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeTitle = String(project.title || 'shil-project').replace(/[^a-zA-Z0-9\u0600-\u06FF_-]+/g, '-').slice(0, 70);
  a.href = url;
  a.download = `${safeTitle || 'shil-project'}-engineering-export.json`;
  a.click();
  URL.revokeObjectURL(url);
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
  const { user, isAdmin } = useAuth();
  const [route, setRoute] = useState({ name: "dashboard" });
  const [projects, setProjects] = useState(() => ProjectRepository.list());
  const [activeProject, setActiveProject] = useState(() => createProjectSession());
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
    openProjectsHub() {
      setRoute({ name: "projects" });
      trackEventSafe("open_projects_hub");
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
      setActiveProject(createProjectSession({ form: { ...DEFAULT_PROJECT_FORM, ownerId: user?.id || "local-dev" } }));
      setStepIndex(0);
      setRoute({ name: "workspace" });
      trackEventSafe("start_new_project");
    },
    openAIPage() {
      setRoute({ name: "ai" });
      trackEventSafe("open_ai_assistant");
    },
    openEducation(origin = null) {
      setRoute({ name: "education", origin: origin ?? route.name });
      trackEventSafe("open_education", { origin: origin ?? route.name });
    },
    openFeedback(origin = null) {
      setRoute({ name: "feedback", origin: origin ?? route.name });
      trackEventSafe("open_feedback", { origin: origin ?? route.name });
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
      form.calculationMode = "loads";
      form.scenarioId = preset?.id || null;
      form.scenarioTitle = preset?.title || "سناریوی آماده";
      form.scenarioFamily = preset?.scenarioFamily || form.scenarioFamily || (form.systemType === "backup" ? "backup" : "solar");
      form.workflowCompletedSteps = form.systemType === "backup" ? [0, 1, 2] : [0, 1, 2, 3];
      if (form.systemType === "backup") {
        form.scenarioFlowStage = "backup-loads-first";
        form.daysAutonomy = 0;
        form.dailyUsageHours = "";
        form.seasonProfile = "annual";
        form.seasonUsageFactor = 1;
        form.sunHours = 0;
      } else {
        form.scenarioFlowStage = "environment-first";
        form.daysAutonomy = form.daysAutonomy ?? "0";
        form.batteryType = "LFP";
      }
      setActiveProject(createProjectSession({ form }));
      // سناریوی خورشیدی از شرایط محیطی شروع می‌شود؛ سناریوی برق اضطراری از ورودی بار و ساعت بکاپ.
      setStepIndex(form.systemType === "backup" ? 3 : 4);
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
      pushManagementAudit(activeProject, output);
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
            ownerId: user?.id || prev.form.ownerId || "local-dev",
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
    duplicateProject(projectId) {
      const found = ProjectRepository.getById(projectId);
      if (!found) return null;
      const duplicated = cloneProjectRecordForDuplicate(found);
      ProjectRepository.upsert(duplicated);
      refreshProjects();
      void persistProjectToCloud(duplicated);
      trackEventSafe("duplicate_project", { sourceProjectId: projectId, newProjectId: duplicated.id });
      return duplicated;
    },
    exportProject(projectId) {
      const found = ProjectRepository.getById(projectId);
      if (!found) return false;
      downloadProjectJson(found);
      trackEventSafe("export_project_json", { projectId });
      return true;
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

  const currentOwnerId = user?.id || "local-dev";
  const visibleProjects = isAdmin
    ? projects
    : projects.filter((project) => project.ownerId === currentOwnerId || (!project.ownerId && currentOwnerId === "local-dev"));

  const value = {
    route,
    setRoute,
    projects: visibleProjects,
    allProjects: projects,
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
