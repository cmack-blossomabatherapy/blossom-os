export type AuthStage =
  | "Awaiting Submission"
  | "Submitted"
  | "Approved"
  | "Denied"
  | "Expiring Soon"
  | "In QA Review"
  | "Flaked Client";

export type AuthType = "Initial" | "Treatment" | "Reauth";
export type QAStatus = "Not Started" | "In Review" | "Complete";
export type RiskLevel = "Low" | "Medium" | "High";

export interface AuthDocument {
  name: string;
  required: boolean;
  received: boolean;
}

export interface AuthTask {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
}

export interface AuthTimelineEvent {
  id: string;
  type: "system" | "submission" | "approval" | "denial" | "qa" | "document" | "renewal" | "note";
  description: string;
  timestamp: string;
  user?: string;
}

export interface Authorization {
  id: string;
  clientId: string;
  clientName: string;
  state: string;
  payor: string;
  authType: AuthType;
  stage: AuthStage;
  coordinator: string;
  qaOwner: string | null;
  qaStatus: QAStatus;
  qaNotes: string | null;
  submittedDate: string | null;
  approvedDate: string | null;
  expirationDate: string | null;
  hours: string | null;
  daysInStage: number;
  riskLevel: RiskLevel;
  missingInfo: boolean;
  treatmentPlanReceived: boolean;
  documents: AuthDocument[];
  missingRequirements: string[];
  nextAction: string;
  nextTaskDue: string | null;
  lastActivity: string;
  tasks: AuthTask[];
  timeline: AuthTimelineEvent[];
  automationLog: string[];
  denialReason?: string;
}

export const authStages: { name: AuthStage; variant: "default" | "success" | "warning" | "destructive" | "info" | "muted" }[] = [
  { name: "Awaiting Submission", variant: "warning" },
  { name: "In QA Review", variant: "default" },
  { name: "Submitted", variant: "info" },
  { name: "Approved", variant: "success" },
  { name: "Denied", variant: "destructive" },
  { name: "Expiring Soon", variant: "warning" },
  { name: "Flaked Client", variant: "muted" },
];

export const stageVariant = (s: string): "default" | "success" | "warning" | "destructive" | "info" | "muted" =>
  authStages.find((x) => x.name === s)?.variant || "muted";

export const qaVariant = (s: QAStatus): "default" | "success" | "warning" | "muted" => {
  const m: Record<QAStatus, "default" | "success" | "warning" | "muted"> = {
    "Not Started": "muted",
    "In Review": "warning",
    "Complete": "success",
  };
  return m[s];
};

export const riskVariant = (r: RiskLevel): "destructive" | "warning" | "muted" =>
  r === "High" ? "destructive" : r === "Medium" ? "warning" : "muted";

// Today reference for the mock dataset
const TODAY = new Date("2026-04-16");

export const daysUntil = (dateStr: string | null): number | null => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return Math.round((d.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24));
};

export const expirationTone = (days: number | null): "success" | "warning" | "destructive" | "muted" => {
  if (days === null) return "muted";
  if (days < 30) return "destructive";
  if (days <= 60) return "warning";
  return "success";
};

export const getAuthAlert = (a: Authorization): { type: "red" | "yellow"; message: string } | null => {
  const days = daysUntil(a.expirationDate);
  if (a.stage === "Denied") return { type: "red", message: "Denied" };
  if (a.missingInfo) return { type: "red", message: "Missing docs — cannot submit" };
  if (days !== null && days < 15) return { type: "red", message: `Expires in ${days}d` };
  if (a.stage === "Awaiting Submission" && a.daysInStage >= 2) return { type: "yellow", message: `Awaiting submission ${a.daysInStage}d` };
  if (a.stage === "In QA Review" && a.daysInStage >= 3) return { type: "yellow", message: "QA pending" };
  if (days !== null && days < 30) return { type: "yellow", message: `Expires in ${days}d` };
  return null;
};

export const lifecycleStages = [
  "Created",
  "Awaiting Submission",
  "Submitted",
  "Approved",
  "QA Review",
  "Renewal Cycle",
] as const;

export const getLifecycleProgress = (a: Authorization): boolean[] => {
  const idx: Record<AuthStage, number> = {
    "Awaiting Submission": 1,
    "In QA Review": 1,
    "Submitted": 2,
    "Approved": 3,
    "Denied": 2,
    "Expiring Soon": 4,
    "Flaked Client": 0,
  };
  const reached = idx[a.stage];
  return lifecycleStages.map((_, i) => i <= reached);
};

const baseDocs = (planReceived: boolean, missing: boolean): AuthDocument[] => [
  { name: "Insurance Card (Front)", required: true, received: true },
  { name: "Insurance Card (Back)", required: true, received: true },
  { name: "Diagnostic Evaluation", required: true, received: !missing },
  { name: "Treatment Plan", required: true, received: planReceived },
  { name: "Prescription / Referral", required: true, received: !missing },
  { name: "Consent Forms", required: true, received: true },
];

export const mockAuths: Authorization[] = [
  {
    id: "A-2210", clientId: "C-0421", clientName: "Emma Thompson", state: "GA",
    payor: "Anthem BCBS", authType: "Treatment", stage: "Approved",
    coordinator: "Priya K.", qaOwner: "Dr. Kim", qaStatus: "Complete", qaNotes: "Plan complete and signed.",
    submittedDate: "2026-02-20", approvedDate: "2026-03-01", expirationDate: "2026-09-01",
    hours: "20/wk", daysInStage: 46, riskLevel: "Low", missingInfo: false, treatmentPlanReceived: true,
    documents: baseDocs(true, false),
    missingRequirements: [],
    nextAction: "Monitor for renewal trigger at 90 days",
    nextTaskDue: "2026-06-03", lastActivity: "Auth approved by payor",
    tasks: [
      { id: "t1", title: "Confirm Treatment Plan", completed: true },
      { id: "t2", title: "Submit Authorization", completed: true },
      { id: "t3", title: "Set renewal reminder (90-day)", completed: true },
    ],
    timeline: [
      { id: "e1", type: "approval", description: "Approved for 20hr/wk through 2026-09-01", timestamp: "2026-03-01T10:00:00Z", user: "System" },
      { id: "e2", type: "submission", description: "Submitted to Anthem BCBS", timestamp: "2026-02-20T14:00:00Z", user: "Priya K." },
      { id: "e3", type: "qa", description: "QA review completed by Dr. Kim", timestamp: "2026-02-18T11:00:00Z", user: "Dr. Kim" },
      { id: "e4", type: "document", description: "Treatment Plan received", timestamp: "2026-02-15T09:00:00Z" },
      { id: "e5", type: "system", description: "Authorization record created", timestamp: "2026-02-10T09:00:00Z" },
    ],
    automationLog: ["Auto-created", "Moved to QA Review", "Moved to Submitted", "Moved to Approved"],
  },
  {
    id: "A-2209", clientId: "C-0417", clientName: "Olivia Brown", state: "GA",
    payor: "Anthem BCBS", authType: "Treatment", stage: "Submitted",
    coordinator: "Priya K.", qaOwner: "Dr. Lee", qaStatus: "Complete", qaNotes: "All clear.",
    submittedDate: "2026-04-07", approvedDate: null, expirationDate: null,
    hours: null, daysInStage: 9, riskLevel: "Medium", missingInfo: false, treatmentPlanReceived: true,
    documents: baseDocs(true, false),
    missingRequirements: [],
    nextAction: "Follow up with Anthem BCBS on submission",
    nextTaskDue: "2026-04-17", lastActivity: "Auth submitted",
    tasks: [
      { id: "t1", title: "Confirm Treatment Plan", completed: true },
      { id: "t2", title: "Submit Authorization", completed: true },
      { id: "t3", title: "Follow up with payor", completed: false, dueDate: "2026-04-17" },
    ],
    timeline: [
      { id: "e1", type: "submission", description: "Submitted to Anthem BCBS", timestamp: "2026-04-07T14:00:00Z", user: "Priya K." },
      { id: "e2", type: "qa", description: "QA review completed", timestamp: "2026-04-05T10:00:00Z", user: "Dr. Lee" },
      { id: "e3", type: "system", description: "Authorization record created", timestamp: "2026-04-01T09:00:00Z" },
    ],
    automationLog: ["Auto-created", "Moved to QA Review", "Moved to Submitted"],
  },
  {
    id: "A-2208", clientId: "C-0418", clientName: "Liam Chen", state: "AZ",
    payor: "Cigna", authType: "Treatment", stage: "In QA Review",
    coordinator: "Marcus T.", qaOwner: "Dr. Patel", qaStatus: "In Review", qaNotes: "Reviewing treatment plan goals.",
    submittedDate: null, approvedDate: null, expirationDate: null,
    hours: null, daysInStage: 4, riskLevel: "Medium", missingInfo: false, treatmentPlanReceived: true,
    documents: baseDocs(true, false),
    missingRequirements: [],
    nextAction: "Complete QA review",
    nextTaskDue: "2026-04-18", lastActivity: "Treatment plan submitted to QA",
    tasks: [
      { id: "t1", title: "Confirm Treatment Plan", completed: true },
      { id: "t2", title: "Complete QA review", completed: false, dueDate: "2026-04-18" },
      { id: "t3", title: "Submit Authorization", completed: false },
    ],
    timeline: [
      { id: "e1", type: "qa", description: "QA review started by Dr. Patel", timestamp: "2026-04-12T10:00:00Z", user: "Dr. Patel" },
      { id: "e2", type: "document", description: "Treatment Plan received", timestamp: "2026-04-11T15:00:00Z" },
      { id: "e3", type: "system", description: "Authorization record created", timestamp: "2026-04-09T09:00:00Z" },
    ],
    automationLog: ["Auto-created", "Moved to In QA Review"],
  },
  {
    id: "A-2207", clientId: "C-0414", clientName: "Zoe Rivera", state: "GA",
    payor: "Anthem BCBS", authType: "Initial", stage: "Submitted",
    coordinator: "Priya K.", qaOwner: null, qaStatus: "Not Started", qaNotes: null,
    submittedDate: "2026-04-10", approvedDate: null, expirationDate: null,
    hours: "8 assessment", daysInStage: 6, riskLevel: "Low", missingInfo: false, treatmentPlanReceived: false,
    documents: baseDocs(false, false),
    missingRequirements: [],
    nextAction: "Wait for payor response",
    nextTaskDue: "2026-04-20", lastActivity: "Initial auth submitted",
    tasks: [
      { id: "t1", title: "Submit Initial Auth", completed: true },
      { id: "t2", title: "Follow up with payor", completed: false, dueDate: "2026-04-20" },
    ],
    timeline: [
      { id: "e1", type: "submission", description: "Initial auth submitted", timestamp: "2026-04-10T11:00:00Z", user: "Priya K." },
      { id: "e2", type: "system", description: "Authorization record created", timestamp: "2026-04-08T09:00:00Z" },
    ],
    automationLog: ["Auto-created", "Moved to Submitted"],
  },
  {
    id: "A-2206", clientId: "C-0413", clientName: "Ben Carter", state: "GA",
    payor: "Cigna", authType: "Treatment", stage: "Approved",
    coordinator: "Priya K.", qaOwner: "Dr. Lee", qaStatus: "Complete", qaNotes: "Approved without revisions.",
    submittedDate: "2026-03-20", approvedDate: "2026-04-01", expirationDate: "2026-10-01",
    hours: "15/wk", daysInStage: 15, riskLevel: "Low", missingInfo: false, treatmentPlanReceived: true,
    documents: baseDocs(true, false),
    missingRequirements: [],
    nextAction: "Monitor for renewal trigger",
    nextTaskDue: "2026-07-03", lastActivity: "Approved",
    tasks: [{ id: "t1", title: "Set renewal reminder", completed: true }],
    timeline: [
      { id: "e1", type: "approval", description: "Approved for 15hr/wk through 2026-10-01", timestamp: "2026-04-01T10:00:00Z", user: "System" },
      { id: "e2", type: "submission", description: "Submitted to Cigna", timestamp: "2026-03-20T14:00:00Z", user: "Priya K." },
      { id: "e3", type: "system", description: "Authorization record created", timestamp: "2026-03-12T09:00:00Z" },
    ],
    automationLog: ["Auto-created", "Approved"],
  },
  {
    id: "A-2205", clientId: "C-0420", clientName: "Aiden Patel", state: "TX",
    payor: "Aetna", authType: "Treatment", stage: "Approved",
    coordinator: "Marcus T.", qaOwner: "Dr. Lee", qaStatus: "Complete", qaNotes: null,
    submittedDate: "2026-03-22", approvedDate: "2026-04-01", expirationDate: "2026-10-01",
    hours: "20/wk", daysInStage: 15, riskLevel: "Low", missingInfo: false, treatmentPlanReceived: true,
    documents: baseDocs(true, false),
    missingRequirements: [],
    nextAction: "Monitor for renewal trigger",
    nextTaskDue: "2026-07-03", lastActivity: "Approved",
    tasks: [{ id: "t1", title: "Set renewal reminder", completed: true }],
    timeline: [
      { id: "e1", type: "approval", description: "Approved for 20hr/wk through 2026-10-01", timestamp: "2026-04-01T10:00:00Z", user: "System" },
      { id: "e2", type: "submission", description: "Submitted to Aetna", timestamp: "2026-03-22T14:00:00Z", user: "Marcus T." },
      { id: "e3", type: "system", description: "Authorization record created", timestamp: "2026-03-15T09:00:00Z" },
    ],
    automationLog: ["Auto-created", "Approved"],
  },
  {
    id: "A-2204", clientId: "C-0411", clientName: "Caleb Foster", state: "GA",
    payor: "Anthem BCBS", authType: "Treatment", stage: "Expiring Soon",
    coordinator: "Priya K.", qaOwner: "Dr. Kim", qaStatus: "Complete", qaNotes: null,
    submittedDate: "2026-01-10", approvedDate: "2026-01-20", expirationDate: "2026-05-05",
    hours: "20/wk", daysInStage: 5, riskLevel: "High", missingInfo: false, treatmentPlanReceived: true,
    documents: baseDocs(true, false),
    missingRequirements: [],
    nextAction: "Trigger 90-day reauth — request updated treatment plan",
    nextTaskDue: "2026-04-18", lastActivity: "Moved to Expiring Soon",
    tasks: [
      { id: "t1", title: "Confirm Treatment Plan for reauth", completed: false, dueDate: "2026-04-18" },
      { id: "t2", title: "Begin Reauth submission", completed: false },
    ],
    timeline: [
      { id: "e1", type: "renewal", description: "Moved to Expiring Soon (under 30 days)", timestamp: "2026-04-11T08:00:00Z", user: "System" },
      { id: "e2", type: "approval", description: "Approved through 2026-05-05", timestamp: "2026-01-20T10:00:00Z", user: "System" },
      { id: "e3", type: "submission", description: "Submitted to Anthem BCBS", timestamp: "2026-01-10T14:00:00Z", user: "Priya K." },
    ],
    automationLog: ["Approved", "Moved to Expiring Soon — reauth subtask created"],
  },
  {
    id: "A-2203", clientId: "C-0419", clientName: "Sofia Garcia", state: "GA",
    payor: "United Healthcare", authType: "Treatment", stage: "Expiring Soon",
    coordinator: "Priya K.", qaOwner: "Dr. Kim", qaStatus: "Complete", qaNotes: null,
    submittedDate: "2026-02-12", approvedDate: "2026-02-25", expirationDate: "2026-06-08",
    hours: "25/wk", daysInStage: 3, riskLevel: "Medium", missingInfo: false, treatmentPlanReceived: true,
    documents: baseDocs(true, false),
    missingRequirements: [],
    nextAction: "Begin reauth at 60-day mark",
    nextTaskDue: "2026-04-22", lastActivity: "Moved to Expiring Soon",
    tasks: [{ id: "t1", title: "Confirm Treatment Plan for reauth", completed: false, dueDate: "2026-04-22" }],
    timeline: [
      { id: "e1", type: "renewal", description: "Moved to Expiring Soon (under 60 days)", timestamp: "2026-04-13T08:00:00Z", user: "System" },
      { id: "e2", type: "approval", description: "Approved through 2026-06-08", timestamp: "2026-02-25T10:00:00Z", user: "System" },
    ],
    automationLog: ["Approved", "Moved to Expiring Soon (60-day window)"],
  },
  {
    id: "A-2202", clientId: "C-0415", clientName: "Marcus Johnson", state: "TX",
    payor: "Aetna", authType: "Initial", stage: "Awaiting Submission",
    coordinator: "Marcus T.", qaOwner: null, qaStatus: "Not Started", qaNotes: null,
    submittedDate: null, approvedDate: null, expirationDate: null,
    hours: null, daysInStage: 3, riskLevel: "High", missingInfo: true, treatmentPlanReceived: false,
    documents: baseDocs(false, true),
    missingRequirements: ["Diagnostic Evaluation", "Prescription / Referral"],
    nextAction: "Collect missing diagnostic evaluation from pediatrician",
    nextTaskDue: "2026-04-17", lastActivity: "Missing info flagged",
    tasks: [
      { id: "t1", title: "Collect missing documentation", completed: false, dueDate: "2026-04-17" },
      { id: "t2", title: "Submit Initial Auth", completed: false },
    ],
    timeline: [
      { id: "e1", type: "document", description: "Missing diagnostic evaluation flagged", timestamp: "2026-04-13T15:00:00Z", user: "System" },
      { id: "e2", type: "system", description: "Authorization record created", timestamp: "2026-04-13T09:00:00Z" },
    ],
    automationLog: ["Auto-created", "Flagged: missing documentation — cannot submit"],
  },
  {
    id: "A-2201", clientId: "C-0410", clientName: "Layla Brooks", state: "GA",
    payor: "United Healthcare", authType: "Initial", stage: "Awaiting Submission",
    coordinator: "Priya K.", qaOwner: null, qaStatus: "Not Started", qaNotes: null,
    submittedDate: null, approvedDate: null, expirationDate: null,
    hours: null, daysInStage: 4, riskLevel: "Medium", missingInfo: true, treatmentPlanReceived: false,
    documents: baseDocs(false, true),
    missingRequirements: ["Diagnostic Evaluation"],
    nextAction: "Follow up on consent forms blocking submission",
    nextTaskDue: "2026-04-17", lastActivity: "Awaiting consent forms",
    tasks: [
      { id: "t1", title: "Confirm Consent Forms", completed: false, dueDate: "2026-04-17" },
      { id: "t2", title: "Submit Initial Auth", completed: false },
    ],
    timeline: [
      { id: "e1", type: "system", description: "Authorization record created", timestamp: "2026-04-12T09:00:00Z" },
    ],
    automationLog: ["Auto-created", "Awaiting documentation"],
  },
  {
    id: "A-2200", clientId: "C-0416", clientName: "Noah Williams", state: "TX",
    payor: "Medicaid", authType: "Initial", stage: "Approved",
    coordinator: "Marcus T.", qaOwner: null, qaStatus: "Not Started", qaNotes: null,
    submittedDate: "2026-04-04", approvedDate: "2026-04-09", expirationDate: "2026-07-09",
    hours: "8 assessment", daysInStage: 7, riskLevel: "Low", missingInfo: false, treatmentPlanReceived: false,
    documents: baseDocs(false, false),
    missingRequirements: [],
    nextAction: "Schedule assessment within auth window",
    nextTaskDue: "2026-04-17", lastActivity: "Initial auth approved",
    tasks: [{ id: "t1", title: "Schedule assessment", completed: false, dueDate: "2026-04-17" }],
    timeline: [
      { id: "e1", type: "approval", description: "Initial auth approved", timestamp: "2026-04-09T16:00:00Z", user: "System" },
      { id: "e2", type: "submission", description: "Submitted to Medicaid", timestamp: "2026-04-04T11:00:00Z", user: "Marcus T." },
    ],
    automationLog: ["Auto-created", "Submitted", "Approved"],
  },
  {
    id: "A-2199", clientId: "C-0422", clientName: "Riley Adams", state: "TX",
    payor: "Aetna", authType: "Initial", stage: "Denied",
    coordinator: "Marcus T.", qaOwner: null, qaStatus: "Not Started", qaNotes: null,
    submittedDate: "2026-03-28", approvedDate: null, expirationDate: null,
    hours: null, daysInStage: 6, riskLevel: "High", missingInfo: false, treatmentPlanReceived: false,
    documents: baseDocs(false, false),
    missingRequirements: [],
    denialReason: "Insufficient medical necessity documentation",
    nextAction: "Appeal with additional supporting documentation",
    nextTaskDue: "2026-04-20", lastActivity: "Denial received",
    tasks: [
      { id: "t1", title: "Review denial reason", completed: true },
      { id: "t2", title: "Prepare appeal packet", completed: false, dueDate: "2026-04-20" },
    ],
    timeline: [
      { id: "e1", type: "denial", description: "Denied: insufficient medical necessity documentation", timestamp: "2026-04-10T10:00:00Z", user: "System" },
      { id: "e2", type: "submission", description: "Submitted to Aetna", timestamp: "2026-03-28T14:00:00Z", user: "Marcus T." },
    ],
    automationLog: ["Submitted", "Denied — client moved back to Leads board for review"],
  },
];
