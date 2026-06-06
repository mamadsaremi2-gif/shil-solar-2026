export const SHIL_UI_V15_RULES = {
  identity: {
    appType: "engineering-platform",
    financialBlocksAllowed: false,
  },
  background: {
    managedByInfrastructure: true,
    userCanChange: false,
    offlineCache: true,
    silentUpdate: true,
  },
  headers: {
    fixed: true,
    centeredBrand: true,
    capsuleTitle: true,
    projectWorkflowDashboardButton: true,
    autoSaveOnDashboardExit: true,
  },
  footers: {
    contact: ["dashboard"],
    newProjectMother: ["dashboard"],
    projectWorkflow: ["previousStep", "saveDraft", "confirmStep"],
  },
  scroll: {
    pageVerticalScroll: true,
    globalHorizontalScroll: false,
    internalHorizontalScroll: true,
    scrollIndicatorAlwaysVisible: true,
  },
  blocks: {
    type: "elevated-industrial-panel",
    raised: true,
    subtleNeonBorder: true,
    horizontalScrollableBlocksNeedIndicator: true,
  },
  inputs: {
    defaultValuesRequired: true,
    manualOverride: true,
    acceptsPersianText: true,
    acceptsEnglishText: true,
    acceptsPersianDigits: true,
    acceptsEnglishDigits: true,
    normalizeBeforeCalculation: true,
    priority: ["userOverride", "onlineData", "gpsCityData", "defaultValues"],
  },
  calculations: {
    solarEngine: "SolarUnifiedCalculationEngine",
    emergencyEngine: "EmergencyPowerUnifiedCalculationEngine",
    dispatcher: true,
  },
  finalOutput: {
    noEquipmentPhotos: true,
    noFinancialData: true,
    integratedMpptInsideInverter: true,
    externalChargeControllerHiddenByDefault: true,
  },
};
