export function saveProject(
  data
) {

  const projects =
    JSON.parse(
      localStorage.getItem(
        "shil-projects"
      ) || "[]"
    );

  projects.push(data);

  localStorage.setItem(
    "shil-projects",
    JSON.stringify(projects)
  );
}

export function getProjects() {

  return JSON.parse(
    localStorage.getItem(
      "shil-projects"
    ) || "[]"
  );
}
