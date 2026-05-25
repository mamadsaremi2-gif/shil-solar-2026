import { runPvStringLayoutRule } from "./pvStringLayoutRuleEngine.js";
import { n, pick, round } from "./math.js";

export function runMultiMpptSystem(input = {}) {
  const inverter = input.inverter || {};
  const mpptCount = Math.max(1, Math.round(n(pick(inverter.mppt_count, inverter.mpptCount, input.mpptCount), 1)));
  const mpptList = Array.isArray(inverter.mppt_list) && inverter.mppt_list.length
    ? inverter.mppt_list
    : Array.from({ length: mpptCount }, (_, idx) => ({
      mppt_id: idx + 1,
      V_mppt_min: pick(inverter.V_mppt_min, inverter.mpptMinVoltage, input.mppt?.V_mppt_min, 120),
      V_mppt_max: pick(inverter.V_mppt_max, inverter.mpptMaxVoltage, input.mppt?.V_mppt_max, 450),
      V_dc_max: pick(inverter.V_dc_max, inverter.maxDcVoltage, input.mppt?.V_dc_max, 500),
      I_mppt_max: pick(inverter.I_mppt_max, inverter.maxInputCurrent, input.mppt?.I_mppt_max, 18),
    }));
  const targetPower = n(pick(input.user?.target_power, input.targetPowerW, input.settings?.targetPowerW), 0);
  const perMpptTarget = targetPower > 0 ? targetPower / mpptList.length : 0;
  const per_MPPT_panels = mpptList.map((mppt, index) => {
    const layout = runPvStringLayoutRule({ ...input, mppt, user: { ...(input.user || {}), target_power: perMpptTarget || targetPower } });
    return {
      mppt_id: mppt.mppt_id || index + 1,
      layout,
      n_series: layout.n_series,
      n_parallel: layout.n_parallel,
      I_PV_out: layout.I_array,
      V_PV_oc: layout.V_oc_cold,
      P_array: layout.P_array,
      warnings: layout.warnings,
    };
  });
  const totals = per_MPPT_panels.reduce((acc, item) => {
    acc.N_panels += n(item.layout.N_panels, 0);
    acc.P_array += n(item.layout.P_array, 0);
    acc.I_array += n(item.I_PV_out, 0);
    acc.maxVoc = Math.max(acc.maxVoc, n(item.V_PV_oc, 0));
    return acc;
  }, { N_panels: 0, P_array: 0, I_array: 0, maxVoc: 0 });
  const warnings = [
    ...per_MPPT_panels.flatMap((item) => item.warnings || []),
    per_MPPT_panels.some((item) => !item.layout.ok) ? "حداقل یک MPPT با پنل/اینورتر ناسازگار است." : null,
    per_MPPT_panels.some((item) => !item.layout.N_panels) ? "یک MPPT بدون آرایه مؤثر باقی مانده است." : null,
  ].filter(Boolean);
  return {
    ok: !per_MPPT_panels.some((item) => !item.layout.ok),
    engine: "SHIL_Inverter_MPPT_System",
    mppt_count: mpptList.length,
    per_MPPT_panels,
    totals: { ...totals, P_array: round(totals.P_array, 2), I_array: round(totals.I_array, 2), maxVoc: round(totals.maxVoc, 2) },
    warnings,
    notes_fa: ["هر MPPT به صورت مستقل محاسبه شد و خروجی Combiner از مجموع بخش‌ها ساخته می‌شود."],
  };
}
