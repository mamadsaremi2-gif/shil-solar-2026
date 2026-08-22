export function saveProject(data) {
  const projects = JSON.parse(localStorage.getItem("shil-projects") || "[]");

  const project = {
    id: Date.now(),
    createdAt: new Date().toISOString(),
    ...data,
  };

  projects.push(project);

  localStorage.setItem("shil-projects", JSON.stringify(projects));

  return project;
}

export function getProjects() {
  return JSON.parse(localStorage.getItem("shil-projects") || "[]");
}

export function clearProjects() {
  localStorage.removeItem("shil-projects");
}
