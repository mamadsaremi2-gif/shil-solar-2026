import { ViewportService } from "../../src/mobile/adapters/ViewportService.js";
import { PWAInstallState } from "../../src/mobile/adapters/PWAInstallState.js";
import { AutoSaveController } from "../../src/mobile/adapters/AutoSaveController.js";
import { MemoryStorageAdapter } from "../../src/data/storage/MemoryStorageAdapter.js";
import { ProjectRepository } from "../../src/data/repositories/ProjectRepository.js";
import { createValidOffgridFixture, assert } from "../fixtures.js";

const viewport = new ViewportService({ width: 390, height: 844 });
assert(viewport.isMobile() === true, "Viewport service should detect mobile.");

const pwa = new PWAInstallState();
pwa.markInstallable();
pwa.markPrompted();
pwa.markInstalled();
assert(pwa.snapshot().installed === true, "PWA state should track installation.");

const repo = new ProjectRepository(new MemoryStorageAdapter());
const project = await repo.createProject({ form: createValidOffgridFixture() });

const autoSave = new AutoSaveController({ repository: repo });
autoSave.queue(project.id, { status: "draft-autosaved" });
assert(autoSave.pendingCount() === 1, "AutoSave should queue pending save.");

const saved = await autoSave.flush();
assert(saved[0].status === "draft-autosaved", "AutoSave should flush queued patch.");
assert(autoSave.pendingCount() === 0, "AutoSave should clear queue after flush.");

console.log("pwaAdapter.test passed");
