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
  | "Getting DX";

export type Priority = "Hot" | "Warm" | "Cold";

export interface LeadTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TimelineEvent {
  id: string;
  type: "call" | "email" | "sms" | "form" | "system" | "note";
  description: string;
  timestamp: string;
  user?: string;
}

export interface Lead {
  id: string;
  childName: string;
  parentName: string;
  phone: string;
  email: string;
  state: string;
  source: string;
  status: LeadStatus;
  owner: string;
  priority: Priority;
  childAge: string;
  formStatus: "Not Sent" | "Sent" | "Viewed" | "Completed";
  consentStatus: "Not Sent" | "Sent" | "Completed";
  vobStatus: "Not Started" | "Sent" | "Completed" | "Issue";
  createdAt: string;
  lastContacted: string | null;
  daysInStage: number;
  nextAction: string;
  nextTaskDue: string | null;
  lastActivity: string;
  payor: string;
  coverageType: string;
  paymentPlanNeeded: boolean;
  timeline: TimelineEvent[];
  tasks: LeadTask[];
  documents: { name: string; type: string; url?: string }[];
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
  { name: "Non-qualified Lead", color: "muted" },
  { name: "Getting DX", color: "default" },
];

const makeTimeline = (status: LeadStatus): TimelineEvent[] => {
  const base: TimelineEvent[] = [
    { id: "t1", type: "system", description: "Lead created from website form", timestamp: "2025-04-10T09:00:00Z" },
  ];
  if (status !== "New Lead") {
    base.push({ id: "t2", type: "call", description: "Call attempt #1 — no answer", timestamp: "2025-04-10T10:30:00Z", user: "Sarah M." });
    base.push({ id: "t3", type: "sms", description: "Intro SMS sent", timestamp: "2025-04-10T10:32:00Z", user: "Sarah M." });
  }
  if (["Sent Form", "Missing Information", "Form Received", "Sent to VOB", "VOB Completed"].includes(status)) {
    base.push({ id: "t4", type: "call", description: "Connected — parent interested", timestamp: "2025-04-11T14:00:00Z", user: "Sarah M." });
    base.push({ id: "t5", type: "form", description: "Intake form sent via PandaDoc", timestamp: "2025-04-11T14:15:00Z", user: "Sarah M." });
  }
  if (["Form Received", "Sent to VOB", "VOB Completed"].includes(status)) {
    base.push({ id: "t6", type: "form", description: "Intake form completed by parent", timestamp: "2025-04-12T08:00:00Z" });
  }
  return base;
};

const makeTasks = (status: LeadStatus): LeadTask[] => [
  { id: "tk1", title: "Review Intake Packet", completed: ["Form Received", "Sent to VOB", "VOB Completed"].includes(status) },
  { id: "tk2", title: "Set Insurance Type", completed: ["Sent to VOB", "VOB Completed"].includes(status) },
  { id: "tk3", title: "Collect Missing Info", completed: status !== "Missing Information" },
  { id: "tk4", title: "Add to Eligipro", completed: ["VOB Completed"].includes(status) },
  { id: "tk5", title: "Add to CentralReach", completed: false },
];

export const mockLeads: Lead[] = [
  {
    id: "L-1042", childName: "Emma Thompson", parentName: "Jennifer Thompson", phone: "(404) 555-0142",
    email: "jthompson@email.com", state: "GA", source: "Website", status: "New Lead", owner: "Sarah M.",
    priority: "Hot", childAge: "3y 2m", formStatus: "Not Sent", consentStatus: "Not Sent", vobStatus: "Not Started",
    createdAt: "2025-04-15T14:00:00Z", lastContacted: null, daysInStage: 0,
    nextAction: "Make first contact", nextTaskDue: "2025-04-15", lastActivity: "Lead created",
    payor: "BCBS", coverageType: "PPO", paymentPlanNeeded: false,
    timeline: makeTimeline("New Lead"), tasks: makeTasks("New Lead"),
    documents: [], automationLog: ["Lead created from website form automatically"],
  },
  {
    id: "L-1041", childName: "Aiden Patel", parentName: "Ravi Patel", phone: "(512) 555-0198",
    email: "rpatel@email.com", state: "TX", source: "Referral", status: "In Contact", owner: "James R.",
    priority: "Warm", childAge: "4y 8m", formStatus: "Not Sent", consentStatus: "Not Sent", vobStatus: "Not Started",
    createdAt: "2025-04-13T09:00:00Z", lastContacted: "2025-04-14T10:30:00Z", daysInStage: 2,
    nextAction: "Send intake form", nextTaskDue: "2025-04-16", lastActivity: "SMS sent",
    payor: "Aetna", coverageType: "HMO", paymentPlanNeeded: false,
    timeline: makeTimeline("In Contact"), tasks: makeTasks("In Contact"),
    documents: [], automationLog: ["Intro SMS sent automatically", "Moved to In Contact"],
  },
  {
    id: "L-1040", childName: "Sofia Garcia", parentName: "Maria Garcia", phone: "(770) 555-0167",
    email: "mgarcia@email.com", state: "GA", source: "Insurance", status: "Form Received", owner: "Sarah M.",
    priority: "Hot", childAge: "2y 11m", formStatus: "Completed", consentStatus: "Sent", vobStatus: "Not Started",
    createdAt: "2025-04-10T08:00:00Z", lastContacted: "2025-04-13T15:00:00Z", daysInStage: 1,
    nextAction: "Review form & send VOB", nextTaskDue: "2025-04-15", lastActivity: "Form completed",
    payor: "United", coverageType: "PPO", paymentPlanNeeded: false,
    timeline: makeTimeline("Form Received"), tasks: makeTasks("Form Received"),
    documents: [{ name: "Intake Form", type: "PandaDoc" }, { name: "Insurance Card (Front)", type: "Image" }],
    automationLog: ["Form sent via PandaDoc", "Form viewed by parent", "Form completed — moved to Form Received"],
  },
  {
    id: "L-1039", childName: "Liam Chen", parentName: "Wei Chen", phone: "(480) 555-0134",
    email: "wchen@email.com", state: "AZ", source: "Website", status: "Sent to VOB", owner: "James R.",
    priority: "Warm", childAge: "5y 1m", formStatus: "Completed", consentStatus: "Completed", vobStatus: "Sent",
    createdAt: "2025-04-08T10:00:00Z", lastContacted: "2025-04-12T11:00:00Z", daysInStage: 3,
    nextAction: "Follow up on VOB", nextTaskDue: "2025-04-16", lastActivity: "VOB sent to insurance",
    payor: "Cigna", coverageType: "PPO", paymentPlanNeeded: true,
    timeline: makeTimeline("Sent to VOB"), tasks: makeTasks("Sent to VOB"),
    documents: [{ name: "Intake Form", type: "PandaDoc" }, { name: "Consent Forms", type: "PDF" }, { name: "Insurance Card", type: "Image" }],
    automationLog: ["Form completed", "Consent forms sent", "Consent completed", "Sent to VOB"],
  },
  {
    id: "L-1038", childName: "Olivia Brown", parentName: "Mark Brown", phone: "(678) 555-0189",
    email: "mbrown@email.com", state: "GA", source: "Referral", status: "Missing Information", owner: "Sarah M.",
    priority: "Warm", childAge: "3y 7m", formStatus: "Sent", consentStatus: "Not Sent", vobStatus: "Not Started",
    createdAt: "2025-04-07T12:00:00Z", lastContacted: "2025-04-11T09:00:00Z", daysInStage: 5,
    nextAction: "Follow up on missing info", nextTaskDue: "2025-04-15", lastActivity: "Missing info flagged",
    payor: "BCBS", coverageType: "EPO", paymentPlanNeeded: false,
    timeline: makeTimeline("Missing Information"), tasks: makeTasks("Missing Information"),
    documents: [{ name: "Intake Form (Incomplete)", type: "PandaDoc" }],
    automationLog: ["Form sent", "Form viewed", "Missing info detected — moved to Missing Information"],
  },
  {
    id: "L-1037", childName: "Noah Williams", parentName: "Keisha Williams", phone: "(214) 555-0156",
    email: "kwilliams@email.com", state: "TX", source: "Website", status: "VOB Completed", owner: "James R.",
    priority: "Hot", childAge: "4y 0m", formStatus: "Completed", consentStatus: "Completed", vobStatus: "Completed",
    createdAt: "2025-04-05T07:00:00Z", lastContacted: "2025-04-14T16:00:00Z", daysInStage: 1,
    nextAction: "Move to Clients", nextTaskDue: "2025-04-15", lastActivity: "VOB completed",
    payor: "Medicaid", coverageType: "Managed", paymentPlanNeeded: false,
    timeline: makeTimeline("VOB Completed"), tasks: makeTasks("VOB Completed"),
    documents: [{ name: "Intake Form", type: "PandaDoc" }, { name: "Consent Forms", type: "PDF" }, { name: "VOB Report", type: "PDF" }],
    automationLog: ["Full pipeline completed", "VOB result received", "Ready to move to Clients"],
  },
  {
    id: "L-1036", childName: "Ava Martinez", parentName: "Carlos Martinez", phone: "(602) 555-0178",
    email: "cmartinez@email.com", state: "AZ", source: "Insurance", status: "Can't Reach", owner: "Sarah M.",
    priority: "Cold", childAge: "3y 4m", formStatus: "Not Sent", consentStatus: "Not Sent", vobStatus: "Not Started",
    createdAt: "2025-04-03T11:00:00Z", lastContacted: "2025-04-10T14:00:00Z", daysInStage: 8,
    nextAction: "Final contact attempt", nextTaskDue: "2025-04-16", lastActivity: "Call attempt #3 — voicemail",
    payor: "Tricare", coverageType: "Prime", paymentPlanNeeded: false,
    timeline: makeTimeline("Can't Reach"), tasks: makeTasks("Can't Reach"),
    documents: [], automationLog: ["3 call attempts made", "Moved to Can't Reach after 5 days"],
  },
  {
    id: "L-1035", childName: "Ethan Davis", parentName: "Lauren Davis", phone: "(404) 555-0123",
    email: "ldavis@email.com", state: "GA", source: "Website", status: "New Lead", owner: "James R.",
    priority: "Hot", childAge: "2y 6m", formStatus: "Not Sent", consentStatus: "Not Sent", vobStatus: "Not Started",
    createdAt: "2025-04-15T08:00:00Z", lastContacted: null, daysInStage: 0,
    nextAction: "Make first contact", nextTaskDue: "2025-04-15", lastActivity: "Lead created",
    payor: "BCBS", coverageType: "PPO", paymentPlanNeeded: false,
    timeline: makeTimeline("New Lead"), tasks: makeTasks("New Lead"),
    documents: [], automationLog: ["Lead created from website form automatically"],
  },
  {
    id: "L-1034", childName: "Mia Johnson", parentName: "David Johnson", phone: "(972) 555-0145",
    email: "djohnson@email.com", state: "TX", source: "Ads", status: "Sent Form", owner: "Sarah M.",
    priority: "Warm", childAge: "3y 9m", formStatus: "Sent", consentStatus: "Not Sent", vobStatus: "Not Started",
    createdAt: "2025-04-09T13:00:00Z", lastContacted: "2025-04-11T10:00:00Z", daysInStage: 4,
    nextAction: "Follow up on form", nextTaskDue: "2025-04-15", lastActivity: "Form sent",
    payor: "Aetna", coverageType: "PPO", paymentPlanNeeded: false,
    timeline: makeTimeline("Sent Form"), tasks: makeTasks("Sent Form"),
    documents: [], automationLog: ["Connected with parent", "Intake form sent via PandaDoc"],
  },
  {
    id: "L-1033", childName: "Lucas Wilson", parentName: "Amanda Wilson", phone: "(770) 555-0199",
    email: "awilson@email.com", state: "GA", source: "Referral", status: "Getting DX", owner: "James R.",
    priority: "Warm", childAge: "4y 3m", formStatus: "Completed", consentStatus: "Completed", vobStatus: "Not Started",
    createdAt: "2025-04-06T15:00:00Z", lastContacted: "2025-04-13T09:00:00Z", daysInStage: 3,
    nextAction: "Wait for DX from pediatrician", nextTaskDue: "2025-04-18", lastActivity: "DX request sent",
    payor: "United", coverageType: "HMO", paymentPlanNeeded: true,
    timeline: makeTimeline("Sent Form"), tasks: makeTasks("Sent Form"),
    documents: [{ name: "Intake Form", type: "PandaDoc" }, { name: "Consent Forms", type: "PDF" }],
    automationLog: ["Forms completed", "Needs DX before VOB"],
  },
  {
    id: "L-1032", childName: "Isabella Lee", parentName: "Grace Lee", phone: "(480) 555-0112",
    email: "glee@email.com", state: "AZ", source: "Website", status: "New Lead", owner: "Sarah M.",
    priority: "Hot", childAge: "2y 1m", formStatus: "Not Sent", consentStatus: "Not Sent", vobStatus: "Not Started",
    createdAt: "2025-04-15T11:00:00Z", lastContacted: null, daysInStage: 0,
    nextAction: "Make first contact", nextTaskDue: "2025-04-15", lastActivity: "Lead created",
    payor: "BCBS", coverageType: "PPO", paymentPlanNeeded: false,
    timeline: makeTimeline("New Lead"), tasks: makeTasks("New Lead"),
    documents: [], automationLog: ["Lead created from website form automatically"],
  },
  {
    id: "L-1031", childName: "Jackson Moore", parentName: "Tiffany Moore", phone: "(214) 555-0176",
    email: "tmoore@email.com", state: "TX", source: "Insurance", status: "Sent Form", owner: "James R.",
    priority: "Warm", childAge: "5y 5m", formStatus: "Viewed", consentStatus: "Not Sent", vobStatus: "Not Started",
    createdAt: "2025-04-08T09:00:00Z", lastContacted: "2025-04-10T16:00:00Z", daysInStage: 6,
    nextAction: "Follow up — form viewed but not completed", nextTaskDue: "2025-04-15", lastActivity: "Form viewed by parent",
    payor: "Cigna", coverageType: "PPO", paymentPlanNeeded: false,
    timeline: makeTimeline("Sent Form"), tasks: makeTasks("Sent Form"),
    documents: [], automationLog: ["Form sent", "Form viewed by parent (not completed)"],
  },
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
  if (["Sent to VOB"].includes(lead.status) && lead.daysInStage >= 3) return { type: "yellow", message: "VOB pending " + lead.daysInStage + "d" };
  if (lead.status === "Can't Reach" && lead.daysInStage >= 5) return { type: "red", message: "Can't reach — " + lead.daysInStage + "d" };
  return null;
};
