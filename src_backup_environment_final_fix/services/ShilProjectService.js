import { ProjectRepository } from "../data/repositories/ProjectRepository.js";
import { SyncQueue } from "../data/sync/SyncQueue.js";
import { processSyncQueue } from "../data/sync/syncProcessor.js";
import { MigrationRunner } from "../data/migrations/MigrationRunner.js";
import { ErrorRecoveryService } from "../errors/ErrorRecoveryService.js";
import { runEngineeringDesign } from "../runEngineeringDesign.js";
import { buildEngineeringReport, buildMarkdownEngineeringReport } from "../reporting/engineeringReportBuilder.js";
import { ProjectExporter } from "../data/portable/ProjectExporter.js";
import { ProjectImporter } from "../data/portable/ProjectImporter.js";
import { ConflictResolver } from "../data/sync/ConflictResolver.js";

export class ShilProjectService {
  constructor(storage) {
    this.storage = storage;
    this.projects = new ProjectRepository(storage);
    this.syncQueue = new SyncQueue(storage);
    this.migrations = new MigrationRunner(storage);
    this.errors = new ErrorRecoveryService(storage);
    this.exporter = new ProjectExporter(this.projects);
    this.importer = new ProjectImporter(this.projects);
    this.conflictResolver = new ConflictResolver();
  }

  async initialize() {
    return this.migrations.run();
  }

  async createProject(input) {
    const project = await this.projects.createProject(input);
    await this.syncQueue.enqueue({ type: "project:create", payload: project });
    return project;
  }

  async updateProject(id, patch) {
    const project = await this.projects.updateProject(id, patch);
    await this.syncQueue.enqueue({ type: "project:update", payload: project });
    return project;
  }

  async calculateProject(id, options = {}) {
    const project = await this.projects.getProject(id);
    if (!project) throw new Error(`Project not found: ${id}`);

    try {
      const result = runEngineeringDesign(project.form, options);
      await this.projects.saveResult(id, result);
      await this.syncQueue.enqueue({ type: "project:result", payload: { id, result } });
      return result;
    } catch (error) {
      await this.errors.capture(error, { projectId: id, action: "calculateProject" });
      throw error;
    }
  }

  async buildReport(id, format = "object") {
    const project = await this.projects.getProject(id);
    if (!project) throw new Error(`Project not found: ${id}`);

    const result = project.result || runEngineeringDesign(project.form);

    if (format === "markdown") {
      return buildMarkdownEngineeringReport(project.form, result);
    }

    return buildEngineeringReport(project.form, result);
  }

  async exportProject(id) {
    return this.exporter.exportProject(id);
  }

  async importProject(payload, options) {
    const project = await this.importer.importProject(payload, options);
    await this.syncQueue.enqueue({ type: "project:import", payload: project });
    return project;
  }

  async resolveConflict(localProject, remoteProject, strategy = "latest-write-wins") {
    this.conflictResolver.strategy = strategy;
    return this.conflictResolver.resolve(localProject, remoteProject);
  }

  async processSync(handlers) {
    return processSyncQueue(this.syncQueue, handlers);
  }
}
