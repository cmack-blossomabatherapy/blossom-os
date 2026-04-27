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
export type ServiceSetting = "Home" | "School" | "Clinic";

export interface DashboardDefinition {
  key: DashboardKey;
  name: string;
  access: string;
  description: string;
  lastUpdated: string;
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
  utilization: number;
  avgDaysToStart: number;
  flakedClients: number;
  revenueEstimate: number;
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
  avgDays: number;
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
  { key: "ceo", name: "CEO & Leadership Dashboard", access: "Super Admin, Leadership", description: "Company-wide scorecard for operational performance.", lastUpdated: "Today · 8:42 AM" },
  { key: "intake", name: "Intake Dashboard", access: "Intake Team, Leadership, Super Admin", description: "Tracks leads, forms, VOBs, and conversion.", lastUpdated: "Today · 8:35 AM" },
  { key: "authorizations", name: "Authorizations Dashboard", access: "Auth Team, Leadership, Super Admin", description: "Tracks initial auths, treatment auths, denials, and expirations.", lastUpdated: "Today · 8:30 AM" },
  { key: "scheduling", name: "Scheduling Dashboard", access: "Scheduling Team, Leadership, Super Admin", description: "Tracks assessments, start dates, availability, and calendar risk.", lastUpdated: "Today · 8:28 AM" },
  { key: "staffing", name: "Staffing Dashboard", access: "Staffing Team, Leadership, Super Admin", description: "Tracks staffing gaps, wait time, RBT utilization, and caseloads.", lastUpdated: "Today · 8:25 AM" },
  { key: "clinic", name: "Clinic Dashboard", access: "Clinic Directors, Leadership, Super Admin", description: "Tracks clinic-level census, flow, staffing, and utilization.", lastUpdated: "Today · 8:18 AM" },
  { key: "qa", name: "QA Dashboard", access: "QA Team, Leadership, Super Admin", description: "Tracks clinical readiness, QA turnaround, missing items, and PRs.", lastUpdated: "Today · 8:12 AM" },
  { key: "finance", name: "Finance Dashboard", access: "Finance Team, Leadership, Super Admin", description: "Tracks billable hours, payment risk, OON cases, and estimates.", lastUpdated: "Today · 8:05 AM" },
  { key: "hr", name: "HR Dashboard", access: "HR Team, Leadership, Super Admin", description: "Tracks people operations, reviews, training, and HR escalations.", lastUpdated: "Today · 7:58 AM" },
  { key: "recruiting", name: "Recruiting Dashboard", access: "Recruiting Team, Leadership, Super Admin", description: "Tracks candidates, hiring stages, starts, and open role coverage.", lastUpdated: "Today · 7:52 AM" },
];

export const clinics: ClinicPerformance[] = [
  { id: "riverdale", clinic: "Riverdale", state: "GA", director: "Monica Reyes", activeClients: 1, pipelineClients: 18, staffingNeeded: 1, authorizedHours: 640, deliveredHours: 372, utilization: 58, avgDaysToStart: 34, flakedClients: 1, revenueEstimate: 29760, healthStatus: "Critical", notes: "High demand, low conversion to active care." },
  { id: "peachtree-corners", clinic: "Peachtree Corners", state: "GA", director: "Alicia Grant", activeClients: 28, pipelineClients: 11, staffingNeeded: 4, authorizedHours: 1240, deliveredHours: 1098, utilization: 89, avgDaysToStart: 18, flakedClients: 0, revenueEstimate: 87840, healthStatus: "Healthy", notes: "Strong utilization with manageable staffing risk." },
  { id: "home-based-georgia", clinic: "Home-Based Georgia", state: "GA", director: "Jamal Brooks", activeClients: 36, pipelineClients: 24, staffingNeeded: 9, authorizedHours: 1580, deliveredHours: 1192, utilization: 75, avgDaysToStart: 29, flakedClients: 2, revenueEstimate: 95360, healthStatus: "Watch", notes: "Staffing constraints are slowing starts." },
  { id: "north-carolina", clinic: "North Carolina", state: "NC", director: "Priya Shah", activeClients: 19, pipelineClients: 9, staffingNeeded: 3, authorizedHours: 880, deliveredHours: 748, utilization: 85, avgDaysToStart: 21, flakedClients: 0, revenueEstimate: 59840, healthStatus: "Healthy", notes: "Stable pipeline and delivery pace." },
  { id: "tennessee", clinic: "Tennessee", state: "TN", director: "Evan Miller", activeClients: 15, pipelineClients: 13, staffingNeeded: 5, authorizedHours: 760, deliveredHours: 501, utilization: 66, avgDaysToStart: 31, flakedClients: 1, revenueEstimate: 40080, healthStatus: "Critical", notes: "Utilization below target and staffing wait increasing." },
  { id: "virginia", clinic: "Virginia", state: "VA", director: "Nora Williams", activeClients: 21, pipelineClients: 10, staffingNeeded: 2, authorizedHours: 930, deliveredHours: 802, utilization: 86, avgDaysToStart: 22, flakedClients: 0, revenueEstimate: 64160, healthStatus: "Healthy", notes: "Healthy clinic flow with low red flag volume." },
  { id: "maryland", clinic: "Maryland", state: "MD", director: "Caleb Turner", activeClients: 17, pipelineClients: 8, staffingNeeded: 4, authorizedHours: 820, deliveredHours: 603, utilization: 74, avgDaysToStart: 27, flakedClients: 1, revenueEstimate: 48240, healthStatus: "Watch", notes: "Watch staffing and auth expiration risk." },
];

const riverdaleByStage: Record<string, string[]> = {
  "Sent Form": ["Zayden Pryor", "Jiriya Hill-Stewart", "Bymaan Florez"],
  "Missing Info": ["Skylar Dennis", "Jalen Harris", "Cinnamon Duhart"],
  "No DX": ["Amon Montgomery"],
  "Pending Initial Authorization": ["Ares Jackson", "Antonio Barron", "Anterio Barron", "Amir Elliot", "Kennedy Hines"],
  "Schedule Assessment": ["Cai Harden", "Lamarious Elijah Bell Hylton", "Legend Odom"],
  "In QA": ["Levi Banks"],
  "Staffing Needed": ["Azaria Daniel"],
  Active: ["Aiden Johnson"],
  Flaked: ["Jamiyah Jones"],
};

const riverdaleClients: ClientRecord[] = Object.entries(riverdaleByStage).flatMap(([status, names], stageIndex) =>
  names.map((name, i) => ({
    id: `${status}-${name}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
    status,
    state: "GA",
    clinic: "Riverdale",
    serviceSetting: i % 3 === 0 ? "Clinic" : i % 3 === 1 ? "Home" : "School",
    bcba: ["Dana Morris", "Kim Ward", "Riley Foster"][i % 3],
    rbt: status === "Active" ? "Maya Chen" : status === "Staffing Needed" ? "Needed" : "Pending",
    insurance: ["Aetna", "BCBS", "Medicaid", "United"][i % 4],
    authStatus: status.includes("Auth") ? status : status === "Active" ? "Approved" : "Not Started",
    authorizedHours: status === "Active" ? 40 : status.includes("Auth") || status === "Staffing Needed" ? 30 : 0,
    deliveredHours: status === "Active" ? 24 : 0,
    daysInStatus: [6, 9, 16, 24, 21, 12, 18, 4, 15][stageIndex] ?? 7,
    startDate: status === "Active" ? "2026-04-08" : "—",
    riskLevel: (status === "Flaked" || status.includes("Authorization") ? "Critical" : status === "Missing Info" || status === "Staffing Needed" ? "High" : "Medium") as RiskLevel,
    notes: status === "Flaked" ? "Follow-up required after approval." : status === "Missing Info" ? "Family outreach needed." : "Monitor next handoff.",
  })),
);

export const clients: ClientRecord[] = [
  ...riverdaleClients,
  ...clinics.filter((c) => c.id !== "riverdale").flatMap((clinic, clinicIndex) =>
    Array.from({ length: Math.min(8, clinic.activeClients + clinic.pipelineClients) }, (_, i) => ({
      id: `${clinic.id}-${i}`,
      name: ["Noah Carter", "Olivia Green", "Eli Parker", "Mia Bennett", "Lucas Reed", "Ava Coleman", "Mason Hall", "Sophia James"][i],
      status: i < 3 ? "Active" : ["Pending Treatment Auth", "Staffing Needed", "Schedule Assessment", "In QA", "Missing Info"][i - 3] ?? "Active",
      state: clinic.state,
      clinic: clinic.clinic,
      serviceSetting: ["Home", "School", "Clinic"][i % 3] as ServiceSetting,
      bcba: ["Dana Morris", "Kim Ward", "Riley Foster", "Sam Patel"][i % 4],
      rbt: i < 3 ? ["Maya Chen", "Jordan Lee", "Tara Kim"][i % 3] : i === 4 ? "Needed" : "Pending",
      insurance: ["Aetna", "BCBS", "Medicaid", "United"][i % 4],
      authStatus: i < 3 ? "Approved" : i === 3 ? "Submitted" : "Pending",
      authorizedHours: i < 5 ? 30 + (i % 3) * 5 : 0,
      deliveredHours: i < 3 ? 24 + (i % 2) * 4 : 0,
      daysInStatus: 4 + clinicIndex * 2 + i,
      startDate: i < 3 ? "2026-04-01" : "—",
      riskLevel: i === 4 ? "High" : clinic.healthStatus === "Critical" ? "High" : "Medium",
      notes: "Mock client for dashboard drilldown.",
    })),
  ),
];

export const pipelineStages: PipelineStage[] = [
  { stage: "Lead / Sent Form", count: 22, avgDays: 4, stuckTooLong: false },
  { stage: "Missing Info", count: 11, avgDays: 9, stuckTooLong: true },
  { stage: "Sent to VOB", count: 16, avgDays: 3, stuckTooLong: false },
  { stage: "No DX", count: 4, avgDays: 12, stuckTooLong: true },
  { stage: "Pending Initial Auth", count: 18, avgDays: 23, stuckTooLong: true },
  { stage: "Schedule Assessment", count: 13, avgDays: 18, stuckTooLong: true },
  { stage: "In QA", count: 8, avgDays: 11, stuckTooLong: false },
  { stage: "Pending Treatment Auth", count: 12, avgDays: 19, stuckTooLong: false },
  { stage: "Staffing Needed", count: 28, avgDays: 17, stuckTooLong: true },
  { stage: "Pending Start Date", count: 9, avgDays: 6, stuckTooLong: false },
  { stage: "Active", count: 137, avgDays: 0, stuckTooLong: false },
  { stage: "Flaked", count: 5, avgDays: 15, stuckTooLong: true },
  { stage: "Discharged", count: 7, avgDays: 0, stuckTooLong: false },
  { stage: "Services on Pause", count: 6, avgDays: 14, stuckTooLong: true },
];

export const redFlags: RedFlag[] = [
  { type: "Pending Auth over 21 days", target: "Ares Jackson", owner: "Auth Team", daysOpen: 24, severity: "Critical", action: "Escalate payor follow-up today." },
  { type: "Staffing Needed over 14 days", target: "Azaria Daniel", owner: "Staffing", daysOpen: 18, severity: "Critical", action: "Assign RBT candidate or create coverage plan." },
  { type: "Missing Info over 7 days", target: "Skylar Dennis", owner: "Intake", daysOpen: 9, severity: "Watch", action: "Call family and document blocker." },
  { type: "Low utilization under 70%", target: "Tennessee", owner: "Ops", daysOpen: 12, severity: "Critical", action: "Review missed sessions and RBT capacity." },
  { type: "In QA over 14 days", target: "Levi Banks", owner: "QA", daysOpen: 12, severity: "Watch", action: "Confirm missing clinical items." },
  { type: "Auth expiring within 30 days", target: "Maryland", owner: "Auth Team", daysOpen: 3, severity: "Info", action: "Queue reauth documentation." },
];

export const insights = [
  { insight: "Most delays are happening before authorization.", why: "Forms, missing information, and no-DX cases are stopping clients before revenue-producing steps.", action: "Create a daily intake blocker review for families missing documents." },
  { insight: "Riverdale has demand but low active conversion.", why: "The clinic has 18 pipeline clients and only 1 active client.", action: "Prioritize Riverdale auth and assessment handoffs this week." },
  { insight: "Staffing will become a larger issue as pending treatment auths are approved.", why: "Twenty-eight clients are already waiting for staff and more are approaching approval.", action: "Start proactive RBT matching before approval is received." },
  { insight: "Clinic-based services are outperforming home-based utilization.", why: "Clinic delivery is at 88% utilization compared with 72% for home-based care.", action: "Review home-based cancellations and travel constraints." },
  { insight: "Flaked clients are happening after approval.", why: "Approved families are dropping before start, creating lost authorization value.", action: "Add a post-approval family confirmation workflow." },
];
