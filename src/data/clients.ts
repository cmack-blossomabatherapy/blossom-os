import { canonicalPipelineStage, masterPipelineSections, masterPipelineStages, type PipelineStageVariant } from "@/data/pipeline";

export type ClientStage =
  | "New Lead"
  | "In Contact"
  | "Sent Form"
  | "Missing Information"
  | "Form Received"
  | "Sent to VOB"
  | "VOB Pending"
  | "VOB Received"
  | "Financial Review"
  | "Payment Plan Required"
  | "Payment Plan Received"
  | "Approved for Services"
  | "Not Qualified"
  | "Can Not Submit Auth"
  | "Converted to Client"
  | "BCBA Assignment"
  | "Pending Initial Authorization"
  | "Pending Initial Auth"
  | "Initial Auth – Awaiting Submission"
  | "Initial Auth – Submitted"
  | "Initial Auth – Approved"
  | "Waiting on Consent"
  | "Waiting on Consent Forms"
  | "Schedule Assessment"
  | "Assessment Scheduled"
  | "Assessment Completed"
  | "Treatment Plan Pending"
  | "QA Review"
  | "QA Issues / Fix Required"
  | "QA Approved"
  | "In QA"
  | "Treatment Auth – Awaiting Submission"
  | "Treatment Auth – Submitted"
  | "Treatment Auth – Approved"
  | "Treatment Auth – Denied"
  | "Pending Treatment Auth"
  | "Staffing Needed"
  | "Matching in Progress"
  | "RBT Assigned"
  | "Restaffing Needed"
  | "Pending Schedule"
  | "Schedule Created"
  | "Pending Start Date"
  | "Active"
  | "Flaked"
  | "Discharged"
  | "Services on Pause"
  | "Reauth Triggered"
  | "Progress Report Needed"
  | "Progress Report Received"
  | "Reauth Submitted"
  | "Reauth Approved";

export type AuthStatus = "Not Submitted" | "Submitted" | "Approved" | "Denied" | "Expired" | "Expiring Soon";
export type StaffingStatus = "Not Needed" | "Needed" | "In Progress" | "Assigned";
export type QAStatus = "Not Started" | "In Review" | "Complete";
export type ClientSchedulingStatus = "Pending Schedule" | "Schedule Created" | "Pending Start" | "Active";
export type ActiveServiceStatus = "Active" | "Services on Pause" | "Flaked" | "Discharged";
export type ActiveStaffingStatus = "Stable" | "Needs Restaffing" | "In Transition";
export type NotesComplianceStatus = "Compliant" | "Needs Review" | "Flagged" | "Repeated Errors";
export type BillingClaimStatus = "Current" | "Missing Sessions" | "Claims Issue" | "Delayed Billing";
export type ReauthCycleStatus = "Not Started" | "BCBA Notified" | "In Progress" | "Report Received" | "QA Review" | "Submitted" | "Approved" | "Failed / Delayed";
export type ReauthQAStatus = "Not Started" | "In Review" | "Passed" | "Failed";
export type ReauthSubmissionStatus = "Not Submitted" | "Ready" | "Submitted" | "Approved" | "Denied";

export interface ClientTask {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
}

export interface ClientTimelineEvent {
  id: string;
  type: "system" | "auth" | "staffing" | "schedule" | "qa" | "note" | "stage";
  description: string;
  timestamp: string;
  user?: string;
}

export interface AuthorizationRecord {
  id?: string;
  type: "Initial" | "Treatment" | "Reauth";
  status: AuthStatus;
  submittedDate?: string;
  approvedDate?: string;
  expirationDate?: string;
  hours?: string;
  approvedHours?: number | null;
  frequency?: string | null;
  serviceType?: string | null;
  authorizationPeriod?: string | null;
  notes?: string;
  payor?: string;
  state?: string;
  assignedAuthCoordinator?: string;
  qaOwner?: string | null;
  qaStatus?: QAStatus;
  treatmentPlanReceived?: boolean;
  treatmentPlanLinked?: boolean;
  requiredDocsReceived?: boolean;
  approvalLetterReceived?: boolean;
  partialApproval?: boolean;
  missingDocs?: string[];
  nextAction?: string;
  blockers?: string[];
  qaNotes?: string | null;
  escalationOwner?: string | null;
  submissionHistory?: { status?: string; date?: string; note?: string }[];
  reauthSourceId?: string | null;
  daysInStage?: number;
  progressReportStatus?: "Not Started" | "In Progress" | "Received";
}

export interface ScheduleSlot {
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";
  start: string;
  end: string;
  rbt?: string;
  location?: "Home" | "School" | "Clinic";
  notes?: string;
}

export interface ReauthCycle {
  id: string;
  clientId: string;
  linkedAuthorizationId?: string | null;
  payor: string;
  currentAuthExpirationDate: string;
  reauthTriggerDate: string;
  bcba9WeekNotificationDate?: string | null;
  bcba6WeekNotificationDate?: string | null;
  progressReportDueDate?: string | null;
  progressReportReceivedDate?: string | null;
  qaReviewStartedDate?: string | null;
  qaCompletedDate?: string | null;
  submissionDate?: string | null;
  approvalDate?: string | null;
  status: ReauthCycleStatus;
  qaStatus: ReauthQAStatus;
  submissionStatus: ReauthSubmissionStatus;
  assignedBcba?: string | null;
  qaOwner?: string | null;
  authorizationCoordinator?: string | null;
  stateDirector?: string | null;
  blockers: string[];
  alerts: string[];
  notes?: string | null;
  daysInStage?: number;
}

export interface Client {
  id: string;
  leadId?: string;
  childName: string;
  parentName: string;
  phone?: string;
  email?: string;
  childAge: string;
  state: string;
  clinic: string;
  stage: ClientStage;
  bcba: string | null;
  rbt: string | null;
  intakeOwner: string;
  authStatus: AuthStatus;
  staffingStatus: StaffingStatus;
  qaStatus: QAStatus;
  daysInStage: number;
  daysSinceVOB: number;
  daysSinceAssessment: number | null;
  daysToStart: number | null;
  assessmentDate: string | null;
  startDate: string | null;
  schedulingStatus?: ClientSchedulingStatus;
  caseCoordinationDocumentGenerated?: boolean;
  pairingEmailSent?: boolean;
  schedulingNotes?: string | null;
  centralReachSyncStatus?: string;
  activeServiceStatus?: ActiveServiceStatus;
  activeStaffingStatus?: ActiveStaffingStatus;
  approvedWeeklyHours?: number;
  scheduledWeeklyHours?: number;
  deliveredWeeklyHours?: number;
  serviceLocation?: string;
  notesComplianceStatus?: NotesComplianceStatus;
  noteguardFlags?: number;
  amerigroupStatus?: string;
  sessionsLogged?: number;
  claimsSubmitted?: number;
  claimsIssues?: number;
  billingStatus?: BillingClaimStatus;
  newRbtStartDate?: string | null;
  rbtCheckInStatus?: string;
  earlyRbtIssues?: string[];
  nextReauthDate?: string | null;
  activeAlerts?: string[];
  activeNotes?: string | null;
  nextAction: string;
  nextTaskDue: string | null;
  lastActivity: string;
  payor: string;
  insurance?: string;
  paymentPlanStatus?: string;
  paymentPlanRequired?: boolean;
  paymentPlanSigned?: boolean;
  readyForAuth?: boolean;
  consentRequired?: boolean;
  consentComplete?: boolean;
  blockers: string[];
  /**
   * Structured flag indicating the family has flaked / gone unreachable.
   * Drives the "Flaked Client" status tab and next-best-action engine.
   * Prefer this flag over parsing free-text blockers.
   */
  clientUnreachable?: boolean;
  clientUnreachableSince?: string | null;
  clientUnreachableReason?: string | null;
  authorizations: AuthorizationRecord[];
  reauthCycles?: ReauthCycle[];
  schedule: ScheduleSlot[];
  tasks: ClientTask[];
  timeline: ClientTimelineEvent[];
  documents: { name: string; type: string }[];
  automationLog: string[];
  staffingHistory: { date: string; event: string }[];
}

export const pipelineSections = masterPipelineSections as { title: string; summary: string; stages: { name: ClientStage; variant: PipelineStageVariant; owner: string }[] }[];

export const clientStages: { name: ClientStage; variant: PipelineStageVariant }[] = masterPipelineStages.map((stage) => ({
  name: stage.name as ClientStage,
  variant: stage.variant,
}));

export const stageVariant = (stage: string): "default" | "success" | "warning" | "destructive" | "info" | "muted" => {
  return clientStages.find((s) => s.name === canonicalPipelineStage(stage))?.variant || "muted";
};

export const authVariant = (s: AuthStatus): "default" | "success" | "warning" | "destructive" | "muted" => {
  const m: Record<AuthStatus, "default" | "success" | "warning" | "destructive" | "muted"> = {
    "Not Submitted": "muted",
    "Submitted": "warning",
    "Approved": "success",
    "Denied": "destructive",
    "Expired": "destructive",
    "Expiring Soon": "warning",
  };
  return m[s];
};

export const staffingVariant = (s: StaffingStatus): "default" | "success" | "warning" | "destructive" | "muted" => {
  const m: Record<StaffingStatus, "default" | "success" | "warning" | "destructive" | "muted"> = {
    "Not Needed": "muted",
    "Needed": "destructive",
    "In Progress": "warning",
    "Assigned": "success",
  };
  return m[s];
};

export const qaVariant = (s: QAStatus): "default" | "success" | "warning" | "muted" => {
  const m: Record<QAStatus, "default" | "success" | "warning" | "muted"> = {
    "Not Started": "muted",
    "In Review": "warning",
    "Complete": "success",
  };
  return m[s];
};

export const getClientAlert = (c: Client): { type: "red" | "yellow"; message: string } | null => {
  const stage = canonicalPipelineStage(c.stage);
  if (c.paymentPlanRequired && !c.paymentPlanSigned) return { type: "red", message: "Payment plan not signed" };
  if ((stage === "BCBA Assignment" || stage === "Converted to Client") && !c.bcba) return { type: "red", message: "No BCBA assigned" };
  if ((stage === "Waiting on Consent" || stage === "Waiting on Consent Forms") && c.consentRequired !== false && !c.consentComplete) return { type: "red", message: "Missing consent forms" };
  if (!c.bcba && getLifecycleProgress(c).some(Boolean)) return { type: "red", message: "No BCBA assigned" };
  if (stage === "Pending Initial Authorization" && c.authStatus === "Not Submitted") return { type: "yellow", message: "Auth not submitted" };
  if (stage === "Initial Auth – Awaiting Submission" && c.authStatus === "Not Submitted") return { type: "red", message: "Auth not submitted" };
  if (c.stage === "Schedule Assessment" && c.daysInStage >= 5) return { type: "yellow", message: "Assessment not scheduled" };
  if (c.stage === "Staffing Needed" && c.daysInStage >= 5) return { type: "red", message: `Staffing needed ${c.daysInStage}d` };
  if (c.stage === "Pending Start Date" && !c.startDate) return { type: "red", message: "Start date missing" };
  if (stage === "Treatment Auth – Awaiting Submission" && c.daysInStage >= 7) return { type: "yellow", message: `Auth pending ${c.daysInStage}d` };
  return null;
};

export const lifecycleSteps = []as const;

export const getLifecycleProgress = (c: Client): boolean[] => {
  const stageOrder: ClientStage[] = [
    "BCBA Assignment", "Initial Auth – Awaiting Submission", "Waiting on Consent",
    "Schedule Assessment", "Assessment Scheduled", "QA Review",
    "Treatment Auth – Awaiting Submission", "Staffing Needed", "Pending Start Date", "Active",
  ];
  const idx = stageOrder.indexOf(canonicalPipelineStage(c.stage) as ClientStage);
  // step i is done if we are PAST stage i
  return lifecycleSteps.map((_, i) => idx > i || c.stage === "Active");
};

const baseTimeline = (created: string): ClientTimelineEvent[] => [
  { id: "ct1", type: "system", description: "Moved from Leads → Clients (VOB completed)", timestamp: created, user: "System" },
];

export const mockClients: Client[] = [];

// ---------- KPI helpers ----------
export type ClientKpiKey =
  | "bcbaAssignment"
  | "pendingInitialAuth"
  | "waitingConsent"
  | "assessmentScheduled"
  | "inQa"
  | "pendingTreatmentAuth"
  | "staffingNeeded"
  | "pendingStart"
  | "active";

export const clientKpiFilters: Record<ClientKpiKey, (c: Client) => boolean> = {
  bcbaAssignment: (c) => canonicalPipelineStage(c.stage) === "BCBA Assignment",
  pendingInitialAuth: (c) => canonicalPipelineStage(c.stage) === "Initial Auth – Awaiting Submission",
  waitingConsent: (c) => canonicalPipelineStage(c.stage) === "Waiting on Consent",
  assessmentScheduled: (c) => c.stage === "Assessment Scheduled",
  inQa: (c) => canonicalPipelineStage(c.stage) === "QA Review",
  pendingTreatmentAuth: (c) => canonicalPipelineStage(c.stage) === "Treatment Auth – Awaiting Submission",
  staffingNeeded: (c) => ["Staffing Needed", "Matching in Progress", "Restaffing Needed"].includes(canonicalPipelineStage(c.stage)),
  pendingStart: (c) => c.stage === "Pending Start Date",
  active: (c) => c.stage === "Active",
};

export const calculateClientKpis = (clients: Client[]) => {
  const inStage = (s: ClientStage) => clients.filter((c) => canonicalPipelineStage(c.stage) === s).length;
  const avgDaysIn = (filter: (c: Client) => boolean) => {
    const xs = clients.filter(filter);
    if (!xs.length) return 0;
    return Math.round(xs.reduce((sum, c) => sum + c.daysInStage, 0) / xs.length);
  };
  return {
    bcbaAssignment: inStage("BCBA Assignment"),
    pendingInitialAuth: inStage("Initial Auth – Awaiting Submission"),
    waitingConsent: inStage("Waiting on Consent"),
    assessmentScheduled: inStage("Assessment Scheduled"),
    inQa: inStage("QA Review"),
    pendingTreatmentAuth: inStage("Treatment Auth – Awaiting Submission"),
    staffingNeeded: inStage("Staffing Needed") + inStage("Matching in Progress") + inStage("Restaffing Needed"),
    pendingStart: inStage("Pending Start Date"),
    active: inStage("Active"),
    avgTimeToStart: avgDaysIn((c) => c.daysToStart !== null) || 18,
    avgTimeInQa: avgDaysIn((c) => canonicalPipelineStage(c.stage) === "QA Review") || 0,
    avgTimeInStaffing: avgDaysIn((c) => ["Staffing Needed", "Matching in Progress"].includes(canonicalPipelineStage(c.stage))) || 0,
  };
};
