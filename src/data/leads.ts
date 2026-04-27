export type LeadStatus =
  | "New Lead"
  | "In Contact"
  | "Sent Form"
  | "Missing Information"
  | "Form Received"
  | "Sent to VOB"
  | "VOB Completed"
  | "Can't Reach"
  | "Can Not Submit Auth"
  | "Sent Packet - Can't Reach"
  | "Non-qualified Lead"
  | "Getting DX"
  | "Non-Qualified"
  | "Needs DX";

export type Priority = "Hot" | "Warm" | "Cold";
export type LeadSource = "Website" | "Phone" | "Facebook" | "Referral" | "Ads" | "Organic" | "Digital" | "Insurance";
export type FormStatus = "Not Sent" | "Sent" | "Viewed" | "Complete" | "Completed";
export type ConsentStatus = "Not Sent" | "Sent" | "Complete" | "Completed";
export type VobStatus = "Not Started" | "Not Sent" | "Sent" | "Received" | "Completed" | "Issue" | "Approved" | "Payment Plan Required";
export type FormReviewStatus = "Pending" | "Complete" | "Missing Info" | "Missing Information";
export type FinancialStatus = "Pending Review" | "Approved" | "Payment Plan Required" | "Not Viable";
export type PaymentPlanStatus = "Not Required" | "Sent" | "Awaiting Signature" | "Signed" | "Approved" | "Declined" | "Not Qualified";

export interface LeadTask {
  id: string;
  title: string;
  completed: boolean;
  owner?: string;
  dueDate?: string;
  workflowStep?: string;
  comments?: number;
}

export const INTAKE_COORDINATORS = ["Sarah M.", "James R.", "Maya P."];

export const createIntakeTask = (title: LeadTask["title"], owner = INTAKE_COORDINATORS[0], dueOffsetDays = 0): LeadTask => {
  const due = new Date();
  due.setDate(due.getDate() + dueOffsetDays);
  return {
    id: `tk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    completed: false,
    owner,
    dueDate: due.toISOString().split("T")[0],
    workflowStep: title,
  };
};

export const FINANCIAL_OWNER = "Gabi";

export const defaultFinancialFields = (insurance = "") => ({
  primaryInsurance: insurance,
  secondaryInsurance: "",
  inNetwork: true,
  outOfNetwork: false,
  deductibleAmount: 3000,
  deductibleRemaining: 1200,
  coinsurancePercent: 20,
  copay: 35,
  maxOutOfPocket: 8500,
  estimatedInsuranceCoveragePercent: 80,
  estimatedClientResponsibility: 620,
  expectedWeeklyHours: 20,
  estimatedMonthlyRevenue: 6400,
  financialStatus: "Pending Review" as FinancialStatus,
  financialDecisionNotes: "",
  financialOwner: FINANCIAL_OWNER,
  daysInFinancialStage: 0,
  financialBlockers: [] as string[],
  paymentPlanSent: false,
  paymentPlanSigned: false,
  paymentPlanAmount: 0,
  paymentPlanStatus: "Not Required" as PaymentPlanStatus,
});

export interface TimelineEvent {
  id: string;
  type: "call" | "email" | "sms" | "form" | "system" | "note";
  description: string;
  timestamp: string;
  user?: string;
}

export type CallOutcome = "Attempted" | "Contacted" | "Connected" | "Left voicemail" | "Wrong number";

export interface CommunicationLog {
  id: string;
  type: "call" | "sms" | "email" | "note";
  outcome?: CallOutcome;
  direction?: "inbound" | "outbound";
  subject?: string;
  preview: string;
  timestamp: string;
  user?: string;
  durationSec?: number;
}

export interface Lead {
  id: string;
  childName: string;
  parentName: string;
  phone: string;
  email: string;
  state: string;
  source: LeadSource;
  status: LeadStatus;
  owner: string;
  priority: Priority;
  childAge: string;
  formStatus: FormStatus;
  consentStatus: ConsentStatus;
  vobStatus: VobStatus;
  formReviewStatus: FormReviewStatus;
  insurance: string;
  insuranceType: string;
  primaryInsurance: string;
  secondaryInsurance?: string;
  inNetwork: boolean;
  outOfNetwork: boolean;
  deductibleAmount: number;
  deductibleRemaining: number;
  coinsurancePercent: number;
  copay: number;
  maxOutOfPocket: number;
  estimatedInsuranceCoveragePercent: number;
  estimatedClientResponsibility: number;
  expectedWeeklyHours: number;
  estimatedMonthlyRevenue: number;
  financialStatus: FinancialStatus;
  financialDecisionNotes?: string;
  financialOwner: string;
  daysInFinancialStage: number;
  financialBlockers: string[];
  notQualifiedReason?: string;
  createdAt: string;
  updatedAt: string;
  lastContacted: string | null;
  daysInStage: number;
  nextAction: string;
  nextTaskDue: string | null;
  lastActivity: string;
  payor: string;
  coverageType: string;
  paymentPlanNeeded: boolean;
  paymentPlanSent: boolean;
  paymentPlanSigned: boolean;
  paymentPlanAmount: number;
  paymentPlanStatus: PaymentPlanStatus;
  initialFormLink?: string;
  vobFile?: { name: string; uploadedAt: string };
  notes?: string;
  tags?: string[];
  timeline: TimelineEvent[];
  tasks: LeadTask[];
  documents: { name: string; type: string; url?: string; uploadedAt?: string }[];
  communications: CommunicationLog[];
  automationLog: string[];
}

export const pipelineStages: { name: LeadStatus; color: string }[] = [
  { name: "New Lead", color: "info" },
  { name: "In Contact", color: "default" },
  { name: "Sent Form", color: "default" },
  { name: "Missing Information", color: "warning" },
  { name: "Form Received", color: "success" },
  { name: "Sent to VOB", color: "default" },
  { name: "VOB Completed", color: "success" },
  { name: "Can't Reach", color: "destructive" },
  { name: "Can Not Submit Auth", color: "destructive" },
  { name: "Sent Packet - Can't Reach", color: "warning" },
  { name: "Non-Qualified", color: "muted" },
  { name: "Needs DX", color: "default" },
];

const makeTimeline = (status: LeadStatus): TimelineEvent[] => {
  const base: TimelineEvent[] = [
    { id: "t1", type: "system", description: "Lead created from website form", timestamp: "2025-04-10T09:00:00Z" },
  ];
  if (status !== "New Lead") {
    base.push({ id: "t2", type: "call", description: "Call attempt #1 — no answer", timestamp: "2025-04-10T10:30:00Z", user: "Sarah M." });
    base.push({ id: "t3", type: "sms", description: "Intro SMS sent", timestamp: "2025-04-10T10:32:00Z", user: "Sarah M." });
  }
  if (["Sent Form", "Missing Information", "Form Received", "Sent to VOB", "VOB Completed", "Needs DX", "Getting DX"].includes(status)) {
    base.push({ id: "t4", type: "call", description: "Connected — parent interested", timestamp: "2025-04-11T14:00:00Z", user: "Sarah M." });
    base.push({ id: "t5", type: "form", description: "Intake form sent via PandaDoc", timestamp: "2025-04-11T14:15:00Z", user: "Sarah M." });
  }
  if (["Form Received", "Sent to VOB", "VOB Completed"].includes(status)) {
    base.push({ id: "t6", type: "form", description: "Intake form completed by parent", timestamp: "2025-04-12T08:00:00Z" });
  }
  if (["Sent to VOB", "VOB Completed"].includes(status)) {
    base.push({ id: "t7", type: "system", description: "VOB submitted to insurance", timestamp: "2025-04-13T10:00:00Z" });
  }
  if (status === "VOB Completed") {
    base.push({ id: "t8", type: "system", description: "VOB received — ready for client transition", timestamp: "2025-04-14T16:00:00Z" });
  }
  return base;
};

const makeCommunications = (status: LeadStatus, owner: string): CommunicationLog[] => {
  const logs: CommunicationLog[] = [];
  if (status !== "New Lead") {
    logs.push({
      id: "c1", type: "call", outcome: "Left voicemail", direction: "outbound",
      preview: "Left voicemail — introduced Blossom, offered to call back",
      timestamp: "2025-04-10T10:30:00Z", user: owner, durationSec: 45,
    });
    logs.push({
      id: "c2", type: "sms", direction: "outbound",
      preview: "Hi! This is Blossom ABA — we got your inquiry about evaluation services...",
      timestamp: "2025-04-10T10:32:00Z", user: owner,
    });
  }
  if (["Sent Form", "Missing Information", "Form Received", "Sent to VOB", "VOB Completed", "Getting DX"].includes(status)) {
    logs.push({
      id: "c3", type: "call", outcome: "Connected", direction: "outbound",
      preview: "Connected with parent. Discussed services, walked through intake process.",
      timestamp: "2025-04-11T14:00:00Z", user: owner, durationSec: 720,
    });
    logs.push({
      id: "c4", type: "email", direction: "outbound",
      subject: "Your Blossom ABA Intake Packet",
      preview: "Sending your intake form via PandaDoc. Please complete at your earliest convenience...",
      timestamp: "2025-04-11T14:15:00Z", user: owner,
    });
  }
  if (status === "Can't Reach") {
    logs.push({
      id: "c5", type: "call", outcome: "Left voicemail", direction: "outbound",
      preview: "3rd attempt — no answer, left detailed voicemail.",
      timestamp: "2025-04-13T11:00:00Z", user: owner, durationSec: 30,
    });
  }
  return logs;
};

const makeTasks = (status: LeadStatus, owner: string): LeadTask[] => {
  const tasks: LeadTask[] = [];
  if (["Form Received", "Sent to VOB", "VOB Completed", "Missing Information"].includes(status)) {
    tasks.push({ id: "tk1", title: "Review Intake Packet", completed: status !== "Form Received", owner, workflowStep: "Form Received", dueDate: "2025-04-15" });
    tasks.push({ id: "tk2", title: "Set Insurance & Insurance Type Field", completed: ["Sent to VOB", "VOB Completed"].includes(status), owner, workflowStep: "Form Received", dueDate: "2025-04-15" });
    tasks.push({ id: "tk3", title: "Set Form Review Status", completed: ["Sent to VOB", "VOB Completed"].includes(status), owner, workflowStep: "Form Received", dueDate: "2025-04-15" });
  }
  if (status === "Missing Information") {
    tasks.push({ id: "tk4", title: "Collect Missing Information and Update Form Status", completed: false, owner, workflowStep: "Missing Information", dueDate: "2025-04-16", comments: 2 });
  }
  if (["Sent to VOB", "VOB Completed"].includes(status)) {
    tasks.push({ id: "tk5", title: "Add to Eligipro", completed: status === "VOB Completed", owner, workflowStep: "Sent to VOB", dueDate: "2025-04-16" });
    tasks.push({ id: "tk6", title: "Add to Central Reach", completed: status === "VOB Completed", owner, workflowStep: "Sent to VOB", dueDate: "2025-04-16" });
  }
  if (status === "Can Not Submit Auth") {
    tasks.push({ id: "tk7", title: "Collect Missing Documentation", completed: false, owner, workflowStep: "Can Not Submit Auth", dueDate: "2025-04-17" });
  }
  return tasks;
};

const buildLead = (
  partial: Pick<Lead, "id" | "childName" | "parentName" | "phone" | "email" | "state" | "source" | "status" | "owner" | "priority" | "childAge" | "createdAt" | "lastContacted" | "daysInStage" | "nextAction" | "nextTaskDue" | "lastActivity" | "payor" | "coverageType" | "paymentPlanNeeded" | "insurance" | "insuranceType"> &
    Partial<Pick<Lead, "formStatus" | "consentStatus" | "vobStatus" | "formReviewStatus" | "documents" | "vobFile" | "notQualifiedReason" | "tags" | "notes" | "initialFormLink">>
): Lead => {
  const formStatus = partial.formStatus ?? "Not Sent";
  const consentStatus = partial.consentStatus ?? "Not Sent";
  const vobStatus = partial.vobStatus ?? "Not Started";
  const formReviewStatus = partial.formReviewStatus ?? "Pending";
  return {
    ...partial,
    formStatus,
    consentStatus,
    vobStatus,
    formReviewStatus,
    updatedAt: partial.lastContacted ?? partial.createdAt,
    initialFormLink: partial.initialFormLink ?? "https://app.pandadoc.com/intake/" + partial.id,
    documents: partial.documents ?? [],
    tags: partial.tags ?? [],
    notes: partial.notes,
    vobFile: partial.vobFile,
    notQualifiedReason: partial.notQualifiedReason,
    timeline: makeTimeline(partial.status),
    tasks: makeTasks(partial.status, partial.owner),
    communications: makeCommunications(partial.status, partial.owner),
    automationLog: ["Lead created from " + partial.source.toLowerCase()],
  };
};

export const mockLeads: Lead[] = [
  buildLead({ id: "L-1042", childName: "Emma Thompson", parentName: "Jennifer Thompson", phone: "(404) 555-0142", email: "jthompson@email.com", state: "GA", source: "Website", status: "New Lead", owner: "Sarah M.", priority: "Hot", childAge: "3y 2m", createdAt: "2025-04-15T14:00:00Z", lastContacted: null, daysInStage: 0, nextAction: "Make first contact", nextTaskDue: "2025-04-15", lastActivity: "Lead created", payor: "BCBS", coverageType: "PPO", paymentPlanNeeded: false, insurance: "BCBS", insuranceType: "PPO" }),
  buildLead({ id: "L-1041", childName: "Aiden Patel", parentName: "Ravi Patel", phone: "(512) 555-0198", email: "rpatel@email.com", state: "TX", source: "Referral", status: "In Contact", owner: "James R.", priority: "Warm", childAge: "4y 8m", createdAt: "2025-04-13T09:00:00Z", lastContacted: "2025-04-14T10:30:00Z", daysInStage: 2, nextAction: "Send intake form", nextTaskDue: "2025-04-16", lastActivity: "SMS sent", payor: "Aetna", coverageType: "HMO", paymentPlanNeeded: false, insurance: "Aetna", insuranceType: "HMO" }),
  buildLead({ id: "L-1040", childName: "Sofia Garcia", parentName: "Maria Garcia", phone: "(770) 555-0167", email: "mgarcia@email.com", state: "GA", source: "Insurance", status: "Form Received", owner: "Sarah M.", priority: "Hot", childAge: "2y 11m", formStatus: "Completed", consentStatus: "Sent", formReviewStatus: "Pending", createdAt: "2025-04-10T08:00:00Z", lastContacted: "2025-04-13T15:00:00Z", daysInStage: 1, nextAction: "Review form & send VOB", nextTaskDue: "2025-04-15", lastActivity: "Form completed", payor: "United", coverageType: "PPO", paymentPlanNeeded: false, insurance: "United Healthcare", insuranceType: "PPO", documents: [{ name: "Intake Form", type: "PandaDoc", uploadedAt: "2025-04-12" }, { name: "Insurance Card (Front)", type: "Image", uploadedAt: "2025-04-12" }] }),
  buildLead({ id: "L-1039", childName: "Liam Chen", parentName: "Wei Chen", phone: "(480) 555-0134", email: "wchen@email.com", state: "AZ", source: "Website", status: "Sent to VOB", owner: "James R.", priority: "Warm", childAge: "5y 1m", formStatus: "Completed", consentStatus: "Completed", vobStatus: "Sent", formReviewStatus: "Complete", createdAt: "2025-04-08T10:00:00Z", lastContacted: "2025-04-12T11:00:00Z", daysInStage: 3, nextAction: "Follow up on VOB", nextTaskDue: "2025-04-16", lastActivity: "VOB sent to insurance", payor: "Cigna", coverageType: "PPO", paymentPlanNeeded: true, insurance: "Cigna", insuranceType: "PPO", documents: [{ name: "Intake Form", type: "PandaDoc" }, { name: "Consent Forms", type: "PDF" }, { name: "Insurance Card", type: "Image" }] }),
  buildLead({ id: "L-1038", childName: "Olivia Brown", parentName: "Mark Brown", phone: "(678) 555-0189", email: "mbrown@email.com", state: "GA", source: "Referral", status: "Missing Information", owner: "Sarah M.", priority: "Warm", childAge: "3y 7m", formStatus: "Sent", consentStatus: "Not Sent", formReviewStatus: "Missing Information", createdAt: "2025-04-07T12:00:00Z", lastContacted: "2025-04-11T09:00:00Z", daysInStage: 5, nextAction: "Follow up on missing info", nextTaskDue: "2025-04-15", lastActivity: "Missing info flagged", payor: "BCBS", coverageType: "EPO", paymentPlanNeeded: false, insurance: "BCBS", insuranceType: "EPO", documents: [{ name: "Intake Form (Incomplete)", type: "PandaDoc" }] }),
  buildLead({ id: "L-1037", childName: "Noah Williams", parentName: "Keisha Williams", phone: "(214) 555-0156", email: "kwilliams@email.com", state: "TX", source: "Website", status: "VOB Completed", owner: "James R.", priority: "Hot", childAge: "4y 0m", formStatus: "Completed", consentStatus: "Completed", vobStatus: "Approved", formReviewStatus: "Complete", createdAt: "2025-04-05T07:00:00Z", lastContacted: "2025-04-14T16:00:00Z", daysInStage: 1, nextAction: "Move to Clients", nextTaskDue: "2025-04-15", lastActivity: "VOB completed", payor: "Medicaid", coverageType: "Managed", paymentPlanNeeded: false, insurance: "Texas Medicaid", insuranceType: "Managed Care", vobFile: { name: "VOB_Williams.pdf", uploadedAt: "2025-04-14" }, documents: [{ name: "Intake Form", type: "PandaDoc" }, { name: "Consent Forms", type: "PDF" }, { name: "VOB Report", type: "PDF" }] }),
  buildLead({ id: "L-1036", childName: "Ava Martinez", parentName: "Carlos Martinez", phone: "(602) 555-0178", email: "cmartinez@email.com", state: "AZ", source: "Insurance", status: "Can't Reach", owner: "Sarah M.", priority: "Cold", childAge: "3y 4m", createdAt: "2025-04-03T11:00:00Z", lastContacted: "2025-04-10T14:00:00Z", daysInStage: 8, nextAction: "Final contact attempt", nextTaskDue: "2025-04-16", lastActivity: "Call attempt #3 — voicemail", payor: "Tricare", coverageType: "Prime", paymentPlanNeeded: false, insurance: "Tricare", insuranceType: "Prime" }),
  buildLead({ id: "L-1035", childName: "Ethan Davis", parentName: "Lauren Davis", phone: "(404) 555-0123", email: "ldavis@email.com", state: "GA", source: "Website", status: "New Lead", owner: "James R.", priority: "Hot", childAge: "2y 6m", createdAt: "2025-04-15T08:00:00Z", lastContacted: null, daysInStage: 0, nextAction: "Make first contact", nextTaskDue: "2025-04-15", lastActivity: "Lead created", payor: "BCBS", coverageType: "PPO", paymentPlanNeeded: false, insurance: "BCBS", insuranceType: "PPO" }),
  buildLead({ id: "L-1034", childName: "Mia Johnson", parentName: "David Johnson", phone: "(972) 555-0145", email: "djohnson@email.com", state: "TX", source: "Ads", status: "Sent Form", owner: "Sarah M.", priority: "Warm", childAge: "3y 9m", formStatus: "Sent", createdAt: "2025-04-09T13:00:00Z", lastContacted: "2025-04-11T10:00:00Z", daysInStage: 4, nextAction: "Follow up on form", nextTaskDue: "2025-04-15", lastActivity: "Form sent", payor: "Aetna", coverageType: "PPO", paymentPlanNeeded: false, insurance: "Aetna", insuranceType: "PPO" }),
  buildLead({ id: "L-1033", childName: "Lucas Wilson", parentName: "Amanda Wilson", phone: "(770) 555-0199", email: "awilson@email.com", state: "GA", source: "Referral", status: "Getting DX", owner: "James R.", priority: "Warm", childAge: "4y 3m", formStatus: "Completed", consentStatus: "Completed", formReviewStatus: "Complete", createdAt: "2025-04-06T15:00:00Z", lastContacted: "2025-04-13T09:00:00Z", daysInStage: 3, nextAction: "Wait for DX from pediatrician", nextTaskDue: "2025-04-18", lastActivity: "DX request sent", payor: "United", coverageType: "HMO", paymentPlanNeeded: true, insurance: "United Healthcare", insuranceType: "HMO", documents: [{ name: "Intake Form", type: "PandaDoc" }, { name: "Consent Forms", type: "PDF" }] }),
  buildLead({ id: "L-1032", childName: "Isabella Lee", parentName: "Grace Lee", phone: "(480) 555-0112", email: "glee@email.com", state: "AZ", source: "Website", status: "New Lead", owner: "Sarah M.", priority: "Hot", childAge: "2y 1m", createdAt: "2025-04-15T11:00:00Z", lastContacted: null, daysInStage: 0, nextAction: "Make first contact", nextTaskDue: "2025-04-15", lastActivity: "Lead created", payor: "BCBS", coverageType: "PPO", paymentPlanNeeded: false, insurance: "BCBS", insuranceType: "PPO" }),
  buildLead({ id: "L-1031", childName: "Jackson Moore", parentName: "Tiffany Moore", phone: "(214) 555-0176", email: "tmoore@email.com", state: "TX", source: "Insurance", status: "Sent Form", owner: "James R.", priority: "Warm", childAge: "5y 5m", formStatus: "Viewed", createdAt: "2025-04-08T09:00:00Z", lastContacted: "2025-04-10T16:00:00Z", daysInStage: 6, nextAction: "Follow up — form viewed but not completed", nextTaskDue: "2025-04-15", lastActivity: "Form viewed by parent", payor: "Cigna", coverageType: "PPO", paymentPlanNeeded: false, insurance: "Cigna", insuranceType: "PPO" }),
  // Additional seed
  buildLead({ id: "L-1030", childName: "Charlotte Kim", parentName: "Helen Kim", phone: "(404) 555-0211", email: "hkim@email.com", state: "GA", source: "Facebook", status: "Can Not Submit Auth", owner: "Sarah M.", priority: "Hot", childAge: "3y 0m", formStatus: "Completed", consentStatus: "Completed", vobStatus: "Issue", formReviewStatus: "Missing Information", createdAt: "2025-04-04T10:00:00Z", lastContacted: "2025-04-13T11:00:00Z", daysInStage: 4, nextAction: "Collect missing documentation", nextTaskDue: "2025-04-17", lastActivity: "Auth blocked — missing docs", payor: "Anthem", coverageType: "PPO", paymentPlanNeeded: false, insurance: "Anthem", insuranceType: "PPO", documents: [{ name: "Intake Form", type: "PandaDoc" }] }),
  buildLead({ id: "L-1029", childName: "Mason Rivera", parentName: "Diana Rivera", phone: "(602) 555-0287", email: "drivera@email.com", state: "AZ", source: "Phone", status: "Sent Packet - Can't Reach", owner: "James R.", priority: "Cold", childAge: "4y 6m", formStatus: "Sent", createdAt: "2025-03-28T09:00:00Z", lastContacted: "2025-04-09T14:00:00Z", daysInStage: 9, nextAction: "Mark non-qualified or reattempt", nextTaskDue: null, lastActivity: "Packet mailed — no response", payor: "Cigna", coverageType: "HMO", paymentPlanNeeded: false, insurance: "Cigna", insuranceType: "HMO" }),
  buildLead({ id: "L-1028", childName: "Amelia Scott", parentName: "Joel Scott", phone: "(770) 555-0322", email: "jscott@email.com", state: "GA", source: "Organic", status: "Non-qualified Lead", owner: "Sarah M.", priority: "Cold", childAge: "8y 0m", createdAt: "2025-04-02T10:00:00Z", lastContacted: "2025-04-08T12:00:00Z", daysInStage: 6, nextAction: "Archive", nextTaskDue: null, lastActivity: "Out of age range", payor: "BCBS", coverageType: "PPO", paymentPlanNeeded: false, insurance: "BCBS", insuranceType: "PPO", notQualifiedReason: "Out of age range" }),
  buildLead({ id: "L-1027", childName: "Henry Wright", parentName: "Olivia Wright", phone: "(512) 555-0411", email: "owright@email.com", state: "TX", source: "Digital", status: "VOB Completed", owner: "James R.", priority: "Hot", childAge: "3y 5m", formStatus: "Completed", consentStatus: "Completed", vobStatus: "Payment Plan Required", formReviewStatus: "Complete", createdAt: "2025-04-04T08:00:00Z", lastContacted: "2025-04-14T10:00:00Z", daysInStage: 0, nextAction: "Set up payment plan & move to Clients", nextTaskDue: "2025-04-15", lastActivity: "VOB approved — payment plan needed", payor: "BCBS", coverageType: "HSA", paymentPlanNeeded: true, insurance: "BCBS", insuranceType: "HSA", vobFile: { name: "VOB_Wright.pdf", uploadedAt: "2025-04-14" }, documents: [{ name: "Intake Form", type: "PandaDoc" }, { name: "Consent Forms", type: "PDF" }, { name: "VOB Report", type: "PDF" }] }),
];

export const statusVariant = (status: string): "default" | "success" | "warning" | "destructive" | "info" | "muted" => {
  const map: Record<string, "default" | "success" | "warning" | "destructive" | "info" | "muted"> = {
    "New Lead": "info",
    "In Contact": "default",
    "Sent Form": "default",
    "Missing Information": "warning",
    "Form Received": "success",
    "Sent to VOB": "default",
    "VOB Completed": "success",
    "Can't Reach": "destructive",
    "Can Not Submit Auth": "destructive",
    "Sent Packet - Can't Reach": "warning",
    "Non-qualified Lead": "muted",
    "Getting DX": "default",
    "Non-Qualified": "muted",
    "Needs DX": "default",
  };
  return map[status] || "muted";
};

export const priorityVariant = (p: Priority): "destructive" | "warning" | "muted" => {
  return p === "Hot" ? "destructive" : p === "Warm" ? "warning" : "muted";
};

export const getInlineAlert = (lead: Lead): { type: "red" | "yellow"; message: string } | null => {
  if (lead.status === "New Lead" && !lead.lastContacted) return { type: "red", message: "No contact yet" };
  if (lead.status === "Missing Information" && lead.daysInStage >= 3) return { type: "red", message: "Missing info blocking VOB" };
  if (lead.status === "Sent Form" && lead.daysInStage >= 3) return { type: "yellow", message: "Form not completed in " + lead.daysInStage + "d" };
  if (lead.status === "Form Received" && lead.vobStatus === "Not Sent") return { type: "red", message: "VOB not sent" };
  if (lead.status === "Sent to VOB" && lead.daysInStage >= 3) return { type: "yellow", message: "VOB pending " + lead.daysInStage + "d" };
  if (lead.status === "Can't Reach" && lead.daysInStage >= 5) return { type: "red", message: "Can't reach — " + lead.daysInStage + "d" };
  if (lead.status === "Can Not Submit Auth") return { type: "red", message: "Auth blocked — missing docs" };
  if (lead.status === "VOB Completed" && (lead.vobStatus === "Approved" || lead.vobStatus === "Payment Plan Required")) return { type: "yellow", message: "Ready to move to Clients" };
  if (lead.daysInStage > 5 && !["VOB Completed", "Non-Qualified", "Non-qualified Lead"].includes(lead.status)) return { type: "red", message: `Stuck in stage ${lead.daysInStage}d` };
  return null;
};

// KPI calculators
export type KpiKey = "newToday" | "notContacted" | "sentForm" | "missingInfo" | "sentVob" | "vobCompleted" | "cantReach" | "all";

export const kpiFilters: Record<KpiKey, (l: Lead) => boolean> = {
  all: () => true,
  newToday: (l) => l.status === "New Lead" && l.daysInStage === 0,
  notContacted: (l) => !l.lastContacted,
  sentForm: (l) => l.status === "Sent Form",
  missingInfo: (l) => l.status === "Missing Information",
  sentVob: (l) => l.status === "Sent to VOB",
  vobCompleted: (l) => l.status === "VOB Completed",
  cantReach: (l) => l.status === "Can't Reach" || l.status === "Sent Packet - Can't Reach",
};

export const calculateKpis = (leads: Lead[]) => {
  const contactedLeads = leads.filter((l) => l.lastContacted);
  const avgTimeToContact = contactedLeads.length
    ? Math.round(
        contactedLeads.reduce((sum, l) => {
          const diff = (new Date(l.lastContacted!).getTime() - new Date(l.createdAt).getTime()) / (1000 * 60 * 60);
          return sum + diff;
        }, 0) / contactedLeads.length,
      )
    : 0;
  const vobLeads = leads.filter((l) => l.status === "VOB Completed");
  const avgTimeToVob = vobLeads.length
    ? Math.round(
        vobLeads.reduce((sum, l) => {
          const diff = (new Date(l.updatedAt).getTime() - new Date(l.createdAt).getTime()) / (1000 * 60 * 60 * 24);
          return sum + diff;
        }, 0) / vobLeads.length,
      )
    : 0;

  return {
    newToday: leads.filter(kpiFilters.newToday).length,
    notContacted: leads.filter(kpiFilters.notContacted).length,
    sentForm: leads.filter(kpiFilters.sentForm).length,
    missingInfo: leads.filter(kpiFilters.missingInfo).length,
    sentVob: leads.filter(kpiFilters.sentVob).length,
    vobCompleted: leads.filter(kpiFilters.vobCompleted).length,
    cantReach: leads.filter(kpiFilters.cantReach).length,
    avgTimeToContact,
    avgTimeToVob,
  };
};
