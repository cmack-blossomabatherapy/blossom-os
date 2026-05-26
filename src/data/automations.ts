// =================== Automations mock dataset ===================

export type WorkflowType = "Intake" | "Client" | "Auth" | "QA" | "Scheduling" | "Staffing" | "Document" | "Task" | "Global";
export type AutomationStatus = "Active" | "Paused" | "Error";
export type TriggerType =
  | "Status Changes"
  | "Document Uploaded"
  | "Field Updated"
  | "Date Reached"
  | "Task Completed"
  | "Record Created"
  | "Timer";

export type ConditionOp = "equals" | "not_equals" | "is_set" | "is_empty";
export type ActionType =
  | "Move to Stage"
  | "Create Task"
  | "Assign Owner"
  | "Send Email"
  | "Send SMS"
  | "Create Record"
  | "Update Field"
  | "Trigger Automation"
  | "Send Alert";

export interface AutomationCondition {
  field: string;
  op: ConditionOp;
  value?: string;
}

export interface AutomationAction {
  type: ActionType;
  detail: string;
}

export interface AutomationFailsafe {
  enabled: boolean;
  afterDays: number;
  action: "Send Alert" | "Reassign" | "Escalate";
}

export interface AutomationRunLog {
  id: string;
  status: "success" | "failure";
  recordType: string;
  recordLabel: string;
  message: string;
  timestamp: string;
  errorDetail?: string;
}

export interface Automation {
  id: string;
  name: string;
  description: string;
  workflow: WorkflowType;
  triggerType: TriggerType;
  triggerLabel: string; // human readable
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  failsafe: AutomationFailsafe;
  status: AutomationStatus;
  owner: string;
  createdAt: string;
  lastRun: string;
  totalRuns: number;
  successRate: number; // 0-100
  highImpact: boolean;
  recentLogs: AutomationRunLog[];
}

const hoursAgo = (n: number) => new Date(Date.now() - n * 3600_000).toISOString();
const daysAgo = (n: number) => new Date(Date.now() - n * 86400_000).toISOString();

export const mockAutomations: Automation[] = [];

// =================== Helpers ===================

export const automationStatusVariant = (
  s: AutomationStatus,
): "default" | "success" | "warning" | "destructive" | "info" | "muted" => ({
  Active: "success",
  Paused: "muted",
  Error: "destructive",
} as const)[s];

export const workflowVariant = (
  w: WorkflowType,
): "default" | "success" | "warning" | "destructive" | "info" | "muted" => ({
  Intake: "info",
  Client: "success",
  Auth: "warning",
  QA: "default",
  Scheduling: "info",
  Staffing: "info",
  Document: "muted",
  Task: "muted",
  Global: "muted",
} as const)[w];

export const formatRelative = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export const findAutomation = (id: string) => mockAutomations.find((a) => a.id === id);

export type AutomationSavedView =
  | "all"
  | "intake"
  | "client"
  | "auth"
  | "qa"
  | "scheduling"
  | "failed"
  | "high-impact"
  | "paused";

export const filterAutomationsByView = (list: Automation[], view: AutomationSavedView): Automation[] => {
  switch (view) {
    case "intake":
      return list.filter((a) => a.workflow === "Intake");
    case "client":
      return list.filter((a) => a.workflow === "Client");
    case "auth":
      return list.filter((a) => a.workflow === "Auth");
    case "qa":
      return list.filter((a) => a.workflow === "QA");
    case "scheduling":
      return list.filter((a) => a.workflow === "Scheduling" || a.workflow === "Staffing");
    case "failed":
      return list.filter((a) => a.status === "Error");
    case "high-impact":
      return list.filter((a) => a.highImpact);
    case "paused":
      return list.filter((a) => a.status === "Paused");
    default:
      return list;
  }
};

// Visual flow nodes for lifecycle view
export interface FlowNode {
  id: string;
  label: string;
  workflow: WorkflowType;
  automationCount: number;
}

export const lifecycleFlow: FlowNode[] = [];
