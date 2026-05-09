const KEY = "solar-design-suite-projects";

export function loadProjects() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveProjects(projects) {
  localStorage.setItem(KEY, JSON.stringify(projects));
}
