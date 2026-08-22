import { getOperationalProfile } from '../config/operationalProfiles.js';

function hasPath(source, path) {
  return String(path || '').split('.').filter(Boolean).reduce((acc, key) => (
    acc && Object.prototype.hasOwnProperty.call(acc, key) ? acc[key] : undefined
  ), source) !== undefined;
}

export function createOperationalStatus(engineResult = {}, options = {}) {
  const profile = getOperationalProfile(options.profile || engineResult?.contextMeta?.profile || 'SAFE_PRODUCTION');
  const warnings = Array.isArray(engineResult.warnings) ? engineResult.warnings : [];
  const errors = Array.isArray(engineResult.errors) ? engineResult.errors : [];
  const summary = engineResult.summary || {};
  const requiredSummaryKeys = Array.isArray(profile.requiredSummaryKeys) ? profile.requiredSummaryKeys : [];
  const missingSummary = requiredSummaryKeys.filter((key) => !hasPath(summary, key));
  const ready = Boolean(engineResult.ok !== false)
    && errors.length === 0
    && missingSummary.length === 0
    && warnings.length <= (profile.maxWarningsBeforeReview ?? 99);

  return Object.freeze({
    ready,
    profile: profile.id,
    status: ready ? 'READY_FOR_OPERATION' : 'NEEDS_REVIEW',
    errorCount: errors.length,
    warningCount: warnings.length,
    missingSummary,
    checkedAt: new Date().toISOString(),
  });
}

export function assertEngineOperational(engineResult = {}, options = {}) {
  const status = createOperationalStatus(engineResult, options);
  if (!status.ready) {
    const reason = [
      status.errorCount ? `${status.errorCount} error(s)` : null,
      status.warningCount ? `${status.warningCount} warning(s)` : null,
      status.missingSummary.length ? `missing summary: ${status.missingSummary.join(', ')}` : null,
    ].filter(Boolean).join('; ');
    throw new Error(`Engine is not operational: ${reason || 'unknown reason'}`);
  }
  return status;
}
