import { sha256 } from "../../security/hash.js";

export class FeatureFlagService {
  constructor(flags = {}) {
    this.flags = {
      advancedEngineering: { enabled: true, rolloutPercent: 100 },
      offlineBackup: { enabled: true, rolloutPercent: 100 },
      telemetry: { enabled: true, rolloutPercent: 100 },
      pluginSystem: { enabled: true, rolloutPercent: 100 },
      experimentalUIBridge: { enabled: false, rolloutPercent: 0 },
      ...flags
    };
  }

  setFlag(name, config) {
    this.flags[name] = { ...(this.flags[name] || {}), ...config };
    return this.flags[name];
  }

  isEnabled(name, context = {}) {
    const flag = this.flags[name];
    if (!flag || !flag.enabled) return false;

    const rollout = flag.rolloutPercent ?? 100;
    if (rollout >= 100) return true;
    if (rollout <= 0) return false;

    const key = context.userId || context.projectId || "anonymous";
    const hash = sha256(`${name}:${key}`);
    const bucket = parseInt(hash.slice(0, 8), 16) % 100;
    return bucket < rollout;
  }

  snapshot() {
    return JSON.parse(JSON.stringify(this.flags));
  }
}
