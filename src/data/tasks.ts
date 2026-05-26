import { mockLeads } from "./leads";
import { mockClients } from "./clients";

export type TaskDepartment = "Intake" | "Auth" | "QA" | "Scheduling" | "Staffing" | "Operations";
export type TaskStatus = "Open" | "In Progress" | "Completed" | "Blocked";
export type TaskPriority = "High" | "Medium" | "Low";
export type TaskLinkedType = "Lead" | "Client" | "Authorization" | "QA";
export type BlockerType =
  | "Waiting on Client"
  | "Waiting on Document"
  | "Waiting on Auth"
  | "Waiting on QA"
  | "Waiting on BCBA";

export interface TaskComment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

export interface TaskTimelineEvent {
  id: string;
  type: "created" | "updated" | "reassigned" | "completed" | "blocked" | "system";
  description: string;
  timestamp: string;
  user?: string;
}

export interface TaskRecord {
  id: string;
  title: string;
  department: TaskDepartment;
  type: string; // specific task name e.g. "Review Intake Packet"
  linkedRecordType: TaskLinkedType;
  linkedRecordId: string | null;
  linkedRecordLabel: string;
  currentStage: string;
  status: TaskStatus;
  priority: TaskPriority;
  owner: string;
  state: string;
  createdAt: string;
  dueDate: string;
  completedAt: string | null;
  blocker: BlockerType | null;
  blockerDetail: string | null;
  notes: string;
  comments: TaskComment[];
  timeline: TaskTimelineEvent[];
  automationOrigin: string | null;
}

const daysAgo = (n: number) => new Date(Date.now() - n * 86400_000).toISOString();
const daysAhead = (n: number) => new Date(Date.now() + n * 86400_000).toISOString();
const hoursAhead = (n: number) => new Date(Date.now() + n * 3600_000).toISOString();
const hoursAgo = (n: number) => new Date(Date.now() - n * 3600_000).toISOString();

const lead = (i: number) => mockLeads[i];
const client = (i: number) => mockClients[i];

export const mockTasks: TaskRecord[] = [];

// =============== Helpers ===============

export const taskStatusVariant = (
  s: TaskStatus,
): "default" | "success" | "warning" | "destructive" | "info" | "muted" => ({
  Open: "muted",
  "In Progress": "info",
  Completed: "success",
  Blocked: "destructive",
} as const)[s];

export const taskPriorityVariant = (
  p: TaskPriority,
): "default" | "success" | "warning" | "destructive" | "info" | "muted" => ({
  High: "destructive",
  Medium: "warning",
  Low: "muted",
} as const)[p];

export const departmentVariant = (
  d: TaskDepartment,
): "default" | "success" | "warning" | "destructive" | "info" | "muted" => ({
  Intake: "info",
  Auth: "warning",
  QA: "default",
  Scheduling: "success",
  Staffing: "info",
  Operations: "muted",
} as const)[d];

export const linkedTypeVariant = (
  t: TaskLinkedType,
): "default" | "success" | "warning" | "destructive" | "info" | "muted" => ({
  Lead: "info",
  Client: "success",
  Authorization: "warning",
  QA: "default",
} as const)[t];

export const isOverdue = (t: TaskRecord): boolean => {
  if (t.status === "Completed") return false;
  return new Date(t.dueDate).getTime() < Date.now();
};

export const isDueToday = (t: TaskRecord): boolean => {
  if (t.status === "Completed") return false;
  const d = new Date(t.dueDate);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate() &&
    !isOverdue(t)
  );
};

export const formatTaskDate = (iso: string): string => {
  const d = new Date(iso);
  const now = Date.now();
  const diffMs = d.getTime() - now;
  const diffDays = Math.round(diffMs / 86400_000);
  const diffHours = Math.round(diffMs / 3600_000);

  if (Math.abs(diffHours) < 1) return "Now";
  if (Math.abs(diffHours) < 24) {
    return diffHours > 0 ? `In ${diffHours}h` : `${Math.abs(diffHours)}h ago`;
  }
  if (Math.abs(diffDays) <= 7) {
    return diffDays > 0 ? `In ${diffDays}d` : `${Math.abs(diffDays)}d ago`;
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export const findTask = (id: string) => mockTasks.find((t) => t.id === id);

export type TaskSavedView =
  | "my-tasks"
  | "today"
  | "overdue"
  | "intake"
  | "auth"
  | "qa"
  | "scheduling"
  | "staffing"
  | "blockers"
  | "all";

const ME = "Sarah M."; // mock current user

export const filterTasksByView = (tasks: TaskRecord[], view: TaskSavedView): TaskRecord[] => {
  switch (view) {
    case "my-tasks":
      return tasks.filter((t) => t.owner === ME && t.status !== "Completed");
    case "today":
      return tasks.filter(isDueToday);
    case "overdue":
      return tasks.filter(isOverdue);
    case "intake":
      return tasks.filter((t) => t.department === "Intake");
    case "auth":
      return tasks.filter((t) => t.department === "Auth");
    case "qa":
      return tasks.filter((t) => t.department === "QA");
    case "scheduling":
      return tasks.filter((t) => t.department === "Scheduling");
    case "staffing":
      return tasks.filter((t) => t.department === "Staffing");
    case "blockers":
      return tasks.filter((t) => t.status === "Blocked");
    default:
      return tasks;
  }
};

export const departmentOrder: TaskDepartment[] = [];
