export const OPERATIONAL_PROFILES = Object.freeze({
  SAFE_PRODUCTION: Object.freeze({
    id: 'SAFE_PRODUCTION',
    title: 'SHIL Safe Production Profile',
    description: 'Rules run in isolated mode; incomplete input returns warnings instead of runtime crashes.',
    allowPartialResults: true,
    failFast: false,
    maxWarningsBeforeReview: 6,
    requiredSummaryKeys: ['pv', 'inverter'],
  }),
  ENGINE_QA: Object.freeze({
    id: 'ENGINE_QA',
    title: 'SHIL Engine QA Profile',
    description: 'Strict profile for smoke tests and pre-release verification.',
    allowPartialResults: true,
    failFast: false,
    maxWarningsBeforeReview: 10,
    requiredSummaryKeys: ['pv', 'inverter'],
  }),
});

export function getOperationalProfile(profileId = 'SAFE_PRODUCTION') {
  return OPERATIONAL_PROFILES[profileId] || OPERATIONAL_PROFILES.SAFE_PRODUCTION;
}
