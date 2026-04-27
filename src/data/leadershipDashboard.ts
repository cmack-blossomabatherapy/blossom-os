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

export const dashboardDefinitions: DashboardDefinition[] = [
  { key: "ceo", name: "CEO & Leadership Dashboard", access: "Super Admin, Leadership", description: "Company-wide scorecard for operational performance." },
  { key: "intake", name: "Intake Dashboard", access: "Intake Team, Leadership, Super Admin", description: "Tracks leads, forms, VOBs, and conversion." },
  { key: "authorizations", name: "Authorizations Dashboard", access: "Auth Team, Leadership, Super Admin", description: "Tracks initial auths, treatment auths, denials, and expirations." },
  { key: "scheduling", name: "Scheduling Dashboard", access: "Scheduling Team, Leadership, Super Admin", description: "Tracks assessments, start dates, availability, and calendar risk." },
  { key: "staffing", name: "Staffing Dashboard", access: "Staffing Team, Leadership, Super Admin", description: "Tracks staffing gaps, wait time, RBT utilization, and caseloads." },
  { key: "clinic", name: "Clinic Dashboard", access: "Clinic Directors, Leadership, Super Admin", description: "Tracks clinic-level census, flow, staffing, and utilization." },
  { key: "qa", name: "QA Dashboard", access: "QA Team, Leadership, Super Admin", description: "Tracks clinical readiness, QA turnaround, missing items, and PRs." },
  { key: "finance", name: "Finance Dashboard", access: "Finance Team, Leadership, Super Admin", description: "Tracks billable hours, payment risk, OON cases, and estimates." },
  { key: "hr", name: "HR Dashboard", access: "HR Team, Leadership, Super Admin", description: "Tracks people operations, reviews, training, and HR escalations." },
  { key: "recruiting", name: "Recruiting Dashboard", access: "Recruiting Team, Leadership, Super Admin", description: "Tracks candidates, hiring stages, starts, and open role coverage." },
];

export const pipelineStageOrder = [
  "Sent Form",
  "Missing Info",
  "Sent to VOB",
  "No DX",
  "Pending Initial Auth",
  "Schedule Assessment",
  "In QA",
  "Pending Treatment Auth",
  "Staffing Needed",
  "Pending Start Date",
  "Active",
  "Flaked",
  "Discharged",
  "Services on Pause",
];
