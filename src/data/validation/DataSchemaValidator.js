export class DataSchemaValidator {
  validateProject(project) {
    const errors = [];
    if (!project?.id) errors.push("Project id is required.");
    if (!project?.form?.project?.title) errors.push("Project title is required.");
    if (!project?.createdAt) errors.push("Project createdAt is required.");
    if (!project?.updatedAt) errors.push("Project updatedAt is required.");
    if (!Number.isFinite(project?.version)) errors.push("Project version must be numeric.");
    return { valid: errors.length === 0, errors };
  }

  validateBackup(backup) {
    const errors = [];
    if (backup?.format !== "SHIL_BACKUP") errors.push("Backup format is invalid.");
    if (!backup?.checksum) errors.push("Backup checksum is required.");
    if (!backup?.data || typeof backup.data !== "object") errors.push("Backup data object is required.");
    return { valid: errors.length === 0, errors };
  }
}
