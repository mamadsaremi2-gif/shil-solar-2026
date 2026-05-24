/**
 * Unified SHIL PV Calculation Engine
 *
 * This module is the single source of truth for the solar/PV calculation path.
 * It intentionally runs the PV design as an ordered pipeline so coefficients,
 * losses and efficiency factors are applied exactly once and in the correct layer.
 *
 * Pipeline order:
 * 1) input normalization
 * 2) PV string / MPPT layout
 * 3) smart bank selection
 * 4) protection, cable and panelboard sizing (selection only; no energy loss applied)
 * 5) efficiency and energy calculation (all power/energy losses applied once)
 * 6) route-specific summary
 */

export const PV_ENGINE_VERSION = "2026.05.24-unified-pv-10-rules-complete";

const DEFAULT_PANEL = {
  model_name: "SHIL Default PV 585W",
  P_panel: 585,
  Voc_panel: 52.2,
  Vmp_panel: 43.8,
  Isc_panel: 14.1,
  Imp_panel: 13.36,
  gamma_temp_coeff: -0.0035,
};

const DEFAULT_INVERTER = {
  model_name: "SHIL Default Hybrid 6kW",
  P_inv: 6000,
  eta_inv: 0.96,
  mppt_count: 2,
  mppt_list: [
    { mppt_id: 1, V_mppt_min: 120, V_mppt_max: 450, V_dc_max: 500, I_mppt_max: 16 },
    { mppt_id: 2, V_mppt_min: 120, V_mppt_max: 450, V_dc_max: 500, I_mppt_max: 16 },
  ],
  AC: { U_AC: 230, cos_phi: 0.9, phase: "single_phase" },
  battery: { U_bat_nom: 48 },
};

const DEFAULT_BATTERY = {
  model_name: "SHIL Default Battery 48V 100Ah",
  U_bat_nom: 48,
  capacity_Wh: 4800,
  eta_battery_charge: 0.95,
  eta_battery_discharge: 0.95,
  max_discharge_current: 100,
};

const CABLE_AREAS_MM2 = [2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240];

const SHIL_REMAINING_10_RULES = [
  { id: 1, name: "DC_Voltage_Level_Selection", place_in_engine: "voltage_level_selection" },
  { id: 2, name: "Breaker_Type_Selection", place_in_engine: "protection_DC_PV, protection_DC_BAT, protection_AC" },
  { id: 3, name: "Pole_Count_Selection", place_in_engine: "protection_DC_PV, protection_AC, panelboard_selection" },
  { id: 4, name: "Panelboard_Size_Selection", place_in_engine: "panelboard_selection" },
  { id: 5, name: "Panelboard_IP_Selection", place_in_engine: "environment_rules" },
  { id: 6, name: "Cable_Voltage_Drop_Rule", place_in_engine: "cable_selection" },
  { id: 7, name: "SPD_Type_Selection", place_in_engine: "protection_DC_PV, protection_AC" },
  { id: 8, name: "Battery_Fuse_Type_Selection", place_in_engine: "protection_DC_BAT" },
  { id: 9, name: "Multi_MPPT_Management", place_in_engine: "mppt_validation" },
  { id: 10, name: "Panel_Layout_Space_Constraint", place_in_engine: "panel_string_design" },
];

function selectDCVoltageLevel(vString) {
  const v = Math.max(0, toNumber(vString, 0));
  if (v <= 550) return { rating: "600VDC", max_supported_V: 550 };
  if (v <= 900) return { rating: "1000VDC", max_supported_V: 900 };
  if (v <= 1200) return { rating: "1500VDC", max_supported_V: 1200 };
  return { rating: "CUSTOM_HIGH_VOLTAGE_REVIEW", max_supported_V: 1200, warning_fa: "ولتاژ استرینگ از محدوده استاندارد 1500VDC بالاتر است و نیاز به بازبینی مهندسی دارد." };
}

function selectBreakerType(currentA, circuit = "AC") {
  const current = Math.max(0, toNumber(currentA, 0));
  const base = current <= 63 ? "MCB" : "MCCB";
  if (circuit === "PV_DC" || circuit === "BAT_DC") return current <= 63 ? "DC Breaker or DC Isolator" : "DC MCCB or DC Isolator";
  return base;
}

function selectPoleCount(circuit, phase = "single_phase") {
  if (circuit === "PV_DC") return "2P or 4P";
  if (circuit === "SPD_DC") return "2P or 4P";
  if (circuit === "BAT_DC") return "2P";
  if (circuit === "AC") return phase === "three_phase" ? "3P+N" : "1P+N";
  if (circuit === "SPD_AC") return phase === "three_phase" ? "4P" : "2P";
  if (circuit === "ISOLATOR") return "must_disconnect_all_poles";
  return "2P";
}

function selectPanelboardSize(moduleCount) {
  const modules = Math.max(0, Math.ceil(toNumber(moduleCount, 0)));
  if (modules <= 12) return "12M";
  if (modules <= 24) return "24M";
  if (modules <= 36) return "36M";
  if (modules <= 54) return "54M";
  return "Industrial_Panel";
}

function selectPanelboardIP(installationEnv = "indoor") {
  const map = {
    indoor: "IP40",
    outdoor: "IP54",
    roof: "IP65",
    corrosive: "IP65 + anti_corrosion",
    industrial: "IP55 or IP65",
  };
  return map[installationEnv] || "IP40";
}

function cableDropLimit(circuit, lengthM = 0, currentA = 0) {
  const circuitLimits = {
    PV_DC: { min: 1.5, max: 3 },
    Battery_DC: { min: 1, max: 2 },
    AC: { min: 2, max: 3 },
  };
  const base = circuitLimits[circuit] || { min: 2, max: 3 };
  const length = toNumber(lengthM, 0);
  const current = toNumber(currentA, 0);
  const notes = [];
  if (length > 30) notes.push("if_length_high: increase_cable_size");
  if (current > 100) notes.push("if_current_high: parallel_cables_allowed");
  return { allowed_percent_range: `${base.min}% - ${base.max}%`, max_percent: base.max, notes };
}

function selectSPDType({ installationEnv = "indoor", highLightningArea = false, side = "DC" } = {}) {
  if (highLightningArea) return "Type I";
  if (installationEnv === "roof") return "Type I+II";
  if (side === "BAT") return "Type II";
  return "Type II";
}

function selectBatteryFuseType({ voltage = 48, installationEnv = "indoor", inverterPowerW = 0 } = {}) {
  const v = toNumber(voltage, 48);
  const p = toNumber(inverterPowerW, 0);
  if (v >= 120) return "NH";
  if (installationEnv === "industrial" || p >= 15000) return "NH gPV";
  if (v <= 60 && p <= 8000) return "MEGA or ANL";
  return "DC_cartridge_fuse";
}

function evaluateMultiMPPTManagement(input, layout) {
  const { environment } = input;
  const warnings = [];
  const assignments = layout.per_MPPT.map((mppt) => ({
    mppt_id: mppt.mppt_id,
    panel_count: mppt.N_panels,
    power_W: mppt.P_array,
    connection_type: mppt.connection_type,
    condition_group: environment.multi_orientation ? "separate_orientation_group" : environment.has_partial_shading ? "similar_shading_group" : "uniform_group",
  }));
  const powers = assignments.map((a) => a.power_W).filter((p) => p > 0);
  const avg = powers.length ? powers.reduce((a,b)=>a+b,0)/powers.length : 0;
  assignments.forEach((a) => {
    if (a.power_W <= 0) warnings.push({ code: "MPPT_EMPTY", level: "warning", fa: `MPPT ${a.mppt_id} خالی است؛ تقسیم توان بین MPPTها بررسی شود.` });
    if (avg && Math.abs(a.power_W - avg) / avg > 0.25) warnings.push({ code: "MPPT_POWER_UNBALANCED", level: "warning", fa: `توان MPPT ${a.mppt_id} با سایر MPPTها متعادل نیست.` });
  });
  if (environment.multi_orientation) warnings.push({ code: "MULTI_ORIENTATION_SEPARATE_MPPT", level: "warning", fa: "جهت‌های متفاوت باید به MPPT جدا اختصاص داده شوند و در یک MPPT ترکیب نشوند." });
  if (environment.has_partial_shading) warnings.push({ code: "SHADING_SEPARATE_MPPT", level: "warning", fa: "سایه متفاوت باید در MPPT یا گروه جدا مدیریت شود." });
  return {
    rule: "Multi_MPPT_Management",
    assignments,
    balance_power_between_MPPTs: true,
    no_mixing_conditions_in_one_MPPT: true,
    warnings,
  };
}

function applyPanelLayoutSpaceConstraint(input, layout) {
  const space = input.user.panel_layout_space || {};
  const spaceLevel = space.space_level || input.environment.panel_space_level || "normal";
  const distanceLevel = space.distance_level || input.environment.array_distance_level || "normal";
  const preference = [];
  if (spaceLevel === "small") preference.push("if_space_small: increase_series_reduce_parallel");
  if (spaceLevel === "large") preference.push("if_space_large: increase_parallel");
  if (distanceLevel === "long") preference.push("if_distance_long: prefer_more_series");
  if (distanceLevel === "short") preference.push("if_distance_short: parallel_allowed");
  const warnings = [];
  if (spaceLevel === "small" && layout.per_MPPT.some((m) => (m.n_parallel || 0) > 1)) {
    warnings.push({ code: "SPACE_SMALL_PARALLEL_REVIEW", level: "warning", fa: "فضای نصب محدود است؛ کاهش موازی و افزایش سری تا محدوده مجاز بررسی شود." });
  }
  return { rule: "Panel_Layout_Space_Constraint", space_level: spaceLevel, distance_level: distanceLevel, preference, warnings };
}

const COPPER_RESISTIVITY_OHM_MM2_PER_M = 0.0175;

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function round(value, digits = 2) {
  const n = toNumber(value, 0);
  const factor = 10 ** digits;
  return Math.round(n * factor) / factor;
}

function ceilToStep(value, step = 1) {
  if (!step) return Math.ceil(value);
  return Math.ceil(value / step) * step;
}

function safeDivide(a, b, fallback = 0) {
  const denominator = toNumber(b, 0);
  if (!denominator) return fallback;
  return toNumber(a, 0) / denominator;
}

function createLedger() {
  const used = new Map();
  const warnings = [];
  return {
    use(effectKey, owner) {
      if (used.has(effectKey)) {
        warnings.push({
          code: "DUPLICATE_EFFECT_BLOCKED",
          level: "warning",
          fa: `اثر ${effectKey} قبلاً در ${used.get(effectKey)} اعمال شده و در ${owner} دوباره اعمال نمی‌شود.`,
          effectKey,
          firstOwner: used.get(effectKey),
          blockedOwner: owner,
        });
        return false;
      }
      used.set(effectKey, owner);
      return true;
    },
    list() {
      return Array.from(used.entries()).map(([effectKey, owner]) => ({ effectKey, owner }));
    },
    warnings() {
      return warnings;
    },
  };
}

function normalizeInput(raw = {}) {
  const panel = { ...DEFAULT_PANEL, ...(raw.panel || {}) };
  const inverterRaw = { ...DEFAULT_INVERTER, ...(raw.inverter || {}) };
  const mpptList = Array.isArray(inverterRaw.mppt_list) && inverterRaw.mppt_list.length
    ? inverterRaw.mppt_list
    : DEFAULT_INVERTER.mppt_list;

  const inverter = {
    ...inverterRaw,
    P_inv: toNumber(inverterRaw.P_inv || inverterRaw.power_W, DEFAULT_INVERTER.P_inv),
    eta_inv: toNumber(inverterRaw.eta_inv, DEFAULT_INVERTER.eta_inv),
    mppt_count: toNumber(inverterRaw.mppt_count, mpptList.length),
    mppt_list: mpptList.map((mppt, index) => ({
      mppt_id: toNumber(mppt.mppt_id, index + 1),
      V_mppt_min: toNumber(mppt.V_mppt_min, DEFAULT_INVERTER.mppt_list[0].V_mppt_min),
      V_mppt_max: toNumber(mppt.V_mppt_max, DEFAULT_INVERTER.mppt_list[0].V_mppt_max),
      V_dc_max: toNumber(mppt.V_dc_max, DEFAULT_INVERTER.mppt_list[0].V_dc_max),
      I_mppt_max: toNumber(mppt.I_mppt_max, DEFAULT_INVERTER.mppt_list[0].I_mppt_max),
    })),
    AC: { ...DEFAULT_INVERTER.AC, ...(inverterRaw.AC || {}) },
    battery: { ...DEFAULT_INVERTER.battery, ...(inverterRaw.battery || {}) },
  };

  const battery = { ...DEFAULT_BATTERY, ...(raw.battery || {}) };
  const environment = {
    G_POA: toNumber(raw.environment?.G_POA, 1000),
    H_POA_daily: toNumber(raw.environment?.H_POA_daily ?? raw.irradiance_daily?.H_POA_daily, 5),
    T_ambient: toNumber(raw.environment?.T_ambient, 25),
    T_min: toNumber(raw.environment?.T_min, -5),
    soiling_level: raw.environment?.soiling_level || "medium",
    tilt_deg: toNumber(raw.array?.tilt_deg ?? raw.environment?.tilt_deg, 30),
    azimuth_deg: toNumber(raw.array?.azimuth_deg ?? raw.environment?.azimuth_deg, 180),
    shading_percent: clamp(toNumber(raw.array?.shading_percent ?? raw.environment?.shading_percent, 0), 0, 100),
    has_partial_shading: toBoolean(raw.site?.has_partial_shading ?? raw.environment?.has_partial_shading, false),
    multi_orientation: toBoolean(raw.site?.multi_orientation ?? raw.environment?.multi_orientation, false),
    installation_env: raw.user?.installation_env || raw.environment?.installation_env || "indoor",
    high_lightning_area: toBoolean(raw.environment?.high_lightning_area ?? raw.site?.high_lightning_area, false),
    panel_space_level: raw.environment?.panel_space_level || raw.site?.panel_space_level || "normal",
    array_distance_level: raw.environment?.array_distance_level || raw.site?.array_distance_level || "normal",
  };

  const user = {
    route: raw.route || raw.method || "solar_panel_power",
    P_target_array: toNumber(raw.user?.P_target_array ?? raw.P_target_array ?? raw.target_power ?? raw.panelPowerTarget, 0),
    target_power: toNumber(raw.user?.target_power ?? raw.target_power ?? raw.totalPowerW, 0),
    daily_energy_Wh: toNumber(raw.user?.daily_energy_Wh ?? raw.dailyEnergyWh ?? raw.energyDailyWh, 0),
    autonomy_days: Math.max(0, toNumber(raw.user?.autonomy_days ?? raw.autonomy_days, 1)),
    manual_inverter_count: toNumber(raw.user?.manual_inverter_count ?? raw.manual_inverter_count, 0),
    manual_panel_count: toNumber(raw.user?.manual_panel_count ?? raw.manual_panel_count, 0),
    panel_layout_space: raw.user?.panel_layout_space || raw.panel_layout_space || {},
    cable_lengths: {
      PV_to_combiner: toNumber(raw.user?.cable_lengths?.PV_to_combiner, 15),
      combiner_to_inverter: toNumber(raw.user?.cable_lengths?.combiner_to_inverter, 10),
      inverter_to_battery: toNumber(raw.user?.cable_lengths?.inverter_to_battery, 3),
      inverter_to_load: toNumber(raw.user?.cable_lengths?.inverter_to_load, 15),
    },
  };

  panel.P_panel = toNumber(panel.P_panel, DEFAULT_PANEL.P_panel);
  panel.Voc_panel = toNumber(panel.Voc_panel, DEFAULT_PANEL.Voc_panel);
  panel.Vmp_panel = toNumber(panel.Vmp_panel, DEFAULT_PANEL.Vmp_panel);
  panel.Isc_panel = toNumber(panel.Isc_panel, DEFAULT_PANEL.Isc_panel);
  panel.Imp_panel = toNumber(panel.Imp_panel, DEFAULT_PANEL.Imp_panel);
  panel.gamma_temp_coeff = toNumber(panel.gamma_temp_coeff, DEFAULT_PANEL.gamma_temp_coeff);

  battery.U_bat_nom = toNumber(battery.U_bat_nom, DEFAULT_BATTERY.U_bat_nom);
  battery.capacity_Wh = toNumber(battery.capacity_Wh, DEFAULT_BATTERY.capacity_Wh);
  battery.eta_battery_charge = toNumber(battery.eta_battery_charge, DEFAULT_BATTERY.eta_battery_charge);
  battery.eta_battery_discharge = toNumber(battery.eta_battery_discharge, DEFAULT_BATTERY.eta_battery_discharge);
  battery.max_discharge_current = toNumber(battery.max_discharge_current, DEFAULT_BATTERY.max_discharge_current);

  const targetPowerFromEnergy = user.daily_energy_Wh && environment.H_POA_daily
    ? user.daily_energy_Wh / environment.H_POA_daily
    : 0;
  const designPowerW = Math.max(user.P_target_array, user.target_power, targetPowerFromEnergy, panel.P_panel);

  return { panel, inverter, battery, environment, user, designPowerW };
}

function findSeriesCandidates(panel, mppt, tempSafetyFactor = 1.1) {
  const maxByVoc = Math.floor(safeDivide(mppt.V_dc_max, panel.Voc_panel * tempSafetyFactor, 0));
  const minByVmp = Math.ceil(safeDivide(mppt.V_mppt_min, panel.Vmp_panel, 0));
  const maxByVmp = Math.floor(safeDivide(mppt.V_mppt_max, panel.Vmp_panel, 0));
  const start = Math.max(1, minByVmp);
  const end = Math.max(0, Math.min(maxByVoc, maxByVmp));
  const values = [];
  for (let n = start; n <= end; n += 1) values.push(n);
  return { values, n_series_max_by_Voc: maxByVoc, minByVmp, maxByVmp };
}

function runStringConnectionForMPPT({ panel, mppt, environment, targetPowerForMppt, tempSafetyFactor = 1.1 }) {
  const candidates = findSeriesCandidates(panel, mppt, tempSafetyFactor);
  const nParallelMaxByCurrent = Math.floor(safeDivide(mppt.I_mppt_max, panel.Imp_panel, 0));
  const seriesValid = candidates.values.length > 0;
  const preferredSeries = seriesValid ? candidates.values[candidates.values.length - 1] : null;
  const targetPanelCount = targetPowerForMppt > 0 ? Math.ceil(targetPowerForMppt / panel.P_panel) : preferredSeries || 1;
  const targetParallel = preferredSeries ? Math.max(1, Math.ceil(targetPanelCount / preferredSeries)) : 0;
  const nParallel = seriesValid ? Math.min(Math.max(1, targetParallel), Math.max(0, nParallelMaxByCurrent)) : 0;
  const parallelForSeriesValid = seriesValid && nParallel >= 1;

  let connectionType = "incompatible";
  let reasonFa = "این پنل با این MPPT از نظر ولتاژ و جریان سازگار نیست.";
  let errorFa = null;

  if (seriesValid && parallelForSeriesValid && !environment.has_partial_shading && !environment.multi_orientation) {
    connectionType = nParallel > 1 ? "series_with_parallel_strings" : "series";
    reasonFa = "شرایط نوری یکنواخت است و چیدمان سری بهترین راندمان و کمترین تلفات کابل را دارد.";
  } else if (seriesValid && parallelForSeriesValid && environment.has_partial_shading) {
    connectionType = "series_with_limited_parallel";
    reasonFa = "به دلیل سایه جزئی، استرینگ‌های موازی محدود با شرایط نوری مشابه تعریف می‌شوند.";
  } else if (seriesValid && parallelForSeriesValid && environment.multi_orientation) {
    connectionType = "separate_MPPT_or_parallel_groups";
    reasonFa = "به دلیل چند جهت نصب، گروه‌ها باید روی MPPT جدا یا گروه‌های مستقل قرار بگیرند.";
  } else if (!seriesValid && nParallelMaxByCurrent >= 1) {
    connectionType = "parallel_preferred";
    reasonFa = "ولتاژ سری از محدوده مجاز خارج می‌شود؛ باید تعداد سری کاهش یافته و موازی کنترل‌شده استفاده شود.";
  } else {
    errorFa = "نه ولتاژ سری داخل محدوده MPPT است و نه جریان مجاز MPPT امکان موازی‌سازی می‌دهد.";
  }

  const nSeries = preferredSeries;
  const panels = nSeries && nParallel ? nSeries * nParallel : 0;
  const VWorkApprox = nSeries ? nSeries * panel.Vmp_panel : 0;
  const VPvOc = nSeries ? nSeries * panel.Voc_panel * tempSafetyFactor : 0;
  const IArray = nParallel ? nParallel * panel.Imp_panel : 0;
  const PArray = panels * panel.P_panel;

  const warnings = [];
  if (VPvOc > mppt.V_dc_max * 0.92 && VPvOc <= mppt.V_dc_max) {
    warnings.push({ code: "VDC_NEAR_LIMIT", level: "warning", fa: "ولتاژ مدار باز آرایه به حد مجاز اینورتر نزدیک است." });
  }
  if (IArray > mppt.I_mppt_max * 0.92 && IArray <= mppt.I_mppt_max) {
    warnings.push({ code: "MPPT_CURRENT_NEAR_LIMIT", level: "warning", fa: "جریان آرایه به حد مجاز MPPT نزدیک است." });
  }
  if (IArray > mppt.I_mppt_max) {
    warnings.push({ code: "MPPT_CURRENT_OVER", level: "error", fa: "جریان آرایه از حد مجاز MPPT بیشتر است." });
  }
  if (errorFa) warnings.push({ code: "MPPT_INCOMPATIBLE", level: "error", fa: errorFa });

  return {
    mppt_id: mppt.mppt_id,
    connection_type: connectionType,
    n_series: nSeries,
    n_parallel: nParallel || null,
    N_panels: panels,
    V_work_approx: round(VWorkApprox),
    V_PV_oc: round(VPvOc),
    I_array: round(IArray),
    P_array: round(PArray),
    I_string: panel.Imp_panel,
    n_parallel_max_by_current: nParallelMaxByCurrent,
    reason_fa: reasonFa,
    warnings,
    valid: !warnings.some((w) => w.level === "error"),
  };
}

function runMPPTLayout(input) {
  const { panel, inverter, environment, designPowerW, user } = input;
  const activeMppts = inverter.mppt_list.slice(0, Math.max(1, inverter.mppt_count));
  const targetTotal = user.manual_panel_count > 0 ? user.manual_panel_count * panel.P_panel : designPowerW;
  const targetPerMppt = targetTotal / activeMppts.length;
  const perMPPT = activeMppts.map((mppt) => runStringConnectionForMPPT({ panel, mppt, environment, targetPowerForMppt: targetPerMppt }));

  const totalPanels = perMPPT.reduce((sum, item) => sum + item.N_panels, 0);
  const totalPower = totalPanels * panel.P_panel;
  const totalCurrent = perMPPT.reduce((sum, item) => sum + item.I_array, 0);
  const valid = perMPPT.every((item) => item.valid);
  const warnings = perMPPT.flatMap((item) => item.warnings.map((warning) => ({ ...warning, mppt_id: item.mppt_id })));

  const baseLayout = {
    stage: "PV_STRING_MPPT_LAYOUT",
    valid,
    total_panels: totalPanels,
    total_array_power_W: round(totalPower),
    total_current_A: round(totalCurrent),
    mppt_count: activeMppts.length,
    per_MPPT: perMPPT,
    warnings,
  };
  const mpptManagement = evaluateMultiMPPTManagement(input, baseLayout);
  const spaceConstraint = applyPanelLayoutSpaceConstraint(input, baseLayout);
  baseLayout.mppt_management = mpptManagement;
  baseLayout.panel_layout_space_constraint = spaceConstraint;
  baseLayout.warnings = [...warnings, ...mpptManagement.warnings, ...spaceConstraint.warnings];
  return baseLayout;
}

function selectSmartBanks(input, layout) {
  const { inverter, battery, panel, user, designPowerW } = input;
  const requiredInverterCount = Math.max(1, Math.ceil(safeDivide(designPowerW, inverter.P_inv, 1)));
  const selectedInverterCount = user.manual_inverter_count > 0 ? user.manual_inverter_count : requiredInverterCount;
  const inverterCapacity = selectedInverterCount * inverter.P_inv;
  const warnings = [];

  if (selectedInverterCount < requiredInverterCount) {
    warnings.push({
      code: "INVERTER_COUNT_UNDER_REQUIRED",
      level: "error",
      fa: "تعداد اینورتر انتخاب‌شده توان طراحی را پوشش نمی‌دهد؛ تعداد باید افزایش یابد.",
    });
  }

  const dailyEnergyNeed = Math.max(user.daily_energy_Wh, designPowerW * 4);
  const baseBatteryCount = Math.max(1, Math.ceil(safeDivide(dailyEnergyNeed, battery.capacity_Wh, 1)));
  const autonomyBatteryCount = Math.max(baseBatteryCount, Math.ceil(safeDivide(dailyEnergyNeed * Math.max(1, user.autonomy_days), battery.capacity_Wh, 1)));

  const panelCount = user.manual_panel_count > 0 ? user.manual_panel_count : layout.total_panels;
  const panelCapacity = panelCount * panel.P_panel;

  if (panelCapacity < designPowerW * 0.95) {
    warnings.push({
      code: "PANEL_CAPACITY_LOW",
      level: "warning",
      fa: "توان مجموعه پنل‌ها کمتر از توان هدف است و ممکن است تولید واقعی کافی نباشد.",
    });
  }

  return {
    stage: "SMART_BANK_SELECTION",
    inverter: {
      selected: inverter,
      required_count: requiredInverterCount,
      count: selectedInverterCount,
      capacity_W: inverterCapacity,
    },
    battery: {
      selected_default: battery,
      base_count: baseBatteryCount,
      autonomy_days: user.autonomy_days,
      autonomy_count: autonomyBatteryCount,
      usable_capacity_Wh: autonomyBatteryCount * battery.capacity_Wh,
    },
    panel: {
      selected: panel,
      count: panelCount,
      capacity_W: panelCapacity,
    },
    valid: !warnings.some((w) => w.level === "error"),
    warnings,
  };
}

function chooseCableSize({ currentA, lengthM, voltageV, maxDropPercent, circuit = "AC" }) {
  const current = Math.max(0, toNumber(currentA, 0));
  const length = Math.max(0, toNumber(lengthM, 0));
  const voltage = Math.max(1, toNumber(voltageV, 230));
  const dropRule = cableDropLimit(circuit, length, current);
  const maxDrop = Math.max(0.1, toNumber(maxDropPercent ?? dropRule.max_percent, dropRule.max_percent));

  for (const area of CABLE_AREAS_MM2) {
    const resistancePerM = COPPER_RESISTIVITY_OHM_MM2_PER_M / area;
    const voltageDrop = 2 * current * length * resistancePerM;
    const dropPercent = (voltageDrop / voltage) * 100;
    if (dropPercent <= maxDrop) {
      return { area_mm2: area, resistance_per_m: resistancePerM, voltage_drop_percent: round(dropPercent, 2), voltage_drop_rule: dropRule };
    }
  }

  const area = CABLE_AREAS_MM2[CABLE_AREAS_MM2.length - 1];
  const resistancePerM = COPPER_RESISTIVITY_OHM_MM2_PER_M / area;
  return {
    area_mm2: area,
    resistance_per_m: resistancePerM,
    voltage_drop_percent: round((2 * current * length * resistancePerM / voltage) * 100, 2),
    voltage_drop_rule: dropRule,
    warning: "بزرگ‌ترین سایز کابل بانک هم ممکن است افت ولتاژ را کامل پوشش ندهد.",
  };
}

function runProtectionSelection(input, layout, banks) {
  const { panel, inverter, user, environment } = input;
  const perMPPT = layout.per_MPPT.map((mpptResult) => {
    const pvCurrent = mpptResult.I_array;
    const pvVoltage = Math.max(mpptResult.V_PV_oc, mpptResult.V_work_approx, 1);
    const pvCable = chooseCableSize({
      currentA: 1.25 * pvCurrent,
      lengthM: user.cable_lengths.PV_to_combiner,
      voltageV: pvVoltage,
      maxDropPercent: 3,
      circuit: "PV_DC",
    });
    const voltageLevel = selectDCVoltageLevel(pvVoltage);
    const dcBreakerCurrent = ceilToStep(1.25 * pvCurrent, 1);
    return {
      mppt_id: mpptResult.mppt_id,
      voltage_level: voltageLevel,
      string_fuses: {
        count: mpptResult.n_parallel || 0,
        current_rating_A: ceilToStep(1.25 * panel.Imp_panel, 1),
        type: "gPV",
        voltage_rating: voltageLevel.rating,
      },
      DC_breaker: {
        current_rating_A: dcBreakerCurrent,
        type: selectBreakerType(dcBreakerCurrent, "PV_DC"),
        voltage_rating: voltageLevel.rating,
        poles: selectPoleCount("PV_DC"),
      },
      SPD_DC: { type: selectSPDType({ installationEnv: environment.installation_env, highLightningArea: environment.high_lightning_area, side: "DC" }), voltage_rating: voltageLevel.rating, poles: selectPoleCount("SPD_DC") },
      DC_isolator: { current_rating_A: dcBreakerCurrent, type: selectBreakerType(dcBreakerCurrent, "PV_DC"), poles: selectPoleCount("ISOLATOR") },
      PV_cable: {
        design_current_A: round(1.25 * pvCurrent),
        length_m: user.cable_lengths.PV_to_combiner,
        ...pvCable,
      },
    };
  });

  const batteryCurrent = safeDivide(banks.inverter.selected.P_inv, input.battery.U_bat_nom * Math.max(0.01, inverter.eta_inv), 0);
  const batteryCable = chooseCableSize({
    currentA: 1.25 * batteryCurrent,
    lengthM: user.cable_lengths.inverter_to_battery,
    voltageV: input.battery.U_bat_nom,
    maxDropPercent: 2,
    circuit: "Battery_DC",
  });

  const phase = inverter.AC?.phase || "single_phase";
  const UAC = toNumber(inverter.AC?.U_AC, 230);
  const cosPhi = toNumber(inverter.AC?.cos_phi, 0.9);
  const acCurrent = phase === "three_phase"
    ? safeDivide(banks.inverter.capacity_W, 1.732 * UAC * cosPhi, 0)
    : safeDivide(banks.inverter.capacity_W, UAC * cosPhi, 0);
  const acCable = chooseCableSize({ currentA: 1.25 * acCurrent, lengthM: user.cable_lengths.inverter_to_load, voltageV: UAC, maxDropPercent: 3, circuit: "AC" });
  const moduleEstimate = perMPPT.length * 8 + 10;
  const batteryFuseType = selectBatteryFuseType({ voltage: input.battery.U_bat_nom, installationEnv: environment.installation_env, inverterPowerW: banks.inverter.capacity_W });

  return {
    stage: "PROTECTION_SELECTION_ONLY",
    note_fa: "این مرحله فقط انتخاب حفاظت، کابل و تابلو را انجام می‌دهد و هیچ تلفات انرژی را روی توان نهایی اعمال نمی‌کند.",
    per_MPPT_protection: perMPPT,
    battery_block: {
      I_bat_A: round(batteryCurrent),
      fuse_A: ceilToStep(1.25 * batteryCurrent, 1),
      fuse_type: batteryFuseType,
      DC_breaker_A: ceilToStep(1.1 * 1.25 * batteryCurrent, 1),
      DC_breaker_type: selectBreakerType(ceilToStep(1.1 * 1.25 * batteryCurrent, 1), "BAT_DC"),
      poles: selectPoleCount("BAT_DC"),
      SPD_BAT: { type: selectSPDType({ installationEnv: environment.installation_env, highLightningArea: environment.high_lightning_area, side: "BAT" }) },
      battery_cable: { design_current_A: round(1.25 * batteryCurrent), length_m: user.cable_lengths.inverter_to_battery, ...batteryCable },
    },
    AC_output_panel: {
      I_AC_A: round(acCurrent),
      breaker_A: ceilToStep(1.25 * acCurrent, 1),
      breaker_type: selectBreakerType(ceilToStep(1.25 * acCurrent, 1), "AC"),
      poles: selectPoleCount("AC", phase),
      RCD_RCCB: { current_rating_A: ceilToStep(1.25 * acCurrent, 1), sensitivity: "30mA / 100-300mA", type: "Type A default", poles: selectPoleCount("AC", phase) },
      SPD_AC: { type: selectSPDType({ installationEnv: environment.installation_env, highLightningArea: environment.high_lightning_area, side: "AC" }), voltage_rating: phase === "three_phase" ? "440V" : "275V", poles: selectPoleCount("SPD_AC", phase) },
      AC_cable: { design_current_A: round(1.25 * acCurrent), length_m: user.cable_lengths.inverter_to_load, ...acCable },
    },
    panelboard: {
      IP: selectPanelboardIP(environment.installation_env),
      module_estimate: moduleEstimate,
      size: selectPanelboardSize(moduleEstimate),
      environment_rule: environment.installation_env,
    },
    valid: true,
    warnings: [],
  };
}

function orientationFactor(tiltDeg, azimuthDeg) {
  const tiltDiff = Math.abs(toNumber(tiltDeg, 30) - 30);
  const azimuthDiff = Math.abs(toNumber(azimuthDeg, 180) - 180);
  if (tiltDiff <= 10 && azimuthDiff <= 20) return { factor: 1, grade: "optimal" };
  if (tiltDiff <= 20 && azimuthDiff <= 45) return { factor: 0.97, grade: "good" };
  if (tiltDiff <= 35 && azimuthDiff <= 80) return { factor: 0.92, grade: "medium" };
  return { factor: 0.8, grade: "bad" };
}

function runEfficiencyCalculation(input, layout, banks, protection, ledger) {
  const { panel, environment, inverter, battery } = input;
  const soilingMap = { low: 0.98, medium: 0.95, high: 0.9 };
  const PArraySTC = banks.panel.capacity_W || layout.total_array_power_W;
  const fIrr = ledger.use("irradiance_factor", "EfficiencyEngine") ? safeDivide(environment.G_POA, 1000, 1) : 1;
  const orientation = orientationFactor(environment.tilt_deg, environment.azimuth_deg);
  const fOrientation = ledger.use("orientation_factor", "EfficiencyEngine") ? orientation.factor : 1;
  const fIAM = ledger.use("iam_factor", "EfficiencyEngine") ? (orientation.grade === "bad" ? 0.92 : 0.98) : 1;
  const TCell = environment.T_ambient + 25;
  const fTemp = ledger.use("temperature_power_derate", "EfficiencyEngine") ? Math.max(0.65, 1 + panel.gamma_temp_coeff * (TCell - 25)) : 1;
  const fSoiling = ledger.use("soiling_factor", "EfficiencyEngine") ? (soilingMap[environment.soiling_level] || 0.95) : 1;
  const fMismatch = ledger.use("mismatch_factor", "EfficiencyEngine") ? 0.98 : 1;
  const fShading = ledger.use("shading_factor", "EfficiencyEngine") ? Math.max(0, 1 - environment.shading_percent / 100) : 1;

  const PDCReal = PArraySTC * fIrr * fOrientation * fIAM * fTemp * fSoiling * fMismatch * fShading;

  const representativePV = protection.per_MPPT_protection[0]?.PV_cable || { resistance_per_m: 0, length_m: 0 };
  const dcCurrentForLoss = layout.per_MPPT.reduce((sum, item) => sum + Math.max(item.I_array, 0), 0);
  let etaDCCable = 1;
  if (ledger.use("dc_cable_energy_loss", "EfficiencyEngine")) {
    const dcLoss = dcCurrentForLoss ** 2 * representativePV.resistance_per_m * representativePV.length_m;
    etaDCCable = clamp(1 - safeDivide(dcLoss, Math.max(PDCReal, 1), 0), 0.75, 1);
  }

  const PDCIn = PDCReal * etaDCCable;
  const etaBattery = ledger.use("battery_roundtrip_efficiency", "EfficiencyEngine")
    ? battery.eta_battery_charge * battery.eta_battery_discharge
    : 1;
  const PDCAfterBattery = PDCIn * etaBattery;
  const etaInv = ledger.use("inverter_efficiency", "EfficiencyEngine") ? inverter.eta_inv : 1;
  const PACOut = PDCAfterBattery * etaInv;

  const acCable = protection.AC_output_panel.AC_cable || { resistance_per_m: 0, length_m: 0 };
  let etaACCable = 1;
  if (ledger.use("ac_cable_energy_loss", "EfficiencyEngine")) {
    const acCurrent = safeDivide(PACOut, toNumber(inverter.AC?.U_AC, 230), 0);
    const acLoss = acCurrent ** 2 * acCable.resistance_per_m * acCable.length_m;
    etaACCable = clamp(1 - safeDivide(acLoss, Math.max(PACOut, 1), 0), 0.75, 1);
  }

  const PACLoad = PACOut * etaACCable;
  const etaSystemNoBattery = fOrientation * fIAM * fTemp * fSoiling * fMismatch * etaDCCable * etaInv * etaACCable;
  const etaSystemWithBattery = etaSystemNoBattery * etaBattery;
  const HPOADaily = environment.H_POA_daily;
  const productionRawDailyWh = PArraySTC * HPOADaily;
  const productionRealDailyWh = PArraySTC * etaSystemWithBattery * HPOADaily;

  const warnings = [];
  if (environment.soiling_level === "high") warnings.push({ code: "HIGH_SOILING_LOSS", level: "warning", fa: "گردوغبار زیاد باعث افت محسوس راندمان شده است." });
  if (environment.shading_percent >= 10) warnings.push({ code: "HIGH_SHADING_LOSS", level: "warning", fa: "سایه محل نصب زیاد است و باید اصلاح یا MPPT جدا بررسی شود." });
  if (etaDCCable < 0.97) warnings.push({ code: "DC_CABLE_LOSS_HIGH", level: "warning", fa: "افت کابل DC بالا است؛ افزایش سطح مقطع یا کاهش طول کابل بررسی شود." });
  if (etaACCable < 0.97) warnings.push({ code: "AC_CABLE_LOSS_HIGH", level: "warning", fa: "افت کابل AC بالا است؛ افزایش سطح مقطع یا کاهش طول کابل بررسی شود." });

  return {
    stage: "EFFICIENCY_ENERGY_ONCE",
    factors: {
      f_irr: round(fIrr, 4),
      f_orientation: round(fOrientation, 4),
      orientation_grade: orientation.grade,
      f_IAM: round(fIAM, 4),
      f_temp: round(fTemp, 4),
      f_soiling: round(fSoiling, 4),
      f_mismatch: round(fMismatch, 4),
      f_shading: round(fShading, 4),
      eta_DC_cable: round(etaDCCable, 4),
      eta_battery: round(etaBattery, 4),
      eta_inv: round(etaInv, 4),
      eta_AC_cable: round(etaACCable, 4),
    },
    outputs: {
      P_array_STC_W: round(PArraySTC),
      P_DC_real_W: round(PDCReal),
      P_DC_in_W: round(PDCIn),
      P_DC_after_battery_W: round(PDCAfterBattery),
      P_AC_out_W: round(PACOut),
      P_AC_load_W: round(PACLoad),
      eta_system_no_battery: round(etaSystemNoBattery, 4),
      eta_system_with_battery: round(etaSystemWithBattery, 4),
      production_raw_daily_Wh: round(productionRawDailyWh),
      production_real_daily_Wh: round(productionRealDailyWh),
      production_real_monthly_Wh: round(productionRealDailyWh * 30),
    },
    valid: true,
    warnings,
  };
}

function buildSummary(input, layout, banks, protection, efficiency, allWarnings, ledger) {
  const blockingErrors = allWarnings.filter((item) => item.level === "error");
  const finalDesignPower = efficiency.outputs.P_AC_load_W;
  return {
    stage: "SUMMARY_ENGINE",
    route: input.user.route,
    ok: blockingErrors.length === 0,
    canContinue: blockingErrors.length === 0,
    title_fa: routeTitle(input.user.route),
    important_results: {
      panel_power_W: input.panel.P_panel,
      panel_count: banks.panel.count,
      panel_array_power_W: banks.panel.capacity_W,
      effective_power_after_losses_W: efficiency.outputs.P_AC_load_W,
      final_design_power_W: round(finalDesignPower),
      inverter_power_W: banks.inverter.selected.P_inv,
      inverter_count: banks.inverter.count,
      raw_daily_production_Wh: efficiency.outputs.production_raw_daily_Wh,
      real_daily_production_Wh: efficiency.outputs.production_real_daily_Wh,
      default_battery: banks.battery.selected_default.model_name,
      autonomy_days: banks.battery.autonomy_days,
      battery_count_for_autonomy: banks.battery.autonomy_count,
      mppt_count: layout.mppt_count,
    },
    warnings: allWarnings,
    effect_ledger: ledger.list(),
    duplicate_effect_warnings: ledger.warnings(),
    supplemental_rules_applied: SHIL_REMAINING_10_RULES.map((rule) => rule.name),
    ui_rules: {
      hide_protection_and_cable_in_summary: true,
      show_only_titles_results_and_blocking_alerts: true,
      glass_readability_required: true,
    },
  };
}

function routeTitle(route) {
  const map = {
    equipment_list: "چکیده اختصاصی مسیر لیست تجهیزات",
    load_profile: "چکیده اختصاصی مسیر پروفایل مصرف",
    solar_panel_power: "چکیده اختصاصی مسیر توان پنل خورشیدی",
    total_power: "چکیده اختصاصی مسیر توان کل",
    total_current: "چکیده اختصاصی مسیر جریان کل",
    daily_energy: "چکیده اختصاصی مسیر انرژی روزانه",
  };
  return map[route] || "چکیده اختصاصی مسیر پنل خورشیدی";
}

export function runUnifiedSolarCalculation(rawInput = {}) {
  const ledger = createLedger();
  const input = normalizeInput(rawInput);
  const layout = runMPPTLayout(input);
  const banks = selectSmartBanks(input, layout);
  const protection = runProtectionSelection(input, layout, banks);
  const efficiency = runEfficiencyCalculation(input, layout, banks, protection, ledger);
  const warnings = [
    ...layout.warnings,
    ...banks.warnings,
    ...protection.warnings,
    ...efficiency.warnings,
    ...ledger.warnings(),
  ];
  const summary = buildSummary(input, layout, banks, protection, efficiency, warnings, ledger);

  return {
    engine: "Unified SHIL PV Calculation Engine",
    version: PV_ENGINE_VERSION,
    pipeline_order: [
      "INPUT_NORMALIZATION",
      "PV_STRING_MPPT_LAYOUT",
      "SMART_BANK_SELECTION",
      "PROTECTION_SELECTION_ONLY",
      "EFFICIENCY_ENERGY_ONCE",
      "SUMMARY_ENGINE",
    ],
    supplemental_rules_applied: SHIL_REMAINING_10_RULES,
    no_double_count_policy: {
      dc_ac_cable_loss: "Protection selects cable size only; Efficiency applies cable energy loss once.",
      temperature: "Layout uses temperature safety only for Vdc check; Efficiency applies power derate once.",
      inverter_efficiency: "Applied once in EfficiencyEngine.",
      battery_efficiency: "Applied once in EfficiencyEngine for battery-backed paths.",
      orientation_soiling_shading_iam: "Applied once in EfficiencyEngine.",
    },
    input,
    layout,
    banks,
    protection,
    efficiency,
    summary,
    ok: summary.ok,
    canContinue: summary.canContinue,
  };
}

export const calculateUnifiedPV = runUnifiedSolarCalculation;
export default runUnifiedSolarCalculation;
