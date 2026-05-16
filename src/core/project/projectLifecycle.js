export const projectStatuses = [
  "draft",
  "environment-ready",
  "equipment-ready",
  "calculation-ready",
  "completed"
];

export function getNextProjectStatus(current) {

  const index = projectStatuses.indexOf(current);

  if(index === -1) return "draft";

  return projectStatuses[index + 1] || "completed";
}
