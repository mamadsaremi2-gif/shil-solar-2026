const num = (value, fallback = 0) => {
  if (value === null || value === undefined || value === "") return fallback;
  const normalized = String(value)
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
  const n = Number(normalized);
  return Number.isFinite(n) ? n : fallback;
};

const round = (value, digits = 2) => Number(num(value, 0).toFixed(digits));
const clamp = (value, min, max) => Math.min(max, Math.max(min, num(value, min)));

export function runSolarSizing({
  panelPowerW,
  panelCount,
  peakSunHours,
  systemLossPercent,
  systemLossRatio,
  dailyLoadKWh,
  dailyLoadWh,
  autonomyDays,
  depthOfDischarge,
  efficiency,
  batteryUnitKWh,
  batteryUnitVoltageV,
  batteryUnitCapacityAh,
} = {}) {
  const P_panel = Math.max(0, num(panelPowerW, 620));
  const N_panel = Math.max(0, Math.ceil(num(panelCount, 0)));
  const PSH = clamp(peakSunHours, 0, 9);
  const lossRatio = systemLossRatio !== undefined
    ? clamp(systemLossRatio, 0, 0.6)
    : clamp(num(systemLossPercent, 15) / 100, 0, 0.6);
  const E_load_daily = Math.max(0, num(dailyLoadKWh, 0) || num(dailyLoadWh, 0) / 1000);
  const Days_aut = Math.max(0, num(autonomyDays, 1));
  const DoD = clamp(depthOfDischarge, 0.1, 1);
  const eta = clamp(efficiency, 0.1, 1);
  const E_bat_unit = Math.max(0, num(batteryUnitKWh, 0));
  const batteryVoltageV = Math.max(0, num(batteryUnitVoltageV, 0));
  const batteryCapacityAh = Math.max(0, num(batteryUnitCapacityAh, batteryVoltageV > 0 && E_bat_unit > 0 ? (E_bat_unit * 1000) / batteryVoltageV : 0));

  const P_array_w = N_panel * P_panel;
  const P_array_kw = P_array_w / 1000;
  const E_pv_daily = P_array_kw * PSH * (1 - lossRatio);
  const coveragePercent = E_load_daily > 0 ? (E_pv_daily / E_load_daily) * 100 : null;
  const E_bat_needed = E_load_daily > 0 ? (E_load_daily * Days_aut) / (DoD * eta) : 0;
  const N_bat = E_bat_unit > 0 && E_bat_needed > 0 ? Math.ceil(E_bat_needed / E_bat_unit) : 0;
  const batteryBankKWh = round(N_bat * E_bat_unit, 2);
  const batteryBankAh = batteryCapacityAh > 0 ? round(N_bat * batteryCapacityAh, 1) : 0;

  const enoughDailyEnergy = E_load_daily > 0 ? E_pv_daily >= E_load_daily : null;
  const messages = [];
  if (N_panel > 0) messages.push(`این تعداد پنل حدود ${round(P_array_kw, 2)} کیلووات توان پیک DC دارد.`);
  if (E_pv_daily > 0) messages.push(`در شرایط متوسط، روزانه حدود ${round(E_pv_daily, 2)} کیلووات‌ساعت انرژی تولید می‌شود.`);
  if (enoughDailyEnergy === true) messages.push("سیستم از نظر انرژی روزانه مصرف واردشده را پوشش می‌دهد.");
  if (enoughDailyEnergy === false) messages.push("برای پوشش کامل مصرف، تعداد پنل باید افزایش یابد یا مصرف روزانه کاهش پیدا کند.");
  if (E_bat_needed > 0) messages.push(`برای ${round(Days_aut, 1)} روز خودکفایی، حدود ${round(E_bat_needed, 2)} کیلووات‌ساعت ظرفیت باتری نیاز است.`);
  if (N_bat > 0) messages.push(`این مقدار تقریباً برابر ${N_bat.toLocaleString("fa-IR")} عدد باتری ${round(E_bat_unit, 2)} کیلووات‌ساعتی است${batteryVoltageV ? `؛ مشخصات هر باتری ${batteryVoltageV}V / ${round(batteryCapacityAh, 1)}Ah و ظرفیت کل بانک ${batteryBankKWh}kWh است` : ""}.`);

  return {
    input: { P_panel, N_panel, PSH, lossRatio, E_load_daily, Days_aut, DoD, eta, E_bat_unit, batteryVoltageV, batteryCapacityAh },
    pArrayW: round(P_array_w, 0),
    pArrayKW: round(P_array_kw, 2),
    ePvDailyKWh: round(E_pv_daily, 2),
    eLoadDailyKWh: round(E_load_daily, 2),
    coveragePercent: coveragePercent === null ? null : round(coveragePercent, 1),
    enoughDailyEnergy,
    eBatteryNeededKWh: round(E_bat_needed, 2),
    batteryUnitKWh: round(E_bat_unit, 2),
    batteryVoltageV: round(batteryVoltageV, 1),
    batteryCapacityAh: round(batteryCapacityAh, 1),
    batteryBankKWh,
    batteryBankAh,
    batteryCount: N_bat,
    batterySummary: N_bat > 0 ? `${N_bat.toLocaleString("fa-IR")} عدد / ${round(batteryVoltageV, 1)}V / ${round(batteryCapacityAh, 1)}Ah / ${round(E_bat_unit, 2)}kWh هر باتری / ${batteryBankKWh}kWh کل` : "",
    messages,
  };
}
