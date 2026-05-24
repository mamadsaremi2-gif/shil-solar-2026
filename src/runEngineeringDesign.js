import { runEngineeringPipeline } from "./engines/pipeline/engineeringPipeline.js";
import { runUnifiedPvForUi } from "./engine/unifiedPvUiAdapter.js";

export function runEngineeringDesign(form = {}, options = {}) {
  const domain = options.domain || form.designDomain || form.domain || "solar";
  if (domain === "solar" || domain === "pv") {
    const unified = runUnifiedPvForUi({
      load: {
        method: form.calculationMethod?.method || form.method || "equipment_list",
        totalPowerW: form.project?.peakLoadW || form.load?.totalPowerW || form.manualPowerW || 0,
        totalEnergyWh: form.project?.dailyEnergyWh || form.load?.totalEnergyWh || 0,
        voltageAC: form.inverter?.outputVoltage || form.voltageAC || 230,
      },
      environment: {
        ...form.environment,
        peakSunHours: form.environment?.peakSunHours || form.environment?.psh || 5,
        shadingLossPercent: form.environment?.shadingLossPercent || 0,
        soilingLossPercent: form.environment?.soilingLossPercent || 4,
        temperatureMinC: form.pv?.temperatureMinC || form.environment?.temperatureMinC,
      },
      settings: {
        method: form.calculationMethod?.method || form.method || "equipment_list",
        calculationMethod: form.calculationMethod?.method || form.method || "equipment_list",
        panelCount: form.pv?.panelCount || form.pv?.N_panel || 0,
        outputAcVoltage: form.inverter?.outputVoltage || 230,
        autonomyDays: form.project?.autonomyDays || form.battery?.autonomyDays || 0,
      },
      solarPanelPowerInput: {
        panelPowerW: form.pv?.panelPowerW,
        panelCount: form.pv?.panelCount,
        psh: form.environment?.peakSunHours,
        totalPanelPowerW: form.pv?.panelPowerW && form.pv?.panelCount ? form.pv.panelPowerW * form.pv.panelCount : 0,
      },
    });
    return {
      status: unified.ok ? "ready" : "blocked",
      valid: unified.ok,
      canContinue: unified.canContinue,
      unifiedPvEngineResult: unified,
      warnings: (unified.summary?.warnings || []).map((item) => item.fa || item.text || String(item)),
      summary: unified.summary,
      result: unified.summary?.important_results,
      explanations: ["محاسبه با موتور یکپارچه PV انجام شد و ضرایب/تلفات دوبار اعمال نشده‌اند."],
    };
  }
  return runEngineeringPipeline(form, options);
}
