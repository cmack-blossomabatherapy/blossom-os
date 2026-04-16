// =================== Team mock dataset ===================

export type Department =
  | "Intake"
  | "Auth"
  | "QA"
  | "Scheduling"
  | "Staffing"
  | "Clinics"
  | "Exec";

export type TeamStatus = "Active" | "On Leave" | "Inactive";
export type WorkloadLevel = "Light" | "Normal" | "High" | "Overloaded";

export interface OwnedWork {
  leads: number;
  clients: number;
  auths: number;
  qa: number;
  tasksOpen: number;
  tasksOverdue: number;
  tasksCompletedMonth: number;
}

export interface PerformanceMetric {
  label: string;
  value: string;
  trend: "up" | "down" | "neutral";
}

export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  role: string;
  department: Department;
  states: string[];
  email: string;
  phone: string;
  status: TeamStatus;
  hiredAt: string;
  reportsTo: string | null; // memberId
  responsibilities: string[];
  workload: OwnedWork;
  workloadLevel: WorkloadLevel;
  performance: PerformanceMetric[];
  // for the workload bar (% of capacity)
  capacityPct: number;
}

const m = (
  id: string,
  name: string,
  role: string,
  department: Department,
  states: string[],
  reportsTo: string | null,
  status: TeamStatus,
  workload: OwnedWork,
  capacityPct: number,
  responsibilities: string[],
  performance: PerformanceMetric[],
): TeamMember => ({
  id,
  name,
  initials: name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase(),
  role,
  department,
  states,
  email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@blossomaba.com`,
  phone: "+1 (555) 010-" + String(1000 + Math.floor(Math.random() * 8999)).slice(0, 4),
  status,
  hiredAt: new Date(Date.now() - Math.floor(Math.random() * 900) * 86400_000).toISOString(),
  reportsTo,
  responsibilities,
  workload,
  workloadLevel:
    capacityPct >= 100 ? "Overloaded" : capacityPct >= 80 ? "High" : capacityPct >= 40 ? "Normal" : "Light",
  performance,
  capacityPct,
});

export const mockTeam: TeamMember[] = [
  // Exec
  m(
    "TM-001",
    "Mordy Greenberg",
    "Director of Operations",
    "Exec",
    ["GA", "TX", "AZ"],
    null,
    "Active",
    { leads: 0, clients: 0, auths: 4, qa: 2, tasksOpen: 6, tasksOverdue: 1, tasksCompletedMonth: 38 },
    62,
    ["Approves auth strategy", "Owns escalations", "Capacity planning"],
    [
      { label: "Decisions / wk", value: "24", trend: "up" },
      { label: "Escalations resolved", value: "97%", trend: "up" },
    ],
  ),
  m(
    "TM-002",
    "Rachel Cohen",
    "Operations Manager",
    "Exec",
    ["GA", "TX", "AZ"],
    "TM-001",
    "Active",
    { leads: 0, clients: 0, auths: 0, qa: 0, tasksOpen: 4, tasksOverdue: 0, tasksCompletedMonth: 22 },
    45,
    ["Cross-team coordination", "SOP enforcement", "Reports & KPIs"],
    [
      { label: "SLA compliance", value: "94%", trend: "up" },
      { label: "Reports shipped", value: "12", trend: "neutral" },
    ],
  ),

  // Intake
  m(
    "TM-010",
    "Sarah Mitchell",
    "Intake Coordinator",
    "Intake",
    ["GA", "TX"],
    "TM-002",
    "Active",
    { leads: 18, clients: 0, auths: 0, qa: 0, tasksOpen: 14, tasksOverdue: 3, tasksCompletedMonth: 87 },
    92,
    ["Outreach", "Form sending", "Missing info follow-up", "VOB initiation"],
    [
      { label: "Leads handled", value: "87", trend: "up" },
      { label: "Avg contact time", value: "1.4h", trend: "down" },
      { label: "Conversion %", value: "62%", trend: "up" },
    ],
  ),
  m(
    "TM-011",
    "James Rodriguez",
    "Intake Coordinator",
    "Intake",
    ["TX", "AZ"],
    "TM-002",
    "Active",
    { leads: 15, clients: 0, auths: 0, qa: 0, tasksOpen: 9, tasksOverdue: 0, tasksCompletedMonth: 71 },
    68,
    ["Outreach", "Form sending", "VOB initiation"],
    [
      { label: "Leads handled", value: "71", trend: "neutral" },
      { label: "Avg contact time", value: "2.1h", trend: "neutral" },
      { label: "Conversion %", value: "54%", trend: "up" },
    ],
  ),
  m(
    "TM-012",
    "Jenna Park",
    "Intake Coordinator",
    "Intake",
    ["GA"],
    "TM-002",
    "On Leave",
    { leads: 4, clients: 0, auths: 0, qa: 0, tasksOpen: 2, tasksOverdue: 0, tasksCompletedMonth: 14 },
    18,
    ["Outreach", "Form sending"],
    [
      { label: "Leads handled", value: "14", trend: "down" },
      { label: "Conversion %", value: "48%", trend: "neutral" },
    ],
  ),

  // Authorizations
  m(
    "TM-020",
    "Priya Kapoor",
    "Auth Coordinator",
    "Auth",
    ["GA", "TX", "AZ"],
    "TM-001",
    "Active",
    { leads: 0, clients: 0, auths: 22, qa: 0, tasksOpen: 16, tasksOverdue: 4, tasksCompletedMonth: 64 },
    104,
    ["Submit authorizations", "Payor follow-up", "Renewal cycles"],
    [
      { label: "Auths submitted", value: "64", trend: "up" },
      { label: "Approval rate", value: "91%", trend: "up" },
      { label: "Avg time to submit", value: "3.2d", trend: "down" },
    ],
  ),
  m(
    "TM-021",
    "Marcus Taylor",
    "Auth Coordinator",
    "Auth",
    ["GA", "TX"],
    "TM-001",
    "Active",
    { leads: 0, clients: 0, auths: 19, qa: 0, tasksOpen: 11, tasksOverdue: 1, tasksCompletedMonth: 52 },
    78,
    ["Submit authorizations", "Payor follow-up", "Documentation review"],
    [
      { label: "Auths submitted", value: "52", trend: "neutral" },
      { label: "Approval rate", value: "88%", trend: "neutral" },
      { label: "Avg time to submit", value: "4.1d", trend: "neutral" },
    ],
  ),

  // QA
  m(
    "TM-030",
    "Lisa Wang",
    "QA Reviewer",
    "QA",
    ["GA", "TX", "AZ"],
    "TM-001",
    "Active",
    { leads: 0, clients: 0, auths: 0, qa: 9, tasksOpen: 6, tasksOverdue: 0, tasksCompletedMonth: 41 },
    72,
    ["Treatment plan review", "QA checklist completion", "Hand-off to auth"],
    [
      { label: "QA turnaround", value: "1.8d", trend: "down" },
      { label: "Items completed", value: "41", trend: "up" },
      { label: "Rejection rate", value: "8%", trend: "down" },
    ],
  ),

  // Scheduling
  m(
    "TM-040",
    "David Chen",
    "Scheduler",
    "Scheduling",
    ["GA", "TX", "AZ"],
    "TM-002",
    "Active",
    { leads: 0, clients: 14, auths: 0, qa: 0, tasksOpen: 12, tasksOverdue: 2, tasksCompletedMonth: 58 },
    85,
    ["Assessment scheduling", "Build schedules", "Confirm start dates"],
    [
      { label: "Time to schedule", value: "2.3d", trend: "down" },
      { label: "Time to start date", value: "11d", trend: "neutral" },
      { label: "Schedules built", value: "58", trend: "up" },
    ],
  ),

  // Staffing
  m(
    "TM-050",
    "Maya Foster",
    "Staffing Coordinator",
    "Staffing",
    ["GA", "TX"],
    "TM-002",
    "Active",
    { leads: 0, clients: 11, auths: 0, qa: 0, tasksOpen: 8, tasksOverdue: 1, tasksCompletedMonth: 33 },
    66,
    ["RBT assignment", "Availability matching", "Pairing emails"],
    [
      { label: "Time to assign RBT", value: "3.4d", trend: "down" },
      { label: "Fill rate", value: "82%", trend: "up" },
      { label: "Reassignments", value: "4", trend: "neutral" },
    ],
  ),

  // Clinics (BCBAs)
  m(
    "TM-060",
    "Dr. Hannah Kim",
    "BCBA",
    "Clinics",
    ["GA", "TX"],
    "TM-001",
    "Active",
    { leads: 0, clients: 24, auths: 0, qa: 0, tasksOpen: 10, tasksOverdue: 0, tasksCompletedMonth: 47 },
    88,
    ["Assessments", "Treatment plans", "RBT supervision"],
    [
      { label: "Active caseload", value: "24", trend: "up" },
      { label: "Plan turnaround", value: "5.1d", trend: "neutral" },
    ],
  ),
  m(
    "TM-061",
    "Dr. Daniel Lee",
    "BCBA",
    "Clinics",
    ["GA", "TX"],
    "TM-001",
    "Active",
    { leads: 0, clients: 18, auths: 0, qa: 0, tasksOpen: 7, tasksOverdue: 0, tasksCompletedMonth: 39 },
    72,
    ["Assessments", "Treatment plans", "RBT supervision"],
    [
      { label: "Active caseload", value: "18", trend: "neutral" },
      { label: "Plan turnaround", value: "4.7d", trend: "down" },
    ],
  ),
];

// =================== Helpers ===================

export const departmentVariant = (
  d: Department,
): "default" | "success" | "warning" | "destructive" | "info" | "muted" =>
  ({
    Intake: "info",
    Auth: "warning",
    QA: "default",
    Scheduling: "success",
    Staffing: "info",
    Clinics: "success",
    Exec: "muted",
  } as const)[d];

export const statusVariant = (
  s: TeamStatus,
): "default" | "success" | "warning" | "destructive" | "info" | "muted" =>
  ({ Active: "success", "On Leave": "warning", Inactive: "muted" } as const)[s];

export const workloadVariant = (
  w: WorkloadLevel,
): "default" | "success" | "warning" | "destructive" | "info" | "muted" =>
  ({ Light: "muted", Normal: "success", High: "warning", Overloaded: "destructive" } as const)[w];

export const capacityColor = (pct: number): string => {
  if (pct >= 100) return "bg-destructive";
  if (pct >= 80) return "bg-warning";
  if (pct >= 40) return "bg-success";
  return "bg-muted-foreground/40";
};

export const capacityTextColor = (pct: number): string => {
  if (pct >= 100) return "text-destructive";
  if (pct >= 80) return "text-warning";
  if (pct >= 40) return "text-success";
  return "text-muted-foreground";
};

export const findMember = (id: string) => mockTeam.find((t) => t.id === id);

export type TeamSavedView =
  | "all"
  | "intake"
  | "auth"
  | "qa"
  | "scheduling"
  | "staffing"
  | "clinics"
  | "leadership"
  | "my-team";

export const filterTeamByView = (list: TeamMember[], view: TeamSavedView): TeamMember[] => {
  switch (view) {
    case "intake":
      return list.filter((t) => t.department === "Intake");
    case "auth":
      return list.filter((t) => t.department === "Auth");
    case "qa":
      return list.filter((t) => t.department === "QA");
    case "scheduling":
      return list.filter((t) => t.department === "Scheduling");
    case "staffing":
      return list.filter((t) => t.department === "Staffing");
    case "clinics":
      return list.filter((t) => t.department === "Clinics");
    case "leadership":
      return list.filter((t) => t.department === "Exec");
    case "my-team":
      return list.filter((t) => t.reportsTo === "TM-002");
    default:
      return list;
  }
};

export const departmentOrder: Department[] = [
  "Exec",
  "Intake",
  "Auth",
  "QA",
  "Scheduling",
  "Staffing",
  "Clinics",
];
