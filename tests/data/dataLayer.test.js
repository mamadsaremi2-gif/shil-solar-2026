import { MemoryStorageAdapter } from "../../src/data/storage/MemoryStorageAdapter.js";
import { ProjectRepository } from "../../src/data/repositories/ProjectRepository.js";
import { assert } from "../fixtures.js";

const storage = new MemoryStorageAdapter();
const repo = new ProjectRepository(storage);

const project = await repo.createProject({
  title: "Data Layer Test",
  form: {
    project: {
      title: "Data Layer Test",
      scenario: "offgrid",
      dailyEnergyWh: 1000,
      peakLoadW: 500,
      autonomyDays: 1
    }
  }
});

assert(project.id, "Project should have id.");
assert(project.version === 1, "Project version should start at 1.");

const updated = await repo.updateProject(project.id, {
  form: { project: { title: "Updated", dailyEnergyWh: 1200 } }
});

assert(updated.version === 2, "Project version should increment.");
assert(updated.form.project.title === "Updated", "Project form should update.");
assert(updated.form.project.dailyEnergyWh === 1200, "Project nested form should update.");

const snapshot = await repo.saveSnapshot(project.id, "before-calc");
const snapshots = await repo.listSnapshots(project.id);

assert(snapshot.projectId === project.id, "Snapshot should reference project.");
assert(snapshots.length === 1, "Repository should list project snapshots.");

console.log("dataLayer.test passed");
