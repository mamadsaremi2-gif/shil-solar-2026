export class ReleaseManifestBuilder {
  constructor({ version, packageName, environment = "production" }) {
    this.version = version;
    this.packageName = packageName;
    this.environment = environment;
  }

  build({ testOutput = "", checks = {}, artifacts = [] } = {}) {
    return {
      packageName: this.packageName,
      version: this.version,
      environment: this.environment,
      releaseId: `release_${this.version}_${Date.now()}`,
      createdAt: new Date().toISOString(),
      checks,
      artifacts,
      testSummary: {
        passed: !String(testOutput).includes("failed") && !String(testOutput).includes("Error:"),
        length: String(testOutput).length
      }
    };
  }
}
