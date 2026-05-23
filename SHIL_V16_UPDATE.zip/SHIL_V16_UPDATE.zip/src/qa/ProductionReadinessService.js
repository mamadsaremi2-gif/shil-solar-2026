import { HealthCheckService } from "./health/HealthCheckService.js";
import { ProjectAuditService } from "./audit/ProjectAuditService.js";
import { ProjectExporter } from "../data/portable/ProjectExporter.js";
import { ProjectImporter } from "../data/portable/ProjectImporter.js";
import { ConflictResolver } from "../data/sync/ConflictResolver.js";

export class ProductionReadinessService {
  constructor({ storage, projectService }) {
    this.storage = storage;
    this.projectService = projectService;
    this.health = new HealthCheckService({ storage, projectService });
    this.audit = new ProjectAuditService(storage);
    this.exporter = new ProjectExporter(projectService.projects);
    this.importer = new ProjectImporter(projectService.projects);
    this.conflicts = new ConflictResolver();
  }

  async runReadinessCheck() {
    const health = await this.health.runAll();
    const projects = await this.projectService.projects.listProjects({ includeDeleted: true });
    const pendingSync = await this.projectService.syncQueue.pending();
    const errors = await this.projectService.errors.list();

    return {
      ok: health.ok && errors.filter((item) => !item.resolvedAt).length === 0,
      health,
      counts: {
        projects: projects.length,
        pendingSync: pendingSync.length,
        unresolvedErrors: errors.filter((item) => !item.resolvedAt).length
      },
      generatedAt: new Date().toISOString()
    };
  }
}
