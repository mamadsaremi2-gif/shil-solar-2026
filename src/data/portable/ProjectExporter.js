import { sha256 } from "../../security/hash.js";

export class ProjectExporter {
  constructor(projectRepository) {
    this.projectRepository = projectRepository;
  }

  async exportProject(id) {
    const project = await this.projectRepository.getProject(id);
    if (!project) throw new Error(`Project not found: ${id}`);

    const payload = {
      format: "SHIL_PROJECT_EXPORT",
      formatVersion: 1,
      exportedAt: new Date().toISOString(),
      project
    };

    return {
      ...payload,
      checksum: sha256(JSON.stringify(payload))
    };
  }

  async exportAll() {
    const projects = await this.projectRepository.listProjects({ includeDeleted: true });
    const payload = {
      format: "SHIL_PROJECT_BUNDLE",
      formatVersion: 1,
      exportedAt: new Date().toISOString(),
      projects
    };

    return {
      ...payload,
      checksum: sha256(JSON.stringify(payload))
    };
  }
}
