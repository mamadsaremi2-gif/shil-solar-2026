export class PWAInstallState {
  constructor() {
    this.installable = false;
    this.installed = false;
    this.lastPromptAt = null;
  }

  markInstallable() {
    this.installable = true;
    return this.snapshot();
  }

  markInstalled() {
    this.installed = true;
    this.installable = false;
    return this.snapshot();
  }

  markPrompted() {
    this.lastPromptAt = new Date().toISOString();
    return this.snapshot();
  }

  snapshot() {
    return {
      installable: this.installable,
      installed: this.installed,
      lastPromptAt: this.lastPromptAt
    };
  }
}
