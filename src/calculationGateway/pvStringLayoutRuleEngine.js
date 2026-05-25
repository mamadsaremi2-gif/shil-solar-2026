import { clamp, n, pick, round } from "./math.js";
import { selectDcVoltageLevel } from "./remainingSelectionRules.js";

export function runPvStringLayoutRule(input = {}) {
  const panel = input.panel || input || {};
  const mppt = input.mppt || input.inverter?.PV || input || {};
  const site = input.site || input.environment || {};
  const user = input.user || input.settings || {};
  const tempSafetyFactor = n(input.tempSafetyFactor ?? input.defaults?.temp_safety_factor, 1.1);

  const Voc_panel = n(pick(panel.Voc_panel, panel.panelVoc, panel.voc, panel.Voc), 50.9);
  const Vmp_panel = n(pick(panel.Vmp_panel, panel.panelVmp, panel.vmp, panel.Vmp), 42.6);
  const Isc_panel = n(pick(panel.Isc_panel, panel.panelIsc, panel.isc, panel.Isc), 15);
  const Imp_panel = n(pick(panel.Imp_panel, panel.panelImp, panel.imp, panel.Imp), 14.5);
  const P_panel = n(pick(panel.P_panel, panel.panelPowerW, panel.powerW), 620);

  const V_mppt_min = n(pick(mppt.V_mppt_min, mppt.mpptMinVoltage, mppt.minVoltage), 120);
  const V_mppt_max = n(pick(mppt.V_mppt_max, mppt.mpptMaxVoltage, mppt.maxVoltage), 450);
  const V_dc_max = n(pick(mppt.V_dc_max, mppt.maxDcVoltage, mppt.VdcMax), 500);
  const I_mppt_max = n(pick(mppt.I_mppt_max, mppt.maxInputCurrent, mppt.currentMax), 18);
  const P_target_array = n(pick(user.P_target_array, user.target_power, user.targetPowerW, input.targetPowerW), 0);
  const has_partial_shading = Boolean(pick(site.has_partial_shading, site.hasPartialShading, n(site.shading_percent ?? site.shadingPercent, 0) > 0));
  const multi_orientation = Boolean(pick(site.multi_orientation, site.multiOrientation, false));

  const n_series_max_by_Voc = Math.floor(V_dc_max / Math.max(1, Voc_panel * tempSafetyFactor));
  const candidates = [];
  for (let i = 1; i <= Math.max(1, n_series_max_by_Voc); i += 1) {
    const vmp = i * Vmp_panel;
    if (vmp >= V_mppt_min && vmp <= V_mppt_max && i <= n_series_max_by_Voc) candidates.push(i);
  }
  const n_series = candidates.length ? Math.max(...candidates) : null;
  const I_string = Imp_panel;
  const n_parallel_max_by_current = Math.floor(I_mppt_max / Math.max(0.1, I_string));
  const n_total_panels_target = P_target_array > 0 ? Math.ceil(P_target_array / Math.max(1, P_panel)) : null;
  const n_parallel_target = n_series && n_total_panels_target ? Math.ceil(n_total_panels_target / n_series) : n_parallel_max_by_current;
  const n_parallel = n_series ? clamp(Math.floor(Math.min(n_parallel_target || 1, Math.max(1, n_parallel_max_by_current))), 1, Math.max(1, n_parallel_max_by_current)) : null;
  const series_valid = Boolean(n_series && n_series >= 1 && n_series * Voc_panel * tempSafetyFactor <= V_dc_max && n_series * Vmp_panel >= V_mppt_min && n_series * Vmp_panel <= V_mppt_max);
  const parallel_for_series_valid = series_valid && n_parallel >= 1;

  let connection_type = "series_with_parallel_strings";
  let reason_fa = "سایت بدون سایه و تک‌جهته است، ولتاژ و جریان در محدوده مجاز هستند؛ سری بهترین راندمان و کمترین تلفات کابل را می‌دهد.";
  let error_fa = "";
  if (series_valid && parallel_for_series_valid && has_partial_shading) {
    connection_type = "series_with_limited_parallel";
    reason_fa = "به دلیل سایه جزئی، استرینگ‌های موازی محدود و با شرایط نوری مشابه پیشنهاد می‌شوند.";
  } else if (series_valid && parallel_for_series_valid && multi_orientation) {
    connection_type = "separate_MPPT_or_parallel_groups";
    reason_fa = "جهت‌های مختلف باید روی MPPT جدا یا گروه‌های مستقل قرار گیرند.";
  } else if (!series_valid && n_parallel_max_by_current >= 1) {
    connection_type = "parallel_preferred";
    reason_fa = "سری از نظر ولتاژ نامعتبر است، بنابراین باید تعداد پنل در سری کم و در صورت نیاز موازی افزایش یابد.";
  } else if (!series_valid && n_parallel_max_by_current < 1) {
    connection_type = "incompatible";
    reason_fa = "ترکیب پنل و اینورتر از نظر ولتاژ و جریان مردود است.";
    error_fa = "این پنل با این اینورتر/MPPT از نظر ولتاژ و جریان سازگار نیست.";
  }

  const N_panels = n_series && n_parallel ? n_series * n_parallel : 0;
  const V_work_approx = n_series ? round(n_series * Vmp_panel, 2) : 0;
  const V_oc_cold = n_series ? round(n_series * Voc_panel * tempSafetyFactor, 2) : 0;
  const I_array = n_parallel ? round(n_parallel * Imp_panel, 2) : 0;
  const I_sc_array = n_parallel ? round(n_parallel * Isc_panel, 2) : 0;
  const P_array = round(N_panels * P_panel, 2);

  return {
    ok: connection_type !== "incompatible",
    engine: "PV_String_Layout_Selection",
    connection_type,
    n_series,
    n_parallel,
    N_panels,
    V_work_approx,
    V_oc_cold,
    I_array,
    I_sc_array,
    P_array,
    dcVoltageLevel: selectDcVoltageLevel(V_oc_cold || V_dc_max),
    checks: { n_series_max_by_Voc, n_series_work_range: candidates, n_parallel_max_by_current, series_valid, parallel_for_series_valid },
    status_messages_fa: [reason_fa, error_fa].filter(Boolean),
    warnings: [
      V_oc_cold > V_dc_max * 0.92 ? "ولتاژ مدار باز آرایه به حد بالای اینورتر نزدیک است." : null,
      n_parallel_max_by_current <= 1 ? "ظرفیت جریان MPPT اجازه موازی‌سازی زیاد نمی‌دهد." : null,
    ].filter(Boolean),
    raw: { Voc_panel, Vmp_panel, Isc_panel, Imp_panel, P_panel, V_mppt_min, V_mppt_max, V_dc_max, I_mppt_max, tempSafetyFactor },
  };
}
