import { MemoryStorageAdapter } from "../data/storage/MemoryStorageAdapter.js";
import { ShilProjectService } from "../services/ShilProjectService.js";
import { SettingsService } from "../settings/SettingsService.js";
import { PermissionService } from "../auth/PermissionService.js";
import { ProductionReadinessService } from "../qa/ProductionReadinessService.js";
import { AutoSaveController } from "../mobile/adapters/AutoSaveController.js";
import { RulesetService } from "../rulesets/RulesetService.js";
import { BackupService } from "../data/backup/BackupService.js";
import { TelemetryService } from "../telemetry/TelemetryService.js";
import { PluginRegistry } from "../plugins/PluginRegistry.js";
import { performanceRatioPlugin } from "../plugins/builtins/performanceRatioPlugin.js";
import { projectRiskPlugin } from "../plugins/builtins/projectRiskPlugin.js";
import { EquipmentDatabase } from "../data/equipment/EquipmentDatabase.js";
import { defaultEquipmentSeed } from "../data/equipment/defaultEquipmentSeed.js";
import { ClimateEngine } from "../climate/ClimateEngine.js";
import { EquipmentCompatibilityEngine } from "../data/equipment/EquipmentCompatibilityEngine.js";
import { DataIntegrityService } from "../data/integrity/DataIntegrityService.js";
import { OfflineBackupManager } from "../data/offline/OfflineBackupManager.js";
import { OfflineConflictJournal } from "../data/offline/OfflineConflictJournal.js";
import { ProjectIndexService } from "../data/indexes/ProjectIndexService.js";
import { TransactionManager } from "../data/transactions/TransactionManager.js";
import { DataSchemaValidator } from "../data/validation/DataSchemaValidator.js";
import { RuntimeConfig } from "../production/runtime/RuntimeConfig.js";
import { ProductionRuntimeService } from "../production/runtime/ProductionRuntimeService.js";
import { QualityGateService } from "../qa/gates/QualityGateService.js";
import { EngineeringCalculationCoreV12 } from "../engineering/EngineeringCalculationCoreV12.js";
import { ProductionMaxService } from "../production/ProductionMaxService.js";

export class ShilAppKernel {
  constructor({
    storage = new MemoryStorageAdapter(),
    role,
    settingsKey,
    registerBuiltinPlugins = true,
    runtimeConfig
  } = {}) {
    this.storage = storage;
    this.projects = new ShilProjectService(storage);
    this.settings = new SettingsService(storage, settingsKey);
    this.permissions = new PermissionService(role);
    this.readiness = new ProductionReadinessService({
      storage,
      projectService: this.projects
    });
    this.autoSave = new AutoSaveController({
      repository: this.projects.projects
    });
    this.rulesets = new RulesetService(storage);
    this.backup = new BackupService(storage);
    this.offlineBackup = new OfflineBackupManager(storage);
    this.offlineConflicts = new OfflineConflictJournal(storage);
    this.telemetry = new TelemetryService(storage);
    this.plugins = new PluginRegistry();
    this.equipment = new EquipmentDatabase(defaultEquipmentSeed);
    this.climate = new ClimateEngine();
    this.compatibility = new EquipmentCompatibilityEngine();
    this.integrity = new DataIntegrityService(storage);
    this.projectIndex = new ProjectIndexService(storage);
    this.transactions = new TransactionManager(storage);
    this.schemaValidator = new DataSchemaValidator();
    this.runtimeConfig = new RuntimeConfig(runtimeConfig || {});
    this.runtime = new ProductionRuntimeService({ appKernel: this, config: this.runtimeConfig });
    this.qualityGates = new QualityGateService({
      requiredTraceItems: ["engine:pv", "engine:battery", "engine:inverter", "engine:advanced"]
    });
    this.engineeringV12 = new EngineeringCalculationCoreV12();
    this.productionMax = new ProductionMaxService({ storage, appKernel: this, environment: this.runtimeConfig.get("environment", "production"), packageJson: { name: "shil", version: "13.0.0" } });

    if (registerBuiltinPlugins) {
      this.plugins.register(performanceRatioPlugin);
      this.plugins.register(projectRiskPlugin);
    }
  }

  async initialize() {
    const migration = await this.projects.initialize();
    const settings = await this.settings.get();
    const ruleset = await this.rulesets.getSelected();
    const readiness = await this.readiness.runReadinessCheck();
    const integrityManifest = await this.integrity.createManifest("");
    const preflight = await this.runtime.preflight();

    await this.telemetry.track("app:initialized", {
      migrationTo: migration.to,
      ruleset: ruleset.id
    });

    return {
      migration,
      settings,
      ruleset,
      readiness,
      integrityManifest,
      preflight,
      plugins: this.plugins.list()
    };
  }

  async runProjectCalculation(projectId, options = {}) {
    await this.telemetry.track("calculation:started", { projectId });
    const startedAt = performance.now();
    const result = await this.projects.calculateProject(projectId, options);
    const calculationMs = performance.now() - startedAt;
    const project = await this.projects.projects.getProject(projectId);
    const hookResult = await this.plugins.runHook("calculation:after", {
      form: project.form,
      result
    });

    const quality = this.qualityGates.evaluateResult(hookResult.context.result);
    const limits = this.runtime.enforceLimits({ calculationMs });

    await this.telemetry.track("calculation:completed", {
      projectId,
      valid: hookResult.context.result.valid,
      calculationMs,
      qualityPassed: quality.passed
    });

    return {
      ...hookResult.context.result,
      quality,
      runtime: {
        calculationMs,
        limits
      }
    };
  }

  async rebuildProjectIndex() {
    const projects = await this.projects.projects.listProjects({ includeDeleted: true });
    return this.projectIndex.rebuild(projects);
  }
}
