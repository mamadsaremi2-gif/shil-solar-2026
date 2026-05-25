import { clamp, n, pick, round } from "./math.js";

function orientationFactor(tilt = 30, azimuth = 180) {
  const tiltDelta = Math.abs(n(tilt, 30) - 30);
  const azDelta = Math.abs(n(azimuth, 180) - 180);
  const score = tiltDelta + azDelta / 3;
  if (score <= 10) return { value: 1, class: "optimal" };
  if (score <= 25) return { value: 0.97, class: "good" };
  if (score <= 45) return { value: 0.92, class: "medium" };
  return { value: 0.8, class: "bad" };
}

function cableEta(lossW, baseW) {
  if (!Number.isFinite(lossW) || !Number.isFinite(baseW) || baseW <= 0) return 1;
  return clamp(1 - lossW / baseW, 0.85, 1);
}

export function runEfficiencyEngine(input = {}) {
  const panel = input.panel || {};
  const array = input.array || {};
  const environment = input.environment || {};
  const system = input.system || {};
  const irradiance_daily = input.irradiance_daily || {};
  const scenario = String(input.scenario || input.project?.scenario || input.systemType || "offgrid").toLowerCase();
  const hasBattery = Boolean(input.hasBattery ?? (!["ongrid", "grid", "on-grid"].includes(scenario) && n(pick(system.eta_battery_charge, input.battery?.eta_battery_charge, input.battery?.chargeEfficiency), 0.95) > 0));

  const P_panel = n(pick(panel.P_panel, panel.panelPowerW, panel.powerW), 620);
  const N_panels = n(pick(array.N_panels, array.panelCount), 0);
  const P_array_STC = n(pick(array.P_array_STC, array.P_array), N_panels * P_panel);
  const G_STC = 1000;
  const G_POA = n(pick(environment.G_POA, environment.irradianceWm2), 1000);
  const f_irr = clamp(G_POA / G_STC, 0, 1.3);
  const orientation = orientationFactor(pick(array.tilt_deg, array.tiltDeg, environment.tilt_deg), pick(array.azimuth_deg, array.azimuthDeg, environment.azimuth_deg));
  const f_IAM = orientation.class === "bad" ? 0.92 : 0.98;
  const T_ambient = n(pick(environment.T_ambient, environment.temperatureC, environment.temperatureMaxC), 25);
  const gamma = n(pick(panel.gamma_temp_coeff, panel.gammaTempCoeff, panel.tempCoeffPower), -0.0038);
  const T_cell = T_ambient + 25;
  const f_temp = clamp(1 + gamma * (T_cell - 25), 0.6, 1.05);
  const soilingLevel = environment.soiling_level || environment.soilingLevel || "medium";
  const soilingMap = { low: 0.98, medium: 0.95, high: 0.90 };
  const f_soiling = soilingMap[soilingLevel] || clamp(1 - n(environment.soilingLossPercent, 4) / 100, 0.75, 1);
  const f_mismatch = 0.98;
  const f_shading = clamp(1 - n(pick(array.shading_percent, environment.shading_percent, environment.shadingLossPercent), 0) / 100, 0, 1);
  const P_DC_real = P_array_STC * f_irr * orientation.value * f_IAM * f_temp * f_soiling * f_mismatch * f_shading;
  const Isc_panel = n(pick(panel.Isc_panel, panel.panelIsc, panel.isc), 15);
  const nParallel = n(pick(array.n_parallel, array.parallelCount), 1);
  const dcCurrent = Math.max(0, Isc_panel * nParallel);
  const DC_cable_loss = Math.pow(dcCurrent, 2) * n(pick(system.DC_cable_resistance_per_m, system.dcCableResistancePerM), 0.0008) * n(pick(system.DC_cable_length_m, system.dcCableLengthM), 20);
  const eta_DC_cable = cableEta(DC_cable_loss, P_DC_real);
  const P_DC_in = P_DC_real * eta_DC_cable;
  const eta_battery_charge = n(pick(system.eta_battery_charge, input.battery?.eta_battery_charge, input.battery?.chargeEfficiency), 0.95);
  const eta_battery_discharge = n(pick(system.eta_battery_discharge, input.battery?.eta_battery_discharge, input.battery?.dischargeEfficiency), 0.95);
  const eta_battery = hasBattery ? eta_battery_charge * eta_battery_discharge : 1;
  const P_DC_after_battery = P_DC_in * eta_battery;
  const eta_inv = n(pick(system.eta_inv, system.inverterEfficiency, input.inverter?.efficiency), 0.95);
  const P_AC_out = P_DC_after_battery * eta_inv;
  const acVoltage = n(pick(system.U_AC, system.acVoltage, input.inverter?.outputVoltage), 230);
  const AC_cable_loss = Math.pow(P_AC_out / Math.max(1, acVoltage), 2) * n(pick(system.AC_cable_resistance_per_m, system.acCableResistancePerM), 0.0008) * n(pick(system.AC_cable_length_m, system.acCableLengthM), 20);
  const eta_AC_cable = cableEta(AC_cable_loss, P_AC_out);
  const P_AC_load = P_AC_out * eta_AC_cable;
  const eta_system_no_battery = orientation.value * f_IAM * f_temp * f_soiling * f_mismatch * eta_DC_cable * eta_inv * eta_AC_cable;
  const eta_system_with_battery = eta_system_no_battery * (hasBattery ? eta_battery : 1);
  const H_POA_daily = n(pick(irradiance_daily.H_POA_daily, environment.H_POA_daily, environment.peakSunHours, environment.psh), 5);
  const E_day = P_array_STC * (hasBattery ? eta_system_with_battery : eta_system_no_battery) * H_POA_daily / 1000;
  const E_month = E_day * 30;

  return {
    ok: true,
    engine: "SHIL_Efficiency_Model",
    hasBattery,
    P_array_STC: round(P_array_STC, 2),
    P_DC_real: round(P_DC_real, 2),
    P_DC_in: round(P_DC_in, 2),
    P_DC_after_battery: round(P_DC_after_battery, 2),
    P_AC_out: round(P_AC_out, 2),
    P_AC_load: round(P_AC_load, 2),
    eta_system_no_battery: round(eta_system_no_battery, 4),
    eta_system_with_battery: round(eta_system_with_battery, 4),
    E_day: round(E_day, 2),
    E_month: round(E_month, 2),
    factors: { f_irr: round(f_irr, 4), f_orientation: orientation.value, orientation_class: orientation.class, f_IAM, f_temp: round(f_temp, 4), f_soiling, f_mismatch, f_shading, eta_DC_cable: round(eta_DC_cable, 4), eta_inv, eta_battery: round(eta_battery, 4), eta_AC_cable: round(eta_AC_cable, 4) },
    losses: { DC_cable_loss_W: round(DC_cable_loss, 2), AC_cable_loss_W: round(AC_cable_loss, 2) },
    warnings: [
      !hasBattery && ["offgrid", "hybrid"].includes(scenario) ? "سناریو ذخیره‌ساز دارد اما باتری مؤثر تشخیص داده نشد." : null,
      orientation.class === "bad" ? "زاویه یا جهت پنل باعث افت محسوس راندمان می‌شود." : null,
      f_shading < 0.9 ? "سایه‌اندازی بیش از ۱۰٪ در انرژی نهایی اثرگذار است." : null,
    ].filter(Boolean),
  };
}
