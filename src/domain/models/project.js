export const SYSTEM_TYPES = [
  { value: "offgrid", label: "Off-Grid", description: "طراحی مستقل از شبکه با پنل و باتری" },
  { value: "hybrid", label: "Hybrid", description: "ترکیب شبکه، پنل و باتری با سناریوی بهره برداری" },
  { value: "gridtie", label: "Grid-Tie", description: "متصل به شبکه با تمرکز بر جبران انرژی مصرفی" },
  { value: "backup", label: "سانورتر و باطری", description: "سیستم بدون پنل برای بکاپ بار با سانورتر و باطری" },
];

export const CALCULATION_MODES = [
  { value: "current", label: "بر اساس جریان کل" },
  { value: "power", label: "بر اساس توان کل" },
  { value: "loads", label: "بر اساس لیست تجهیزات" },
  { value: "daily_energy", label: "بر اساس انرژی روزانه" },
  { value: "load_profile", label: "بر اساس پروفایل مصرف" },
];

export const BATTERY_TYPES = ["AGM", "GEL", "LFP", "NMC"];
export const SYSTEM_VOLTAGES = [12, 24, 48, 96];
export const BACKUP_SYSTEM_VOLTAGES = [12, 24, 48];
export const BATTERY_UNIT_VOLTAGE_OPTIONS = [12, 24, 48];
export const BACKUP_BATTERY_CAPACITY_OPTIONS = [50, 75, 100, 120, 150, 180, 200, 250, 300, 400];
export const PANEL_TYPES = ["Mono", "Poly", "Half-Cut", "TOPCon", "HJT"];
export const LOAD_TYPES = ["resistive", "motor", "switching", "mixed"];
export const HYBRID_MODES = [
  { value: "self_consumption", label: "خودمصرفی با بکاپ" },
  { value: "backup_priority", label: "اولویت پشتیبانی باطری" },
  { value: "peak_shaving", label: "کاهش پیک شبکه" },
];


export const EQUIPMENT_ROLE_OPTIONS = [
  { value: 'panel', label: 'پنل خورشیدی' },
  { value: 'battery', label: 'باتری' },
  { value: 'inverter', label: 'اینورتر' },
  { value: 'controller', label: 'شارژ کنترلر' },
];

export const HOURLY_PROFILE_TEMPLATE = [
  0.35, 0.3, 0.28, 0.27, 0.3, 0.38, 0.55, 0.72, 0.84, 0.9, 0.88, 0.8,
  0.72, 0.68, 0.66, 0.7, 0.82, 0.96, 1, 0.98, 0.88, 0.74, 0.58, 0.45,
].map((factor, hour) => ({
  id: `hour-${hour}`,
  hour,
  label: `${String(hour).padStart(2, "0")}:00`,
  factor,
}));

export const DEFAULT_PROJECT_FORM = {
  projectTitle: "پروژه جدید Solar Design Suite",
  clientName: "",
  city: "تهران",
  systemType: "offgrid",
  modeType: "advanced",
  calculationMode: "power",
  hybridMode: "self_consumption",
  targetOffsetPercent: 85,
  gridAvailableHours: 24,
  loadVoltage: 220,
  current: 20,
  loadPower: 4500,
  powerFactor: 0.95,
  backupHours: 6,
  dailyEnergyKwh: 18,
  peakFactor: 2.2,
  loadProfileSource: "template",
  loadProfile: HOURLY_PROFILE_TEMPLATE,
  sunHours: 5.5,
  averageTemperature: 30,
  minTemperature: 0,
  maxTemperature: 40,
  altitude: 1200,
  shadingFactor: 0.95,
  dustFactor: 0.96,
  tiltAngle: 30,
  systemVoltage: 48,
  batteryType: "LFP",
  batteryUnitVoltage: 12,
  batteryUnitAh: 200,
  batteryRoundTripEfficiency: 0.95,
  daysAutonomy: 1,
  dod: 0.8,
  inverterEfficiency: 0.93,
  controllerEfficiency: 0.95,
  cableLossFactor: 0.97,
  panelLossFactor: 0.9,
  designFactor: 1.2,
  surgeFactor: 1.7,
  panelWatt: 585,
  panelType: "TOPCon",
  panelVoc: 53.1,
  panelVmp: 44.8,
  panelTempCoeffVoc: 0.0024,
  panelTypeTemperatureFactor: 0.29,
  controllerType: "MPPT",
  controllerMaxVoc: 250,
  mpptMinVoltage: 120,
  mpptMaxVoltage: 220,
  dcCableLength: 20,
  batteryCableLength: 3,
  acCableLength: 25,
  dcVoltageDropLimit: 3,
  batteryVoltageDropLimit: 2,
  acVoltageDropLimit: 3,
  selectedEquipment: { panel: null, battery: null, inverter: null, controller: null },
  loadItems: [
    {
      id: crypto.randomUUID(),
      name: "روشنایی",
      qty: 8,
      power: 18,
      hours: 8,
      powerFactor: 0.98,
      coincidenceFactor: 1,
      loadType: "resistive",
      surgeFactor: 1,
    },
    {
      id: crypto.randomUUID(),
      name: "پمپ",
      qty: 1,
      power: 1500,
      hours: 2,
      powerFactor: 0.82,
      coincidenceFactor: 1,
      loadType: "motor",
      surgeFactor: 3,
    },
  ],
};
