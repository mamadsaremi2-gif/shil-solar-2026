import { sha256 } from "../../security/hash.js";

export class ProjectImporter {
  constructor(projectRepository) {
    this.projectRepository = projectRepository;
  }

  verify(payload) {
    const { checksum, ...rest } = payload;
    return checksum === sha256(JSON.stringify(rest));
  }

  async importProject(payload, { trustChecksum = true } = {}) {
    if (trustChecksum && !this.verify(payload)) {
      throw new Error("Import checksum verification failed.");
    }

    if (payload.format !== "SHIL_PROJECT_EXPORT") {
      throw new Error("Unsupported SHIL project export format.");
    }

    return this.projectRepository.createProject({
      ...payload.project,
      id: payload.project.id
    });
  }

  async importBundle(payload, { trustChecksum = true } = {}) {
    if (trustChecksum && !this.verify(payload)) {
      throw new Error("Import checksum verification failed.");
    }

    if (payload.format !== "SHIL_PROJECT_BUNDLE") {
      throw new Error("Unsupported SHIL project bundle format.");
    }

    const imported = [];
    for (const project of payload.projects) {
      imported.push(await this.projectRepository.createProject(project));
    }

    return imported;
  }
}
