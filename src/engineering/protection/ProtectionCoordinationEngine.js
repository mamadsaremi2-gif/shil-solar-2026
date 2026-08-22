const BREAKERS = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400];

function nextRating(value) {
  return BREAKERS.find((rating) => rating >= value) || BREAKERS[BREAKERS.length - 1];
}

export function coordinateProtection({
  sourceCurrentA,
  loadCurrentA,
  cableAmpacityA,
  upstreamBreakerA = null,
  factor = 1.25
}) {
  const requiredBreakerA = loadCurrentA * factor;
  const selectedBreakerA = nextRating(requiredBreakerA);
  const issues = [];

  if (selectedBreakerA > cableAmpacityA) {
    issues.push({
      severity: "error",
      code: "BREAKER_EXCEEDS_CABLE_AMPACITY",
      message: "Selected breaker is larger than cable ampacity."
    });
  }

  if (upstreamBreakerA && selectedBreakerA >= upstreamBreakerA) {
    issues.push({
      severity: "warning",
      code: "SELECTIVITY_REVIEW_REQUIRED",
      message: "Downstream breaker is not clearly selective against upstream breaker."
    });
  }

  if (sourceCurrentA < selectedBreakerA * 1.1) {
    issues.push({
      severity: "warning",
      code: "SOURCE_CURRENT_MARGIN_LOW",
      message: "Available source current margin is low."
    });
  }

  return {
    requiredBreakerA,
    selectedBreakerA,
    coordinated: issues.filter((item) => item.severity === "error").length === 0,
    issues
  };
}

export function coordinatePVProtection(form) {
  const stringCurrentA = form.pv.panelIsc;
  const arrayCurrentA = form.pv.panelIsc * form.pv.parallelCount;
  const dcMain = coordinateProtection({
    sourceCurrentA: arrayCurrentA * 1.25,
    loadCurrentA: arrayCurrentA,
    cableAmpacityA: Math.max(form.cable.crossSectionMm2 * 5, 10),
    upstreamBreakerA: null
  });

  return {
    stringFuseA: nextRating(stringCurrentA * 1.25),
    dcMain,
    requiresStringFuses: form.pv.parallelCount >= 3
  };
}
