import { mockLeads } from "./leads";
import { mockClients } from "./clients";

export type CallType = "Lead" | "Client" | "Staff" | "Unknown";
export type CallStatus = "New" | "Attempted" | "Contacted" | "Connected";
export type CallDirection = "Inbound" | "Outbound";
export type CallOutcome =
  | "No Answer"
  | "Left Voicemail"
  | "Spoke to Parent"
  | "Wrong Number"
  | "Existing Client"
  | "New Lead"
  | "—";

export interface CallTimelineEvent {
  id: string;
  type: "call" | "sms" | "email" | "system" | "note";
  description: string;
  timestamp: string;
  user?: string;
}

export interface PhoneCall {
  id: string;
  callerName: string | null;
  phoneNumber: string;
  type: CallType;
  direction: CallDirection;
  status: CallStatus;
  outcome: CallOutcome;
  linkedLeadId: string | null;
  linkedClientId: string | null;
  assignedTo: string | null;
  state: string | null;
  callTime: string; // ISO
  duration: string; // "4m 12s" or "—"
  attempts: number;
  lastAction: string;
  nextAction: string | null;
  notes: string;
  timeline: CallTimelineEvent[];
  automationLog: string[];
}

const minutesAgo = (n: number) => new Date(Date.now() - n * 60_000).toISOString();
const hoursAgo = (n: number) => new Date(Date.now() - n * 3600_000).toISOString();
const daysAgo = (n: number) => new Date(Date.now() - n * 86400_000).toISOString();

export const mockPhoneCalls: PhoneCall[] = [
  {
    id: "CALL-2041",
    callerName: null,
    phoneNumber: "(404) 555-0142",
    type: "Unknown",
    direction: "Inbound",
    status: "New",
    outcome: "—",
    linkedLeadId: null,
    linkedClientId: null,
    assignedTo: null,
    state: "GA",
    callTime: minutesAgo(8),
    duration: "—",
    attempts: 1,
    lastAction: "Call received",
    nextAction: "Return call",
    notes: "",
    timeline: [
      { id: "t1", type: "call", description: "Inbound call · no answer", timestamp: minutesAgo(8) },
    ],
    automationLog: ["Auto-routed to GA intake queue"],
  },
  {
    id: "CALL-2040",
    callerName: "Jennifer Thompson",
    phoneNumber: "(404) 555-0188",
    type: "Lead",
    direction: "Inbound",
    status: "Connected",
    outcome: "Spoke to Parent",
    linkedLeadId: mockLeads[0]?.id ?? null,
    linkedClientId: null,
    assignedTo: "Sarah M.",
    state: "GA",
    callTime: minutesAgo(42),
    duration: "4m 12s",
    attempts: 1,
    lastAction: "Connected · spoke to parent",
    nextAction: "Send intake form",
    notes: "Parent interested in services for 4yo. Wants intake form by EOD.",
    timeline: [
      { id: "t1", type: "call", description: "Inbound call connected", timestamp: minutesAgo(42), user: "Sarah M." },
      { id: "t2", type: "system", description: "Linked to Lead", timestamp: minutesAgo(40) },
    ],
    automationLog: ["SMS confirmation sent", "Lead status moved to In Contact"],
  },
  {
    id: "CALL-2039",
    callerName: "Ravi Patel",
    phoneNumber: "(678) 555-0211",
    type: "Lead",
    direction: "Outbound",
    status: "Attempted",
    outcome: "Left Voicemail",
    linkedLeadId: mockLeads[1]?.id ?? null,
    linkedClientId: null,
    assignedTo: "James R.",
    state: "GA",
    callTime: hoursAgo(2),
    duration: "0m 30s",
    attempts: 2,
    lastAction: "Left voicemail",
    nextAction: "Retry tomorrow AM",
    notes: "Second attempt. Left detailed voicemail with callback number.",
    timeline: [
      { id: "t1", type: "call", description: "Outbound · no answer", timestamp: daysAgo(1), user: "James R." },
      { id: "t2", type: "call", description: "Outbound · left voicemail", timestamp: hoursAgo(2), user: "James R." },
    ],
    automationLog: ["Follow-up task created"],
  },
  {
    id: "CALL-2038",
    callerName: "Maria Garcia",
    phoneNumber: "(770) 555-0399",
    type: "Client",
    direction: "Inbound",
    status: "Connected",
    outcome: "Existing Client",
    linkedLeadId: null,
    linkedClientId: mockClients[0]?.id ?? null,
    assignedTo: "Sarah M.",
    state: "GA",
    callTime: hoursAgo(4),
    duration: "8m 45s",
    attempts: 1,
    lastAction: "Schedule update",
    nextAction: "Confirm new RBT pairing",
    notes: "Discussed schedule change for next week. Wants Tue/Thu sessions moved to afternoons.",
    timeline: [
      { id: "t1", type: "call", description: "Inbound call connected", timestamp: hoursAgo(4), user: "Sarah M." },
      { id: "t2", type: "email", description: "Schedule confirmation emailed", timestamp: hoursAgo(3), user: "Sarah M." },
    ],
    automationLog: ["Email sent to parent", "Task created for scheduler"],
  },
  {
    id: "CALL-2037",
    callerName: null,
    phoneNumber: "(512) 555-0177",
    type: "Unknown",
    direction: "Inbound",
    status: "New",
    outcome: "—",
    linkedLeadId: null,
    linkedClientId: null,
    assignedTo: null,
    state: "TX",
    callTime: hoursAgo(6),
    duration: "—",
    attempts: 1,
    lastAction: "Missed call",
    nextAction: "Return call",
    notes: "",
    timeline: [{ id: "t1", type: "call", description: "Missed inbound", timestamp: hoursAgo(6) }],
    automationLog: ["Auto-routed to TX intake queue"],
  },
  {
    id: "CALL-2036",
    callerName: "Daniel Cohen",
    phoneNumber: "(602) 555-0244",
    type: "Lead",
    direction: "Outbound",
    status: "Attempted",
    outcome: "No Answer",
    linkedLeadId: mockLeads[2]?.id ?? null,
    linkedClientId: null,
    assignedTo: "James R.",
    state: "AZ",
    callTime: hoursAgo(8),
    duration: "0m 15s",
    attempts: 3,
    lastAction: "No answer · 3rd attempt",
    nextAction: "Send packet · move to Can't Reach",
    notes: "Third attempt. No voicemail set up.",
    timeline: [
      { id: "t1", type: "call", description: "Attempt 1 · no answer", timestamp: daysAgo(2), user: "James R." },
      { id: "t2", type: "call", description: "Attempt 2 · no answer", timestamp: daysAgo(1), user: "James R." },
      { id: "t3", type: "call", description: "Attempt 3 · no answer", timestamp: hoursAgo(8), user: "James R." },
    ],
    automationLog: ["Multiple attempts flagged", "Escalation alert raised"],
  },
  {
    id: "CALL-2035",
    callerName: "Aisha Johnson",
    phoneNumber: "(404) 555-0521",
    type: "Lead",
    direction: "Inbound",
    status: "Contacted",
    outcome: "Spoke to Parent",
    linkedLeadId: mockLeads[3]?.id ?? null,
    linkedClientId: null,
    assignedTo: "Sarah M.",
    state: "GA",
    callTime: hoursAgo(10),
    duration: "6m 02s",
    attempts: 1,
    lastAction: "Form sent",
    nextAction: "Awaiting form return",
    notes: "Sent intake packet via email.",
    timeline: [
      { id: "t1", type: "call", description: "Inbound · contacted", timestamp: hoursAgo(10), user: "Sarah M." },
      { id: "t2", type: "email", description: "Intake packet sent", timestamp: hoursAgo(10), user: "Sarah M." },
    ],
    automationLog: ["Form delivery confirmed"],
  },
  {
    id: "CALL-2034",
    callerName: null,
    phoneNumber: "(214) 555-0888",
    type: "Unknown",
    direction: "Inbound",
    status: "New",
    outcome: "—",
    linkedLeadId: null,
    linkedClientId: null,
    assignedTo: null,
    state: "TX",
    callTime: hoursAgo(14),
    duration: "—",
    attempts: 1,
    lastAction: "Missed call",
    nextAction: "Return call",
    notes: "",
    timeline: [{ id: "t1", type: "call", description: "Missed inbound", timestamp: hoursAgo(14) }],
    automationLog: [],
  },
  {
    id: "CALL-2033",
    callerName: "Marcus Lee",
    phoneNumber: "(404) 555-0712",
    type: "Staff",
    direction: "Inbound",
    status: "Connected",
    outcome: "—",
    linkedLeadId: null,
    linkedClientId: null,
    assignedTo: "Mordy G.",
    state: "GA",
    callTime: daysAgo(1),
    duration: "3m 21s",
    attempts: 1,
    lastAction: "RBT availability call",
    nextAction: null,
    notes: "RBT updating availability for next month.",
    timeline: [{ id: "t1", type: "call", description: "Inbound · staff", timestamp: daysAgo(1), user: "Mordy G." }],
    automationLog: ["Availability sync queued"],
  },
];

export const callTypeVariant = (
  t: CallType,
): "default" | "success" | "warning" | "destructive" | "info" | "muted" => {
  const m: Record<CallType, "default" | "success" | "warning" | "destructive" | "info" | "muted"> = {
    Lead: "info",
    Client: "success",
    Staff: "default",
    Unknown: "muted",
  };
  return m[t];
};

export const callStatusVariant = (
  s: CallStatus,
): "default" | "success" | "warning" | "destructive" | "info" | "muted" => {
  const m: Record<CallStatus, "default" | "success" | "warning" | "destructive" | "info" | "muted"> = {
    New: "destructive",
    Attempted: "warning",
    Contacted: "info",
    Connected: "success",
  };
  return m[s];
};

export const findCall = (id: string) => mockPhoneCalls.find((c) => c.id === id);

export const timeSinceCall = (iso: string): string => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
};

export const formatCallTime = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

// Saved view filters
export type CallSavedView =
  | "all"
  | "new"
  | "needs-followup"
  | "connected"
  | "unlinked"
  | "lead"
  | "client";

export const filterCallsByView = (calls: PhoneCall[], view: CallSavedView): PhoneCall[] => {
  switch (view) {
    case "new":
      return calls.filter((c) => c.status === "New");
    case "needs-followup":
      return calls.filter(
        (c) => c.status === "Attempted" || (c.status === "Connected" && !c.nextAction),
      );
    case "connected":
      return calls.filter((c) => c.status === "Connected");
    case "unlinked":
      return calls.filter((c) => !c.linkedLeadId && !c.linkedClientId);
    case "lead":
      return calls.filter((c) => c.type === "Lead");
    case "client":
      return calls.filter((c) => c.type === "Client");
    default:
      return calls;
  }
};
