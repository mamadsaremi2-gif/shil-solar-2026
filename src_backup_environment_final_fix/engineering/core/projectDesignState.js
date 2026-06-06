const DESIGN_STATE_KEY = "shil:projectDesignState";

function readJson(key, fallback = null) {
  try {
    if (typeof localStorage === "undefined") return fallback;
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(key, JSON.stringify(value));
  }
  return value;
}

export function buildProjectDesignState({ domain = "solar", handoff = {}, settings = {}, design = {}, source = "system-settings" } = {}) {
  return {
    version: 1,
    source,
    domain,
    path: handoff?.source?.projectPath || handoff?.source?.domain || domain,
    method: handoff?.source?.method || design?.load?.method || "equipment",
    city: handoff?.environmentSnapshot?.city || handoff?.environment?.city || null,
    environment: {
      psh: design?.system?.psh ?? handoff?.environmentSnapshot?.peakSunHours ?? handoff?.environmentSnapshot?.psh ?? null,
      efficiency: design?.system?.efficiency ?? null,
      lossRatio: design?.system?.lossRatio ?? null,
    },
    rawInput: {
      powerW: design?.load?.basePowerW ?? handoff?.normalizedLoad?.totalPowerW ?? null,
      dailyEnergyKWh: design?.load?.baseEnergyKWh ?? handoff?.normalizedLoad?.dailyEnergyKWh ?? null,
      voltageAC: design?.load?.voltageAC ?? handoff?.normalizedLoad?.voltageAC ?? null,
    },
    settings,
    design,
    updatedAt: new Date().toISOString(),
  };
}

export function saveProjectDesignState(payload = {}) {
  return writeJson(DESIGN_STATE_KEY, payload);
}

export function getProjectDesignState() {
  return readJson(DESIGN_STATE_KEY, null);
}
