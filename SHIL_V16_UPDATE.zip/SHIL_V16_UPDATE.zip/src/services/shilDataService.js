import { putLocal, getLocal, listLocal, removeLocal } from "../db/localDb";
import { enqueueSyncJob } from "../sync";

async function saveEntity(storeName, entityName, data, action = "upsert") {
  const saved = await putLocal(storeName, data);

  enqueueSyncJob({
    type: action,
    entity: entityName,
    entityId: saved.id,
    payload: saved,
  });

  return saved;
}

export const shilDataService = {
  saveProject(data) {
    return saveEntity("projects", "project", data);
  },

  saveDraft(data) {
    return saveEntity("drafts", "draft", data);
  },

  saveProjectStep(data) {
    return saveEntity("project_steps", "project_step", data);
  },

  saveEquipmentCache(data) {
    return saveEntity("equipment_cache", "equipment_cache", data);
  },

  saveClimateCache(data) {
    return saveEntity("climate_cache", "climate_cache", data);
  },

  getProject(id) {
    return getLocal("projects", id);
  },

  listProjects() {
    return listLocal("projects");
  },

  listDrafts() {
    return listLocal("drafts");
  },

  listProjectSteps() {
    return listLocal("project_steps");
  },

  listEquipmentCache() {
    return listLocal("equipment_cache");
  },

  listClimateCache() {
    return listLocal("climate_cache");
  },

  deleteProject(id) {
    enqueueSyncJob({
      type: "delete",
      entity: "project",
      entityId: id,
      payload: { id },
    });

    return removeLocal("projects", id);
  },
};
