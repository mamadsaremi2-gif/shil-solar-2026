import { loadProjects, saveProjects } from "../adapters/localStorageProjectAdapter.js";

function sortProjects(projects) {
  return [...projects].sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
}

export const ProjectRepository = {
  list() {
    return sortProjects(loadProjects());
  },
  getById(projectId) {
    return loadProjects().find((item) => item.id === projectId) ?? null;
  },
  upsert(project) {
    const current = loadProjects();
    const exists = current.findIndex((item) => item.id === project.id);
    if (exists >= 0) current[exists] = project;
    else current.unshift(project);
    const sorted = sortProjects(current);
    saveProjects(sorted);
    return project;
  },
  remove(projectId) {
    const next = loadProjects().filter((item) => item.id !== projectId);
    saveProjects(sortProjects(next));
  },
};
