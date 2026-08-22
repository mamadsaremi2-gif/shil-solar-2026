export class EquipmentCompatibilityEngine {
  checkPVInverter({ pvModule, inverter, seriesCount, parallelCount = 1, minTempC = 0 }) {
    const tempCoeff = Math.abs(pvModule.tempCoeffVocPercentPerC ?? -0.28) / 100;
    const coldVoc = pvModule.voc * seriesCount * (1 + tempCoeff * (25 - minTempC));
    const vmp = pvModule.vmp * seriesCount;
    const current = pvModule.imp * parallelCount;

    const issues = [];

    if (coldVoc > inverter.maxDcVoltage) {
      issues.push({
        code: "PV_INVERTER_MAX_DC_EXCEEDED",
        severity: "error",
        message: "PV cold Voc exceeds inverter max DC voltage."
      });
    }

    if (vmp < inverter.mpptMinVoltage || vmp > inverter.mpptMaxVoltage) {
      issues.push({
        code: "PV_INVERTER_MPPT_MISMATCH",
        severity: "error",
        message: "PV Vmp is outside inverter MPPT range."
      });
    }

    return {
      compatible: issues.filter((issue) => issue.severity === "error").length === 0,
      metrics: { coldVoc, vmp, current },
      issues
    };
  }

  checkBatteryInverter({ battery, inverter }) {
    const issues = [];
    const nominal = battery.nominalVoltage;

    if (nominal < 24 && inverter.ratedPowerW > 3000) {
      issues.push({
        code: "BATTERY_VOLTAGE_LOW_FOR_INVERTER",
        severity: "warning",
        message: "Battery voltage may be low for inverter rating."
      });
    }

    return {
      compatible: issues.filter((issue) => issue.severity === "error").length === 0,
      issues
    };
  }

  checkSystem({ pvModule, inverter, battery, seriesCount, parallelCount, minTempC }) {
    const pvInverter = this.checkPVInverter({ pvModule, inverter, seriesCount, parallelCount, minTempC });
    const batteryInverter = battery ? this.checkBatteryInverter({ battery, inverter }) : { compatible: true, issues: [] };

    return {
      compatible: pvInverter.compatible && batteryInverter.compatible,
      pvInverter,
      batteryInverter,
      issues: [...pvInverter.issues, ...batteryInverter.issues]
    };
  }
}
