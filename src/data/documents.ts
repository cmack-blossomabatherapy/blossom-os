import { mockLeads } from "./leads";
import { mockClients } from "./clients";

export type DocGroup = "Intake" | "Authorization" | "QA" | "Operations";

export type DocType =
  // Intake
  | "Initial Form"
  | "Consent Form"
  | "Insurance Card"
  // Authorization
  | "VOB File"
  | "Authorization Packet"
  | "Supporting Documentation"
  // QA
  | "Treatment Plan"
  | "QA Review Document"
  // Operations
  | "Case Coordination Document"
  | "Scheduling Document"
  | "Internal Note";

export type DocStatus = "Missing" | "Sent" | "Viewed" | "Received" | "Complete";
export type LinkedRecordType = "Lead" | "Client" | "Authorization" | "QA";
export type DocOwnerRole = "Intake" | "Auth" | "QA" | "Scheduling" | "BCBA";

export interface DocVersion {
  version: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface DocTimelineEvent {
  id: string;
  type: "uploaded" | "viewed" | "updated" | "signed" | "approved" | "system";
  description: string;
  timestamp: string;
  user?: string;
}

export interface DocumentRecord {
  id: string;
  name: string;
  type: DocType;
  group: DocGroup;
  status: DocStatus;
  linkedRecordType: LinkedRecordType;
  linkedRecordId: string | null;
  linkedRecordLabel: string;
  state: string;
  owner: string;
  ownerRole: DocOwnerRole;
  uploadedAt: string | null; // ISO
  lastUpdated: string | null;
  requiredBy: string | null;
  blockingStage: string | null; // populated for missing docs
  lastAction: string;
  nextAction: string | null;
  fileSize?: string;
  versions: DocVersion[];
  timeline: DocTimelineEvent[];
  automationLog: string[];
}

const DOC_GROUP: Record<DocType, DocGroup> = {
  "Initial Form": "Intake",
  "Consent Form": "Intake",
  "Insurance Card": "Intake",
  "VOB File": "Authorization",
  "Authorization Packet": "Authorization",
  "Supporting Documentation": "Authorization",
  "Treatment Plan": "QA",
  "QA Review Document": "QA",
  "Case Coordination Document": "Operations",
  "Scheduling Document": "Operations",
  "Internal Note": "Operations",
};

export const docGroupOf = (t: DocType): DocGroup => DOC_GROUP[t];

const daysAgo = (n: number) => new Date(Date.now() - n * 86400_000).toISOString();
const daysAhead = (n: number) => new Date(Date.now() + n * 86400_000).toISOString();

const lead = (i: number) => mockLeads[i];
const client = (i: number) => mockClients[i];

export const mockDocuments: DocumentRecord[] = [
  // ============ INTAKE ============
  {
    id: "DOC-3001",
    name: "Initial Intake Form (Pandadoc)",
    type: "Initial Form",
    group: "Intake",
    status: "Complete",
    linkedRecordType: "Lead",
    linkedRecordId: lead(0)?.id ?? null,
    linkedRecordLabel: lead(0)?.childName ?? "—",
    state: "GA",
    owner: "Sarah M.",
    ownerRole: "Intake",
    uploadedAt: daysAgo(5),
    lastUpdated: daysAgo(4),
    requiredBy: null,
    blockingStage: null,
    lastAction: "Form completed by parent",
    nextAction: "Send to VOB",
    fileSize: "412 KB",
    versions: [{ version: "v1", uploadedAt: daysAgo(5), uploadedBy: "Sarah M." }],
    timeline: [
      { id: "t1", type: "uploaded", description: "Form sent via Pandadoc", timestamp: daysAgo(6), user: "Sarah M." },
      { id: "t2", type: "viewed", description: "Parent opened form", timestamp: daysAgo(5) },
      { id: "t3", type: "signed", description: "Form completed & signed", timestamp: daysAgo(5) },
    ],
    automationLog: ["Form completion → moved lead to Form Received", "VOB task auto-created"],
  },
  {
    id: "DOC-3002",
    name: "Consent Forms Packet",
    type: "Consent Form",
    group: "Intake",
    status: "Sent",
    linkedRecordType: "Client",
    linkedRecordId: client(1)?.id ?? null,
    linkedRecordLabel: client(1)?.childName ?? "—",
    state: "GA",
    owner: "James R.",
    ownerRole: "Intake",
    uploadedAt: daysAgo(3),
    lastUpdated: daysAgo(2),
    requiredBy: daysAhead(2),
    blockingStage: null,
    lastAction: "Sent to parent",
    nextAction: "Awaiting signature",
    fileSize: "228 KB",
    versions: [{ version: "v1", uploadedAt: daysAgo(3), uploadedBy: "James R." }],
    timeline: [
      { id: "t1", type: "uploaded", description: "Packet uploaded", timestamp: daysAgo(3), user: "James R." },
      { id: "t2", type: "system", description: "Packet sent via DocuSign", timestamp: daysAgo(2) },
    ],
    automationLog: ["Reminder scheduled in 48h"],
  },
  {
    id: "DOC-3003",
    name: "Consent Forms — Missing",
    type: "Consent Form",
    group: "Intake",
    status: "Missing",
    linkedRecordType: "Client",
    linkedRecordId: client(2)?.id ?? null,
    linkedRecordLabel: client(2)?.childName ?? "—",
    state: "GA",
    owner: "James R.",
    ownerRole: "Intake",
    uploadedAt: null,
    lastUpdated: null,
    requiredBy: daysAhead(1),
    blockingStage: "Schedule Assessment",
    lastAction: "Outreach attempt 2",
    nextAction: "Resend packet today",
    versions: [],
    timeline: [
      { id: "t1", type: "system", description: "Doc requirement created", timestamp: daysAgo(7) },
      { id: "t2", type: "system", description: "Packet sent — no response", timestamp: daysAgo(4) },
    ],
    automationLog: ["Blocking flag raised", "Lead loop-back triggered"],
  },
  {
    id: "DOC-3004",
    name: "Insurance Card — Front",
    type: "Insurance Card",
    group: "Intake",
    status: "Received",
    linkedRecordType: "Lead",
    linkedRecordId: lead(1)?.id ?? null,
    linkedRecordLabel: lead(1)?.childName ?? "—",
    state: "GA",
    owner: "Sarah M.",
    ownerRole: "Intake",
    uploadedAt: daysAgo(2),
    lastUpdated: daysAgo(2),
    requiredBy: null,
    blockingStage: null,
    lastAction: "Image uploaded by parent",
    nextAction: "Verify with payor",
    fileSize: "1.2 MB",
    versions: [{ version: "v1", uploadedAt: daysAgo(2), uploadedBy: "Parent upload" }],
    timeline: [{ id: "t1", type: "uploaded", description: "Uploaded via portal", timestamp: daysAgo(2) }],
    automationLog: ["VOB task created"],
  },
  {
    id: "DOC-3005",
    name: "Insurance Card — Missing",
    type: "Insurance Card",
    group: "Intake",
    status: "Missing",
    linkedRecordType: "Lead",
    linkedRecordId: lead(2)?.id ?? null,
    linkedRecordLabel: lead(2)?.childName ?? "—",
    state: "AZ",
    owner: "Sarah M.",
    ownerRole: "Intake",
    uploadedAt: null,
    lastUpdated: null,
    requiredBy: daysAhead(3),
    blockingStage: "VOB",
    lastAction: "Requested via SMS",
    nextAction: "Follow up in 24h",
    versions: [],
    timeline: [{ id: "t1", type: "system", description: "Request sent", timestamp: daysAgo(2) }],
    automationLog: ["VOB blocked", "Reminder queued"],
  },

  // ============ AUTHORIZATION ============
  {
    id: "DOC-3006",
    name: "VOB Report — Aetna",
    type: "VOB File",
    group: "Authorization",
    status: "Complete",
    linkedRecordType: "Authorization",
    linkedRecordId: "AUTH-2104",
    linkedRecordLabel: client(0)?.childName ?? "—",
    state: "GA",
    owner: "Mordy G.",
    ownerRole: "Auth",
    uploadedAt: daysAgo(8),
    lastUpdated: daysAgo(8),
    requiredBy: null,
    blockingStage: null,
    lastAction: "VOB received from payor",
    nextAction: "Submit treatment auth",
    fileSize: "342 KB",
    versions: [{ version: "v1", uploadedAt: daysAgo(8), uploadedBy: "Mordy G." }],
    timeline: [
      { id: "t1", type: "uploaded", description: "VOB uploaded", timestamp: daysAgo(8), user: "Mordy G." },
      { id: "t2", type: "approved", description: "Coverage verified", timestamp: daysAgo(8) },
    ],
    automationLog: ["Initial Auth task created"],
  },
  {
    id: "DOC-3007",
    name: "Treatment Auth Packet",
    type: "Authorization Packet",
    group: "Authorization",
    status: "Sent",
    linkedRecordType: "Authorization",
    linkedRecordId: "AUTH-2107",
    linkedRecordLabel: client(3)?.childName ?? "—",
    state: "GA",
    owner: "Mordy G.",
    ownerRole: "Auth",
    uploadedAt: daysAgo(3),
    lastUpdated: daysAgo(3),
    requiredBy: daysAhead(7),
    blockingStage: null,
    lastAction: "Submitted to BCBS",
    nextAction: "Await approval",
    fileSize: "1.8 MB",
    versions: [
      { version: "v1", uploadedAt: daysAgo(5), uploadedBy: "Mordy G." },
      { version: "v2", uploadedAt: daysAgo(3), uploadedBy: "Mordy G." },
    ],
    timeline: [
      { id: "t1", type: "uploaded", description: "Packet drafted", timestamp: daysAgo(5), user: "Mordy G." },
      { id: "t2", type: "updated", description: "Treatment plan attached", timestamp: daysAgo(4) },
      { id: "t3", type: "system", description: "Submitted to payor", timestamp: daysAgo(3) },
    ],
    automationLog: ["QA → Auth handoff complete"],
  },
  {
    id: "DOC-3008",
    name: "Supporting Documentation — Missing",
    type: "Supporting Documentation",
    group: "Authorization",
    status: "Missing",
    linkedRecordType: "Authorization",
    linkedRecordId: "AUTH-2110",
    linkedRecordLabel: client(4)?.childName ?? "—",
    state: "TX",
    owner: "Mordy G.",
    ownerRole: "Auth",
    uploadedAt: null,
    lastUpdated: null,
    requiredBy: daysAhead(2),
    blockingStage: "Pending Treatment Auth",
    lastAction: "Requested from BCBA",
    nextAction: "Escalate to clinical lead",
    versions: [],
    timeline: [{ id: "t1", type: "system", description: "Doc requirement flagged", timestamp: daysAgo(3) }],
    automationLog: ["Auth submission blocked", "Loop-back to QA triggered"],
  },

  // ============ QA ============
  {
    id: "DOC-3009",
    name: "Treatment Plan v2",
    type: "Treatment Plan",
    group: "QA",
    status: "Received",
    linkedRecordType: "QA",
    linkedRecordId: "QA-1207",
    linkedRecordLabel: client(0)?.childName ?? "—",
    state: "GA",
    owner: "Dr. Karen Lee",
    ownerRole: "BCBA",
    uploadedAt: daysAgo(2),
    lastUpdated: daysAgo(1),
    requiredBy: null,
    blockingStage: null,
    lastAction: "BCBA submitted plan",
    nextAction: "QA review",
    fileSize: "984 KB",
    versions: [
      { version: "v1", uploadedAt: daysAgo(5), uploadedBy: "Dr. Karen Lee" },
      { version: "v2", uploadedAt: daysAgo(2), uploadedBy: "Dr. Karen Lee" },
    ],
    timeline: [
      { id: "t1", type: "uploaded", description: "v1 uploaded", timestamp: daysAgo(5), user: "Dr. Karen Lee" },
      { id: "t2", type: "updated", description: "Revision requested by QA", timestamp: daysAgo(3) },
      { id: "t3", type: "uploaded", description: "v2 uploaded", timestamp: daysAgo(2), user: "Dr. Karen Lee" },
    ],
    automationLog: ["QA review task created"],
  },
  {
    id: "DOC-3010",
    name: "Treatment Plan — Missing",
    type: "Treatment Plan",
    group: "QA",
    status: "Missing",
    linkedRecordType: "QA",
    linkedRecordId: "QA-1212",
    linkedRecordLabel: client(5)?.childName ?? "—",
    state: "GA",
    owner: "Dr. Maya Kim",
    ownerRole: "BCBA",
    uploadedAt: null,
    lastUpdated: null,
    requiredBy: daysAhead(1),
    blockingStage: "QA Review",
    lastAction: "BCBA reminder sent",
    nextAction: "Escalate to clinical director",
    versions: [],
    timeline: [{ id: "t1", type: "system", description: "Plan requested from BCBA", timestamp: daysAgo(4) }],
    automationLog: ["QA blocked", "Auth submission blocked downstream"],
  },
  {
    id: "DOC-3011",
    name: "QA Review Notes",
    type: "QA Review Document",
    group: "QA",
    status: "Complete",
    linkedRecordType: "QA",
    linkedRecordId: "QA-1207",
    linkedRecordLabel: client(0)?.childName ?? "—",
    state: "GA",
    owner: "Mordy G.",
    ownerRole: "QA",
    uploadedAt: daysAgo(1),
    lastUpdated: daysAgo(1),
    requiredBy: null,
    blockingStage: null,
    lastAction: "QA approved",
    nextAction: "Forward to Auth",
    fileSize: "112 KB",
    versions: [{ version: "v1", uploadedAt: daysAgo(1), uploadedBy: "Mordy G." }],
    timeline: [
      { id: "t1", type: "uploaded", description: "QA notes saved", timestamp: daysAgo(1), user: "Mordy G." },
      { id: "t2", type: "approved", description: "Approved for submission", timestamp: daysAgo(1) },
    ],
    automationLog: ["Treatment Auth created"],
  },

  // ============ OPERATIONS ============
  {
    id: "DOC-3012",
    name: "Case Coordination Document",
    type: "Case Coordination Document",
    group: "Operations",
    status: "Complete",
    linkedRecordType: "Client",
    linkedRecordId: client(0)?.id ?? null,
    linkedRecordLabel: client(0)?.childName ?? "—",
    state: "GA",
    owner: "Mordy G.",
    ownerRole: "Scheduling",
    uploadedAt: daysAgo(2),
    lastUpdated: daysAgo(2),
    requiredBy: null,
    blockingStage: null,
    lastAction: "Generated & shared",
    nextAction: "Pair with RBT",
    fileSize: "188 KB",
    versions: [{ version: "v1", uploadedAt: daysAgo(2), uploadedBy: "Mordy G." }],
    timeline: [{ id: "t1", type: "uploaded", description: "Auto-generated", timestamp: daysAgo(2) }],
    automationLog: ["Pairing email sent"],
  },
  {
    id: "DOC-3013",
    name: "Scheduling Confirmation",
    type: "Scheduling Document",
    group: "Operations",
    status: "Viewed",
    linkedRecordType: "Client",
    linkedRecordId: client(1)?.id ?? null,
    linkedRecordLabel: client(1)?.childName ?? "—",
    state: "GA",
    owner: "Sarah M.",
    ownerRole: "Scheduling",
    uploadedAt: daysAgo(1),
    lastUpdated: daysAgo(1),
    requiredBy: null,
    blockingStage: null,
    lastAction: "Parent viewed",
    nextAction: "Confirm start date",
    fileSize: "94 KB",
    versions: [{ version: "v1", uploadedAt: daysAgo(1), uploadedBy: "Sarah M." }],
    timeline: [
      { id: "t1", type: "uploaded", description: "Schedule emailed", timestamp: daysAgo(1), user: "Sarah M." },
      { id: "t2", type: "viewed", description: "Parent opened email", timestamp: daysAgo(1) },
    ],
    automationLog: [],
  },
];

// ============ Helpers ============

export const docStatusVariant = (
  s: DocStatus,
): "default" | "success" | "warning" | "destructive" | "info" | "muted" => {
  const m: Record<DocStatus, "default" | "success" | "warning" | "destructive" | "info" | "muted"> = {
    Missing: "destructive",
    Sent: "warning",
    Viewed: "info",
    Received: "info",
    Complete: "success",
  };
  return m[s];
};

export const docGroupVariant = (
  g: DocGroup,
): "default" | "success" | "warning" | "destructive" | "info" | "muted" => {
  const m: Record<DocGroup, "default" | "success" | "warning" | "destructive" | "info" | "muted"> = {
    Intake: "info",
    Authorization: "warning",
    QA: "default",
    Operations: "muted",
  };
  return m[g];
};

export const linkedRecordVariant = (
  t: LinkedRecordType,
): "default" | "success" | "warning" | "destructive" | "info" | "muted" => {
  const m: Record<LinkedRecordType, "default" | "success" | "warning" | "destructive" | "info" | "muted"> = {
    Lead: "info",
    Client: "success",
    Authorization: "warning",
    QA: "default",
  };
  return m[t];
};

export const findDocument = (id: string) => mockDocuments.find((d) => d.id === id);

export const formatDocDate = (iso: string | null): string => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export const daysUntil = (iso: string | null): number | null => {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400_000);
};

export type DocSavedView =
  | "all"
  | "missing"
  | "intake"
  | "consent"
  | "insurance-vob"
  | "treatment-plans"
  | "qa"
  | "recent";

export const filterDocsByView = (docs: DocumentRecord[], view: DocSavedView): DocumentRecord[] => {
  switch (view) {
    case "missing":
      return docs.filter((d) => d.status === "Missing");
    case "intake":
      return docs.filter((d) => d.group === "Intake");
    case "consent":
      return docs.filter((d) => d.type === "Consent Form");
    case "insurance-vob":
      return docs.filter((d) => d.type === "Insurance Card" || d.type === "VOB File");
    case "treatment-plans":
      return docs.filter((d) => d.type === "Treatment Plan");
    case "qa":
      return docs.filter((d) => d.group === "QA");
    case "recent":
      return docs
        .filter((d) => d.uploadedAt)
        .sort((a, b) => new Date(b.uploadedAt!).getTime() - new Date(a.uploadedAt!).getTime())
        .slice(0, 8);
    default:
      return docs;
  }
};

export const docGroupOrder: DocGroup[] = ["Intake", "Authorization", "QA", "Operations"];
