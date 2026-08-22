import { ConflictResolver } from "../../src/data/sync/ConflictResolver.js";
import { createValidOffgridFixture, assert } from "../fixtures.js";

const local = {
  id: "p1",
  version: 2,
  updatedAt: "2026-05-13T10:00:00.000Z",
  form: createValidOffgridFixture({ project: { title: "Local", scenario: "offgrid", dailyEnergyWh: 12000, peakLoadW: 2500, autonomyDays: 1 } })
};

const remote = {
  id: "p1",
  version: 3,
  updatedAt: "2026-05-13T09:00:00.000Z",
  form: createValidOffgridFixture({ project: { title: "Remote", scenario: "offgrid", dailyEnergyWh: 15000, peakLoadW: 3000, autonomyDays: 1 } })
};

const latest = new ConflictResolver("latest-write-wins").resolve(local, remote);
assert(latest.resolved.form.project.title === "Local", "Latest-write-wins should select newer update.");

const remoteWins = new ConflictResolver("remote-wins").resolve(local, remote);
assert(remoteWins.resolved.form.project.title === "Remote", "Remote-wins should select remote.");

const merged = new ConflictResolver("merge-form").resolve(local, remote);
assert(merged.resolved.version === 4, "Merge should increment version.");

console.log("conflictResolution.test passed");
