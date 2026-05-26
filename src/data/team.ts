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

export const mockTeam: TeamMember[] = [];

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

export const departmentOrder: Department[] = [];
