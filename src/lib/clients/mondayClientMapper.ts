import type {
  AuthorizationRecord, AuthStatus, Client, ClientStage, QAStatus,
  StaffingStatus,
} from "@/data/clients";

/** Monday client board kanban groups → canonical pipeline stages. */
const CLIENT_GROUP_TO_STAGE: Record<string, ClientStage> = {
  "BCBA Assignment": "BCBA Assignment",
  "Pending Initial Auth": "Pending Initial Authorization",
  "Waiting on Consent Forms": "Waiting on Consent Forms",
  "Schedule Assessment": "Schedule Assessment",
  "Assessment Scheduled": "Assessment Scheduled",
  "In QA": "In QA",
  "Pending Treatment Auth": "Pending Treatment Auth",
  "Staffing Needed": "Staffing Needed",
  "Restaffing Needed": "Restaffing Needed",
  "Pending Start Date": "Pending Start Date",
  "Active": "Active",
  "Flaked": "Flaked",
  "Services on Pause": "Services on Pause",
  "Discharged": "Discharged",
};

/** Monday authorization board kanban groups → AuthStatus. */
const AUTH_GROUP_TO_STATUS: Record<string, AuthStatus> = {
  "Awaiting Submission": "Not Submitted",
  "Pending IA": "Not Submitted",
  "Pending Initial Treatment": "Not Submitted",
  "Pending Concurrent": "Not Submitted",
  "Pending RA": "Not Submitted",
  "QA Review": "Submitted",
  "Approved": "Approved",
  "Denied": "Denied",
  "Expired": "Expired",
  "Expiring Soon": "Expiring Soon",
  "Flaked": "Not Submitted",
};

export interface MondayClientRow {
  id: string;
  monday_item_id: string | null;
  monday_group: string | null;
  name: string | null;
  state: string | null;
  status: string | null;
  owner: string | null;
  data: Record<string, unknown> | null;
  imported_at: string | null;
  updated_at: string | null;
}

export type MondayAuthRow = MondayClientRow;

const str = (v: unknown) => (v == null ? "" : String(v).trim());
const isoOrNull = (v: unknown): string | null => {
  const s = str(v); if (!s) return null;
  const d = new Date(s); return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};
const daysBetween = (iso?: string | null) => {
  if (!iso) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
};
const daysUntil = (iso?: string | null) => {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
};

function ageFromDob(dob: unknown): string {
  const s = str(dob); if (!s) return "";
  const d = new Date(s); if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  let years = now.getFullYear() - d.getFullYear();
  let months = now.getMonth() - d.getMonth();
  if (months < 0) { years -= 1; months += 12; }
  return `${years}y ${months}m`;
}

function joinName(first: unknown, last: unknown, fallback?: unknown): string {
  const j = [str(first), str(last)].filter(Boolean).join(" ").trim();
  return j || str(fallback) || "—";
}

function normName(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** Map an authorization row to the AuthorizationRecord shape on a Client. */
export function mondayRowToAuth(row: MondayAuthRow): AuthorizationRecord {
  const d = (row.data ?? {}) as Record<string, unknown>;
  const status = AUTH_GROUP_TO_STATUS[row.monday_group ?? ""] ?? "Not Submitted";
  const typeReq = str(d["Type of Request"]).toLowerCase();
  const type: AuthorizationRecord["type"] =
    typeReq.includes("initial") ? "Initial" :
    typeReq.includes("concurrent") || typeReq.includes("re-auth") || typeReq.includes("reauth") ? "Reauth" :
    "Treatment";
  const expirationDate = isoOrNull(d["Auth Exp. Date"]) ?? undefined;
  const submittedDate = isoOrNull(d["Date Submitted"]) ?? undefined;
  const approvedDate = isoOrNull(d["Date Received"]) ?? undefined;
  const qaStatusRaw = str(d["QA Review Status"]).toLowerCase();
  const qaStatus: QAStatus =
    qaStatusRaw.includes("complete") || qaStatusRaw.includes("passed") ? "Complete" :
    qaStatusRaw.includes("review") || qaStatusRaw === "in qa" ? "In Review" :
    "Not Started";
  return {
    id: row.monday_item_id ?? row.id,
    type,
    status,
    submittedDate,
    approvedDate,
    expirationDate,
    hours: str(d["Code(s)/Units"]) || undefined,
    payor: str(d["Insurance"]) || undefined,
    state: str(row.state || d["State"]) || undefined,
    assignedAuthCoordinator: str(d["Person"]) || undefined,
    qaOwner: str(d["QA Review Status"]) || null,
    qaStatus,
    notes: str(d["Notes"]) || undefined,
    nextAction:
      status === "Not Submitted" ? "Submit Authorization" :
      status === "Submitted" ? "Awaiting payer response" :
      status === "Expiring Soon" ? "Trigger reauthorization" :
      status === "Denied" ? "Review denial & resubmit" :
      "Monitor",
  };
}

/** Map a client row + that client's matched auth rows → Client. */
export function mondayRowToClient(row: MondayClientRow, auths: MondayAuthRow[]): Client {
  const d = (row.data ?? {}) as Record<string, unknown>;
  const stage = CLIENT_GROUP_TO_STAGE[row.monday_group ?? ""] ?? "BCBA Assignment";
  const childName = joinName(d["Patient First Name"], "", d["Name"] ?? row.name);
  const parentName = str(d["Parent First Name"]) || str(d["Name of Insured Policy Holder"]) || "—";
  const insurance = str(d["Primary Insurance" as never]) || str(d["Insurance"]) || str(d["Insurance Type"]) || "";
  const payor = insurance || str(d["Lead Source"]) || "—";

  const authRecords = auths.map(mondayRowToAuth);
  const latestAuth = authRecords[0];
  const authStatus: AuthStatus = latestAuth?.status ?? "Not Submitted";
  const expirationDate = authRecords.find((a) => a.expirationDate)?.expirationDate ?? null;

  const bcba = str(d["BCBA"]) || null;
  const rbt = str(d["Pair Up Therapist"]) || null;
  const staffingStatus: StaffingStatus =
    stage === "Staffing Needed" || stage === "Restaffing Needed" ? "Needed" :
    rbt ? "Assigned" :
    bcba ? "In Progress" : "Not Needed";

  const startDate = isoOrNull(d["Date Entering Pending Initial Auth"]);
  const stageEntered = row.updated_at ?? row.imported_at ?? new Date().toISOString();

  return {
    id: row.monday_item_id ?? row.id,
    childName,
    parentName,
    childAge: ageFromDob(d["DOB"]),
    state: str(row.state) || str(d["State"]) || "",
    clinic: str(d["Case Location"]) || str(d["Place of Services"]) || "—",
    stage,
    bcba,
    rbt,
    intakeOwner: str(d["Intake Person"]) || "",
    authStatus,
    staffingStatus,
    qaStatus: stage === "In QA" ? "In Review" : "Not Started",
    daysInStage: daysBetween(stageEntered),
    daysSinceVOB: daysBetween(stageEntered),
    daysSinceAssessment: null,
    daysToStart: startDate ? daysUntil(startDate) : null,
    assessmentDate: null,
    startDate,
    nextAction:
      stage === "BCBA Assignment" ? "Assign BCBA" :
      stage === "Waiting on Consent Forms" ? "Send consent forms" :
      stage === "Pending Initial Authorization" ? "Submit initial auth" :
      stage === "Schedule Assessment" ? "Schedule assessment" :
      stage === "Active" ? "Monitor service delivery" :
      "Review status",
    nextTaskDue: null,
    lastActivity: row.updated_at ? `Synced from Monday on ${row.updated_at.slice(0, 10)}` : "—",
    payor,
    phone: str(d["Phone"]) || str(d["Parent Cell Phone"]) || undefined,
    email: str(d["Email"]) || undefined,
    insurance: insurance || undefined,
    blockers: [],
    authorizations: authRecords,
    schedule: [],
    tasks: [],
    timeline: [{
      id: `tl-${row.monday_item_id ?? row.id}`,
      type: "system",
      description: `Imported from Monday · group "${row.monday_group ?? "—"}"`,
      timestamp: row.imported_at ?? new Date().toISOString(),
    }],
    documents: [],
    automationLog: [`Loaded from monday_clients_raw (item ${row.monday_item_id ?? "—"})`],
    staffingHistory: [],
    nextReauthDate: expirationDate,
  };
}

/** Group authorizations by client using the auth's `link to Clients` field
 * (or the auth's own `name` as a fallback) matched against the client's name. */
export function groupAuthsByClient(
  clients: MondayClientRow[],
  auths: MondayAuthRow[],
): Map<string, MondayAuthRow[]> {
  const byName = new Map<string, string>();           // normalized name → client id
  for (const c of clients) {
    const n = normName(str(c.name) || str((c.data as any)?.["Name"]));
    if (n) byName.set(n, c.monday_item_id ?? c.id);
  }
  const out = new Map<string, MondayAuthRow[]>();
  for (const a of auths) {
    const link = str((a.data as any)?.["link to Clients"]) || str(a.name);
    const id = byName.get(normName(link));
    if (!id) continue;
    const list = out.get(id) ?? [];
    list.push(a);
    out.set(id, list);
  }
  return out;
}