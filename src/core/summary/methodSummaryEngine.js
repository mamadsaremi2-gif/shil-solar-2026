const METHOD_TITLES = {
  equipment: "لیست تجهیزات",
  profile: "پروفایل مصرف",
  energy: "انرژی روزانه",
  power: "توان کل",
  current: "جریان کل",
  solar_panel_power: "توان پنل خورشیدی",
  emergency: "برق اضطراری",
  utility: "نیروگاهی"
};

function n(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function val(...values) {
  for (const item of values) {
    if (item !== undefined && item !== null && item !== "" && item !== "-") return item;
  }
  return "-";
}

function round(value, digits = 2) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";
  const factor = Math.pow(10, digits);
  return Math.round(num * factor) / factor;
}

function whToKwh(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";
  return round(num / 1000, 2);
}

function batteryLabel(bank = {}, fallback = "باتری انتخاب نشده") {
  if (!bank || bank === "none") return fallback;
  const totalCount = val(bank.totalCount, bank.count, bank.quantity, "-");
  if (totalCount === 0 || totalCount === "0") return fallback;
  const b = bank.battery || {};
  const voltage = val(bank.unitVoltageV, bank.voltageV, b.nominalVoltage, b.voltageV, "-");
  const ah = val(bank.unitCapacityAh, bank.capacityAh, b.capacityAh, "-");
  const unitKWh = val(bank.unitEnergyKWh, Number(voltage) && Number(ah) ? round((Number(voltage) * Number(ah)) / 1000, 2) : "-");
  const totalKWh = val(bank.grossEnergyKWh, bank.totalEnergyKWh, bank.grossEnergyWh ? whToKwh(bank.grossEnergyWh) : "-");
  return `${totalCount} عدد / ${voltage}V / ${ah}Ah / ${unitKWh}kWh هر باتری / ${totalKWh}kWh کل`;
}

function loadMetrics({ loadResult = {}, result = {}, systemSettings = {}, calculationInput = {} }) {
  const load = result?.load || loadResult || {};
  const form = calculationInput?.form || {};
  const project = form.project || {};
  const voltage = val(load.voltageAC, result.voltageAC, project.voltageAC, systemSettings.voltageAC, 220);
  const powerW = val(load.totalPowerW, load.designPowerW, result.totalPowerW, result.designPowerW, project.peakLoadW, project.manualPowerW, systemSettings.totalPowerW, "-");
  const energyKWh = val(load.totalEnergyKWh, load.dailyEnergyKWh, result.totalEnergyKWh, result.dailyEnergyKWh, project.dailyEnergyWh ? whToKwh(project.dailyEnergyWh) : "-", systemSettings.dailyEnergyKWh, "-");
  const currentA = val(load.acCurrentA, result.acCurrentA, result.totalCurrentA, Number(powerW) && Number(voltage) ? round(Number(powerW) / Number(voltage), 2) : "-");
  const surgeW = val(load.surgePowerW, result.surgePowerW, load.startPowerW, project.surgePowerW, "-");
  const inverterW = val(load.recommendedInverterW, result.recommendedInverterW, result.inverter?.ratedPowerW, result.inverter?.powerW, systemSettings.inverterPowerW, "-");
  const batteryWh = val(load.recommendedBatteryWh, result.recommendedBatteryWh, result.battery?.grossEnergyWh, systemSettings.batteryWh, "-");
  return { load, powerW, energyKWh, currentA, surgeW, inverterW, batteryWh, voltage };
}

function solarPanelPowerRows({ solarDesign = {}, solarPanelPowerInput = {}, systemSettings = {} }) {
  const totalPanelPowerW = val(solarPanelPowerInput.totalPanelPowerW, solarDesign?.pvArray?.arrayPowerW, systemSettings.totalPanelPowerW, 0);
  const totalKw = Number(totalPanelPowerW) ? round(Number(totalPanelPowerW) / 1000, 2) : "-";
  const panelCount = val(solarPanelPowerInput.panelCount, solarDesign?.pvArray?.panelCount, systemSettings.panelCount, "-");
  const panelPower = val(solarPanelPowerInput.panelPowerW, solarDesign?.panel?.powerW, systemSettings.panelPowerW, "-");
  const rawDaily = val(solarPanelPowerInput.rawDailyEnergyKWh, solarDesign?.panelPowerAnalysis?.array?.rawDailyEnergyKWh, "-");
  const effectiveDaily = val(solarPanelPowerInput.generatedDailyKWh, solarDesign?.panelPowerAnalysis?.array?.dailyEnergyKWh, "-");
  const distribution = Array.isArray(solarPanelPowerInput?.inverterPanelDistribution) ? `${solarPanelPowerInput.inverterPanelDistribution.join(" / ")} پنل` : "تک اینورتر";
  const distributedRows = Array.isArray(solarDesign?.distributedInverterSystems)
    ? solarDesign.distributedInverterSystems.slice(0, 6).map((system) => ({
      label: system.title || "زیرسیستم اینورتر",
      value: `${val(system?.pv?.panelCount, "-")} پنل / ${val(system?.battery?.count, 0)} باتری`,
      note: `${val(system?.protection?.dcCable, "DC")} / ${val(system?.protection?.acCable, "AC")} / ${val(system?.space?.maintenanceAreaM2, "-")}m²`
    }))
    : [];
  return [
    { label: "روش طراحی", value: "توان پنل خورشیدی", note: "چکیده اختصاصی مسیر PV؛ موتور محاسبات مشترک است" },
    { label: "توان کل پنل‌ها", value: `${totalKw} kW`, note: `${panelCount} عدد × ${panelPower} وات` },
    { label: "تولید خام روزانه", value: `${rawDaily} kWh`, note: "قبل از اعمال تلفات و راندمان" },
    { label: "تولید واقعی با تلفات", value: `${effectiveDaily} kWh`, note: "پس از اعمال شرایط محیطی، راندمان و تلفات" },
    { label: "اینورتر خورشیدی", value: `${val(solarDesign?.inverter?.count, "-")} عدد / ${val(solarDesign?.inverter?.ratedPowerW, solarDesign?.inverter?.powerW, "-")} وات`, note: `${val(solarDesign?.inverterTopology?.mpptPerInverter, 1)} MPPT برای هر اینورتر` },
    multiInverterRuleRow(solarDesign),
    { label: "تقسیم پنل", value: distribution, note: "مطابق تقسیم هوشمند یا دستی کاربر" },
    { label: "باتری", value: n(solarDesign?.settings?.autonomyDays, 0) > 0 ? batteryLabel(solarDesign?.battery) : "باتری انتخاب نشده", note: n(solarDesign?.settings?.autonomyDays, 0) > 0 ? "بر اساس روزهای خودمختاری" : "روزهای خودمختاری صفر است" },
    { label: "حفاظت و کابل", value: `DC ${val(solarDesign?.protection?.dcBreakerA, "-")}A / AC ${val(solarDesign?.protection?.acBreakerA, "-")}A`, note: val(solarDesign?.protection?.dcCable, solarDesign?.protection?.pvCable, "بر اساس خروجی موتور مشترک") },
    ...distributedRows
  ];
}

function distributedInverterRows(solarDesign = {}) {
  if (!Array.isArray(solarDesign?.distributedInverterSystems) || !solarDesign.distributedInverterSystems.length) return [];
  return solarDesign.distributedInverterSystems.slice(0, 12).map((system) => ({
    label: system.title || "زیرسیستم اینورتر",
    value: `${val(system?.pv?.panelCount, "-")} پنل / ${val(system?.battery?.count, 0)} باتری`,
    note: `${val(system?.designPowerShareW, "-")}W سهم بار / DC ${val(system?.protection?.dcBreakerA, "-")}A / AC ${val(system?.protection?.acBreakerA, "-")}A / کابل ${val(system?.protection?.dcCable, "-")} و ${val(system?.protection?.acCable, "-")}`
  }));
}

function multiInverterRuleRow(solarDesign = {}) {
  const invCount = val(solarDesign?.inverter?.count, 1);
  const invPower = val(solarDesign?.inverter?.ratedPowerW, solarDesign?.inverter?.powerW, "-");
  return {
    label: "قانون مشترک چنداینورتری",
    value: `${invCount} اینورتر × ${invPower}W`,
    note: "توان، پنل، باتری، فضا، حفاظت AC/DC و کابل‌ها برای هر اینورتر مستقل تقسیم و سپس جمع‌بندی می‌شوند."
  };
}

function equipmentRows(ctx) {
  const m = loadMetrics(ctx);
  return [
    { label: "روش طراحی", value: "لیست تجهیزات", note: "چکیده بارمحور؛ بدون MPPT و تقسیم پنل اختصاصی" },
    { label: "تعداد تجهیزات", value: ctx.loadResult?.selectedCount ? `${ctx.loadResult.selectedCount} مورد` : (Array.isArray(ctx.selectedEquipment) ? `${ctx.selectedEquipment.length} مورد` : "بدون تجهیز انتخابی") },
    { label: "توان کل مصرفی", value: `${m.powerW} W`, note: "جمع توان تجهیزات انتخاب‌شده" },
    { label: "انرژی روزانه", value: `${m.energyKWh} kWh`, note: "بر اساس ساعت کارکرد تجهیزات" },
    { label: "جریان AC", value: `${m.currentA} A`, note: `بر اساس مسیر ${m.voltage}V` },
    { label: "پیک راه‌اندازی", value: `${m.surgeW} W`, note: "بارهای موتوری و ضریب راه‌اندازی" },
    { label: "اینورتر پیشنهادی", value: `${m.inverterW} W`, note: "بر اساس توان مصرفی و پیک استارت" },
    { label: "باتری مرجع", value: m.batteryWh === "-" ? "انتخاب نشده" : `${whToKwh(m.batteryWh)} kWh`, note: "در صورت نیاز به ذخیره‌سازی" },
    multiInverterRuleRow(ctx.solarDesign),
    ...distributedInverterRows(ctx.solarDesign)
  ];
}

function profileRows(ctx) {
  const m = loadMetrics(ctx);
  const profile = ctx.loadResult?.profile || ctx.systemSettings?.profile || {};
  return [
    { label: "روش طراحی", value: "پروفایل مصرف", note: "چکیده اختصاصی مصرف‌محور بر اساس بازه‌های زمانی" },
    { label: "مصرف صبح", value: `${val(profile.morningKWh, ctx.loadResult?.morningKWh, "-")} kWh`, note: "بازه صبح" },
    { label: "مصرف ظهر", value: `${val(profile.noonKWh, ctx.loadResult?.noonKWh, "-")} kWh`, note: "بازه ظهر" },
    { label: "مصرف عصر", value: `${val(profile.eveningKWh, ctx.loadResult?.eveningKWh, "-")} kWh`, note: "بازه عصر" },
    { label: "مصرف شب", value: `${val(profile.nightKWh, ctx.loadResult?.nightKWh, "-")} kWh`, note: "بازه شب" },
    { label: "توان پیک", value: `${m.powerW} W`, note: "بیشترین توان همزمان پروفایل" },
    { label: "انرژی روزانه", value: `${m.energyKWh} kWh`, note: "جمع کل پروفایل مصرف" },
    { label: "اینورتر پیشنهادی", value: `${m.inverterW} W`, note: "با لحاظ ضریب راه‌اندازی مسیر پروفایل" },
    multiInverterRuleRow(ctx.solarDesign),
    ...distributedInverterRows(ctx.solarDesign)
  ];
}

function energyRows(ctx) {
  const m = loadMetrics(ctx);
  return [
    { label: "روش طراحی", value: "انرژی روزانه", note: "چکیده اختصاصی انرژی‌محور" },
    { label: "انرژی روزانه ورودی", value: `${m.energyKWh} kWh`, note: "مبنای اصلی این مسیر" },
    { label: "توان تخمینی", value: `${m.powerW} W`, note: "از انرژی و ساعت کارکرد/پروفایل به دست آمده" },
    { label: "جریان AC", value: `${m.currentA} A`, note: `بر اساس مسیر ${m.voltage}V` },
    { label: "اینورتر پیشنهادی", value: `${m.inverterW} W`, note: "از توان تخمینی و ضریب راه‌اندازی" },
    { label: "باتری مرجع", value: m.batteryWh === "-" ? "انتخاب نشده" : `${whToKwh(m.batteryWh)} kWh`, note: "بر اساس انرژی روزانه و خودمختاری" },
    multiInverterRuleRow(ctx.solarDesign),
    ...distributedInverterRows(ctx.solarDesign)
  ];
}

function powerRows(ctx) {
  const m = loadMetrics(ctx);
  return [
    { label: "روش طراحی", value: "توان کل", note: "چکیده اختصاصی توان‌محور" },
    { label: "توان کل ورودی", value: `${m.powerW} W`, note: "مبنای اصلی انتخاب اینورتر و حفاظت" },
    { label: "انرژی روزانه تخمینی", value: `${m.energyKWh} kWh`, note: "بر اساس ساعت کارکرد ثبت‌شده" },
    { label: "جریان AC", value: `${m.currentA} A`, note: `توان تقسیم بر ولتاژ ${m.voltage}V` },
    { label: "پیک استارت", value: `${m.surgeW} W`, note: "با ضریب راه‌اندازی" },
    { label: "اینورتر پیشنهادی", value: `${m.inverterW} W`, note: "نزدیک‌ترین ظرفیت بالاتر مجاز" },
    multiInverterRuleRow(ctx.solarDesign),
    ...distributedInverterRows(ctx.solarDesign)
  ];
}

function currentRows(ctx) {
  const m = loadMetrics(ctx);
  return [
    { label: "روش طراحی", value: "جریان کل", note: "چکیده اختصاصی جریان‌محور" },
    { label: "جریان کل ورودی", value: `${m.currentA} A`, note: "مبنای اصلی این مسیر" },
    { label: "ولتاژ مسیر", value: `${m.voltage} V`, note: "۲۲۰ تک‌فاز یا ۳۸۰ سه‌فاز" },
    { label: "توان متناظر", value: `${m.powerW} W`, note: "بر اساس جریان و ولتاژ" },
    { label: "انرژی روزانه", value: `${m.energyKWh} kWh`, note: "در صورت ثبت ساعت کارکرد" },
    { label: "اینورتر/حفاظت", value: `${m.inverterW} W`, note: "حفاظت و کابل از همین جریان محاسبه می‌شوند" },
    multiInverterRuleRow(ctx.solarDesign),
    ...distributedInverterRows(ctx.solarDesign)
  ];
}

function emergencyRows(ctx) {
  const result = ctx.result || {};
  return [
    { label: "روش طراحی", value: "برق اضطراری", note: "چکیده اختصاصی سیستم پشتیبان" },
    { label: "اینورتر برق اضطراری", value: `${val(result?.inverter?.count, 1)} عدد / ${val(result?.inverter?.ratedPowerW, "-")} وات`, note: "پوشش توان دائم و لحظه‌ای بارهای ضروری" },
    { label: "باتری منتخب", value: batteryLabel(result?.battery), note: "بر اساس زمان برق اضطراری و DoD" },
    { label: "زمان برق اضطراری", value: `${val(result?.settings?.requiredEmergencyHours, 2)} ساعت`, note: "در ظرفیت باتری لحاظ شده" },
    { label: "حفاظت DC/AC", value: `DC ${val(result?.protection?.dcBreakerA, "-")}A / AC ${val(result?.protection?.acBreakerA, "-")}A`, note: "حفاظت باتری و خروجی AC" }
  ];
}

export function getActiveMethodKey({ domain = "solar" } = {}) {
  if (domain === "emergency") return "emergency";
  return localStorage.getItem("shil:calculationMethod") || "equipment";
}

export function buildMethodSummary(ctx = {}) {
  const methodKey = ctx.methodKey || getActiveMethodKey({ domain: ctx.domain });
  const safeCtx = { ...ctx, methodKey };
  let rows;
  if (methodKey === "solar_panel_power") rows = solarPanelPowerRows(safeCtx);
  else if (methodKey === "profile") rows = profileRows(safeCtx);
  else if (methodKey === "energy") rows = energyRows(safeCtx);
  else if (methodKey === "power") rows = powerRows(safeCtx);
  else if (methodKey === "current") rows = currentRows(safeCtx);
  else if (methodKey === "emergency") rows = emergencyRows(safeCtx);
  else rows = equipmentRows(safeCtx);
  return {
    methodKey,
    title: METHOD_TITLES[methodKey] || METHOD_TITLES.equipment,
    blockTitle: `چکیده مسیر ${METHOD_TITLES[methodKey] || METHOD_TITLES.equipment}`,
    badge: methodKey === "solar_panel_power" ? "PV اختصاصی" : methodKey === "emergency" ? "Backup" : "محاسبات اختصاصی",
    rows,
    isSolarPanelPower: methodKey === "solar_panel_power",
    isLoadBased: methodKey !== "solar_panel_power" && methodKey !== "emergency"
  };
}
