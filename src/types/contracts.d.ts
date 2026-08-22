export type ProjectScenario = "offgrid" | "hybrid" | "ongrid";

export interface ProjectInfo {
  title: string;
  scenario: ProjectScenario;
  location: string;
  dailyEnergyWh: number;
  peakLoadW: number;
  autonomyDays: number;
}

export interface PVForm {
  panelPowerW: number;
  panelVoc: number;
  panelVmp: number;
  panelIsc: number;
  panelImp: number;
  seriesCount: number;
  parallelCount: number;
  dcBusVoltage: number;
  temperatureMinC: number;
  temperatureMaxC: number;
  tempCoeffVocPercentPerC: number;
}

export interface EngineeringForm {
  project: ProjectInfo;
  pv: PVForm;
  battery: Record<string, number | string>;
  inverter: Record<string, number | string>;
  cable: Record<string, number | string>;
  environment: Record<string, number | string>;
}

export interface EngineeringResult {
  valid: boolean;
  errors: Array<Record<string, unknown>>;
  warnings: Array<Record<string, unknown>>;
  outputs: Record<string, unknown>;
  trace: string[];
  generatedAt: string;
}
