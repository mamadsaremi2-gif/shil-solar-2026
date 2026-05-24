import { runUnifiedSolarCalculation } from "./solarUnifiedCalculationEngine.js";
import { SHIL_LITHIUM_BATTERIES, SHIL_SOLAR_INVERTERS, SHIL_SOLAR_PANELS } from "../data/shilSolarBanks.js";

const n = (value, fallback = 0) => {
  const parsed = Number(String(value ?? "").replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/٫/g, ".").replace(/٬|,/g, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const round = (value, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round(n(value) * factor) / factor;
};

function pickPanel(id) {
  return SHIL_SOLAR_PANELS.find((item) => item.id === id) || SHIL_SOLAR_PANELS.find((item) => item.powerW === 620) || SHIL_SOLAR_PANELS[0] || {};
}

function pickInverter(id, requiredPowerW = 0) {
  const byId = SHIL_SOLAR_INVERTERS.find((item) => item.id === id);
  if (byId) return byId;
  return SHIL_SOLAR_INVERTERS.find((item) => n(item.ratedPowerW) >= requiredPowerW) || SHIL_SOLAR_INVERTERS[SHIL_SOLAR_INVERTERS.length - 1] || SHIL_SOLAR_INVERTERS[0] || {};
}

function pickBattery(id) {
  return SHIL_LITHIUM_BATTERIES.find((item) => item.id === id) || SHIL_LITHIUM_BATTERIES.find((item) => n(item.nominalVoltage) >= 48) || SHIL_LITHIUM_BATTERIES[0] || {};
}


function normalizeUnifiedRoute(route) {
  const key = String(route || '').trim();
  const map = {
    equipment: 'equipment_list',
    equipment_list: 'equipment_list',
    profile: 'load_profile',
    load_profile: 'load_profile',
    solar_panel_power: 'solar_panel_power',
    power: 'total_power',
    total_power: 'total_power',
    current: 'total_current',
    total_current: 'total_current',
    energy: 'daily_energy',
    daily_energy: 'daily_energy',
  };
  return map[key] || key || 'equipment_list';
}

function mapSoiling(environment = {}) {
  const soiling = n(environment.soilingLossPercent ?? environment.totalLossPercent, 4);
  if (soiling >= 10) return "high";
  if (soiling >= 5) return "medium";
  return "low";
}

export function buildUnifiedPvInput({ load = {}, environment = {}, settings = {}, solarPanelPowerInput = {} } = {}) {
  const panel = pickPanel(settings.panelId || solarPanelPowerInput.selectedPanelId);
  const targetFromPanels = n(solarPanelPowerInput.totalPanelPowerW, n(solarPanelPowerInput.panelCount) * n(panel.powerW));
  const targetFromLoad = Math.max(n(load.totalPowerW), n(load.surgePowerW), n(load.recommendedInverterW));
  const targetPower = Math.max(targetFromPanels, targetFromLoad, n(settings.targetPowerW));
  const inverter = pickInverter(settings.inverterId, targetPower * n(settings.reserveFactor, 1.2));
  const battery = pickBattery(settings.batteryId);
  const mpptCount = Math.max(1, n(settings.mpptCountPerInverter, inverter.mpptCount || 1));
  const mpptList = Array.from({ length: mpptCount }, (_, index) => ({
    mppt_id: index + 1,
    V_mppt_min: n(inverter.mpptMinV, 120),
    V_mppt_max: n(inverter.mpptMaxV, 450),
    V_dc_max: n(inverter.maxPvVocV || inverter.maxDcVoltage, 500),
    I_mppt_max: n(inverter.maxPvInputCurrentA, 27),
  }));
  const outputVoltage = n(settings.outputAcVoltage || load.voltageAC || solarPanelPowerInput.acVoltageRoute, inverter.outputVoltage || 230);
  const manualInverterCount = n(settings.inverterCount || solarPanelPowerInput.inverterSplitCount, 0);
  const manualPanelCount = n(settings.panelCount || solarPanelPowerInput.panelCount, 0);
  const psh = n(solarPanelPowerInput.psh || environment.peakSunHours || environment.sunHours, 5);
  const lossPercent = n(solarPanelPowerInput.lossPercent || environment.totalLossPercent, 15);
  const route = normalizeUnifiedRoute(settings.calculationMethod || settings.method || load.method || "equipment");
  return {
    route,
    panel: {
      model_name: panel.title || panel.model,
      P_panel: n(panel.powerW, 550),
      Voc_panel: n(panel.voc, 50),
      Vmp_panel: n(panel.vmp, 42),
      Isc_panel: n(panel.isc, 13),
      Imp_panel: n(panel.imp, 12.8),
      gamma_temp_coeff: n(panel.tempCoeffPower || panel.gamma_temp_coeff, -0.0035),
    },
    inverter: {
      model_name: inverter.title || inverter.model,
      P_inv: n(inverter.ratedPowerW, 6000),
      eta_inv: n(inverter.efficiency, 0.93),
      mppt_count: mpptCount,
      mppt_list: mpptList,
      AC: { U_AC: outputVoltage, cos_phi: n(load.powerFactor || inverter.cosPhi, 0.9), phase: outputVoltage >= 380 ? "three_phase" : "single_phase" },
      battery: { U_bat_nom: n(inverter.dcVoltage || inverter.batteryVoltage, 48) },
    },
    battery: {
      model_name: battery.title,
      U_bat_nom: n(battery.nominalVoltage, 48),
      capacity_Wh: n(battery.energyWh, n(battery.nominalVoltage, 48) * n(battery.capacityAh, 100)),
      eta_battery_charge: Math.sqrt(n(battery.efficiency, 0.94)),
      eta_battery_discharge: Math.sqrt(n(battery.efficiency, 0.94)),
      max_discharge_current: n(battery.maxDischargeCurrentA, 100),
    },
    environment: {
      G_POA: 1000,
      H_POA_daily: psh,
      T_ambient: n(environment.temperatureAvgC || environment.avgTempC || environment.T_ambient, 25),
      T_min: n(environment.temperatureMinC || environment.minTempC || environment.T_min, -5),
      soiling_level: mapSoiling(environment),
      tilt_deg: n(environment.tiltDeg || environment.tilt_deg, 30),
      azimuth_deg: n(environment.azimuthDeg || environment.azimuth_deg, 180),
      shading_percent: n(environment.shadingLossPercent || environment.shading_percent, 0),
      has_partial_shading: n(environment.shadingLossPercent || environment.shading_percent, 0) > 0,
      multi_orientation: Boolean(environment.multiOrientation || environment.multi_orientation),
      installation_env: environment.installationEnv || environment.installation_env || "indoor",
    },
    user: {
      P_target_array: targetFromPanels || targetPower,
      target_power: targetPower,
      daily_energy_Wh: n(load.totalEnergyWh, n(load.totalEnergyKWh) * 1000) || n(solarPanelPowerInput.generatedDailyKWh) * 1000,
      autonomy_days: n(settings.autonomyDays, 0),
      manual_inverter_count: manualInverterCount,
      manual_panel_count: manualPanelCount,
      installation_env: environment.installationEnv || "indoor",
      cable_lengths: {
        PV_to_combiner: n(settings.pvCableLengthM || environment.pvCableLengthM, 15),
        combiner_to_inverter: n(settings.combinerCableLengthM, 10),
        inverter_to_battery: n(settings.batteryCableLengthM, 3),
        inverter_to_load: n(settings.acCableLengthM, 15),
      },
    },
    lossPercent,
  };
}

export function runUnifiedPvForUi(args = {}) {
  const input = buildUnifiedPvInput(args);
  return runUnifiedSolarCalculation(input);
}

export function unifiedPvToLegacyDesign(unified, fallbackDesign = {}) {
  const s = unified?.summary?.important_results || {};
  const bank = unified?.banks || {};
  const eff = unified?.efficiency?.outputs || {};
  const protection = unified?.protection || {};
  const firstMppt = unified?.layout?.per_MPPT?.[0] || {};
  const inverterSelected = bank?.inverter?.selected || {};
  const panelSelected = bank?.panel?.selected || {};
  const batterySelected = bank?.battery?.selected_default || {};
  const warnings = (unified?.summary?.warnings || []).map((item) => item.fa || item.text || String(item));
  return {
    ...fallbackDesign,
    valid: Boolean(unified?.canContinue),
    nextBlockedReason: unified?.canContinue ? "" : (warnings.find(Boolean) || "پیکربندی نیازمند اصلاح است."),
    settings: {
      ...(fallbackDesign.settings || {}),
      autonomyDays: s.autonomy_days || 0,
      reserveFactor: fallbackDesign.settings?.reserveFactor || 1,
      outputAcVoltage: unified?.input?.inverter?.AC?.U_AC || 230,
    },
    design: {
      ...(fallbackDesign.design || {}),
      designPowerW: s.final_design_power_W || eff.P_AC_load_W || 0,
    },
    panel: {
      ...(fallbackDesign.panel || {}),
      id: panelSelected.id || fallbackDesign.panel?.id,
      title: panelSelected.model_name || panelSelected.title || fallbackDesign.panel?.title || "پنل انتخاب‌شده",
      powerW: s.panel_power_W || panelSelected.P_panel || fallbackDesign.panel?.powerW || 0,
    },
    inverter: {
      ...(fallbackDesign.inverter || {}),
      id: inverterSelected.id || fallbackDesign.inverter?.id,
      title: inverterSelected.model_name || inverterSelected.title || fallbackDesign.inverter?.title || "اینورتر انتخاب‌شده",
      ratedPowerW: s.inverter_power_W || inverterSelected.P_inv || fallbackDesign.inverter?.ratedPowerW || 0,
      count: s.inverter_count || bank?.inverter?.count || 1,
      dcVoltage: inverterSelected?.battery?.U_bat_nom || fallbackDesign.inverter?.dcVoltage || 48,
    },
    battery: {
      ...(fallbackDesign.battery || {}),
      battery: {
        ...(fallbackDesign.battery?.battery || {}),
        id: batterySelected.id || fallbackDesign.battery?.battery?.id,
        title: s.default_battery || batterySelected.model_name || fallbackDesign.battery?.battery?.title || "باتری انتخاب‌شده",
        nominalVoltage: batterySelected.U_bat_nom || fallbackDesign.battery?.battery?.nominalVoltage || 48,
        capacityAh: fallbackDesign.battery?.battery?.capacityAh || Math.round(n(batterySelected.capacity_Wh, 4800) / Math.max(1, n(batterySelected.U_bat_nom, 48))),
      },
      totalCount: s.battery_count_for_autonomy || bank?.battery?.autonomy_count || 0,
      unitVoltageV: batterySelected.U_bat_nom || 48,
      unitEnergyKWh: round(n(batterySelected.capacity_Wh, 0) / 1000, 2),
      grossEnergyWh: n(batterySelected.capacity_Wh, 0) * n(s.battery_count_for_autonomy, 0),
      grossEnergyKWh: round(n(batterySelected.capacity_Wh, 0) * n(s.battery_count_for_autonomy, 0) / 1000, 2),
    },
    pvArray: {
      ...(fallbackDesign.pvArray || {}),
      panelCount: s.panel_count || bank?.panel?.count || 0,
      arrayPowerW: s.panel_array_power_W || bank?.panel?.capacity_W || 0,
      seriesCount: firstMppt.n_series || fallbackDesign.pvArray?.seriesCount || 0,
      parallelCount: firstMppt.n_parallel || fallbackDesign.pvArray?.parallelCount || 0,
    },
    inverterTopology: {
      ...(fallbackDesign.inverterTopology || {}),
      inverterCount: s.inverter_count || 1,
      totalMppt: s.mppt_count || unified?.layout?.mppt_count || 1,
      mpptPerInverter: unified?.input?.inverter?.mppt_count || 1,
      panelDistribution: unified?.layout?.per_MPPT?.map((item) => item.N_panels) || [],
      pvPowerPerInverterKW: round((s.panel_array_power_W || 0) / Math.max(1, s.inverter_count || 1) / 1000, 2),
      panelsPerInverter: Math.ceil((s.panel_count || 0) / Math.max(1, s.inverter_count || 1)),
      stringsPerMppt: firstMppt.n_parallel || 0,
      mpptCurrentA: firstMppt.I_array || 0,
      rows: unified?.layout?.per_MPPT?.map((item, index) => ({ inverterNo: index + 1, panelsApprox: item.N_panels, pvPowerKW: round(item.P_array / 1000, 2), mpptCount: 1, stringsApprox: item.n_parallel || 0 })) || [],
      notes: unified?.layout?.per_MPPT?.map((item) => item.reason_fa).filter(Boolean) || [],
    },
    protection: {
      ...(fallbackDesign.protection || {}),
      dcBreakerA: protection?.per_MPPT_protection?.[0]?.DC_breaker?.current_rating_A || fallbackDesign.protection?.dcBreakerA || "-",
      acBreakerA: protection?.AC_output_panel?.breaker_A || fallbackDesign.protection?.acBreakerA || "-",
      dcCable: protection?.battery_block?.battery_cable?.area_mm2 ? `${protection.battery_block.battery_cable.area_mm2}mm²` : fallbackDesign.protection?.dcCable,
      pvCable: protection?.per_MPPT_protection?.[0]?.PV_cable?.area_mm2 ? `${protection.per_MPPT_protection[0].PV_cable.area_mm2}mm²` : fallbackDesign.protection?.pvCable,
      batteryCable: protection?.battery_block?.battery_cable?.area_mm2 ? `${protection.battery_block.battery_cable.area_mm2}mm²` : fallbackDesign.protection?.batteryCable,
      acCable: protection?.AC_output_panel?.AC_cable?.area_mm2 ? `${protection.AC_output_panel.AC_cable.area_mm2}mm²` : fallbackDesign.protection?.acCable,
    },
    solarSizing: {
      ...(fallbackDesign.solarSizing || {}),
      pArrayKW: round((s.panel_array_power_W || 0) / 1000, 2),
      ePvDailyKWh: round((s.real_daily_production_Wh || 0) / 1000, 2),
    },
    unifiedPvEngine: unified,
    warnings,
    explanations: ["نتایج این صفحه از موتور یکپارچه PV و بدون اعمال دوباره ضرایب تولید شده‌اند."],
  };
}
