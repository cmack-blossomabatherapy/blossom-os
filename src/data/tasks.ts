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

export const mockTasks: TaskRecord[] = [
  // ========== OVERDUE ==========
  {
    id: "TSK-5001",
    title: "Collect Missing Information",
    department: "Intake",
    type: "Collect Missing Information",
    linkedRecordType: "Lead",
    linkedRecordId: lead(2)?.id ?? null,
    linkedRecordLabel: lead(2)?.childName ?? "—",
    currentStage: "Missing Information",
    status: "Blocked",
    priority: "High",
    owner: "Sarah M.",
    state: "AZ",
    createdAt: daysAgo(6),
    dueDate: daysAgo(2),
    completedAt: null,
    blocker: "Waiting on Client",
    blockerDetail: "Parent has not returned consent forms after 3 attempts",
    notes: "Escalate to clinical lead if not resolved by EOD",
    comments: [
      { id: "c1", author: "Sarah M.", text: "Left voicemail; sent SMS reminder.", timestamp: daysAgo(3) },
    ],
    timeline: [
      { id: "t1", type: "created", description: "Auto-created from Missing Info workflow", timestamp: daysAgo(6) },
      { id: "t2", type: "blocked", description: "Marked blocked: Waiting on Client", timestamp: daysAgo(3), user: "Sarah M." },
    ],
    automationOrigin: "Missing Info → Collect Missing Information",
  },
  {
    id: "TSK-5002",
    title: "Submit Authorization",
    department: "Auth",
    type: "Submit Authorization",
    linkedRecordType: "Authorization",
    linkedRecordId: "AUTH-2110",
    linkedRecordLabel: client(4)?.childName ?? "—",
    currentStage: "Pending Treatment Auth",
    status: "Blocked",
    priority: "High",
    owner: "Mordy G.",
    state: "TX",
    createdAt: daysAgo(5),
    dueDate: daysAgo(1),
    completedAt: null,
    blocker: "Waiting on Document",
    blockerDetail: "Supporting Documentation not uploaded",
    notes: null as unknown as string,
    comments: [],
    timeline: [
      { id: "t1", type: "created", description: "Auto-created from QA → Auth handoff", timestamp: daysAgo(5) },
      { id: "t2", type: "blocked", description: "Blocked by missing documentation", timestamp: daysAgo(2) },
    ],
    automationOrigin: "QA Approved → Submit Authorization",
  },
  {
    id: "TSK-5003",
    title: "Confirm Treatment Plan",
    department: "Auth",
    type: "Confirm Treatment Plan",
    linkedRecordType: "Client",
    linkedRecordId: client(3)?.id ?? null,
    linkedRecordLabel: client(3)?.childName ?? "—",
    currentStage: "Pending Treatment Auth",
    status: "In Progress",
    priority: "High",
    owner: "Mordy G.",
    state: "GA",
    createdAt: daysAgo(4),
    dueDate: daysAgo(1),
    completedAt: null,
    blocker: null,
    blockerDetail: null,
    notes: "Reviewed v2; one revision needed before submission.",
    comments: [],
    timeline: [
      { id: "t1", type: "created", description: "Auto-created when QA approved", timestamp: daysAgo(4) },
      { id: "t2", type: "updated", description: "Status: In Progress", timestamp: daysAgo(2), user: "Mordy G." },
    ],
    automationOrigin: "QA Approved → Confirm Treatment Plan",
  },

  // ========== DUE TODAY ==========
  {
    id: "TSK-5004",
    title: "Review Intake Packet",
    department: "Intake",
    type: "Review Intake Packet",
    linkedRecordType: "Lead",
    linkedRecordId: lead(0)?.id ?? null,
    linkedRecordLabel: lead(0)?.childName ?? "—",
    currentStage: "Form Received",
    status: "Open",
    priority: "High",
    owner: "Sarah M.",
    state: "GA",
    createdAt: daysAgo(1),
    dueDate: hoursAhead(4),
    completedAt: null,
    blocker: null,
    blockerDetail: null,
    notes: "",
    comments: [],
    timeline: [{ id: "t1", type: "created", description: "Auto-created on form completion", timestamp: daysAgo(1) }],
    automationOrigin: "Form Received → Review Intake Packet",
  },
  {
    id: "TSK-5005",
    title: "Set Insurance Type",
    department: "Intake",
    type: "Set Insurance Type",
    linkedRecordType: "Lead",
    linkedRecordId: lead(1)?.id ?? null,
    linkedRecordLabel: lead(1)?.childName ?? "—",
    currentStage: "Form Received",
    status: "Open",
    priority: "Medium",
    owner: "James R.",
    state: "GA",
    createdAt: daysAgo(1),
    dueDate: hoursAhead(6),
    completedAt: null,
    blocker: null,
    blockerDetail: null,
    notes: "",
    comments: [],
    timeline: [{ id: "t1", type: "created", description: "Auto-created on form completion", timestamp: daysAgo(1) }],
    automationOrigin: "Form Received → Set Insurance",
  },
  {
    id: "TSK-5006",
    title: "Assign RBT",
    department: "Staffing",
    type: "Assign RBT",
    linkedRecordType: "Client",
    linkedRecordId: client(5)?.id ?? null,
    linkedRecordLabel: client(5)?.childName ?? "—",
    currentStage: "Staffing Needed",
    status: "In Progress",
    priority: "High",
    owner: "David C.",
    state: "GA",
    createdAt: daysAgo(2),
    dueDate: hoursAhead(8),
    completedAt: null,
    blocker: null,
    blockerDetail: null,
    notes: "2 candidates shortlisted",
    comments: [
      { id: "c1", author: "David C.", text: "Interviewing top candidate today at 3pm.", timestamp: hoursAgo(6) },
    ],
    timeline: [
      { id: "t1", type: "created", description: "Auto-created when stage = Staffing Needed", timestamp: daysAgo(2) },
      { id: "t2", type: "updated", description: "Moved to In Progress", timestamp: daysAgo(1), user: "David C." },
    ],
    automationOrigin: "Staffing Needed → Assign RBT",
  },

  // ========== NEXT UP ==========
  {
    id: "TSK-5007",
    title: "Confirm BCBA Assignment",
    department: "Scheduling",
    type: "Confirm BCBA Assignment",
    linkedRecordType: "Client",
    linkedRecordId: client(2)?.id ?? null,
    linkedRecordLabel: client(2)?.childName ?? "—",
    currentStage: "BCBA Assignment",
    status: "Open",
    priority: "Medium",
    owner: "Sarah M.",
    state: "GA",
    createdAt: daysAgo(0),
    dueDate: daysAhead(1),
    completedAt: null,
    blocker: null,
    blockerDetail: null,
    notes: "",
    comments: [],
    timeline: [{ id: "t1", type: "created", description: "Auto-created on intake handoff", timestamp: daysAgo(0) }],
    automationOrigin: "VOB Completed → Confirm BCBA",
  },
  {
    id: "TSK-5008",
    title: "Enter Assessment Date",
    department: "Scheduling",
    type: "Enter Assessment Date",
    linkedRecordType: "Client",
    linkedRecordId: client(2)?.id ?? null,
    linkedRecordLabel: client(2)?.childName ?? "—",
    currentStage: "Schedule Assessment",
    status: "Open",
    priority: "Medium",
    owner: "Sarah M.",
    state: "GA",
    createdAt: daysAgo(0),
    dueDate: daysAhead(2),
    completedAt: null,
    blocker: null,
    blockerDetail: null,
    notes: "",
    comments: [],
    timeline: [{ id: "t1", type: "created", description: "Auto-created from BCBA confirmation", timestamp: daysAgo(0) }],
    automationOrigin: "BCBA Confirmed → Enter Assessment",
  },
  {
    id: "TSK-5009",
    title: "Complete QA Checklist",
    department: "QA",
    type: "Complete QA Checklist",
    linkedRecordType: "QA",
    linkedRecordId: "QA-1207",
    linkedRecordLabel: client(0)?.childName ?? "—",
    currentStage: "In QA",
    status: "In Progress",
    priority: "Medium",
    owner: "Mordy G.",
    state: "GA",
    createdAt: daysAgo(1),
    dueDate: daysAhead(2),
    completedAt: null,
    blocker: null,
    blockerDetail: null,
    notes: "8/12 items complete",
    comments: [],
    timeline: [{ id: "t1", type: "created", description: "Auto-created when stage = In QA", timestamp: daysAgo(1) }],
    automationOrigin: "Treatment Plan Submitted → Complete QA",
  },
  {
    id: "TSK-5010",
    title: "Build Schedule",
    department: "Scheduling",
    type: "Build Schedule",
    linkedRecordType: "Client",
    linkedRecordId: client(1)?.id ?? null,
    linkedRecordLabel: client(1)?.childName ?? "—",
    currentStage: "Pending Start Date",
    status: "Open",
    priority: "Medium",
    owner: "Sarah M.",
    state: "GA",
    createdAt: daysAgo(0),
    dueDate: daysAhead(3),
    completedAt: null,
    blocker: null,
    blockerDetail: null,
    notes: "",
    comments: [],
    timeline: [{ id: "t1", type: "created", description: "Auto-created from staffing complete", timestamp: daysAgo(0) }],
    automationOrigin: "RBT Assigned → Build Schedule",
  },
  {
    id: "TSK-5011",
    title: "Generate Case Coordination Document",
    department: "Operations",
    type: "Generate Case Coordination Document",
    linkedRecordType: "Client",
    linkedRecordId: client(0)?.id ?? null,
    linkedRecordLabel: client(0)?.childName ?? "—",
    currentStage: "Pending Start Date",
    status: "Open",
    priority: "Low",
    owner: "Mordy G.",
    state: "GA",
    createdAt: daysAgo(0),
    dueDate: daysAhead(4),
    completedAt: null,
    blocker: null,
    blockerDetail: null,
    notes: "",
    comments: [],
    timeline: [{ id: "t1", type: "created", description: "Auto-created", timestamp: daysAgo(0) }],
    automationOrigin: "Schedule Built → Generate Case Coord",
  },

  // ========== BLOCKED (additional) ==========
  {
    id: "TSK-5012",
    title: "Review Treatment Plan",
    department: "QA",
    type: "Review Treatment Plan",
    linkedRecordType: "QA",
    linkedRecordId: "QA-1212",
    linkedRecordLabel: client(5)?.childName ?? "—",
    currentStage: "In QA",
    status: "Blocked",
    priority: "High",
    owner: "Mordy G.",
    state: "GA",
    createdAt: daysAgo(4),
    dueDate: daysAhead(1),
    completedAt: null,
    blocker: "Waiting on BCBA",
    blockerDetail: "Treatment Plan v1 not yet uploaded",
    notes: "",
    comments: [],
    timeline: [
      { id: "t1", type: "created", description: "Auto-created", timestamp: daysAgo(4) },
      { id: "t2", type: "blocked", description: "Blocked: BCBA not submitted plan", timestamp: daysAgo(2) },
    ],
    automationOrigin: "QA Stage → Review Treatment Plan",
  },
  {
    id: "TSK-5013",
    title: "Fix Missing Documentation",
    department: "Auth",
    type: "Fix Missing Documentation",
    linkedRecordType: "Authorization",
    linkedRecordId: "AUTH-2110",
    linkedRecordLabel: client(4)?.childName ?? "—",
    currentStage: "Pending Treatment Auth",
    status: "Blocked",
    priority: "High",
    owner: "Mordy G.",
    state: "TX",
    createdAt: daysAgo(3),
    dueDate: daysAhead(2),
    completedAt: null,
    blocker: "Waiting on Document",
    blockerDetail: "Supporting Documentation overdue",
    notes: "",
    comments: [],
    timeline: [
      { id: "t1", type: "created", description: "Auto-created from auth blocker", timestamp: daysAgo(3) },
    ],
    automationOrigin: "Auth Blocked → Fix Documentation",
  },

  // ========== COMPLETED ==========
  {
    id: "TSK-5014",
    title: "Send Pairing Email",
    department: "Operations",
    type: "Send Pairing Email",
    linkedRecordType: "Client",
    linkedRecordId: client(0)?.id ?? null,
    linkedRecordLabel: client(0)?.childName ?? "—",
    currentStage: "Active",
    status: "Completed",
    priority: "Low",
    owner: "Sarah M.",
    state: "GA",
    createdAt: daysAgo(3),
    dueDate: daysAgo(2),
    completedAt: daysAgo(2),
    blocker: null,
    blockerDetail: null,
    notes: "Sent to family + RBT",
    comments: [],
    timeline: [
      { id: "t1", type: "created", description: "Auto-created", timestamp: daysAgo(3) },
      { id: "t2", type: "completed", description: "Marked complete", timestamp: daysAgo(2), user: "Sarah M." },
    ],
    automationOrigin: "RBT Assigned → Send Pairing Email",
  },
  {
    id: "TSK-5015",
    title: "Mark Ready for Submission",
    department: "QA",
    type: "Mark Ready for Submission",
    linkedRecordType: "QA",
    linkedRecordId: "QA-1207",
    linkedRecordLabel: client(0)?.childName ?? "—",
    currentStage: "Pending Treatment Auth",
    status: "Completed",
    priority: "Medium",
    owner: "Mordy G.",
    state: "GA",
    createdAt: daysAgo(4),
    dueDate: daysAgo(3),
    completedAt: daysAgo(3),
    blocker: null,
    blockerDetail: null,
    notes: "",
    comments: [],
    timeline: [
      { id: "t1", type: "created", description: "Auto-created", timestamp: daysAgo(4) },
      { id: "t2", type: "completed", description: "QA approved", timestamp: daysAgo(3), user: "Mordy G." },
    ],
    automationOrigin: "QA Checklist Done → Mark Ready",
  },
];

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

export const departmentOrder: TaskDepartment[] = [
  "Intake",
  "Auth",
  "QA",
  "Scheduling",
  "Staffing",
  "Operations",
];
