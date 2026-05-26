export type DashboardKey =
  | "ceo"
  | "intake"
  | "authorizations"
  | "scheduling"
  | "staffing"
  | "clinic"
  | "qa"
  | "finance"
  | "hr"
  | "recruiting";

export type RiskLevel = "Low" | "Medium" | "High" | "Critical";
export type HealthStatus = "Healthy" | "Watch" | "Critical";
export type ServiceSetting = "Home" | "School" | "Clinic" | "Unknown";

export interface DashboardDefinition {
  key: DashboardKey;
  name: string;
  access: string;
  description: string;
}

export interface ClinicPerformance {
  id: string;
  clinic: string;
  state: string;
  director: string;
  activeClients: number;
  pipelineClients: number;
  staffingNeeded: number;
  authorizedHours: number;
  deliveredHours: number;
  utilization: number | null;
  avgDaysToStart: number | null;
  flakedClients: number;
  revenueEstimate: number | null;
  healthStatus: HealthStatus;
  notes: string;
}

export interface ClientRecord {
  id: string;
  name: string;
  status: string;
  state: string;
  clinic: string;
  serviceSetting: ServiceSetting;
  bcba: string;
  rbt: string;
  insurance: string;
  authStatus: string;
  authorizedHours: number;
  deliveredHours: number;
  daysInStatus: number;
  startDate: string;
  riskLevel: RiskLevel;
  notes: string;
}

export interface PipelineStage {
  stage: string;
  count: number;
  avgDays: number | null;
  stuckTooLong: boolean;
}

export interface RedFlag {
  type: string;
  target: string;
  owner: string;
  daysOpen: number;
  severity: "Critical" | "Watch" | "Info" | "Resolved";
  action: string;
}

export const dashboardDefinitions: DashboardDefinition[] = [];

export const pipelineStageOrder = [];
