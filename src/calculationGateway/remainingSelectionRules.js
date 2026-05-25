import { n } from "./math.js";

export const SHIL_REMAINING_SELECTION_RULES = {
  DC_Voltage_Level_Selection: {
    if_Vstring_lte_550: "600VDC",
    if_Vstring_lte_900: "1000VDC",
    if_Vstring_lte_1200: "1500VDC",
  },
  Breaker_Type_Selection: {
    if_current_lte_63A: "MCB",
    if_current_gt_63A: "MCCB",
    DC_circuit: "DC Breaker or DC Isolator",
    AC_circuit: "MCB/MCCB + RCD",
  },
  Pole_Count_Selection: {
    PV_DC: "2P or 4P",
    AC_single_phase: "1P+N",
    AC_three_phase: "3P+N",
    SPD: "2P or 4P",
    isolator: "must_disconnect_all_poles",
  },
  Panelboard_Size_Selection: {
    if_modules_lte_12: "12M",
    if_modules_lte_24: "24M",
    if_modules_lte_36: "36M",
    if_modules_lte_54: "54M",
    else: "Industrial_Panel",
  },
  Panelboard_IP_Selection: {
    indoor: "IP40",
    outdoor: "IP54",
    roof: "IP65",
    corrosive: "IP65 + anti_corrosion",
    industrial: "IP55 or IP65",
  },
  Cable_Voltage_Drop_Rule: {
    PV_DC: "1.5% - 3%",
    Battery_DC: "1% - 2%",
    AC: "2% - 3%",
    if_length_high: "increase_cable_size",
    if_current_high: "parallel_cables_allowed",
  },
  SPD_Type_Selection: {
    roof: "Type I+II",
    high_lightning_area: "Type I",
    normal_building: "Type II",
    AC_side: "Type II",
    battery_side: "Type II",
  },
  Battery_Fuse_Type_Selection: {
    high_voltage_battery: "NH",
    system_48V: "MEGA or ANL",
    industrial_system: "NH gPV",
    small_system: "DC_cartridge_fuse",
  },
  Multi_MPPT_Management: {
    different_orientations: "assign_to_separate_MPPT",
    different_shading: "assign_to_separate_MPPT",
    balance_power_between_MPPTs: true,
    warn_if_MPPT_empty: true,
    no_mixing_conditions_in_one_MPPT: true,
  },
  Panel_Layout_Space_Constraint: {
    if_space_small: "increase_series_reduce_parallel",
    if_space_large: "increase_parallel",
    if_distance_long: "prefer_more_series",
    if_distance_short: "parallel_allowed",
  },
};

export function selectDcVoltageLevel(vString = 0) {
  const v = n(vString, 0);
  if (v <= 550) return "600VDC";
  if (v <= 900) return "1000VDC";
  return "1500VDC";
}

export function selectBreakerType(currentA = 0, circuit = "AC") {
  if (String(circuit).toUpperCase().includes("DC")) return n(currentA, 0) <= 63 ? "DC Breaker" : "DC MCCB";
  return n(currentA, 0) <= 63 ? "MCB" : "MCCB";
}

export function selectPanelboardSize(moduleCount = 0) {
  const m = n(moduleCount, 0);
  if (m <= 12) return "12M";
  if (m <= 24) return "24M";
  if (m <= 36) return "36M";
  if (m <= 54) return "54M";
  return "Industrial_Panel";
}

export function selectPanelboardIP(env = "indoor") {
  const key = String(env || "indoor");
  return SHIL_REMAINING_SELECTION_RULES.Panelboard_IP_Selection[key] || "IP54";
}

export function selectSpdType({ installationEnv = "indoor", highLightningArea = false } = {}) {
  if (highLightningArea) return "Type I";
  if (["roof", "corrosive", "outdoor"].includes(installationEnv)) return "Type I+II";
  return "Type II";
}

export function selectBatteryFuseType({ voltage = 48, industrial = false } = {}) {
  if (industrial) return "NH gPV";
  if (n(voltage, 48) >= 120) return "NH";
  if (n(voltage, 48) === 48) return "MEGA or ANL";
  return "DC_cartridge_fuse";
}
