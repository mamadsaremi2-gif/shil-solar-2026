export const PROJECT_STATUS = {
  DRAFT: "draft",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
};

export function resolveProjectBucket(project) {
  if (project.status === PROJECT_STATUS.COMPLETED || project.finalizedAt) {
    return "finalProjects";
  }
  return "inProgressProjects";
}

export function keepProjectInProgress(project, lastStep) {
  return {
    ...project,
    status: project.status || PROJECT_STATUS.IN_PROGRESS,
    lastSavedStep: lastStep,
    updatedAt: new Date().toISOString(),
    bucket: "inProgressProjects",
  };
}

export function finalizeProject(project) {
  return {
    ...project,
    status: PROJECT_STATUS.COMPLETED,
    finalizedAt: new Date().toISOString(),
    bucket: "finalProjects",
  };
}
