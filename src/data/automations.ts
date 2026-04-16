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

export const mockAutomations: Automation[] = [
  // ============ INTAKE ============
  {
    id: "AUTO-001",
    name: "Form Completed → Move to Form Received",
    description: "When a parent completes the intake form via Pandadoc, advance the lead and create a VOB task.",
    workflow: "Intake",
    triggerType: "Status Changes",
    triggerLabel: "Lead form status = Complete",
    conditions: [{ field: "Form Status", op: "equals", value: "Complete" }],
    actions: [
      { type: "Move to Stage", detail: "Lead → Form Received" },
      { type: "Create Task", detail: "Send to VOB" },
      { type: "Send SMS", detail: "Confirmation to parent" },
    ],
    failsafe: { enabled: true, afterDays: 2, action: "Send Alert" },
    status: "Active",
    owner: "Sarah M.",
    createdAt: daysAgo(120),
    lastRun: hoursAgo(2),
    totalRuns: 487,
    successRate: 99,
    highImpact: true,
    recentLogs: [
      { id: "l1", status: "success", recordType: "Lead", recordLabel: "Mason Reid", message: "Moved to Form Received · VOB task created", timestamp: hoursAgo(2) },
      { id: "l2", status: "success", recordType: "Lead", recordLabel: "Aria Singh", message: "Moved to Form Received", timestamp: hoursAgo(8) },
    ],
  },
  {
    id: "AUTO-002",
    name: "Call Connected → Move to In Contact",
    description: "When phone-call status flips to Connected, move the lead and start the form-send sequence.",
    workflow: "Intake",
    triggerType: "Status Changes",
    triggerLabel: "Call status = Connected",
    conditions: [],
    actions: [
      { type: "Move to Stage", detail: "Lead → In Contact" },
      { type: "Create Task", detail: "Send Initial Form" },
      { type: "Send Email", detail: "Welcome packet" },
    ],
    failsafe: { enabled: false, afterDays: 0, action: "Send Alert" },
    status: "Active",
    owner: "Sarah M.",
    createdAt: daysAgo(115),
    lastRun: hoursAgo(1),
    totalRuns: 312,
    successRate: 100,
    highImpact: true,
    recentLogs: [
      { id: "l1", status: "success", recordType: "Lead", recordLabel: "Jamie Lee", message: "Moved to In Contact", timestamp: hoursAgo(1) },
    ],
  },
  {
    id: "AUTO-003",
    name: "Missing Info → Move to Missing Information",
    description: "Detects intake gaps and re-routes the lead with a chase task.",
    workflow: "Intake",
    triggerType: "Field Updated",
    triggerLabel: "Form fields incomplete",
    conditions: [{ field: "Required Fields", op: "is_empty" }],
    actions: [
      { type: "Move to Stage", detail: "Lead → Missing Information" },
      { type: "Create Task", detail: "Collect Missing Information" },
      { type: "Send SMS", detail: "Reminder to parent" },
    ],
    failsafe: { enabled: true, afterDays: 3, action: "Escalate" },
    status: "Active",
    owner: "Sarah M.",
    createdAt: daysAgo(90),
    lastRun: hoursAgo(6),
    totalRuns: 148,
    successRate: 96,
    highImpact: false,
    recentLogs: [
      { id: "l1", status: "success", recordType: "Lead", recordLabel: "Wei Chen", message: "Moved to Missing Info", timestamp: hoursAgo(6) },
    ],
  },
  {
    id: "AUTO-004",
    name: "VOB Approved → Convert to Client",
    description: "Promotes a qualified lead to the client lifecycle with BCBA assignment task.",
    workflow: "Intake",
    triggerType: "Status Changes",
    triggerLabel: "VOB status = Approved",
    conditions: [{ field: "VOB Status", op: "equals", value: "Approved" }],
    actions: [
      { type: "Create Record", detail: "Create Client record" },
      { type: "Move to Stage", detail: "Client → BCBA Assignment" },
      { type: "Create Task", detail: "Confirm BCBA Assignment" },
    ],
    failsafe: { enabled: true, afterDays: 1, action: "Send Alert" },
    status: "Active",
    owner: "Mordy G.",
    createdAt: daysAgo(180),
    lastRun: hoursAgo(20),
    totalRuns: 142,
    successRate: 100,
    highImpact: true,
    recentLogs: [
      { id: "l1", status: "success", recordType: "Lead", recordLabel: "Olivia Brown", message: "Client created · BCBA task generated", timestamp: hoursAgo(20) },
    ],
  },

  // ============ CLIENT ============
  {
    id: "AUTO-010",
    name: "BCBA Assigned → Pending Initial Auth",
    description: "Once a BCBA is on the case, advance the client and prep the auth packet.",
    workflow: "Client",
    triggerType: "Field Updated",
    triggerLabel: "Client.bcba is set",
    conditions: [{ field: "BCBA", op: "is_set" }],
    actions: [
      { type: "Move to Stage", detail: "Client → Pending Initial Auth" },
      { type: "Create Task", detail: "Submit Initial Auth" },
    ],
    failsafe: { enabled: false, afterDays: 0, action: "Send Alert" },
    status: "Active",
    owner: "Mordy G.",
    createdAt: daysAgo(180),
    lastRun: hoursAgo(12),
    totalRuns: 98,
    successRate: 100,
    highImpact: true,
    recentLogs: [
      { id: "l1", status: "success", recordType: "Client", recordLabel: "Aiden Patel", message: "Stage advanced · Auth task created", timestamp: hoursAgo(12) },
    ],
  },
  {
    id: "AUTO-011",
    name: "Consent Complete → Schedule Assessment",
    description: "Moves client forward when all consents are signed.",
    workflow: "Client",
    triggerType: "Document Uploaded",
    triggerLabel: "Consent Forms = Complete",
    conditions: [{ field: "Consent Status", op: "equals", value: "Complete" }],
    actions: [
      { type: "Move to Stage", detail: "Client → Schedule Assessment" },
      { type: "Create Task", detail: "Enter Assessment Date" },
    ],
    failsafe: { enabled: true, afterDays: 2, action: "Send Alert" },
    status: "Active",
    owner: "Sarah M.",
    createdAt: daysAgo(150),
    lastRun: daysAgo(1),
    totalRuns: 76,
    successRate: 100,
    highImpact: false,
    recentLogs: [],
  },
  {
    id: "AUTO-012",
    name: "Start Date Reached → Move to Active",
    description: "When the calendar hits the planned start date, flip the client to Active.",
    workflow: "Client",
    triggerType: "Date Reached",
    triggerLabel: "Client.startDate = today",
    conditions: [],
    actions: [
      { type: "Move to Stage", detail: "Client → Active" },
      { type: "Send Email", detail: "Welcome packet to family" },
      { type: "Create Task", detail: "Send Pairing Email" },
    ],
    failsafe: { enabled: false, afterDays: 0, action: "Send Alert" },
    status: "Active",
    owner: "David C.",
    createdAt: daysAgo(180),
    lastRun: daysAgo(2),
    totalRuns: 84,
    successRate: 99,
    highImpact: true,
    recentLogs: [
      { id: "l1", status: "success", recordType: "Client", recordLabel: "Emma Thompson", message: "Activated · Pairing email queued", timestamp: daysAgo(2) },
    ],
  },

  // ============ AUTH ============
  {
    id: "AUTO-020",
    name: "Missing Docs → Cannot Submit Auth",
    description: "Flags an auth that lacks supporting documentation and notifies ops.",
    workflow: "Auth",
    triggerType: "Field Updated",
    triggerLabel: "Auth packet missing documents",
    conditions: [{ field: "Missing Docs", op: "equals", value: "Yes" }],
    actions: [
      { type: "Move to Stage", detail: "Auth → Cannot Submit" },
      { type: "Create Task", detail: "Fix Missing Documentation" },
      { type: "Send Alert", detail: "Notify auth owner" },
    ],
    failsafe: { enabled: true, afterDays: 2, action: "Escalate" },
    status: "Active",
    owner: "Mordy G.",
    createdAt: daysAgo(120),
    lastRun: hoursAgo(4),
    totalRuns: 41,
    successRate: 95,
    highImpact: true,
    recentLogs: [
      { id: "l1", status: "success", recordType: "Authorization", recordLabel: "AUTH-2110", message: "Flagged · Fix Docs task created", timestamp: hoursAgo(4) },
    ],
  },
  {
    id: "AUTO-021",
    name: "Auth Approved → Staffing Needed",
    description: "When the payor approves, kick off staffing immediately.",
    workflow: "Auth",
    triggerType: "Status Changes",
    triggerLabel: "Auth status = Approved",
    conditions: [{ field: "Auth Status", op: "equals", value: "Approved" }],
    actions: [
      { type: "Move to Stage", detail: "Client → Staffing Needed" },
      { type: "Create Task", detail: "Assign RBT" },
      { type: "Send Email", detail: "Approval notice to parent" },
    ],
    failsafe: { enabled: true, afterDays: 1, action: "Send Alert" },
    status: "Active",
    owner: "Mordy G.",
    createdAt: daysAgo(160),
    lastRun: hoursAgo(18),
    totalRuns: 119,
    successRate: 100,
    highImpact: true,
    recentLogs: [
      { id: "l1", status: "success", recordType: "Client", recordLabel: "Noah Williams", message: "Stage → Staffing Needed", timestamp: hoursAgo(18) },
    ],
  },
  {
    id: "AUTO-022",
    name: "Auth Denied → Flag + Alert",
    description: "Surfaces denials to leadership and creates appeal task.",
    workflow: "Auth",
    triggerType: "Status Changes",
    triggerLabel: "Auth status = Denied",
    conditions: [{ field: "Auth Status", op: "equals", value: "Denied" }],
    actions: [
      { type: "Send Alert", detail: "Notify ops lead + clinical director" },
      { type: "Create Task", detail: "Begin appeal review" },
    ],
    failsafe: { enabled: true, afterDays: 3, action: "Escalate" },
    status: "Active",
    owner: "Mordy G.",
    createdAt: daysAgo(160),
    lastRun: daysAgo(4),
    totalRuns: 12,
    successRate: 100,
    highImpact: true,
    recentLogs: [
      { id: "l1", status: "success", recordType: "Authorization", recordLabel: "AUTH-2098", message: "Alert sent · Appeal task open", timestamp: daysAgo(4) },
    ],
  },
  {
    id: "AUTO-023",
    name: "Auth Expiring < 90 days → Renewal Task",
    description: "Daily scan creates renewal cycle tasks.",
    workflow: "Auth",
    triggerType: "Date Reached",
    triggerLabel: "Auth.expiresIn < 90 days",
    conditions: [],
    actions: [{ type: "Create Task", detail: "Begin renewal" }],
    failsafe: { enabled: false, afterDays: 0, action: "Send Alert" },
    status: "Active",
    owner: "Mordy G.",
    createdAt: daysAgo(200),
    lastRun: hoursAgo(10),
    totalRuns: 64,
    successRate: 100,
    highImpact: false,
    recentLogs: [],
  },

  // ============ QA ============
  {
    id: "AUTO-030",
    name: "Treatment Plan Received → QA Review",
    description: "Move plan into QA queue and assign reviewer.",
    workflow: "QA",
    triggerType: "Document Uploaded",
    triggerLabel: "Treatment Plan uploaded",
    conditions: [],
    actions: [
      { type: "Create Record", detail: "Create QA record" },
      { type: "Assign Owner", detail: "Round-robin QA reviewer" },
      { type: "Create Task", detail: "Complete QA Checklist" },
    ],
    failsafe: { enabled: true, afterDays: 5, action: "Escalate" },
    status: "Active",
    owner: "Mordy G.",
    createdAt: daysAgo(140),
    lastRun: daysAgo(1),
    totalRuns: 88,
    successRate: 98,
    highImpact: true,
    recentLogs: [
      { id: "l1", status: "success", recordType: "QA", recordLabel: "QA-1207", message: "Created · Reviewer assigned", timestamp: daysAgo(1) },
    ],
  },
  {
    id: "AUTO-031",
    name: "QA Complete → Pending Treatment Auth",
    description: "Once QA approves, hand off to authorization team.",
    workflow: "QA",
    triggerType: "Status Changes",
    triggerLabel: "QA status = Complete",
    conditions: [],
    actions: [
      { type: "Move to Stage", detail: "Client → Pending Treatment Auth" },
      { type: "Create Task", detail: "Submit Authorization" },
    ],
    failsafe: { enabled: true, afterDays: 1, action: "Send Alert" },
    status: "Active",
    owner: "Mordy G.",
    createdAt: daysAgo(140),
    lastRun: daysAgo(3),
    totalRuns: 79,
    successRate: 100,
    highImpact: true,
    recentLogs: [],
  },

  // ============ SCHEDULING / STAFFING ============
  {
    id: "AUTO-040",
    name: "RBT Assigned → Pending Start Date",
    description: "Tightens the loop between staffing and start.",
    workflow: "Staffing",
    triggerType: "Field Updated",
    triggerLabel: "Client.rbt is set",
    conditions: [{ field: "RBT", op: "is_set" }],
    actions: [
      { type: "Move to Stage", detail: "Client → Pending Start Date" },
      { type: "Create Task", detail: "Build Schedule" },
      { type: "Send Email", detail: "Pairing email to RBT + family" },
    ],
    failsafe: { enabled: false, afterDays: 0, action: "Send Alert" },
    status: "Active",
    owner: "David C.",
    createdAt: daysAgo(150),
    lastRun: hoursAgo(36),
    totalRuns: 71,
    successRate: 100,
    highImpact: true,
    recentLogs: [],
  },
  {
    id: "AUTO-041",
    name: "Staffing Missing > 7 days → Escalate",
    description: "Flags chronic staffing gaps to leadership.",
    workflow: "Staffing",
    triggerType: "Date Reached",
    triggerLabel: "Days in Staffing Needed > 7",
    conditions: [],
    actions: [
      { type: "Send Alert", detail: "Notify staffing lead + ops director" },
      { type: "Update Field", detail: "Set client priority = High" },
    ],
    failsafe: { enabled: false, afterDays: 0, action: "Send Alert" },
    status: "Active",
    owner: "David C.",
    createdAt: daysAgo(120),
    lastRun: hoursAgo(8),
    totalRuns: 22,
    successRate: 100,
    highImpact: true,
    recentLogs: [],
  },

  // ============ FAILED ============
  {
    id: "AUTO-090",
    name: "Send Pairing SMS via Twilio",
    description: "Texts the family + RBT a pairing message on schedule.",
    workflow: "Staffing",
    triggerType: "Status Changes",
    triggerLabel: "Client moved to Pending Start Date",
    conditions: [],
    actions: [{ type: "Send SMS", detail: "Pairing message via Twilio" }],
    failsafe: { enabled: true, afterDays: 1, action: "Send Alert" },
    status: "Error",
    owner: "David C.",
    createdAt: daysAgo(60),
    lastRun: hoursAgo(3),
    totalRuns: 41,
    successRate: 78,
    highImpact: false,
    recentLogs: [
      {
        id: "l1",
        status: "failure",
        recordType: "Client",
        recordLabel: "Liam Carter",
        message: "SMS not sent",
        timestamp: hoursAgo(3),
        errorDetail: "Twilio error 21610: recipient unsubscribed",
      },
      {
        id: "l2",
        status: "failure",
        recordType: "Client",
        recordLabel: "Sophia Reyes",
        message: "SMS not sent",
        timestamp: hoursAgo(20),
        errorDetail: "Twilio error 21408: phone not provisioned",
      },
    ],
  },
  {
    id: "AUTO-091",
    name: "Notify QA when Treatment Plan Uploaded",
    description: "Slack ping to #qa-review channel.",
    workflow: "QA",
    triggerType: "Document Uploaded",
    triggerLabel: "Treatment Plan uploaded",
    conditions: [],
    actions: [{ type: "Send Alert", detail: "Slack #qa-review" }],
    failsafe: { enabled: false, afterDays: 0, action: "Send Alert" },
    status: "Error",
    owner: "Mordy G.",
    createdAt: daysAgo(45),
    lastRun: hoursAgo(14),
    totalRuns: 28,
    successRate: 82,
    highImpact: false,
    recentLogs: [
      {
        id: "l1",
        status: "failure",
        recordType: "QA",
        recordLabel: "QA-1212",
        message: "Slack notification failed",
        timestamp: hoursAgo(14),
        errorDetail: "channel_not_found: #qa-review was archived",
      },
    ],
  },

  // ============ PAUSED ============
  {
    id: "AUTO-095",
    name: "Escalate Can't Reach after 5 attempts",
    description: "Auto-marks lead Can't Reach and notifies intake lead.",
    workflow: "Intake",
    triggerType: "Field Updated",
    triggerLabel: "Lead.callAttempts >= 5",
    conditions: [],
    actions: [
      { type: "Move to Stage", detail: "Lead → Can't Reach" },
      { type: "Send Alert", detail: "Notify intake lead" },
    ],
    failsafe: { enabled: false, afterDays: 0, action: "Send Alert" },
    status: "Paused",
    owner: "Sarah M.",
    createdAt: daysAgo(80),
    lastRun: daysAgo(8),
    totalRuns: 31,
    successRate: 100,
    highImpact: false,
    recentLogs: [],
  },
];

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

export const lifecycleFlow: FlowNode[] = [
  { id: "lead", label: "Lead", workflow: "Intake", automationCount: 4 },
  { id: "vob", label: "VOB", workflow: "Intake", automationCount: 3 },
  { id: "client", label: "Client", workflow: "Client", automationCount: 3 },
  { id: "auth", label: "Auth", workflow: "Auth", automationCount: 4 },
  { id: "qa", label: "QA", workflow: "QA", automationCount: 2 },
  { id: "staffing", label: "Staffing", workflow: "Staffing", automationCount: 2 },
  { id: "start", label: "Start", workflow: "Client", automationCount: 1 },
  { id: "active", label: "Active", workflow: "Client", automationCount: 1 },
];
