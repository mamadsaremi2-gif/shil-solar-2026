const OFFLINE_PROJECTS_KEY = "shil_solar_offline_projects";
const OFFLINE_QUEUE_KEY = "shil_solar_offline_sync_queue";

export function getOfflineProjects() {
  try {
    const saved = localStorage.getItem(OFFLINE_PROJECTS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveOfflineProjects(projects) {
  localStorage.setItem(OFFLINE_PROJECTS_KEY, JSON.stringify(projects));
}

export function getOfflineQueue() {
  try {
    const saved = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveOfflineQueue(queue) {
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

export function createOfflineCalculationProject(calculation) {
  const project = {
    id: crypto.randomUUID(),
    local_id: crypto.randomUUID(),
    title: "محاسبه سریع خورشیدی - آفلاین",
    client_name: "محاسبه سریع",
    city: "نامشخص",
    system_type: "solar",
    status: "offline_pending_sync",

    system_power: Number(calculation.systemSizeKW),
    panel_count: calculation.panels,
    battery_capacity: calculation.batteryCapacity,
    daily_consumption: calculation.dailyConsumptionKWh,
    sun_hours: calculation.sunHours,

    project_data: {
      calculation,
      offline: true,
    },

    created_at: new Date().toISOString(),
    synced: false,
  };

  const projects = getOfflineProjects();
  const updatedProjects = [project, ...projects];
  saveOfflineProjects(updatedProjects);

  const queue = getOfflineQueue();
  saveOfflineQueue([
    {
      id: crypto.randomUUID(),
      type: "create_project",
      payload: project,
      created_at: new Date().toISOString(),
    },
    ...queue,
  ]);

  return project;
}

export function markOfflineProjectSynced(localId, serverProject) {
  const projects = getOfflineProjects();

  const updated = projects.map((project) => {
    if (project.local_id !== localId) return project;

    return {
      ...project,
      ...serverProject,
      local_id: localId,
      synced: true,
      status: "synced",
    };
  });

  saveOfflineProjects(updated);
  return updated;
}

export function removeQueueItem(queueItemId) {
  const queue = getOfflineQueue();
  const updated = queue.filter((item) => item.id !== queueItemId);
  saveOfflineQueue(updated);
  return updated;
}

export function clearSyncedOfflineProjects() {
  const projects = getOfflineProjects();
  const pendingOnly = projects.filter((project) => !project.synced);
  saveOfflineProjects(pendingOnly);
  return pendingOnly;
}