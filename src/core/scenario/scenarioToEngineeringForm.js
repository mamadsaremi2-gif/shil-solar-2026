import { createEngineeringForm } from "../../contracts/engineeringFormContract.js";

export function scenarioToEngineeringForm(scenario, environment = {}, equipment = {}) {
  const domain = scenario?.domain || "solar";
  const isSolar = domain === "solar";
  const peakLoadW = Number(scenario?.loadEstimate || equipment?.totalPowerW || 1000);
  const dailyEnergyWh = Number(scenario?.dailyEnergyWh || equipment?.totalDailyWh || peakLoadW * 5);
  const batteryAh = Number(scenario?.suggestedBatteryAh || Math.ceil((dailyEnergyWh / 48 / 0.8) / 50) * 50);
  const inverterRatedW = Number(scenario?.inverterRatedW || Math.ceil((peakLoadW * 1.3) / 500) * 500);

  return createEngineeringForm({
    source: "ready-scenario",
    designDomain: domain,
    project: {
      title: scenario?.title || "Ø³Ù†Ø§Ø±ÛŒÙˆÛŒ Ø¢Ù…Ø§Ø¯Ù‡ SHIL",
      scenario: isSolar ? "offgrid" : "emergency",
      location: [environment?.province, environment?.city, environment?.address].filter(Boolean).join(" - "),
      dailyEnergyWh,
      peakLoadW,
      autonomyDays: Number(scenario?.autonomyDays || (isSolar ? 1 : 2)),
      readyScenario: {
        id: scenario?.id,
        domain,
        level: scenario?.levelKey,
        title: scenario?.title,
        calculationEngine: scenario?.calculationEngine || domain,
      },
    },
    environment: {
      peakSunHours: Number(environment?.peakSunHours ?? scenario?.defaultEnvironment?.peakSunHours ?? (isSolar ? 5 : 0)),
      irradianceLossPercent: isSolar ? 3 : 0,
      soilingLossPercent: isSolar ? Number(environment?.soilingLossPercent ?? 3) : 0,
      shadingLossPercent: isSolar ? 0 : 0,
      city: environment?.city || "",
      province: environment?.province || "",
      temperatureMinC: Number(environment?.temperatureMinC ?? scenario?.defaultEnvironment?.temperatureMinC ?? -5),
      temperatureMaxC: Number(environment?.temperatureMaxC ?? scenario?.defaultEnvironment?.temperatureMaxC ?? 45),
      temperatureAverageC: Number(environment?.temperatureAverageC ?? 25),
      altitude: Number(environment?.altitude ?? 0),
      humidity: Number(environment?.humidity ?? 0),
      latitude: environment?.latitude ?? null,
      longitude: environment?.longitude ?? null,
      installType: environment?.installType || "urban",
      installTypeLabel: environment?.installTypeLabel || "Ø´Ù‡Ø±ÛŒ",
      recommendedTiltDeg: Number(environment?.engineeringAssessment?.recommendedTiltDeg ?? 0),
      recommendedAzimuthDeg: Number(environment?.engineeringAssessment?.recommendedAzimuthDeg ?? 180),
      thermalDeratePercent: Number(environment?.engineeringAssessment?.thermalDeratePercent ?? 0),
      corrosionRisk: environment?.engineeringAssessment?.corrosionRisk || "low",
      recommendedIngressProtection: environment?.engineeringAssessment?.recommendedIngressProtection || "IP54",
      needsAntiCorrosion: Boolean(environment?.engineeringAssessment?.needsAntiCorrosion),
      compassAttachment: environment?.compassAttachment || null,
      siteAttachment: environment?.siteAttachment || null,
      engineeringAssessment: environment?.engineeringAssessment || null,
    },
    pv: {
      panelPowerW: isSolar ? 585 : 0,
      panelVoc: isSolar ? 49 : 0,
      panelVmp: isSolar ? 41 : 0,
      panelIsc: isSolar ? 14 : 0,
      panelImp: isSolar ? 13 : 0,
      seriesCount: isSolar ? 2 : 1,
      parallelCount: isSolar ? Math.max(1, Math.ceil((scenario?.suggestedPanels || 2) / 2)) : 1,
      dcBusVoltage: 48,
      temperatureMinC: Number(environment?.temperatureMinC ?? -5),
      temperatureMaxC: Number(environment?.temperatureMaxC ?? 45),
      recommendedTiltDeg: Number(environment?.engineeringAssessment?.recommendedTiltDeg ?? 32),
      recommendedAzimuthDeg: Number(environment?.engineeringAssessment?.recommendedAzimuthDeg ?? 180),
      thermalDeratePercent: Number(environment?.engineeringAssessment?.thermalDeratePercent ?? 0),
      tempCoeffVocPercentPerC: -0.28,
    },
    battery: {
      nominalVoltage: 48,
      capacityAh: batteryAh,
      depthOfDischarge: 0.8,
      roundTripEfficiency: 0.92,
      type: scenario?.batteryType || "Lithium / AGM",
    },
    inverter: {
      ratedPowerW: inverterRatedW,
      surgePowerW: Math.ceil(inverterRatedW * (isSolar ? 1.5 : 2)),
      maxDcVoltage: isSolar ? 500 : 120,
      mpptMinVoltage: isSolar ? 120 : 0,
      mpptMaxVoltage: isSolar ? 450 : 0,
      efficiency: isSolar ? 0.95 : 0.92,
      type: scenario?.inverter || (isSolar ? "Ø§ÛŒÙ†ÙˆØ±ØªØ± Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ" : "Ø§ÛŒÙ†ÙˆØ±ØªØ± Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ"),
    },
    cable: {
      lengthM: Number(equipment?.cableLengthM || 20),
      currentA: Math.max(1, Math.ceil(peakLoadW / 48)),
      crossSectionMm2: 0,
      material: "copper",
      allowedVoltageDropPercent: 3,
    },
    equipment: {
      selectedItems: equipment?.selectedItems || [],
      totalPowerW: equipment?.totalPowerW || peakLoadW,
      totalDailyWh: equipment?.totalDailyWh || dailyEnergyWh,
    },
  });
}

export function buildScenarioCalculationInput() {
  const scenario = JSON.parse(localStorage.getItem("shil:selectedScenario") || "null");
  const environment = JSON.parse(localStorage.getItem("shil:environmentDraft") || "{}");
  const equipment = JSON.parse(localStorage.getItem("shil:equipmentDraft") || "{}");
  if (!scenario) return null;
  const form = scenarioToEngineeringForm(scenario, environment, equipment);
  const input = {
    source: "ready-scenario-flow",
    scenario,
    environment,
    equipment,
    form,
    engine: scenario.calculationEngine || scenario.domain,
  };
  localStorage.setItem("shil:engineeringFormDraft", JSON.stringify(form));
  localStorage.setItem("shil:calculationInput", JSON.stringify(input));
  return input;
}
