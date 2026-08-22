export const ENGINEERING_RESULT_VERSION = "2.0.0";

export function createEmptyEngineeringResult(form = {}) {
  return {
    version: ENGINEERING_RESULT_VERSION,
    ok: false,
    form,
    summary: {},
    loads: {},
    climate: {},
    pv: {},
    battery: {},
    inverter: {},
    controller: {},
    cabling: {},
    losses: {},
    shadow: {},
    voltageCorrection: {},
    validation: { score: 0, grade: "unchecked", checks: [] },
    advisor: [],
    warnings: [],
    errors: [],
    meta: { startedAt: null, finishedAt: null, durationMs: null },
  };
}
