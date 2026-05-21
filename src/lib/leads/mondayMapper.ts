import {
  defaultFinancialFields, FINANCIAL_OWNER, type Lead, type LeadSource, type LeadStatus,
  type FormStatus, type ConsentStatus, type VobStatus, type FormReviewStatus,
  type Priority,
} from "@/data/leads";

/**
 * Map a Monday board's kanban "group" name to the canonical LeadStatus enum
 * used by the Leads UI. Anything unknown defaults to "New Lead" so the row
 * still surfaces.
 */
const GROUP_TO_STATUS: Record<string, LeadStatus> = {
  "New Lead": "New Lead",
  "Meta Leads - Brett": "New Lead",
  "In Contact": "In Contact",
  "Sent Form": "Sent Form",
  "Missing Information": "Missing Information",
  "Form Received": "Form Received",
  "Sent to VOB": "Sent to VOB",
  "VOB Completed": "VOB Completed",
  "Can't Reach": "Can't Reach",
  "Sent Packet - Can't Reach": "Sent Packet - Can't Reach",
  "CAN NOT SUBMIT AUTH": "Can Not Submit Auth",
  "Non Qualified Lead": "Non-Qualified",
  "Getting DX": "Getting DX",
};

export interface MondayLeadRow {
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

function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function isoDate(v: unknown): string | null {
  const s = str(v);
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function daysSince(iso: string | null): number {
  if (!iso) return 0;
  const d = (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.round(d));
}

function ageFromDob(dob: unknown): string {
  const s = str(dob);
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "—";
  const now = new Date();
  let years = now.getFullYear() - d.getFullYear();
  let months = now.getMonth() - d.getMonth();
  if (months < 0) { years -= 1; months += 12; }
  return `${years}y ${months}m`;
}

function mapSource(v: unknown): LeadSource {
  const s = str(v).toLowerCase();
  if (s.includes("referral")) return "Referral";
  if (s.includes("facebook") || s.includes("meta")) return "Facebook";
  if (s.includes("organic")) return "Organic";
  if (s.includes("ads") || s.includes("ppc") || s.includes("cpc")) return "Ads";
  if (s.includes("phone") || s.includes("call")) return "Phone";
  if (s.includes("insurance")) return "Insurance";
  if (s.includes("digital")) return "Digital";
  return "Website";
}

function mapFormStatus(v: unknown): FormStatus {
  const s = str(v).toLowerCase();
  if (!s || s.includes("no form")) return "Not Sent";
  if (s.includes("complete")) return "Completed";
  if (s.includes("view")) return "Viewed";
  if (s.includes("sent")) return "Sent";
  return "Not Sent";
}

function mapConsent(v: unknown): ConsentStatus {
  const s = str(v).toLowerCase();
  if (!s || s.includes("no form")) return "Not Sent";
  if (s.includes("complete")) return "Completed";
  if (s.includes("sent")) return "Sent";
  return "Not Sent";
}

function mapVob(v: unknown): VobStatus {
  const s = str(v).toLowerCase();
  if (!s || s.includes("no vob")) return "Not Started";
  if (s.includes("approved")) return "Approved";
  if (s.includes("payment plan")) return "Payment Plan Required";
  if (s.includes("complete")) return "Completed";
  if (s.includes("received")) return "Received";
  if (s.includes("issue")) return "Issue";
  if (s.includes("sent")) return "Sent";
  return "Not Started";
}

function mapFormReview(v: unknown): FormReviewStatus {
  const s = str(v).toLowerCase();
  if (s.includes("missing")) return "Missing Information";
  if (s.includes("complete")) return "Complete";
  return "Pending";
}

function derivePriority(status: LeadStatus, daysInStage: number): Priority {
  if (status === "New Lead") return "Hot";
  if (status === "Non-Qualified" || status === "Can't Reach") return "Cold";
  return daysInStage >= 4 ? "Warm" : "Hot";
}

function joinName(first: unknown, last: unknown, fallback?: unknown): string {
  const f = str(first), l = str(last);
  const j = [f, l].filter(Boolean).join(" ").trim();
  return j || str(fallback) || "—";
}

/** Convert one monday_leads_raw row into the rich Lead shape the UI expects. */
export function mondayRowToLead(row: MondayLeadRow): Lead {
  const d = (row.data ?? {}) as Record<string, unknown>;
  const status: LeadStatus = GROUP_TO_STATUS[row.monday_group ?? ""] ?? "New Lead";

  const childName = joinName(d["Patient First Name"], d["Patient Last Name"], d["Name of Patient"] ?? d["Client First Name (F)"] ?? row.name);
  const parentName = str(d["Parents Full Name"]) || joinName(d["Parent First Name"], "", d["Parent 2 Name"]);
  const phone = str(d["Phone"]) || str(d["Parent Cell Phone"]) || str(d["Home Phone"]);
  const email = str(d["Email"]) || str(d["Parent 2 Email"]);
  const state = str(row.state || d["State"]);
  const source = mapSource(d["Lead Type"] ?? d["UTM Source"] ?? d["How did you hear about us"]);
  const owner = str(row.owner || d["Intake Person"]);
  const insurance = str(d["Primary Insurance"]);
  const insuranceType = str(d["Insurance Type"]);
  const payor = insurance || "—";

  const createdAt = isoDate(d["Origination Date"]) ?? row.imported_at ?? new Date().toISOString();
  const lastContacted = isoDate(d["Last Contact Date"]);
  const updatedAt = row.updated_at ?? lastContacted ?? createdAt;
  const daysInStage = daysSince(lastContacted ?? createdAt);

  const formStatus = mapFormStatus(d["Form Status"]);
  const consentStatus = mapConsent(d["Consent Form Status"]);
  const vobStatus = mapVob(d["VOB Status"]);
  const formReviewStatus = mapFormReview(d["Form Review Status"]);

  const id = row.monday_item_id || row.id;

  const fin = defaultFinancialFields(insurance);

  return {
    id,
    childName,
    parentName,
    phone,
    email,
    state,
    source,
    status,
    owner: owner || "Unassigned",
    priority: derivePriority(status, daysInStage),
    childAge: ageFromDob(d["DOB"]),
    formStatus,
    consentStatus,
    vobStatus,
    formReviewStatus,
    insurance,
    insuranceType,
    ...fin,
    primaryInsurance: insurance,
    secondaryInsurance: str(d["Secondary Insurance"]) || undefined,
    financialStatus:
      insurance.toLowerCase().includes("medicaid") ? "Approved" :
      vobStatus === "Approved" ? "Approved" :
      vobStatus === "Payment Plan Required" ? "Payment Plan Required" :
      "Pending Review",
    financialOwner: FINANCIAL_OWNER,
    notQualifiedReason: str(d["Non Qualified Reason"]).toLowerCase() === "none" ? undefined : str(d["Non Qualified Reason"]) || undefined,
    createdAt,
    updatedAt,
    lastContacted,
    daysInStage,
    nextAction: nextActionFor(status),
    nextTaskDue: null,
    lastActivity: str(d["E/T Call Log"]) || str(d["Reg Call Log"]) || `Stage: ${status}`,
    payor,
    coverageType: insuranceType || "—",
    paymentPlanNeeded: vobStatus === "Payment Plan Required",
    initialFormLink: str(d["Initial Form Link"]) || undefined,
    notes: str(d["Message/Comments"]) || undefined,
    tags: [],
    timeline: [{
      id: `tl-${id}`,
      type: "system",
      description: `Imported from Monday · group "${row.monday_group ?? "—"}"`,
      timestamp: row.imported_at ?? createdAt,
    }],
    tasks: [],
    documents: [],
    communications: [],
    automationLog: [`Loaded from monday_leads_raw (item ${row.monday_item_id ?? "—"})`],
  };
}

function nextActionFor(status: LeadStatus): string {
  switch (status) {
    case "New Lead": return "Make first contact";
    case "In Contact": return "Send intake form";
    case "Sent Form": return "Follow up on intake packet";
    case "Missing Information": return "Collect missing info";
    case "Form Received": return "Review intake packet";
    case "Sent to VOB": return "Follow up on VOB response";
    case "VOB Completed": return "Move to Client Pipeline";
    case "Can't Reach": return "Final contact attempt";
    case "Sent Packet - Can't Reach": return "Re-engage parent";
    case "Can Not Submit Auth": return "Collect missing documentation";
    case "Getting DX": return "Awaiting DX from pediatrician";
    case "Non-Qualified": return "Archive";
    default: return "Review status";
  }
}