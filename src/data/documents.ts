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

export const mockDocuments: DocumentRecord[] = [];

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

export const docGroupOrder: DocGroup[] = [];
