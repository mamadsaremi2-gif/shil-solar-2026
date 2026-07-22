import { n, pick, round } from "./math.js";

export const METHOD_LABELS = {
  equipment: "لیست تجهیزات",
  equipment_list: "لیست تجهیزات",
  energy: "انرژی روزانه",
  power: "توان کل",
  current: "جریان کل",
  profile: "پروفایل مصرف",
  solar_panel_power: "توان پنل خورشیدی",
};

function buildLoadMetrics(input = {}) {
  const method = input.method || "equipment";
  const voltageAC = n(input.voltageAC, 230);
  const selectedItems = Array.isArray(input.selectedItems) ? input.selectedItems : [];
  const itemPower = selectedItems.reduce((sum, item) => sum + n(item.ratedPowerW || item.powerW, 0) * n(item.quantity, 1), 0);
  const itemEnergy = selectedItems.reduce((sum, item) => sum + n(item.ratedPowerW || item.powerW, 0) * n(item.quantity, 1) * n(item.usageHoursPerDay, 0), 0);
  const manualPowerW = n(input.manualPowerW, 0);
  const manualEnergyWh = n(input.manualEnergyWh, 0);
  const manualHours = n(input.manualHours, 1) || 1;
  const totalPowerW = Math.max(itemPower, manualPowerW, manualEnergyWh ? manualEnergyWh / manualHours : 0);
  const totalEnergyWh = Math.max(itemEnergy, manualEnergyWh, totalPowerW * manualHours);
  const surgePowerW = Math.max(n(input.manualSurgeW, 0), totalPowerW * 1.25);
  return {
    method,
    label: METHOD_LABELS[method] || method,
    totalPowerW: round(totalPowerW, 2),
    totalEnergyWh: round(totalEnergyWh, 2),
    totalEnergyKWh: round(totalEnergyWh / 1000, 2),
    acCurrentA: round(totalPowerW / Math.max(1, voltageAC), 2),
    surgePowerW: round(surgePowerW, 2),
    selectedCount: selectedItems.length,
    voltageAC,
  };
}

export function runSurfaceLoadPreview(input = {}) {
  const load = buildLoadMetrics(input);
  const result = {
    ...load,
    status: "preview_only",
    valid: true,
    previewOnly: true,
    recommendedInverterW: round(load.surgePowerW * 1.1, 0),
    recommendedBatteryWh: round(load.totalEnergyWh * 1.2, 0),
    explanations: ["این بخش فقط پیش‌نمایش سطحی است؛ محاسبات واقعی فقط در صفحه اجرا انجام می‌شود."],
    warnings: [],
  };
  return result;
}

export function persistSurfaceLoadPreview(input = {}) {
  const result = runSurfaceLoadPreview(input);
  try {
    localStorage.setItem("shil:loadEngineResult", JSON.stringify(result));
  } catch {}
  return result;
}

export function runSurfacePvPreview(input = {}) {
  const panelInput = input.solarPanelPowerInput || {};
  const settings = input.settings || {};
  const environment = input.environment || {};
  const panelPowerW = n(pick(panelInput.panelPowerW, settings.panelPowerW, input.panel?.powerW), 620);
  const panelCount = n(pick(panelInput.panelCount, settings.panelCount, input.array?.N_panels), 0);
  const totalPanelPowerW = n(pick(panelInput.totalPanelPowerW, panelPowerW * panelCount), panelPowerW * panelCount);
  const psh = n(pick(panelInput.psh, environment.peakSunHours, environment.psh), 5);
  const lossPercent = n(pick(panelInput.lossPercent, environment.totalLossPercent), 15);
  const rawDailyEnergyKWh = round((totalPanelPowerW / 1000) * psh, 2);
  const generatedDailyKWh = round(rawDailyEnergyKWh * Math.max(0, 1 - lossPercent / 100), 2);
  const summary = {
    important_results: {
      panel_count: panelCount,
      panel_power_W: panelPowerW,
      array_power_W: totalPanelPowerW,
      raw_daily_kWh: rawDailyEnergyKWh,
      preview_daily_kWh: generatedDailyKWh,
    },
    warnings: [],
  };
  return {
    ok: true,
    canContinue: true,
    status: "preview_only",
    previewOnly: true,
    summary,
    explanations: ["این خروجی فقط پیش‌نمایش روکشی صفحات میانی است؛ موتور جامع در صفحه آخر اجرا می‌شود."],
  };
}

export function pvPreviewToLegacyDesign(preview = {}, fallback = {}) {
  const r = preview.summary?.important_results || {};
  return {
    ...fallback,
    previewOnly: true,
    valid: true,
    panel: { ...(fallback.panel || {}), powerW: r.panel_power_W || fallback.panel?.powerW || 620, title: fallback.panel?.title || "پنل انتخابی" },
    pvArray: {
      ...(fallback.pvArray || {}),
      panelCount: r.panel_count || fallback.pvArray?.panelCount || 0,
      arrayPowerW: r.array_power_W || fallback.pvArray?.arrayPowerW || 0,
      seriesCount: fallback.pvArray?.seriesCount || "—",
      parallelCount: fallback.pvArray?.parallelCount || "—",
    },
    panelPowerAnalysis: { array: { rawDailyEnergyKWh: r.raw_daily_kWh, dailyEnergyKWh: r.preview_daily_kWh } },
    explanations: ["پیشنهاد این صفحه فقط جهت اطلاع است؛ محاسبات قطعی در مرحله نهایی انجام می‌شود."],
  };
}
