function num(value, fallback = 0) {
  const n = Number(String(value ?? '').replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
  return Number.isFinite(n) ? n : fallback;
}

function round(value, digits = 2) {
  const f = 10 ** digits;
  return Math.round((Number(value) || 0) * f) / f;
}

function clamp(value, min, max) {
  return Math.min(Math.max(Number(value) || 0, min), max);
}

function obstacleLoss(item) {
  const height = num(item.heightM ?? item.shadowObstacleHeightM, 0);
  const distance = Math.max(num(item.distanceM ?? item.shadowObstacleDistanceM, 1), 0.5);
  const direction = Math.abs(num(item.directionDeg, 180) - 180);
  const horizonAngle = Math.atan(height / distance) * 180 / Math.PI;
  const directionFactor = direction <= 35 ? 1 : direction <= 70 ? 0.55 : 0.22;
  const hourFactor = String(item.criticalHours || '').trim() ? 1.15 : 0.85;
  const manualPercent = clamp(num(item.shadowPercent ?? item.manualShadowPercent ?? item.percentShadow, 0), 0, 95);
  const geometryLossPercent = clamp(horizonAngle * 0.85 * directionFactor * hourFactor, 0, 28);
  const lossPercent = clamp(Math.max(manualPercent, geometryLossPercent), 0, 45);
  return {
    id: item.id || `shadow-${Math.random().toString(16).slice(2)}`,
    title: item.title || 'مانع سایه انداز',
    heightM: round(height, 2),
    distanceM: round(distance, 2),
    directionDeg: round(num(item.directionDeg, 180), 0),
    criticalHours: item.criticalHours || '',
    horizonAngleDeg: round(horizonAngle, 1),
    manualShadowPercent: round(manualPercent, 1),
    geometryLossPercent: round(geometryLossPercent, 1),
    estimatedLossPercent: round(lossPercent, 1),
    status: lossPercent <= 3 ? 'pass' : lossPercent <= 10 ? 'warning' : 'error',
  };
}

export function calculateShadowAnalysis(input) {
  if (input.systemType === 'backup') {
    return { applicable: false, status: 'not_applicable', totalLossPercent: 0, effectiveShadingFactor: 1, objects: [], message: 'در برق اضطراری بدون پنل، تحلیل سایه وارد محاسبات نمی‌شود.' };
  }

  const rawObjects = Array.isArray(input.shadowObjects) && input.shadowObjects.length
    ? input.shadowObjects
    : (num(input.shadowObstacleHeightM, 0) > 0 ? [{
      title: 'مانع اصلی محل نصب',
      heightM: input.shadowObstacleHeightM,
      distanceM: input.shadowObstacleDistanceM,
      directionDeg: input.shadowObstacleDirectionDeg || 180,
      criticalHours: input.shadowCriticalHours,
      shadowPercent: input.shadowPercent || input.manualShadowPercent,
    }] : []);

  const objects = rawObjects.map(obstacleLoss);
  const manualFactorLoss = clamp(Math.max((1 - num(input.shadingFactor, 0.95)) * 100, num(input.shadowPercent || input.manualShadowPercent, 0)), 0, 50);
  const objectsLoss = objects.reduce((sum, item) => sum + item.estimatedLossPercent, 0);
  const totalLossPercent = clamp(Math.max(manualFactorLoss, objectsLoss), 0, 45);
  const effectiveShadingFactor = clamp(1 - totalLossPercent / 100, 0.55, 1);
  const worst = objects.reduce((acc, item) => item.estimatedLossPercent > (acc?.estimatedLossPercent || 0) ? item : acc, null);

  return {
    applicable: true,
    status: totalLossPercent <= 4 ? 'pass' : totalLossPercent <= 12 ? 'warning' : 'error',
    totalLossPercent: round(totalLossPercent, 1),
    effectiveShadingFactor: round(effectiveShadingFactor, 3),
    objects,
    worstObject: worst,
    criticalHours: worst?.criticalHours || input.shadowCriticalHours || 'ثبت نشده',
    message: totalLossPercent <= 4
      ? 'سایه جدی در داده‌های ثبت شده دیده نشد.'
      : totalLossPercent <= 12
        ? 'سایه قابل توجه است؛ آرایش پنل، فاصله از مانع یا MPPT جدا بررسی شود.'
        : 'سایه شدید است؛ محل نصب یا تقسیم آرایه باید اصلاح شود.',
  };
}
