export type AuthStage =
  | "Awaiting Submission"
  | "Submitted"
  | "Approved"
  | "Denied"
  | "Expiring Soon"
  | "In QA Review"
  | "Flaked Client";

export type AuthType = "Initial" | "Treatment" | "Reauth";
/**
 * Canonical QA workflow statuses.
 *
 * Persisted in `qa_work_item_overrides.qa_status` (source-backed items)
 * and `client_qa_reviews.status` (UUID-backed reviews). Every QA page
 * renders against this union so workflow state survives reload.
 */
export type QAStatus =
  | "Not Started"
  | "Awaiting Review"
  | "In Review"
  | "Issues Found"
  | "Ready for Submission"
  | "Submitted to Auth"
  | "Escalated"
  | "Complete";
export type RiskLevel = "Low" | "Medium" | "High";

export const QA_DONE_STATUSES: ReadonlyArray<QAStatus> = [
  "Ready for Submission",
  "Submitted to Auth",
  "Complete",
];
export const QA_BLOCKED_STATUSES: ReadonlyArray<QAStatus> = [
  "Issues Found",
  "Escalated",
];
export const isQADone = (s: QAStatus) => QA_DONE_STATUSES.includes(s);
export const isQABlocked = (s: QAStatus) => QA_BLOCKED_STATUSES.includes(s);

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

export const qaVariant = (
  s: QAStatus,
): "default" | "success" | "warning" | "destructive" | "muted" => {
  const m: Record<QAStatus, "default" | "success" | "warning" | "destructive" | "muted"> = {
    "Not Started":          "muted",
    "Awaiting Review":      "muted",
    "In Review":            "warning",
    "Issues Found":         "destructive",
    "Ready for Submission": "success",
    "Submitted to Auth":    "success",
    "Escalated":            "destructive",
    "Complete":             "success",
  };
  return m[s] ?? "muted";
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

export const lifecycleStages = []as const;

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

export const mockAuths: Authorization[] = [];
