import { calculatePVArray } from "../pv/pvArray.js";
import { calculatePVString } from "../pv/pvString.js";
import { calculateBatteryBank } from "../battery/batteryBank.js";
import { calculateInverterSizing } from "../inverter/inverterSizing.js";
import { calculateCableSizing } from "../cable/cableSizing.js";
import { calculateSystemLosses } from "../losses/systemLosses.js";

export function runEngineeringEngine(input = {}) {
  const losses =
    calculateSystemLosses(input.losses || {});

  const pv =
    calculatePVArray({
      dailyEnergyWh:
        input.dailyEnergyWh || 12500,
      peakSunHours:
        input.peakSunHours || 5.5,
      panelPowerW:
        input.panelPowerW || 585,
      systemLossPercent:
        losses.totalLoss,
    });

  const string =
    calculatePVString({
      ...(input.string || {}),
    });

  const battery =
    calculateBatteryBank({
      dailyEnergyWh:
        input.dailyEnergyWh || 12500,
      autonomyHours:
        input.autonomyHours || 8,
      averageLoadW:
        input.averageLoadW || 1200,
      batteryVoltage:
        input.batteryVoltage || 48,
      dod:
        input.dod || 0.8,
    });

  const inverter =
    calculateInverterSizing({
      peakLoadW:
        input.peakLoadW || 4800,
      surgeFactor:
        input.surgeFactor || 1.3,
    });

  const cable =
    calculateCableSizing({
      currentA:
        input.cableCurrentA || 18,
      lengthM:
        input.cableLengthM || 25,
      voltageV:
        input.cableVoltageV || 480,
      cableAreaMm2:
        input.cableAreaMm2 || 6,
    });

  const valid =
    string.status === "PASS" &&
    cable.status === "PASS" &&
    losses.status === "GOOD";

  return {
    pv,
    string,
    battery,
    inverter,
    cable,
    losses,
    valid,
    status: valid ? "ENGINEERING PASS" : "NEEDS REVIEW",
    generatedAt: new Date().toISOString(),
  };
}
