export class CIReadinessChecker {
  constructor({ packageJson, requiredScripts = ["test", "test:engineering", "test:data", "test:calculation", "test:qa", "test:foundation", "test:v9", "test:v10"] }) {
    this.packageJson = packageJson;
    this.requiredScripts = requiredScripts;
  }

  checkScripts() {
    const scripts = this.packageJson.scripts || {};
    const missing = this.requiredScripts.filter((script) => !scripts[script]);
    return {
      ok: missing.length === 0,
      missing
    };
  }

  checkMetadata() {
    return {
      ok: Boolean(this.packageJson.name && this.packageJson.version && this.packageJson.type === "module"),
      name: this.packageJson.name,
      version: this.packageJson.version,
      type: this.packageJson.type
    };
  }

  run() {
    const scripts = this.checkScripts();
    const metadata = this.checkMetadata();

    return {
      ok: scripts.ok && metadata.ok,
      scripts,
      metadata
    };
  }
}
