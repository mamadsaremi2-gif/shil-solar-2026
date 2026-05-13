import { createEngineeringForm } from "../../contracts/engineeringFormContract.js";
import { projectKey, snapshotKey, STORAGE_KEYS } from "../storage/storageKeys.js";

function createId(prefix = "project") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export class ProjectRepository {
  constructor(storage) {
    this.storage = storage;
  }

  async createProject(input = {}) {
    const now = new Date().toISOString();
    const project = {
      id: input.id || createId(),
      title: input.title || input.project?.title || "Untitled SHIL Project",
      status: input.status || "draft",
      form: createEngineeringForm(input.form || input),
      result: input.result || null,
      createdAt: input.createdAt || now,
      updatedAt: now,
      deletedAt: null,
      version: 1
    };

    await this.storage.setItem(projectKey(project.id), project);
    return project;
  }

  async getProject(id) {
    return this.storage.getItem(projectKey(id));
  }

  async updateProject(id, patch = {}) {
    const current = await this.getProject(id);
    if (!current) throw new Error(`Project not found: ${id}`);

    const next = {
      ...current,
      ...patch,
      form: patch.form ? createEngineeringForm({ ...current.form, ...patch.form }) : current.form,
      updatedAt: new Date().toISOString(),
      version: current.version + 1
    };

    await this.storage.setItem(projectKey(id), next);
    return next;
  }

  async saveResult(id, result) {
    return this.updateProject(id, { result, status: result.valid ? "calculated" : "needs-review" });
  }

  async listProjects({ includeDeleted = false } = {}) {
    const keys = await this.storage.keys(STORAGE_KEYS.PROJECT_PREFIX);
    const projects = [];

    for (const key of keys) {
      const project = await this.storage.getItem(key);
      if (project && (includeDeleted || !project.deletedAt)) projects.push(project);
    }

    return projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async archiveProject(id) {
    return this.updateProject(id, { status: "archived" });
  }

  async softDeleteProject(id) {
    return this.updateProject(id, { deletedAt: new Date().toISOString(), status: "deleted" });
  }

  async saveSnapshot(id, label = "manual") {
    const project = await this.getProject(id);
    if (!project) throw new Error(`Project not found: ${id}`);

    const snapshot = {
      id: createId("snapshot"),
      projectId: id,
      label,
      project,
      createdAt: new Date().toISOString()
    };

    await this.storage.setItem(snapshotKey(snapshot.id), snapshot);
    return snapshot;
  }

  async listSnapshots(projectId) {
    const keys = await this.storage.keys(STORAGE_KEYS.SNAPSHOT_PREFIX);
    const snapshots = [];

    for (const key of keys) {
      const snapshot = await this.storage.getItem(key);
      if (snapshot?.projectId === projectId) snapshots.push(snapshot);
    }

    return snapshots.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}
