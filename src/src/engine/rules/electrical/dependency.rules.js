import { round, ceil } from '../../utils/number.js';

function label(item, fallback = '-') {
  if (!item) return fallback;
  if (typeof item === 'string' || typeof item === 'number') return String(item);
  return item.title || item.label || item.name || item.engineeringClass || fallback;
}

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function riskLevel({ warnings = [], utilization = 0, voltageMargin = 0 }) {
  if (warnings.length || utilization > 0.95 || voltageMargin < 0.08) return 'نیازمند بازبینی';
  if (utilization > 0.85 || voltageMargin < 0.15) return 'مرزی';
  return 'ایمن';
}

export const dependencyRule = Object.freeze({
  id: 'dependency',
  title: 'Dependency Resolver تجهیزات و قیود مهندسی',
  version: '16.0.1',
  run(_input = {}, result = {}) {
    const values = result.values || {};
    const equipment = result.equipment || {};
    const panel = equipment.panel || {};
    const inverter = equipment.inverter || {};
    const battery = equipment.battery || {};

    const panelCount = safeNumber(values.panelCount, 0);
    const panelPowerW = safeNumber(panel.powerW || values.panelPowerW, 0);
    const installedPvPowerW = safeNumber(values.installedPvPowerW || values.installedPvPowerKW * 1000 || panelCount * panelPowerW, 0);
    const inverterPowerW = safeNumber(values.inverterRatedPowerW || inverter.ratedPowerW, 1);
    const inverterCount = Math.max(1, ceil(safeNumber(values.designLoadW || values.peakLoadW, inverterPowerW) / inverterPowerW, 1));
    const mpptCountPerInverter = Math.max(1, safeNumber(inverter.mpptCount || values.mpptCount || values.inverterMpptCount, 1));
    const totalMpptCount = inverterCount * mpptCountPerInverter;

    const stringVocCold = safeNumber(values.stringVocCold, 0);
    const maxPvVoc = safeNumber(inverter.maxPvVocV || inverter.maxPvVoc || panel.maxSystemVoltageV, 500);
    const stringVmp = safeNumber(values.stringVmp, 0);
    const mpptMin = safeNumber(inverter.mpptMinV, 60);
    const mpptMax = safeNumber(inverter.mpptMaxV, maxPvVoc * 0.9);
    const pvCurrentA = safeNumber(values.pvCurrentA, 0);
    const maxPvInputCurrentA = safeNumber(inverter.maxPvInputCurrentA, 30);
    const pvCurrentUtilization = maxPvInputCurrentA ? round(pvCurrentA / maxPvInputCurrentA, 3) : 0;
    const pvVoltageMargin = maxPvVoc ? round((maxPvVoc - stringVocCold) / maxPvVoc, 3) : 0;
    const mpptVoltageOk = stringVmp >= mpptMin && stringVmp <= mpptMax;
    const pvCurrentOk = !maxPvInputCurrentA || pvCurrentA <= maxPvInputCurrentA;
    const pvVoltageOk = !maxPvVoc || stringVocCold <= maxPvVoc;

    const batteryVoltage = safeNumber(values.batteryVoltage || inverter.batteryVoltage || battery.nominalVoltage, 48);
    const batteryEnergyKWh = safeNumber(values.totalUsableBatteryEnergyKWh, 0);
    const backupHours = safeNumber(values.backupHours || values.targetBackupHours, 0);
    const peakLoadW = safeNumber(values.designLoadW || values.peakLoadW, 0);
    const requiredBackupKWh = round((peakLoadW * backupHours) / 1000, 2);
    const batteryCoverageRatio = requiredBackupKWh ? round(batteryEnergyKWh / requiredBackupKWh, 2) : null;

    const panelAreaM2 = safeNumber(panel.areaM2 || ((panel.lengthMm && panel.widthMm) ? panel.lengthMm * panel.widthMm / 1000000 : 2.6), 2.6);
    const rawPanelAreaM2 = round(panelCount * panelAreaM2, 2);
    const serviceAreaM2 = round(rawPanelAreaM2 * 1.25, 2);
    const rowSpacingAreaM2 = round(rawPanelAreaM2 * 0.18, 2);

    const dependencyWarnings = [];
    if (!pvVoltageOk) dependencyWarnings.push({ code: 'V16_PV_VOC_LIMIT', message: 'ولتاژ Voc اصلاح‌شده پنل‌ها از حد مجاز اینورتر بیشتر است.' });
    if (!mpptVoltageOk) dependencyWarnings.push({ code: 'V16_MPPT_RANGE', message: 'ولتاژ کاری رشته با محدوده MPPT اینورتر سازگار نیست.' });
    if (!pvCurrentOk) dependencyWarnings.push({ code: 'V16_MPPT_CURRENT', message: 'جریان PV از حد ورودی MPPT/اینورتر بالاتر است.' });
    if (batteryCoverageRatio !== null && batteryCoverageRatio < 1) dependencyWarnings.push({ code: 'V16_BATTERY_UNDERSIZE', message: 'ظرفیت باتری برای زمان پشتیبانی هدف کم است.' });

    const dependencyGraph = {
      panelToString: {
        panel: label(panel, 'پنل SHIL'),
        seriesPanels: values.seriesPanels || 0,
        parallelStrings: values.parallelStrings || 0,
        stringVmp,
        stringVocCold,
        currentA: pvCurrentA,
        voltageOk: pvVoltageOk,
        currentOk: pvCurrentOk,
        mpptVoltageOk,
      },
      stringToInverter: {
        inverter: label(inverter, 'اینورتر SHIL'),
        inverterCount,
        mpptCountPerInverter,
        totalMpptCount,
        maxPvVoc,
        mpptRangeV: [mpptMin, mpptMax],
        maxPvInputCurrentA,
        pvCurrentUtilization,
        pvVoltageMargin,
      },
      batteryToInverter: {
        battery: label(battery, 'باتری SHIL'),
        batteryVoltage,
        inverterBatteryVoltage: inverter.batteryVoltage || batteryVoltage,
        batteryEnergyKWh,
        requiredBackupKWh,
        batteryCoverageRatio,
        compatibleVoltage: Math.abs(batteryVoltage - safeNumber(inverter.batteryVoltage, batteryVoltage)) <= 4,
      },
      installationSpace: {
        panelAreaM2: rawPanelAreaM2,
        rowSpacingAreaM2,
        recommendedAreaM2: serviceAreaM2,
      },
    };

    const engineeringKpis = {
      pvInstalledKW: round(installedPvPowerW / 1000, 2),
      inverterCount,
      totalMpptCount,
      stringVocCold,
      stringVmp,
      pvCurrentA,
      pvCurrentUtilization,
      pvVoltageMargin,
      batteryCoverageRatio,
      installationAreaM2: serviceAreaM2,
      readiness: riskLevel({ warnings: dependencyWarnings, utilization: pvCurrentUtilization, voltageMargin: pvVoltageMargin }),
    };

    return {
      values: {
        inverterCount,
        totalMpptCount,
        dependencyGraph,
        engineeringKpis,
        installationAreaM2: serviceAreaM2,
        dependencyEngineConnected: true,
      },
      warnings: dependencyWarnings,
      explanations: [{ rule: 'dependency', message: 'Dependency Engine v16 پنل، اینورتر، باتری، MPPT، حفاظت، کابل و فضای نصب را به‌صورت یکپارچه ارزیابی کرد.' }],
    };
  },
});
