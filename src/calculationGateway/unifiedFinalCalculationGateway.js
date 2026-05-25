import { runMultiMpptSystem } from "./multiMpptSystemEngine.js";
import { runPvStringLayoutRule } from "./pvStringLayoutRuleEngine.js";
import { runProtectionEngine } from "./protectionEngine.js";
import { runEfficiencyEngine } from "./efficiencyEngine.js";
import { n, pick, round } from "./math.js";

function normalizeFinalInput(form = {}, options = {}) {
  const project = form.project || {};
  const pv = form.pv || form.panel || {};
  const inverter = form.inverter || {};
  const battery = form.battery || {};
  const environment = form.environment || {};
  const settings = form.settings || form.system || {};
  const scenario = String(pick(project.scenario, form.scenario, settings.systemType, options.domain === "pv" ? "solar" : options.domain, "offgrid"));
  const dailyEnergyWh = n(pick(project.dailyEnergyWh, form.load?.totalEnergyWh, form.manualEnergyWh, form.dailyEnergyWh), 5000);
  const peakLoadW = n(pick(project.peakLoadW, form.load?.totalPowerW, form.manualPowerW, form.peakLoadW), 2500);
  const panelPowerW = n(pick(pv.panelPowerW, pv.P_panel, pv.powerW, form.solarPanelPowerInput?.panelPowerW), 620);
  const requestedPanelCount = n(pick(pv.panelCount, pv.N_panel, form.solarPanelPowerInput?.panelCount), 0);
  const targetPowerW = requestedPanelCount > 0 ? requestedPanelCount * panelPowerW : Math.max(peakLoadW * 1.25, dailyEnergyWh / Math.max(1, n(pick(environment.peakSunHours, environment.psh), 5)) * 1.35);
  return {
    project: { ...project, scenario, dailyEnergyWh, peakLoadW },
    panel: {
      P_panel: panelPowerW,
      Voc_panel: n(pick(pv.panelVoc, pv.Voc_panel, pv.Voc, pv.voc), 50.9),
      Vmp_panel: n(pick(pv.panelVmp, pv.Vmp_panel, pv.Vmp, pv.vmp), 42.6),
      Isc_panel: n(pick(pv.panelIsc, pv.Isc_panel, pv.Isc, pv.isc), 15),
      Imp_panel: n(pick(pv.panelImp, pv.Imp_panel, pv.Imp, pv.imp), 14.56),
      gamma_temp_coeff: n(pick(pv.gamma_temp_coeff, pv.tempCoeffPower, pv.gammaTempCoeff), -0.0038),
      title: pv.panelTitle || pv.title || `${panelPowerW}W PV Panel`,
    },
    inverter: {
      ...inverter,
      model_name: inverter.model_name || inverter.modelName || inverter.title || "SHIL Inverter",
      mppt_count: n(pick(inverter.mppt_count, inverter.mpptCount, settings.mpptCountPerInverter), 1),
      mppt_list: inverter.mppt_list,
      V_mppt_min: n(pick(inverter.V_mppt_min, inverter.mpptMinVoltage), 120),
      V_mppt_max: n(pick(inverter.V_mppt_max, inverter.mpptMaxVoltage), 450),
      V_dc_max: n(pick(inverter.V_dc_max, inverter.maxDcVoltage), 500),
      I_mppt_max: n(pick(inverter.I_mppt_max, inverter.maxInputCurrent), 18),
      ratedPowerW: n(pick(inverter.ratedPowerW, inverter.P_inv, inverter.powerW), Math.max(3000, peakLoadW * 1.25)),
      efficiency: n(pick(inverter.efficiency, settings.eta_inv), 0.95),
      outputVoltage: n(pick(inverter.outputVoltage, inverter.U_AC, settings.U_AC), 230),
      AC: { U_AC: n(pick(inverter.AC?.U_AC, inverter.outputVoltage, settings.U_AC), 230), cos_phi: n(pick(inverter.AC?.cos_phi, inverter.cos_phi, settings.cos_phi), 0.9) },
      BAT: { U_bat_nom: n(pick(inverter.BAT?.U_bat_nom, battery.nominalVoltage, battery.U_bat_nom), 48), P_inv: n(pick(inverter.BAT?.P_inv, inverter.ratedPowerW, inverter.P_inv), Math.max(3000, peakLoadW * 1.25)) },
    },
    battery: {
      ...battery,
      nominalVoltage: n(pick(battery.nominalVoltage, battery.U_bat_nom), 48),
      eta_battery_charge: n(pick(battery.eta_battery_charge, battery.chargeEfficiency), 0.95),
      eta_battery_discharge: n(pick(battery.eta_battery_discharge, battery.dischargeEfficiency, battery.roundTripEfficiency), 0.95),
      autonomyDays: n(pick(project.autonomyDays, battery.autonomyDays, settings.autonomyDays), 0),
    },
    environment: {
      ...environment,
      peakSunHours: n(pick(environment.peakSunHours, environment.psh, environment.H_POA_daily), 5),
      T_ambient: n(pick(environment.T_ambient, environment.temperatureC, environment.temperatureMaxC), 25),
      G_POA: n(pick(environment.G_POA, environment.irradianceWm2), 1000),
      soiling_level: environment.soiling_level || environment.soilingLevel || "medium",
      shading_percent: n(pick(environment.shading_percent, environment.shadingLossPercent), 0),
      has_partial_shading: n(pick(environment.shading_percent, environment.shadingLossPercent), 0) > 0,
      multi_orientation: Boolean(environment.multi_orientation || environment.multiOrientation),
    },
    user: {
      target_power: targetPowerW,
      P_target_array: targetPowerW,
      installation_env: form.installation_env || environment.installation_env || "indoor",
      cable_lengths: {
        PV_to_combiner: n(pick(form.cable?.PV_to_combiner, form.cable?.pvToCombiner, form.cable?.lengthM), 20),
        combiner_to_inverter: n(pick(form.cable?.combiner_to_inverter, form.cable?.combinerToInverter), 20),
        inverter_to_battery: n(pick(form.cable?.inverter_to_battery, form.cable?.inverterToBattery), 5),
        inverter_to_load: n(pick(form.cable?.inverter_to_load, form.cable?.inverterToLoad), 20),
      },
    },
    settings,
  };
}

function buildLegacySolarDesign(input, mpptSystem, protection, efficiency) {
  const first = mpptSystem.per_MPPT_panels?.[0]?.layout || {};
  const panelCount = mpptSystem.totals.N_panels || first.N_panels || 0;
  const batteryNeeded = input.battery.autonomyDays > 0 && !String(input.project.scenario).includes("ongrid");
  const batteryWh = input.project.dailyEnergyWh * Math.max(0, input.battery.autonomyDays || 0) / 0.85;
  const batteryUnitWh = input.battery.nominalVoltage * n(input.battery.capacityAh, 100);
  const batteryCount = batteryNeeded ? Math.max(1, Math.ceil(batteryWh / Math.max(1, batteryUnitWh))) : 0;
  return {
    valid: mpptSystem.ok,
    panel: { title: input.panel.title, powerW: input.panel.P_panel },
    pvArray: { panelCount, arrayPowerW: mpptSystem.totals.P_array, seriesCount: first.n_series, parallelCount: first.n_parallel },
    inverter: { title: input.inverter.model_name, count: 1, ratedPowerW: input.inverter.ratedPowerW, dcVoltage: input.inverter.BAT.U_bat_nom },
    inverterTopology: { mpptPerInverter: input.inverter.mppt_count, panelDistribution: mpptSystem.per_MPPT_panels.map((item) => item.layout.N_panels) },
    battery: { totalCount: batteryCount, count: batteryCount, battery: { nominalVoltage: input.battery.nominalVoltage, capacityAh: n(input.battery.capacityAh, 100) }, unitVoltageV: input.battery.nominalVoltage, unitCapacityAh: n(input.battery.capacityAh, 100), grossEnergyWh: round(batteryCount * batteryUnitWh, 0), grossEnergyKWh: round(batteryCount * batteryUnitWh / 1000, 2), seriesCount: 1, parallelCount: batteryCount, bankVoltageV: input.battery.nominalVoltage, bankCurrentAh: n(input.battery.capacityAh, 100) * batteryCount },
    protection: { dcBreakerA: protection.per_MPPT_protection?.[0]?.DC_breaker?.current_rating_A, acBreakerA: protection.AC_output_panel?.MCB_MCCB?.current_rating_A, dcCable: protection.per_MPPT_protection?.[0]?.PV_cable?.label, pvCable: protection.per_MPPT_protection?.[0]?.PV_cable?.label, batteryCable: protection.Battery_DC_block?.cable?.label, report: ["PV، باتری و AC با زنجیره نهایی SHIL طراحی شدند."] },
    space: { maintenanceAreaM2: round(panelCount * 2.3, 1), note: "برآورد فضای نصب بر اساس تعداد پنل نهایی" },
    panelPowerAnalysis: { array: { rawDailyEnergyKWh: round((mpptSystem.totals.P_array / 1000) * input.environment.peakSunHours, 2), dailyEnergyKWh: efficiency.E_day } },
    solarSizing: { ePvDailyKWh: efficiency.E_day },
    settings: { systemType: input.project.scenario, autonomyDays: input.battery.autonomyDays, reserveFactor: 1.25 },
    explanations: ["محاسبات واقعی فقط در Gateway نهایی و به صورت زنجیره‌ای انجام شد.", "چیدمان، حفاظت و راندمان به ترتیب اجرا شدند و تلفات دوبار اعمال نشدند."],
  };
}

export function runFinalCalculationGateway(form = {}, options = {}) {
  const input = normalizeFinalInput(form, options);
  const layout = runPvStringLayoutRule({ panel: input.panel, mppt: input.inverter, site: input.environment, user: input.user });
  const mpptSystem = runMultiMpptSystem({ panel: input.panel, inverter: input.inverter, environment: input.environment, site: input.environment, user: input.user, targetPowerW: input.user.target_power });
  const protection = runProtectionEngine({ layout, mpptSystem, inverter: input.inverter, battery: input.battery, user: input.user, environment: input.environment });
  const efficiency = runEfficiencyEngine({
    panel: input.panel,
    array: { N_panels: mpptSystem.totals.N_panels, P_array: mpptSystem.totals.P_array, n_parallel: layout.n_parallel, tilt_deg: input.environment.tilt_deg, azimuth_deg: input.environment.azimuth_deg, shading_percent: input.environment.shading_percent },
    environment: input.environment,
    system: { eta_inv: input.inverter.efficiency, eta_battery_charge: input.battery.eta_battery_charge, eta_battery_discharge: input.battery.eta_battery_discharge, DC_cable_length_m: input.user.cable_lengths.combiner_to_inverter, AC_cable_length_m: input.user.cable_lengths.inverter_to_load, U_AC: input.inverter.outputVoltage },
    irradiance_daily: { H_POA_daily: input.environment.peakSunHours },
    inverter: input.inverter,
    battery: input.battery,
    scenario: input.project.scenario,
    hasBattery: input.battery.autonomyDays > 0 && !String(input.project.scenario).includes("ongrid"),
  });
  const warnings = [...(layout.warnings || []), ...(mpptSystem.warnings || []), ...(protection.warnings || []), ...(efficiency.warnings || [])];
  const valid = layout.ok && mpptSystem.ok;
  const solarDesign = buildLegacySolarDesign(input, mpptSystem, protection, efficiency);
  return {
    status: valid ? "ready" : "blocked",
    valid,
    canContinue: valid,
    engine: "SHIL_Unified_Final_Calculation_Gateway",
    execution_order: ["PV_String_Layout_Selection", "SHIL_Inverter_MPPT_System", "SHIL_Protection_Engine", "SHIL_Efficiency_Model", "Final_Report_Builder"],
    anti_duplication: {
      cable_loss: "حفاظت فقط سایز کابل را انتخاب می‌کند؛ راندمان فقط اثر انرژی کابل را محاسبه می‌کند.",
      temperature: "چیدمان فقط Voc/Vdc را کنترل می‌کند؛ راندمان فقط افت توان دمایی را اعمال می‌کند.",
      battery: "باتری فقط در سناریوی دارای ذخیره‌ساز روی انرژی اعمال می‌شود.",
    },
    input,
    layout,
    mpptSystem,
    protection,
    efficiency,
    solarDesign,
    result: {
      arrayPowerW: mpptSystem.totals.P_array,
      dailyEnergyKWh: efficiency.E_day,
      monthlyEnergyKWh: efficiency.E_month,
      panelCount: mpptSystem.totals.N_panels,
      systemEta: efficiency.hasBattery ? efficiency.eta_system_with_battery : efficiency.eta_system_no_battery,
    },
    summary: {
      important_results: {
        panel_count: mpptSystem.totals.N_panels,
        array_power_W: mpptSystem.totals.P_array,
        daily_energy_kWh: efficiency.E_day,
        monthly_energy_kWh: efficiency.E_month,
        connection_type: layout.connection_type,
        combiner_panel: protection.PV_combiner_panel?.panel_size,
      },
      warnings: warnings.map((text) => ({ fa: text, text })),
    },
    warnings,
    explanations: [
      "چیدمان PV و MPPT ابتدا محاسبه شد و خروجی آن ورودی حفاظت و راندمان شد.",
      "حفاظت، کابل و تابلو فقط از جریان و ولتاژ مرحله قبل استفاده کردند و تلفات انرژی را دوباره ضرب نکردند.",
      "راندمان نهایی با زاویه، دما، گردوغبار، سایه، کابل، اینورتر و در صورت نیاز باتری محاسبه شد.",
    ],
  };
}
