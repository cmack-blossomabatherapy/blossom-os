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
  | "Needs DX"
  // Export 79 — canonical Family / Lead Workflow stages. Legacy values above
  // remain for backward compatibility with Monday-imported records.
  | "Lead Captured"
  | "First Contact Attempt"
  | "Engagement Track"
  | "Qualification"
  | "Intake Packet Sent"
  | "Intake Packet Follow Up"
  | "Intake Complete"
  | "Benefits Verification"
  | "Assessment Scheduling"
  | "QA / Treatment Plan Authorization"
  | "Authorization Pending"
  | "Staffing Match"
  | "Ready to Start Services";

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

export const INTAKE_COORDINATORS = [];

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
  /** Extended intake fields sourced from public.intake_leads (Monday-style columns). */
  intake?: LeadIntakeFields;
}

/** Monday-style intake fields persisted on public.intake_leads. */
export interface LeadIntakeFields {
  patientFirstName?: string | null;
  patientLastName?: string | null;
  dob?: string | null;
  parentFirstName?: string | null;
  parentLastName?: string | null;
  parent2Name?: string | null;
  parent2Email?: string | null;
  parentCellPhone?: string | null;
  homePhone?: string | null;
  preferredContactMethod?: string | null;
  leadType?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  referralSource?: string | null;
  referralPartner?: string | null;
  originationDate?: string | null;
  lastContactDate?: string | null;
  regularCallLog?: string | null;
  etCallLog?: string | null;
  messageComments?: string | null;
  secondaryInsurance?: string | null;
  diagnosisStatus?: string | null;
  dxNeeded?: boolean | null;
  mondayItemId?: string | null;
  mondayGroup?: string | null;
  sourceMetadata?: Record<string, unknown> | null;
  originalColumnData?: Record<string, unknown> | null;
}

export const pipelineStages: { name: LeadStatus; color: string }[] = [
  // Canonical Family / Lead Workflow (Export 78+) — source of truth.
  { name: "Lead Captured", color: "info" },
  { name: "First Contact Attempt", color: "default" },
  { name: "Engagement Track", color: "default" },
  { name: "Qualification", color: "default" },
  { name: "Intake Packet Sent", color: "default" },
  { name: "Intake Packet Follow Up", color: "warning" },
  { name: "Intake Complete", color: "success" },
  { name: "Benefits Verification", color: "default" },
  { name: "Assessment Scheduling", color: "default" },
  { name: "QA / Treatment Plan Authorization", color: "default" },
  { name: "Authorization Pending", color: "default" },
  { name: "Staffing Match", color: "default" },
  { name: "Ready to Start Services", color: "success" },
  // Legacy Monday-era statuses kept for backward compatibility on imported records.
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
    ...defaultFinancialFields(partial.insurance),
    financialStatus: partial.insurance.toLowerCase().includes("medicaid") ? "Approved" : partial.vobStatus === "Payment Plan Required" ? "Payment Plan Required" : partial.status === "VOB Completed" ? "Approved" : "Pending Review",
    paymentPlanNeeded: partial.paymentPlanNeeded,
    paymentPlanStatus: partial.paymentPlanNeeded ? "Awaiting Signature" : "Not Required",
    paymentPlanAmount: partial.paymentPlanNeeded ? 450 : 0,
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

export const mockLeads: Lead[] = [];

export const statusVariant = (status: string): "default" | "success" | "warning" | "destructive" | "info" | "muted" => {
  const map: Record<string, "default" | "success" | "warning" | "destructive" | "info" | "muted"> = {
    // Canonical Family / Lead Workflow
    "Lead Captured": "info",
    "First Contact Attempt": "default",
    "Engagement Track": "default",
    "Qualification": "default",
    "Intake Packet Sent": "default",
    "Intake Packet Follow Up": "warning",
    "Intake Complete": "success",
    "Benefits Verification": "default",
    "Assessment Scheduling": "default",
    "QA / Treatment Plan Authorization": "default",
    "Authorization Pending": "default",
    "Staffing Match": "default",
    "Ready to Start Services": "success",
    // Legacy
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
  // Export 86 — treat canonical "Lead Captured" as the primary new-lead stage
  // while still tolerating legacy "New Lead" records.
  if ((lead.status === "Lead Captured" || lead.status === "New Lead") && !lead.lastContacted)
    return { type: "red", message: "No contact yet" };
  if (lead.status === "First Contact Attempt" && lead.daysInStage >= 2)
    return { type: "yellow", message: "Awaiting first contact" };
  if (lead.status === "Intake Packet Sent" && lead.daysInStage >= 3)
    return { type: "yellow", message: "Intake packet not completed in " + lead.daysInStage + "d" };
  if (lead.status === "Intake Packet Follow Up" && lead.daysInStage >= 3)
    return { type: "red", message: "Missing info blocking benefits verification" };
  if (lead.status === "Missing Information" && lead.daysInStage >= 3) return { type: "red", message: "Missing info blocking VOB" };
  if (lead.status === "Sent Form" && lead.daysInStage >= 3) return { type: "yellow", message: "Form not completed in " + lead.daysInStage + "d" };
  if (lead.status === "Form Received" && lead.vobStatus === "Not Sent") return { type: "red", message: "VOB not sent" };
  if (lead.status === "Sent to VOB" && lead.daysInStage >= 3) return { type: "yellow", message: "VOB pending " + lead.daysInStage + "d" };
  if (lead.status === "Can't Reach" && lead.daysInStage >= 5) return { type: "red", message: "Can't reach — " + lead.daysInStage + "d" };
  if (lead.status === "Can Not Submit Auth") return { type: "red", message: "Auth blocked — missing docs" };
  if (lead.status === "VOB Completed" && (lead.vobStatus === "Approved" || lead.vobStatus === "Payment Plan Required")) return { type: "yellow", message: "Benefits verified - schedule assessment" };
  if (lead.status === "Benefits Verification" && (lead.vobStatus === "Approved" || lead.vobStatus === "Completed")) return { type: "yellow", message: "Benefits verified - schedule assessment" };
  if (lead.status === "Assessment Scheduling") return { type: "yellow", message: "Assessment scheduling needed" };
  if (lead.status === "QA / Treatment Plan Authorization") return { type: "yellow", message: "Treatment plan / QA review" };
  if (lead.status === "Authorization Pending") return { type: "yellow", message: "Authorization pending" };
  if (lead.status === "Staffing Match") return { type: "yellow", message: "Staffing match needed" };
  if (lead.status === "Ready to Start Services") return { type: "yellow", message: "Ready to start services" };
  if (lead.daysInStage > 5 && !["VOB Completed", "Ready to Start Services", "Non-Qualified", "Non-qualified Lead"].includes(lead.status)) return { type: "red", message: `Stuck in stage ${lead.daysInStage}d` };
  return null;
};

// KPI calculators
export type KpiKey = "newToday" | "notContacted" | "sentForm" | "missingInfo" | "sentVob" | "vobCompleted" | "cantReach" | "readyToStart" | "all";

export const kpiFilters: Record<KpiKey, (l: Lead) => boolean> = {
  all: () => true,
  // Export 86 — canonical "Lead Captured" is the primary new-lead stage.
  // Legacy "New Lead" still recognized for back-compat reads.
  newToday: (l) =>
    (l.status === "Lead Captured" || l.status === "New Lead") && l.daysInStage === 0,
  notContacted: (l) => !l.lastContacted,
  sentForm: (l) => l.status === "Sent Form",
  missingInfo: (l) => l.status === "Missing Information",
  sentVob: (l) => l.status === "Sent to VOB",
  vobCompleted: (l) => l.status === "VOB Completed",
  cantReach: (l) => l.status === "Can't Reach" || l.status === "Sent Packet - Can't Reach",
  // Export 80 — only the canonical terminal stage (and its legacy aliases)
  // counts as ready-to-start. VOB Completed is NOT ready-to-start; it maps to
  // Assessment Scheduling.
  readyToStart: (l) => {
    const s = l.status as string;
    return s === "Ready to Start Services" || s === "Ready for Start" || s === "Pending Start";
  },
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
    readyToStart: leads.filter(kpiFilters.readyToStart).length,
    avgTimeToContact,
    avgTimeToVob,
  };
};
