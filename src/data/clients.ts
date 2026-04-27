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

export type AuthStatus = "Not Submitted" | "Submitted" | "Approved" | "Denied" | "Expired";
export type StaffingStatus = "Not Needed" | "Needed" | "In Progress" | "Assigned";
export type QAStatus = "Not Started" | "In Review" | "Complete";

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
  type: "Initial" | "Treatment";
  status: AuthStatus;
  submittedDate?: string;
  approvedDate?: string;
  expirationDate?: string;
  hours?: string;
  notes?: string;
}

export interface ScheduleSlot {
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";
  start: string;
  end: string;
  rbt?: string;
}

export interface Client {
  id: string;
  childName: string;
  parentName: string;
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
  nextAction: string;
  nextTaskDue: string | null;
  lastActivity: string;
  payor: string;
  blockers: string[];
  authorizations: AuthorizationRecord[];
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
  if (!c.bcba && getLifecycleProgress(c).some(Boolean)) return { type: "red", message: "No BCBA assigned" };
  if (stage === "Initial Auth – Awaiting Submission" && c.authStatus === "Not Submitted") return { type: "red", message: "Auth not submitted" };
  if (c.stage === "Schedule Assessment" && c.daysInStage >= 5) return { type: "yellow", message: "Assessment not scheduled" };
  if (c.stage === "Staffing Needed" && c.daysInStage >= 5) return { type: "red", message: `Staffing needed ${c.daysInStage}d` };
  if (c.stage === "Pending Start Date" && !c.startDate) return { type: "red", message: "Start date missing" };
  if (stage === "Treatment Auth – Awaiting Submission" && c.daysInStage >= 7) return { type: "yellow", message: `Auth pending ${c.daysInStage}d` };
  return null;
};

export const lifecycleSteps = [
  "BCBA Assigned",
  "Initial Auth Submitted",
  "Consent Completed",
  "Assessment Scheduled",
  "Assessment Completed",
  "QA Complete",
  "Treatment Auth Approved",
  "Staffing Assigned",
  "Start Date Set",
  "Active",
] as const;

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

export const mockClients: Client[] = [
  {
    id: "C-0421", childName: "Emma Thompson", parentName: "Jennifer Thompson", childAge: "3y 4m",
    state: "GA", clinic: "Peachtree Corners", stage: "Active",
    bcba: "Dr. Kim", rbt: "Taylor S.", intakeOwner: "Sarah M.",
    authStatus: "Approved", staffingStatus: "Assigned", qaStatus: "Complete",
    daysInStage: 42, daysSinceVOB: 78, daysSinceAssessment: 60, daysToStart: null,
    assessmentDate: "2026-02-12", startDate: "2026-03-04",
    nextAction: "Quarterly progress review", nextTaskDue: "2026-05-01", lastActivity: "Session note submitted",
    payor: "BCBS",
    blockers: [],
    authorizations: [
      { type: "Initial", status: "Approved", submittedDate: "2026-01-20", approvedDate: "2026-02-01", hours: "8 assessment" },
      { type: "Treatment", status: "Approved", submittedDate: "2026-02-20", approvedDate: "2026-03-01", expirationDate: "2026-09-01", hours: "20/wk" },
    ],
    schedule: [
      { day: "Mon", start: "09:00", end: "13:00", rbt: "Taylor S." },
      { day: "Wed", start: "09:00", end: "13:00", rbt: "Taylor S." },
      { day: "Fri", start: "09:00", end: "13:00", rbt: "Taylor S." },
    ],
    tasks: [
      { id: "ct1", title: "Confirm BCBA Assignment", completed: true },
      { id: "ct2", title: "Send Payment Plan", completed: true },
      { id: "ct3", title: "Confirm Consent Forms", completed: true },
      { id: "ct4", title: "Enter Assessment Date", completed: true },
      { id: "ct5", title: "Confirm Treatment Plan Received", completed: true },
      { id: "ct6", title: "Link BCBA & RBT", completed: true },
      { id: "ct7", title: "Generate Case Coordination Document", completed: true },
    ],
    timeline: [
      { id: "t7", type: "stage", description: "Moved to Active", timestamp: "2026-03-04T09:00:00Z", user: "System" },
      { id: "t6", type: "staffing", description: "Taylor S. assigned as RBT", timestamp: "2026-02-28T15:30:00Z", user: "Maria L." },
      { id: "t5", type: "auth", description: "Treatment auth approved (20hr/wk)", timestamp: "2026-03-01T10:00:00Z", user: "System" },
      { id: "t4", type: "qa", description: "QA completed by Dr. Kim", timestamp: "2026-02-18T14:00:00Z", user: "Dr. Kim" },
      { id: "t3", type: "schedule", description: "Assessment completed", timestamp: "2026-02-12T11:00:00Z", user: "Dr. Kim" },
      { id: "t2", type: "stage", description: "BCBA Dr. Kim assigned", timestamp: "2026-01-15T09:00:00Z", user: "Maria L." },
      ...baseTimeline("2026-01-15T09:00:00Z"),
    ],
    documents: [
      { name: "Treatment Plan", type: "PDF" },
      { name: "Case Coordination Document", type: "PDF" },
      { name: "Consent Forms", type: "PDF" },
      { name: "Auth Approval Letter", type: "PDF" },
    ],
    automationLog: [
      "Auto-created from completed VOB",
      "Moved to Pending Initial Auth",
      "Auth record created",
      "Moved to QA",
      "Moved to Staffing Needed",
      "Moved to Pending Start Date",
      "Moved to Active",
    ],
    staffingHistory: [
      { date: "2026-02-28", event: "Taylor S. matched and assigned" },
      { date: "2026-02-25", event: "Staffing search initiated" },
    ],
  },
  {
    id: "C-0420", childName: "Aiden Patel", parentName: "Ravi Patel", childAge: "4y 10m",
    state: "TX", clinic: "Remote", stage: "Staffing Needed",
    bcba: "Dr. Lee", rbt: null, intakeOwner: "James R.",
    authStatus: "Approved", staffingStatus: "Needed", qaStatus: "Complete",
    daysInStage: 12, daysSinceVOB: 45, daysSinceAssessment: 28, daysToStart: null,
    assessmentDate: "2026-03-19", startDate: null,
    nextAction: "Match RBT in Austin area", nextTaskDue: "2026-04-18", lastActivity: "3rd staffing attempt",
    payor: "Aetna",
    blockers: ["No RBT available in service area for 12 days"],
    authorizations: [
      { type: "Initial", status: "Approved", submittedDate: "2026-03-01", approvedDate: "2026-03-08", hours: "8 assessment" },
      { type: "Treatment", status: "Approved", submittedDate: "2026-03-22", approvedDate: "2026-04-01", expirationDate: "2026-10-01", hours: "20/wk" },
    ],
    schedule: [],
    tasks: [
      { id: "ct1", title: "Confirm BCBA Assignment", completed: true },
      { id: "ct2", title: "Confirm Consent Forms", completed: true },
      { id: "ct3", title: "Enter Assessment Date", completed: true },
      { id: "ct4", title: "Confirm Treatment Plan Received", completed: true },
      { id: "ct5", title: "Link BCBA & RBT", completed: false, dueDate: "2026-04-18" },
      { id: "ct6", title: "Generate Case Coordination Document", completed: false },
    ],
    timeline: [
      { id: "t6", type: "stage", description: "Moved to Staffing Needed", timestamp: "2026-04-04T09:00:00Z", user: "System" },
      { id: "t5", type: "auth", description: "Treatment auth approved", timestamp: "2026-04-01T10:00:00Z", user: "System" },
      { id: "t4", type: "qa", description: "QA completed", timestamp: "2026-03-25T11:00:00Z", user: "Dr. Lee" },
      { id: "t3", type: "schedule", description: "Assessment completed", timestamp: "2026-03-19T11:00:00Z", user: "Dr. Lee" },
      { id: "t2", type: "stage", description: "BCBA Dr. Lee assigned", timestamp: "2026-03-02T09:00:00Z", user: "Maria L." },
      ...baseTimeline("2026-03-02T09:00:00Z"),
    ],
    documents: [
      { name: "Treatment Plan", type: "PDF" },
      { name: "Auth Approval Letter", type: "PDF" },
      { name: "Consent Forms", type: "PDF" },
    ],
    automationLog: [
      "Auto-created from completed VOB",
      "Moved to QA → Pending Treatment Auth",
      "Moved to Staffing Needed",
      "3 RBT match attempts logged",
    ],
    staffingHistory: [
      { date: "2026-04-15", event: "Reached out to 4 RBTs — none available" },
      { date: "2026-04-10", event: "Reached out to 2 RBTs — declined" },
      { date: "2026-04-04", event: "Staffing search initiated" },
    ],
  },
  {
    id: "C-0419", childName: "Sofia Garcia", parentName: "Maria Garcia", childAge: "3y 1m",
    state: "GA", clinic: "Riverdale", stage: "Active",
    bcba: "Dr. Kim", rbt: "Jordan M.", intakeOwner: "Sarah M.",
    authStatus: "Approved", staffingStatus: "Assigned", qaStatus: "Complete",
    daysInStage: 28, daysSinceVOB: 92, daysSinceAssessment: 70, daysToStart: null,
    assessmentDate: "2026-02-04", startDate: "2026-03-18",
    nextAction: "Monthly check-in with parent", nextTaskDue: "2026-04-25", lastActivity: "Session note submitted",
    payor: "United",
    blockers: [],
    authorizations: [
      { type: "Initial", status: "Approved", submittedDate: "2026-01-12", approvedDate: "2026-01-22", hours: "8 assessment" },
      { type: "Treatment", status: "Approved", submittedDate: "2026-02-12", approvedDate: "2026-02-25", expirationDate: "2026-08-25", hours: "25/wk" },
    ],
    schedule: [
      { day: "Tue", start: "13:00", end: "17:00", rbt: "Jordan M." },
      { day: "Thu", start: "13:00", end: "17:00", rbt: "Jordan M." },
    ],
    tasks: [
      { id: "ct1", title: "Confirm BCBA Assignment", completed: true },
      { id: "ct2", title: "Send Payment Plan", completed: true },
      { id: "ct3", title: "Generate Case Coordination Document", completed: true },
    ],
    timeline: [
      { id: "t3", type: "stage", description: "Moved to Active", timestamp: "2026-03-18T09:00:00Z", user: "System" },
      { id: "t2", type: "stage", description: "BCBA Dr. Kim assigned", timestamp: "2026-01-08T09:00:00Z", user: "Maria L." },
      ...baseTimeline("2026-01-08T09:00:00Z"),
    ],
    documents: [{ name: "Treatment Plan", type: "PDF" }, { name: "Auth Letter", type: "PDF" }],
    automationLog: ["Auto-created", "Full pipeline → Active"],
    staffingHistory: [{ date: "2026-03-10", event: "Jordan M. assigned" }],
  },
  {
    id: "C-0418", childName: "Liam Chen", parentName: "Wei Chen", childAge: "5y 2m",
    state: "AZ", clinic: "Remote", stage: "In QA",
    bcba: "Dr. Patel", rbt: null, intakeOwner: "James R.",
    authStatus: "Approved", staffingStatus: "Not Needed", qaStatus: "In Review",
    daysInStage: 4, daysSinceVOB: 22, daysSinceAssessment: 6, daysToStart: null,
    assessmentDate: "2026-04-09", startDate: null,
    nextAction: "Complete QA review", nextTaskDue: "2026-04-18", lastActivity: "Assessment completed",
    payor: "Cigna",
    blockers: [],
    authorizations: [
      { type: "Initial", status: "Approved", submittedDate: "2026-03-25", approvedDate: "2026-04-01", hours: "8 assessment" },
      { type: "Treatment", status: "Not Submitted" },
    ],
    schedule: [],
    tasks: [
      { id: "ct1", title: "Confirm BCBA Assignment", completed: true },
      { id: "ct2", title: "Enter Assessment Date", completed: true },
      { id: "ct3", title: "Confirm Treatment Plan Received", completed: false, dueDate: "2026-04-18" },
    ],
    timeline: [
      { id: "t3", type: "stage", description: "Moved to In QA", timestamp: "2026-04-11T09:00:00Z", user: "System" },
      { id: "t2", type: "schedule", description: "Assessment completed", timestamp: "2026-04-09T11:00:00Z", user: "Dr. Patel" },
      ...baseTimeline("2026-03-24T09:00:00Z"),
    ],
    documents: [{ name: "Assessment Notes", type: "PDF" }, { name: "Initial Auth Letter", type: "PDF" }],
    automationLog: ["Auto-created", "Moved to In QA after assessment"],
    staffingHistory: [],
  },
  {
    id: "C-0417", childName: "Olivia Brown", parentName: "Mark Brown", childAge: "3y 9m",
    state: "GA", clinic: "Peachtree Corners", stage: "Pending Treatment Auth",
    bcba: "Dr. Lee", rbt: "Casey R.", intakeOwner: "Sarah M.",
    authStatus: "Submitted", staffingStatus: "Assigned", qaStatus: "Complete",
    daysInStage: 9, daysSinceVOB: 38, daysSinceAssessment: 18, daysToStart: null,
    assessmentDate: "2026-03-29", startDate: null,
    nextAction: "Follow up with payor on auth status", nextTaskDue: "2026-04-17", lastActivity: "Auth submitted to BCBS",
    payor: "BCBS",
    blockers: ["Treatment auth pending payor response (9 days)"],
    authorizations: [
      { type: "Initial", status: "Approved", submittedDate: "2026-03-10", approvedDate: "2026-03-18" },
      { type: "Treatment", status: "Submitted", submittedDate: "2026-04-07" },
    ],
    schedule: [],
    tasks: [
      { id: "ct1", title: "Confirm Treatment Plan Received", completed: true },
      { id: "ct2", title: "Submit Treatment Auth", completed: true },
      { id: "ct3", title: "Follow up with payor", completed: false, dueDate: "2026-04-17" },
    ],
    timeline: [
      { id: "t2", type: "auth", description: "Treatment auth submitted to BCBS", timestamp: "2026-04-07T14:00:00Z", user: "Sarah M." },
      ...baseTimeline("2026-03-09T09:00:00Z"),
    ],
    documents: [{ name: "Treatment Plan", type: "PDF" }, { name: "Auth Submission", type: "PDF" }],
    automationLog: ["Auto-created", "Moved to Pending Treatment Auth"],
    staffingHistory: [{ date: "2026-04-02", event: "Casey R. matched (pending start)" }],
  },
  {
    id: "C-0416", childName: "Noah Williams", parentName: "Keisha Williams", childAge: "4y 1m",
    state: "TX", clinic: "Remote", stage: "Schedule Assessment",
    bcba: "Dr. Kim", rbt: null, intakeOwner: "James R.",
    authStatus: "Approved", staffingStatus: "Not Needed", qaStatus: "Not Started",
    daysInStage: 6, daysSinceVOB: 14, daysSinceAssessment: null, daysToStart: null,
    assessmentDate: null, startDate: null,
    nextAction: "Schedule assessment with Dr. Kim", nextTaskDue: "2026-04-17", lastActivity: "Initial auth approved",
    payor: "Medicaid",
    blockers: ["Assessment unscheduled for 6 days"],
    authorizations: [
      { type: "Initial", status: "Approved", submittedDate: "2026-04-04", approvedDate: "2026-04-09", hours: "8 assessment" },
      { type: "Treatment", status: "Not Submitted" },
    ],
    schedule: [],
    tasks: [
      { id: "ct1", title: "Schedule assessment", completed: false, dueDate: "2026-04-17" },
      { id: "ct2", title: "Confirm parent availability", completed: false },
    ],
    timeline: [
      { id: "t3", type: "stage", description: "Moved to Schedule Assessment", timestamp: "2026-04-09T16:00:00Z", user: "System" },
      { id: "t2", type: "auth", description: "Initial auth approved", timestamp: "2026-04-09T16:00:00Z", user: "System" },
      ...baseTimeline("2026-04-01T09:00:00Z"),
    ],
    documents: [{ name: "Initial Auth Letter", type: "PDF" }],
    automationLog: ["Auto-created", "Moved to Schedule Assessment after auth approval"],
    staffingHistory: [],
  },
  {
    id: "C-0415", childName: "Marcus Johnson", parentName: "Tanya Johnson", childAge: "2y 8m",
    state: "TX", clinic: "Remote", stage: "BCBA Assignment",
    bcba: null, rbt: null, intakeOwner: "Sarah M.",
    authStatus: "Not Submitted", staffingStatus: "Not Needed", qaStatus: "Not Started",
    daysInStage: 2, daysSinceVOB: 2, daysSinceAssessment: null, daysToStart: null,
    assessmentDate: null, startDate: null,
    nextAction: "Assign BCBA in Austin region", nextTaskDue: "2026-04-16", lastActivity: "Moved from Leads",
    payor: "Aetna",
    blockers: ["No BCBA assigned"],
    authorizations: [
      { type: "Initial", status: "Not Submitted" },
      { type: "Treatment", status: "Not Submitted" },
    ],
    schedule: [],
    tasks: [
      { id: "ct1", title: "Assign BCBA", completed: false, dueDate: "2026-04-16" },
      { id: "ct2", title: "Send Payment Plan", completed: false },
    ],
    timeline: [...baseTimeline("2026-04-13T09:00:00Z")],
    documents: [],
    automationLog: ["Auto-created from completed VOB"],
    staffingHistory: [],
  },
  {
    id: "C-0414", childName: "Zoe Rivera", parentName: "Diana Rivera", childAge: "3y 6m",
    state: "GA", clinic: "Riverdale", stage: "Pending Initial Auth",
    bcba: "Dr. Kim", rbt: null, intakeOwner: "Sarah M.",
    authStatus: "Submitted", staffingStatus: "Not Needed", qaStatus: "Not Started",
    daysInStage: 5, daysSinceVOB: 8, daysSinceAssessment: null, daysToStart: null,
    assessmentDate: null, startDate: null,
    nextAction: "Wait for BCBS auth approval", nextTaskDue: "2026-04-20", lastActivity: "Initial auth submitted",
    payor: "BCBS",
    blockers: [],
    authorizations: [
      { type: "Initial", status: "Submitted", submittedDate: "2026-04-10" },
      { type: "Treatment", status: "Not Submitted" },
    ],
    schedule: [],
    tasks: [
      { id: "ct1", title: "Confirm BCBA Assignment", completed: true },
      { id: "ct2", title: "Submit Initial Auth", completed: true },
    ],
    timeline: [
      { id: "t2", type: "auth", description: "Initial auth submitted", timestamp: "2026-04-10T11:00:00Z", user: "Sarah M." },
      ...baseTimeline("2026-04-07T09:00:00Z"),
    ],
    documents: [{ name: "Auth Submission", type: "PDF" }],
    automationLog: ["Auto-created", "BCBA assigned", "Moved to Pending Initial Auth"],
    staffingHistory: [],
  },
  {
    id: "C-0413", childName: "Ben Carter", parentName: "Michael Carter", childAge: "4y 4m",
    state: "GA", clinic: "Peachtree Corners", stage: "Pending Start Date",
    bcba: "Dr. Lee", rbt: "Alex P.", intakeOwner: "James R.",
    authStatus: "Approved", staffingStatus: "Assigned", qaStatus: "Complete",
    daysInStage: 3, daysSinceVOB: 55, daysSinceAssessment: 32, daysToStart: 8,
    assessmentDate: "2026-03-15", startDate: "2026-04-23",
    nextAction: "Confirm start date logistics with parent", nextTaskDue: "2026-04-19", lastActivity: "Start date set",
    payor: "Cigna",
    blockers: [],
    authorizations: [
      { type: "Initial", status: "Approved", submittedDate: "2026-02-25", approvedDate: "2026-03-05" },
      { type: "Treatment", status: "Approved", submittedDate: "2026-03-20", approvedDate: "2026-04-01", expirationDate: "2026-10-01", hours: "15/wk" },
    ],
    schedule: [
      { day: "Mon", start: "14:00", end: "17:00", rbt: "Alex P." },
      { day: "Wed", start: "14:00", end: "17:00", rbt: "Alex P." },
    ],
    tasks: [
      { id: "ct1", title: "Confirm start date logistics", completed: false, dueDate: "2026-04-19" },
      { id: "ct2", title: "Generate Case Coordination Document", completed: true },
    ],
    timeline: [
      { id: "t3", type: "stage", description: "Moved to Pending Start Date", timestamp: "2026-04-12T09:00:00Z", user: "System" },
      { id: "t2", type: "staffing", description: "Alex P. assigned as RBT", timestamp: "2026-04-08T15:00:00Z", user: "Maria L." },
      ...baseTimeline("2026-02-19T09:00:00Z"),
    ],
    documents: [{ name: "Treatment Plan", type: "PDF" }, { name: "Case Coordination Document", type: "PDF" }],
    automationLog: ["Full pipeline complete", "Moved to Pending Start Date"],
    staffingHistory: [{ date: "2026-04-08", event: "Alex P. matched and confirmed" }],
  },
  {
    id: "C-0412", childName: "Hannah Park", parentName: "Soo Park", childAge: "3y 2m",
    state: "AZ", clinic: "Remote", stage: "Restaffing Needed",
    bcba: "Dr. Patel", rbt: null, intakeOwner: "James R.",
    authStatus: "Approved", staffingStatus: "Needed", qaStatus: "Complete",
    daysInStage: 7, daysSinceVOB: 110, daysSinceAssessment: 80, daysToStart: null,
    assessmentDate: "2026-01-25", startDate: "2026-02-15",
    nextAction: "Find replacement RBT", nextTaskDue: "2026-04-18", lastActivity: "Previous RBT resigned",
    payor: "United",
    blockers: ["Previous RBT resigned 7 days ago"],
    authorizations: [
      { type: "Initial", status: "Approved", submittedDate: "2026-01-05", approvedDate: "2026-01-12" },
      { type: "Treatment", status: "Approved", submittedDate: "2026-01-30", approvedDate: "2026-02-08", expirationDate: "2026-08-08", hours: "20/wk" },
    ],
    schedule: [],
    tasks: [
      { id: "ct1", title: "Find replacement RBT", completed: false, dueDate: "2026-04-18" },
      { id: "ct2", title: "Notify parent of pause", completed: true },
    ],
    timeline: [
      { id: "t3", type: "stage", description: "Moved to Restaffing Needed", timestamp: "2026-04-08T09:00:00Z", user: "System" },
      { id: "t2", type: "staffing", description: "Previous RBT (Sam K.) resigned", timestamp: "2026-04-08T08:00:00Z", user: "Maria L." },
      ...baseTimeline("2026-01-04T09:00:00Z"),
    ],
    documents: [{ name: "Treatment Plan", type: "PDF" }],
    automationLog: ["Auto-created", "Moved to Active", "RBT departure → Restaffing Needed"],
    staffingHistory: [
      { date: "2026-04-08", event: "RBT resigned — restaffing initiated" },
      { date: "2026-02-10", event: "Sam K. originally assigned" },
    ],
  },
  {
    id: "C-0411", childName: "Caleb Foster", parentName: "Rachel Foster", childAge: "5y 0m",
    state: "GA", clinic: "Peachtree Corners", stage: "Services on Pause",
    bcba: "Dr. Kim", rbt: "Taylor S.", intakeOwner: "Sarah M.",
    authStatus: "Approved", staffingStatus: "Assigned", qaStatus: "Complete",
    daysInStage: 14, daysSinceVOB: 130, daysSinceAssessment: 100, daysToStart: null,
    assessmentDate: "2026-01-05", startDate: "2026-02-01",
    nextAction: "Wait for parent return from travel", nextTaskDue: "2026-05-01", lastActivity: "Services paused",
    payor: "BCBS",
    blockers: ["Family on extended travel"],
    authorizations: [
      { type: "Initial", status: "Approved", submittedDate: "2025-12-15", approvedDate: "2025-12-22" },
      { type: "Treatment", status: "Approved", submittedDate: "2026-01-10", approvedDate: "2026-01-20", expirationDate: "2026-07-20", hours: "20/wk" },
    ],
    schedule: [],
    tasks: [{ id: "ct1", title: "Confirm restart date", completed: false, dueDate: "2026-05-01" }],
    timeline: [
      { id: "t2", type: "stage", description: "Moved to Services on Pause", timestamp: "2026-04-01T09:00:00Z", user: "Sarah M." },
      ...baseTimeline("2025-12-14T09:00:00Z"),
    ],
    documents: [{ name: "Treatment Plan", type: "PDF" }],
    automationLog: ["Active → Services on Pause (parent request)"],
    staffingHistory: [],
  },
  {
    id: "C-0410", childName: "Layla Brooks", parentName: "Andre Brooks", childAge: "3y 11m",
    state: "GA", clinic: "Riverdale", stage: "Waiting on Consent Forms",
    bcba: "Dr. Kim", rbt: null, intakeOwner: "Sarah M.",
    authStatus: "Not Submitted", staffingStatus: "Not Needed", qaStatus: "Not Started",
    daysInStage: 4, daysSinceVOB: 4, daysSinceAssessment: null, daysToStart: null,
    assessmentDate: null, startDate: null,
    nextAction: "Follow up on consent forms", nextTaskDue: "2026-04-17", lastActivity: "Consent forms sent",
    payor: "United",
    blockers: ["Consent forms outstanding"],
    authorizations: [
      { type: "Initial", status: "Not Submitted" },
      { type: "Treatment", status: "Not Submitted" },
    ],
    schedule: [],
    tasks: [
      { id: "ct1", title: "Confirm BCBA Assignment", completed: true },
      { id: "ct2", title: "Confirm Consent Forms", completed: false, dueDate: "2026-04-17" },
    ],
    timeline: [...baseTimeline("2026-04-11T09:00:00Z")],
    documents: [],
    automationLog: ["Auto-created", "Consent forms sent automatically"],
    staffingHistory: [],
  },
];

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
  bcbaAssignment: (c) => c.stage === "BCBA Assignment",
  pendingInitialAuth: (c) => c.stage === "Pending Initial Auth",
  waitingConsent: (c) => c.stage === "Waiting on Consent Forms",
  assessmentScheduled: (c) => c.stage === "Assessment Scheduled",
  inQa: (c) => c.stage === "In QA",
  pendingTreatmentAuth: (c) => c.stage === "Pending Treatment Auth",
  staffingNeeded: (c) => c.stage === "Staffing Needed" || c.stage === "Restaffing Needed",
  pendingStart: (c) => c.stage === "Pending Start Date",
  active: (c) => c.stage === "Active",
};

export const calculateClientKpis = (clients: Client[]) => {
  const inStage = (s: ClientStage) => clients.filter((c) => c.stage === s).length;
  const avgDaysIn = (filter: (c: Client) => boolean) => {
    const xs = clients.filter(filter);
    if (!xs.length) return 0;
    return Math.round(xs.reduce((sum, c) => sum + c.daysInStage, 0) / xs.length);
  };
  return {
    bcbaAssignment: inStage("BCBA Assignment"),
    pendingInitialAuth: inStage("Pending Initial Auth"),
    waitingConsent: inStage("Waiting on Consent Forms"),
    assessmentScheduled: inStage("Assessment Scheduled"),
    inQa: inStage("In QA"),
    pendingTreatmentAuth: inStage("Pending Treatment Auth"),
    staffingNeeded: inStage("Staffing Needed") + inStage("Restaffing Needed"),
    pendingStart: inStage("Pending Start Date"),
    active: inStage("Active"),
    avgTimeToStart: avgDaysIn((c) => c.daysToStart !== null) || 18,
    avgTimeInQa: avgDaysIn((c) => c.stage === "In QA") || 0,
    avgTimeInStaffing: avgDaysIn((c) => c.stage === "Staffing Needed") || 0,
  };
};
