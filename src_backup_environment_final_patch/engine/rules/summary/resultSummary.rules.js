function label(item, fallback = '-') {
  if (!item) return fallback;
  if (typeof item === 'string' || typeof item === 'number') return String(item);
  return item.label || item.title || item.name || item.engineeringClass || fallback;
}

function round1(v) { return Math.round((Number(v) || 0) * 10) / 10; }
function round2(v) { return Math.round((Number(v) || 0) * 100) / 100; }
function n(v, fallback = 0) { const x = Number(v); return Number.isFinite(x) ? x : fallback; }

function buildDisplayRows(items = []) {
  return items.filter(Boolean).map((item, index) => ({
    id: item.id || `row-${index}`,
    label: label(item.label || item.title || item.name || item, '-'),
    count: item.count ?? item.qty ?? 1,
    specs: item.specs || item.value || item.note || '-',
    note: item.note || item.reason || item.status || '',
  }));
}

export const resultSummaryRule = Object.freeze({
  id: 'resultSummary',
  title: 'ساخت خروجی نهایی موتور v18',
  version: '18.0.0',
  run(_input = {}, result = {}) {
    const values = result.values || {};
    const equipment = result.equipment || {};
    const protection = values.protection || {};
    const cables = values.cables || {};
    const cableDetails = values.cableDetails || {};
    const dependencyGraph = values.dependencyGraph || {};
    const kpis = values.engineeringKpis || {};

    const inverterRated = n(values.inverterRatedPowerW || equipment.inverter?.ratedPowerW, 1);
    const designLoad = n(values.designLoadW || values.peakLoadW, 0);
    const inverterCount = Math.max(1, n(values.inverterCount, Math.ceil(designLoad / Math.max(inverterRated, 1))));
    const panelCount = n(values.panelCount, 0);
    const panelsPerInverter = Math.ceil(panelCount / inverterCount);
    const stringsTotal = Math.max(1, n(values.parallelStrings, 1));
    const stringsPerInverter = Math.ceil(stringsTotal / inverterCount);
    const panelAreaM2 = n(equipment.panel?.areaM2 || ((equipment.panel?.lengthMm && equipment.panel?.widthMm) ? (equipment.panel.lengthMm * equipment.panel.widthMm / 1000000) : 2.6), 2.6);
    const installationAreaM2 = n(values.installationAreaM2 || kpis.installationAreaM2, round1(panelCount * panelAreaM2 * 1.25));
    const mpptCount = n(values.totalMpptCount || values.mpptCount || values.inverterMpptCount || equipment.inverter?.mpptCount, 1);

    const distributedInverterSystems = Array.from({ length: inverterCount }, (_, index) => {
      const currentPanelCount = index === inverterCount - 1 ? Math.max(0, panelCount - panelsPerInverter * index) : panelsPerInverter;
      const localStrings = Math.max(1, index === inverterCount - 1 ? Math.max(1, stringsTotal - stringsPerInverter * index) : stringsPerInverter);
      return {
        id: `INV-${index + 1}`,
        title: `زیرسیستم اینورتر ${index + 1}`,
        inverter: label(equipment.inverter, 'اینورتر پیشنهادی'),
        pv: {
          panel: label(equipment.panel, 'پنل SHIL'),
          panelCount: currentPanelCount,
          seriesPanels: values.seriesPanels || 0,
          parallelStrings: localStrings,
          stringVmp: values.stringVmp || 0,
          stringVocCold: values.stringVocCold || 0,
          currentA: round2(n(values.pvCurrentA, 0) / inverterCount),
          mpptCount: Math.max(1, Math.ceil(mpptCount / inverterCount)),
          stringsPerMppt: values.stringsPerMppt || 1,
        },
        battery: { count: Math.ceil(n(values.batteryCount, 0) / inverterCount), voltage: values.batteryVoltage || values.inverterBatteryVoltage || 48, energyKWh: values.totalUsableBatteryEnergyKWh || 0 },
        protection: {
          pv: protection.pvDc || {},
          battery: protection.batteryDc || {},
          ac: protection.ac || {},
          dcBreakerA: protection.pvDc?.currentA || 0,
          acBreakerA: protection.ac?.currentA || 0,
          dcCable: cables.pv || 'PV Cable',
          batteryCable: cables.battery || 'Battery Cable',
          acCable: cables.ac || 'AC Cable',
          cableDetails,
        },
        space: {
          panelAreaM2: round1(currentPanelCount * panelAreaM2),
          maintenanceAreaM2: round1(currentPanelCount * panelAreaM2 * 1.25),
        },
      };
    });

    const protectionItems = buildDisplayRows([
      { label: 'حفاظت PV/DC', count: inverterCount, specs: `${label(protection.pvDc?.breaker)} / ${label(protection.pvDc?.fuse)} / ${label(protection.pvDc?.spd)} / ${label(protection.pvDc?.isolator)}`, note: `${protection.pvDc?.designVoltageV || '-'}V | ${protection.pvDc?.currentA || '-'}A` },
      { label: 'حفاظت باتری', count: values.batteryCount ? inverterCount : 0, specs: `${label(protection.batteryDc?.fuse)} / ${label(protection.batteryDc?.isolator)}`, note: `${protection.batteryDc?.designVoltageV || '-'}V | ${protection.batteryDc?.currentA || '-'}A` },
      { label: 'حفاظت AC', count: inverterCount, specs: `${label(protection.ac?.breaker)} / ${label(protection.ac?.spd, 'Type II AC')}`, note: `${protection.ac?.designVoltageV || '-'}V | ${protection.ac?.currentA || '-'}A` },
    ]);

    const cableItems = buildDisplayRows([
      { label: 'کابل PV/DC', count: inverterCount, specs: cableDetails.pv?.label || cables.pv || '-', note: `I=${cableDetails.pv?.currentA || '-'}A / L=${cableDetails.pv?.lengthM || '-'}m / ΔV=${cableDetails.pv?.voltageDropPercent || 0}%` },
      { label: 'کابل باتری', count: inverterCount, specs: cableDetails.battery?.label || cables.battery || '-', note: `I=${cableDetails.battery?.currentA || '-'}A / L=${cableDetails.battery?.lengthM || '-'}m / ΔV=${cableDetails.battery?.voltageDropPercent || 0}%` },
      { label: 'کابل AC', count: inverterCount, specs: cableDetails.ac?.label || cables.ac || '-', note: `I=${cableDetails.ac?.currentA || '-'}A / L=${cableDetails.ac?.lengthM || '-'}m / ΔV=${cableDetails.ac?.voltageDropPercent || 0}%` },
    ]);

    const billOfMaterials = {
      inverters: buildDisplayRows([{ label: 'اینورتر', count: inverterCount, specs: label(equipment.inverter, null), note: `${inverterRated}W / ${values.inverterBatteryVoltage || 48}V / ${equipment.inverter?.mpptCount || 1} MPPT` }]),
      panels: buildDisplayRows([{ label: 'پنل خورشیدی', count: panelCount, specs: `${values.installedPvPowerKW || kpis.pvInstalledKW || 0} kW`, note: label(equipment.panel, null) }]),
      batteries: buildDisplayRows([{ label: 'باتری', count: values.batteryCount || 0, specs: `${values.totalUsableBatteryEnergyKWh || 0} kWh usable`, note: label(equipment.battery, null) }]),
      mppt: buildDisplayRows([{ label: 'MPPT / String', count: mpptCount, specs: `${values.seriesPanels || 0}S × ${values.parallelStrings || 0}P / ${values.stringsPerMppt || 0} رشته در هر MPPT`, note: `${values.stringVmpHot || values.stringVmp || 0}Vmp(hot) / ${values.stringVocCold || 0}Voc(cold) / ${values.pvCurrentA || 0}A` }]),
      protection: protectionItems,
      cables: { pv: cableItems[0], battery: cableItems[1], ac: cableItems[2], items: cableItems },
      space: { totalPanelAreaM2: round1(panelCount * panelAreaM2), requiredInstallationAreaM2: installationAreaM2, serviceFactor: 1.25 },
    };

    const summary = {
      scenario: values.scenario,
      version: 'v18.0.0-final-engineering-completion',
      registryBinding: {
        panels: Boolean(values.panelBankConnected),
        inverters: Boolean(values.inverterBankConnected),
        batteries: Boolean(values.batteryBankConnected),
        protection: Boolean(values.protectionBankConnected),
        cables: Boolean(values.cableBankConnected),
        dependencies: Boolean(values.dependencyEngineConnected),
      },
      readiness: kpis.readiness || 'قابل بررسی',
      engineeringKpis: kpis,
      dependencyGraph,
      pv: {
        panel: label(equipment.panel, null),
        count: panelCount,
        installedPowerKW: values.installedPvPowerKW || kpis.pvInstalledKW || 0,
        stringDesign: values.seriesPanels && values.parallelStrings ? `${values.seriesPanels}S × ${values.parallelStrings}P` : null,
        currentA: values.pvCurrentA || 0,
        voltageMargin: values.pvVoltageSafetyMarginPct ?? kpis.pvVoltageMargin,
        thermal: values.thermal || null,
        mpptAllocation: values.mpptAllocation || [],
      },
      inverter: label(equipment.inverter, null),
      battery: {
        model: label(equipment.battery, null),
        count: values.batteryCount || 0,
        usableEnergyKWh: values.totalUsableBatteryEnergyKWh || 0,
        coverageRatio: values.batteryCoverageRatio ?? kpis.batteryCoverageRatio,
        autonomy: values.batteryAutonomy || null,
      },
      electrical: {
        dcVoltageLevel: values.dcVoltageLevel,
        panelboardIp: values.panelboardIp,
        spdType: values.spdType,
        cables: values.cables || {},
      },
      protection,
      billOfMaterials,
      distributedInverterSystems,
      resultFields: {
        operationalStatus: values.operationalStatus || 'READY_FOR_REVIEW',
        inverterCount,
        panelCount,
        batteryCount: values.batteryCount || 0,
        mpptCount,
        installationAreaM2,
        installedPvPowerKW: values.installedPvPowerKW || kpis.pvInstalledKW || 0,
        stringVocCold: values.stringVocCold || 0,
        stringVmp: values.stringVmp || 0,
        stringVmpHot: values.stringVmpHot || 0,
        pvVoltageSafetyMarginPct: values.pvVoltageSafetyMarginPct || 0,
        pvCurrentA: values.pvCurrentA || 0,
        cables: values.cables || {},
        protectionStatus: kpis.readiness || 'قابل بررسی',
      },
    };

    return {
      summary,
      values: { summaryReady: true, billOfMaterials, distributedInverterSystems, installationAreaM2, inverterCount, mpptCount, engineeringKpis: kpis },
      explanations: [{ rule: 'resultSummary', message: 'خروجی v18 از بانک‌های SHIL، Dependency Engine، حفاظت، کابل، MPPT و فضای نصب برای UI/PDF آماده شد.' }],
    };
  },
});
