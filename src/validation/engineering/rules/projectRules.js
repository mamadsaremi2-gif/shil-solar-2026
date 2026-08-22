import { error, warning } from "../validationMessage.js";

export function validateProjectRules(form) {
  const messages = [];
  const { project } = form;

  if (!project.title || project.title.trim().length < 2) {
    messages.push(error("project.title", "Project title is required."));
  }

  if (!["offgrid", "hybrid", "ongrid"].includes(project.scenario)) {
    messages.push(error("project.scenario", "Project scenario must be offgrid, hybrid, or ongrid."));
  }

  if (project.dailyEnergyWh <= 0) {
    messages.push(error("project.dailyEnergyWh", "Daily energy demand must be greater than zero."));
  }

  if (project.peakLoadW <= 0) {
    messages.push(error("project.peakLoadW", "Peak load must be greater than zero."));
  }

  if (project.scenario === "offgrid" && project.autonomyDays < 1) {
    messages.push(error("project.autonomyDays", "Offgrid systems require at least one autonomy day."));
  }

  if (project.dailyEnergyWh > 1000000) {
    messages.push(warning("project.dailyEnergyWh", "Daily energy demand is very high; verify load profile."));
  }

  return messages;
}
