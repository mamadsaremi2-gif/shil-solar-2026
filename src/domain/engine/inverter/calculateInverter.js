import { findNearestShilInverter } from "../catalog/shilEquipmentBank.js";

function roundUpToStep(value, step = 100) {
  return Math.ceil(value / step) * step;
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
}

function getParallelPolicy(systemType) {
  if (systemType === "gridtie") {
    return "در آنگرید، افزایش توان با چند اینورتر مستقل یا موازی AC مجاز است؛ تقسیم آرایه PV باید بر اساس MPPT هر واحد انجام شود.";
  }
  if (systemType === "hybrid") {
    return "در هیبرید، افزایش توان فقط با اینورترهای دارای قابلیت پارالل/سنکرون مجاز است و بار، باتری و MPPT بین واحدها تقسیم می‌شود.";
  }
  if (systemType === "offgrid") {
    return "در آفگرید، در صورت کافی نبودن توان یک واحد، چند اینورتر پارالل یا چند سیستم مستقل آفگرید پیشنهاد می‌شود.";
  }
  return "در برق اضطراری، پارالل فقط برای مدل‌هایی مجاز است که در دیتاشیت قابلیت سنکرون/پارالل دارند.";
}

export function calculateInverter(input, loadResult) {
  const designContinuousW = loadResult.demandPowerW * input.designFactor * 1.1;
  const requiredContinuousW = roundUpToStep(Math.max(designContinuousW, loadResult.loadPowerW), 100);
  const designContinuousVA = (loadResult.demandApparentVA || loadResult.demandPowerW) * input.designFactor * 1.1;
  const requiredContinuousVA = roundUpToStep(Math.max(designContinuousVA, requiredContinuousW), 100);
  const requiredSurgePowerW = Math.max(loadResult.surgePowerW, requiredContinuousW * 1.2);
  const requiredSurgeVA = Math.max(loadResult.surgeApparentVA || requiredSurgePowerW, requiredContinuousVA * 1.2);

  const selectedUnitPowerW = Number(input.inverterAcPowerW || input.inverterRatedPowerW || 0);
  const catalogMatch = findNearestShilInverter({
    systemType: input.systemType,
    requiredPowerW: selectedUnitPowerW || requiredContinuousW,
    dcVoltageV: input.systemVoltage,
  });

  const unitPowerW = selectedUnitPowerW > 0 ? selectedUnitPowerW : (catalogMatch?.acPowerW || requiredContinuousW);
  const unitSurgeW = Number(input.inverterUnitSurgeW || catalogMatch?.surgeW || unitPowerW * 2);
  const explicitParallelCapable = input.inverterParallelCapable;
  const parallelCapable = explicitParallelCapable === false ? false : explicitParallelCapable === true ? true : Boolean(catalogMatch?.parallelCapable || ["gridtie", "hybrid", "offgrid"].includes(input.systemType));
  const maxParallelUnits = Math.max(1, Number(input.maxParallelInverters || catalogMatch?.maxParallelUnits || (parallelCapable ? 6 : 1)));
  const neededByPower = Math.max(1, Math.ceil(requiredContinuousW / Math.max(unitPowerW, 1)));
  const neededBySurge = Math.max(1, Math.ceil(requiredSurgePowerW / Math.max(unitSurgeW, 1)));
  const requiredParallelUnits = Math.max(neededByPower, neededBySurge);
  const parallelCount = parallelCapable ? Math.min(requiredParallelUnits, maxParallelUnits) : 1;
  const parallelShortfall = requiredParallelUnits > parallelCount;

  const continuousPowerW = roundUpToStep(unitPowerW * parallelCount, 100);
  const continuousPowerVA = roundUpToStep(Math.max(requiredContinuousVA, continuousPowerW), 100);
  const surgePowerW = roundUpToStep(unitSurgeW * parallelCount, 100);
  const surgePowerVA = roundUpToStep(Math.max(requiredSurgeVA, surgePowerW), 100);
  const dcInputVoltage = input.systemVoltage;
  const utilizationRatio = loadResult.demandPowerW / Math.max(continuousPowerW, 1);
  const apparentUtilizationRatio = (loadResult.demandApparentVA || loadResult.demandPowerW) / Math.max(continuousPowerVA, 1);
  const estimatedDcCurrentA = surgePowerW / Math.max(dcInputVoltage * input.inverterEfficiency, 1);
  const unitLoadShareW = loadResult.demandPowerW / Math.max(parallelCount, 1);

  return {
    continuousPowerW,
    continuousPowerVA,
    requiredContinuousPowerW: requiredContinuousW,
    requiredContinuousPowerVA: requiredContinuousVA,
    surgePowerW,
    surgePowerVA,
    requiredSurgePowerW: roundUpToStep(requiredSurgePowerW, 100),
    requiredSurgePowerVA: roundUpToStep(requiredSurgeVA, 100),
    dcInputVoltage,
    utilizationRatio: round(utilizationRatio, 3),
    apparentUtilizationRatio: round(apparentUtilizationRatio, 3),
    estimatedDcCurrentA: round(estimatedDcCurrentA, 1),
    selectedEquipment: catalogMatch,
    unitPowerW: round(unitPowerW),
    unitSurgePowerW: round(unitSurgeW),
    parallelCapable,
    parallelCount,
    requiredParallelUnits,
    maxParallelUnits,
    parallelShortfall,
    unitLoadShareW: round(unitLoadShareW),
    parallelPolicy: getParallelPolicy(input.systemType),
    architecture: parallelCount > 1 ? "parallel_inverters" : "single_inverter",
  };
}
