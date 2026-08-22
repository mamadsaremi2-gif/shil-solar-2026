import { getEnvironmentProfile } from "./EnvironmentProfiles.js";

export class EnvironmentService {
  constructor(name = "production") {
    this.profile = getEnvironmentProfile(name);
  }

  getProfile() {
    return { ...this.profile };
  }

  isProduction() {
    return this.profile.name === "production";
  }

  shouldEncryptStorage() {
    return this.profile.storageEncryption === true;
  }

  shouldReportErrors() {
    return this.profile.errorReporting === "captured";
  }

  getPerformanceBudgetMs() {
    return this.profile.performanceBudgetMs;
  }

  assertProductionSafe() {
    const issues = [];

    if (this.isProduction() && this.profile.debug) {
      issues.push({ code: "DEBUG_ENABLED_IN_PRODUCTION" });
    }

    if (this.isProduction() && !this.profile.storageEncryption) {
      issues.push({ code: "ENCRYPTION_DISABLED_IN_PRODUCTION" });
    }

    if (this.isProduction() && !this.profile.telemetry) {
      issues.push({ code: "TELEMETRY_DISABLED_IN_PRODUCTION" });
    }

    return {
      safe: issues.length === 0,
      issues
    };
  }
}
