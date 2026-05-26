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

export const mockPhoneCalls: PhoneCall[] = [];

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
