import { ceilTo, n, pick, round } from "./math.js";
import { selectBatteryFuseType, selectBreakerType, selectDcVoltageLevel, selectPanelboardIP, selectPanelboardSize, selectSpdType } from "./remainingSelectionRules.js";

function chooseCable({ currentA = 0, lengthM = 0, circuit = "PV_DC" } = {}) {
  const c = n(currentA, 0);
  const l = n(lengthM, 0);
  const dropTarget = circuit === "Battery_DC" ? "<2%" : circuit === "AC" ? "<3%" : "<3%";
  let size = 4;
  if (c > 20) size = 6;
  if (c > 32) size = 10;
  if (c > 50) size = 16;
  if (c > 80) size = 25;
  if (c > 125) size = 35;
  if (c > 160) size = 50;
  if (l > 35) size = Math.max(size, size === 4 ? 6 : size === 6 ? 10 : size + 10);
  return { sizeMm2: size, label: `${size}mm² Cu`, design_current_A: round(c, 2), length_m: l, voltage_drop_rule: dropTarget };
}

export function runProtectionEngine(input = {}) {
  const mpptSystem = input.mpptSystem || {};
  const layout = input.layout || mpptSystem.per_MPPT_panels?.[0]?.layout || {};
  const inverter = input.inverter || {};
  const battery = input.battery || {};
  const user = input.user || {};
  const lengths = user.cable_lengths || input.cable_lengths || input.cable || {};
  const installationEnv = user.installation_env || input.installation_env || input.environment?.installation_env || "indoor";
  const U_AC = n(pick(inverter.AC?.U_AC, inverter.outputVoltage, inverter.U_AC, input.system?.U_AC), 230);
  const cos_phi = n(pick(inverter.AC?.cos_phi, inverter.cos_phi, input.system?.cos_phi), 0.9);
  const P_inv = n(pick(inverter.BAT?.P_inv, inverter.battery?.P_inv, inverter.ratedPowerW, inverter.P_inv, input.system?.P_inv), Math.max(3000, n(layout.P_array, 0)));
  const U_bat_nom = n(pick(inverter.BAT?.U_bat_nom, inverter.battery?.U_bat_nom, battery.U_bat_nom, battery.nominalVoltage), 48);
  const invEff = n(pick(inverter.efficiency, input.system?.eta_inv), 0.95);
  const phase = U_AC >= 380 ? "three_phase" : "single_phase";

  const perMppt = (mpptSystem.per_MPPT_panels?.length ? mpptSystem.per_MPPT_panels : [{ mppt_id: 1, layout }]).map((item) => {
    const l = item.layout || item;
    const I_string = n(l.raw?.Imp_panel, n(l.I_array, 0));
    const I_PV_out = n(l.I_array || item.I_PV_out, 0);
    const V_PV_oc = n(l.V_oc_cold || item.V_PV_oc, 0);
    const dcVoltageLevel = l.dcVoltageLevel || selectDcVoltageLevel(V_PV_oc);
    const dcBreakerA = ceilTo(1.25 * I_PV_out, I_PV_out > 63 ? 10 : 1);
    return {
      mppt_id: item.mppt_id || 1,
      string_fuses: { count: n(l.n_parallel, 1), current_rating_A: ceilTo(1.25 * I_string, 1), type: "gPV", voltage_rating: dcVoltageLevel },
      DC_breaker: { current_rating_A: dcBreakerA, type: selectBreakerType(dcBreakerA, "DC"), voltage_rating: dcVoltageLevel, poles: "2P or 4P" },
      SPD_DC: { type: selectSpdType({ installationEnv }), voltage_rating: dcVoltageLevel, poles: 2 },
      DC_isolator: { current_rating_A: dcBreakerA, poles: "2P or 4P" },
      PV_cable: chooseCable({ currentA: 1.25 * I_PV_out, lengthM: pick(lengths.PV_to_combiner, lengths.PVToCombiner, lengths.lengthM, 20), circuit: "PV_DC" }),
      electrical: { I_PV_out: round(I_PV_out, 2), V_PV_oc: round(V_PV_oc, 2), P_array: n(l.P_array, 0) },
    };
  });

  const I_bat = U_bat_nom > 0 ? P_inv / (U_bat_nom * invEff) : 0;
  const batFuseA = ceilTo(1.25 * I_bat, I_bat > 63 ? 10 : 1);
  const I_AC = phase === "three_phase" ? P_inv / (1.732 * U_AC * cos_phi) : P_inv / (U_AC * cos_phi);
  const acBreakerA = ceilTo(1.25 * I_AC, I_AC > 63 ? 10 : 1);
  const moduleUnits = {
    string_fuse: perMppt.reduce((sum, item) => sum + n(item.string_fuses.count, 0), 0),
    DC_breaker: perMppt.length * 2,
    SPD: perMppt.length * 2,
    isolator: perMppt.length * 2,
    MCB: acBreakerA <= 63 ? 2 : 0,
    MCCB: acBreakerA > 63 ? 4 : 0,
    RCD: 2,
  };
  const moduleCount = Object.values(moduleUnits).reduce((sum, value) => sum + n(value, 0), 0);

  return {
    ok: true,
    engine: "SHIL_Protection_Engine",
    per_MPPT_protection: perMppt,
    PV_combiner_panel: {
      string_fuses: `${moduleUnits.string_fuse} عدد gPV`,
      DC_breakers: `${perMppt.length} عدد`,
      SPD_DC: `${perMppt.length} عدد ${selectSpdType({ installationEnv })}`,
      DC_isolators: `${perMppt.length} عدد`,
      cables: perMppt.map((item) => item.PV_cable),
      panel_size: selectPanelboardSize(moduleCount),
      panel_IP: selectPanelboardIP(installationEnv),
      module_count: moduleCount,
    },
    Battery_DC_block: {
      I_bat: round(I_bat, 2),
      fuse: { current_rating_A: batFuseA, type: selectBatteryFuseType({ voltage: U_bat_nom, industrial: installationEnv === "industrial" }), voltage_rating: `>= ${U_bat_nom}V` },
      DC_breaker: { current_rating_A: ceilTo(1.1 * batFuseA, 1), poles: 2 },
      isolator: { current_rating_A: ceilTo(1.1 * batFuseA, 1), poles: 2 },
      cable: chooseCable({ currentA: 1.25 * I_bat, lengthM: pick(lengths.inverter_to_battery, lengths.inverterToBattery, 5), circuit: "Battery_DC" }),
    },
    AC_output_panel: {
      I_AC: round(I_AC, 2),
      MCB_MCCB: { current_rating_A: acBreakerA, type: selectBreakerType(acBreakerA, "AC"), poles: phase === "three_phase" ? "3P+N" : "1P+N" },
      RCD_RCCB: { current_rating_A: acBreakerA, sensitivity: "30mA (final) | 100-300mA (main)", type: "Type A or Type B" },
      SPD_AC: { type: selectSpdType({ installationEnv: "normal_building" }), voltage_rating: phase === "three_phase" ? "440V" : "275V" },
      AC_isolator: { current_rating_A: acBreakerA, poles: phase === "three_phase" ? "4P" : "2P" },
      cable: chooseCable({ currentA: 1.25 * I_AC, lengthM: pick(lengths.inverter_to_load, lengths.inverterToLoad, 20), circuit: "AC" }),
    },
    cable_schedule: [
      ...perMppt.map((item) => ({ circuit: `PV MPPT ${item.mppt_id}`, ...item.PV_cable })),
      { circuit: "Battery DC", ...chooseCable({ currentA: 1.25 * I_bat, lengthM: pick(lengths.inverter_to_battery, lengths.inverterToBattery, 5), circuit: "Battery_DC" }) },
      { circuit: "AC Output", ...chooseCable({ currentA: 1.25 * I_AC, lengthM: pick(lengths.inverter_to_load, lengths.inverterToLoad, 20), circuit: "AC" }) },
    ],
    panel_sizes: { module_count: moduleCount, size: selectPanelboardSize(moduleCount), IP: selectPanelboardIP(installationEnv) },
    warnings: [],
  };
}
